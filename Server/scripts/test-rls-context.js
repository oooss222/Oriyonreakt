/**
 * Exercises the pooled RLS context wrapper against a real database.
 *
 * Usage: DATABASE_URL=... node scripts/test-rls-context.js
 */
const { query, pool } = require("../src/db");
const { runWithRlsContext, SYSTEM_CONTEXT } = require("../src/lib/rlsContext");

const ANON = { userId: null, role: "anon" };

function asUser(id) {
  return { userId: id, role: "user" };
}

let failures = 0;

function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name}` +
      (ok ? "" : `\n      expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  );
}

async function createUser(email) {
  const result = await runWithRlsContext(SYSTEM_CONTEXT, () =>
    query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, 'x')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [email.split("@")[0], email]
    )
  );

  return result.rows[0].id;
}

async function main() {
  const alice = await createUser("rls-alice@example.com");
  const bob = await createUser("rls-bob@example.com");

  await runWithRlsContext(SYSTEM_CONTEXT, async () => {
    await query(`DELETE FROM listing_drafts WHERE user_id = ANY($1::uuid[])`, [
      [alice, bob],
    ]);
    await query(
      `INSERT INTO listing_drafts (user_id, payload)
       VALUES ($1, '{"form":{"title":"alice"}}'::jsonb),
              ($2, '{"form":{"title":"bob"}}'::jsonb)`,
      [alice, bob]
    );
  });

  const readDrafts = (ctx) =>
    runWithRlsContext(ctx, async () => {
      const res = await query(
        `SELECT payload->'form'->>'title' AS title FROM listing_drafts ORDER BY title`
      );
      return res.rows.map((r) => r.title);
    });

  check("alice sees only her draft", await readDrafts(asUser(alice)), ["alice"]);
  check("bob sees only his draft", await readDrafts(asUser(bob)), ["bob"]);
  check("anonymous sees no drafts", await readDrafts(ANON), []);

  // Alternating identities forces the pooled connection to switch context.
  for (let i = 0; i < 6; i += 1) {
    const [ctx, expected] =
      i % 3 === 0
        ? [asUser(alice), ["alice"]]
        : i % 3 === 1
          ? [asUser(bob), ["bob"]]
          : [ANON, []];

    check(`interleaved read #${i + 1}`, await readDrafts(ctx), expected);
  }

  // Repeating the same identity must stay correct once the context is cached.
  check("repeat read is still scoped", await readDrafts(asUser(alice)), [
    "alice",
  ]);

  // A failing statement must not leave a stale identity behind.
  await runWithRlsContext(asUser(bob), async () => {
    await query("SELECT 1 FROM does_not_exist").catch(() => {});
  });
  check("read after error is scoped", await readDrafts(asUser(alice)), [
    "alice",
  ]);

  const concurrent = await Promise.all([
    readDrafts(asUser(alice)),
    readDrafts(asUser(bob)),
    readDrafts(ANON),
    readDrafts(asUser(alice)),
    readDrafts(asUser(bob)),
  ]);
  check("concurrent reads stay scoped", concurrent, [
    ["alice"],
    ["bob"],
    [],
    ["alice"],
    ["bob"],
  ]);

  await runWithRlsContext(SYSTEM_CONTEXT, async () => {
    await query(`DELETE FROM listing_drafts WHERE user_id = ANY($1::uuid[])`, [
      [alice, bob],
    ]);
    await query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [[alice, bob]]);
  });

  await pool.end();

  console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error("RLS test crashed:", e);
  process.exit(1);
});
