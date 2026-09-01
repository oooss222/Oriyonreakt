const test = require("node:test");
const assert = require("node:assert/strict");

const HAS_DB = Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);

// Unit tests must stay runnable without a database; CI provides one so these
// also run there.
if (!HAS_DB) {
  test("database tests", { skip: "DATABASE_URL is not set" }, () => {});
  return;
}

process.env.JWT_SECRET =
  process.env.JWT_SECRET || "test-secret-that-is-long-enough-for-checks";

const { initDb, query, pool } = require("../src/db");
const {
  runWithRlsContext,
  SYSTEM_CONTEXT,
  ANON_CONTEXT,
} = require("../src/lib/rlsContext");
const Listing = require("../src/models/Listing");

const asUser = (id) => ({ userId: id, role: "user" });
const suffix = Date.now().toString(36);
const state = {};

test.before(async () => {
  await runWithRlsContext(SYSTEM_CONTEXT, initDb);

  await runWithRlsContext(SYSTEM_CONTEXT, async () => {
    const alice = await query(
      `INSERT INTO users (name, email, password) VALUES ('Alice', $1, 'x') RETURNING id`,
      [`alice-${suffix}@test.local`]
    );
    const bob = await query(
      `INSERT INTO users (name, email, password) VALUES ('Bob', $1, 'x') RETURNING id`,
      [`bob-${suffix}@test.local`]
    );

    state.alice = alice.rows[0].id;
    state.bob = bob.rows[0].id;
  });
});

test.after(async () => {
  await runWithRlsContext(SYSTEM_CONTEXT, async () => {
    await query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [
      [state.alice, state.bob],
    ]);
  });

  await pool.end();
});

test("a listing can be created outside real estate", async () => {
  // Regression: extractRealEstateMeta returns {} for other categories, so the
  // re_* insert parameters were undefined and every such publish failed.
  for (const cat of ["phones", "transport", "furniture"]) {
    const listing = await runWithRlsContext(asUser(state.alice), () =>
      Listing.create({
        title: `Test ${cat} ${suffix}`,
        price: "1 500",
        description: "",
        location: "Душанбе",
        cat,
        subcategory: "",
        images: [],
        specs: [],
        owner: state.alice,
      })
    );

    assert.ok(listing?.id, `${cat} listing should be created`);
    assert.equal(listing.cat, cat);
  }
});

test("create stores the numeric price used by filters and sorting", async () => {
  const listing = await runWithRlsContext(asUser(state.alice), () =>
    Listing.create({
      title: `Priced ${suffix}`,
      price: "12 345",
      cat: "phones",
      location: "Душанбе",
      images: [],
      specs: [],
      owner: state.alice,
    })
  );

  const row = await runWithRlsContext(SYSTEM_CONTEXT, () =>
    query(`SELECT price_num FROM listings WHERE id = $1`, [listing.id])
  );

  assert.equal(Number(row.rows[0].price_num), 12345);
});

test("an unparseable price stores null rather than failing the insert", async () => {
  const listing = await runWithRlsContext(asUser(state.alice), () =>
    Listing.create({
      title: `Odd price ${suffix}`,
      price: "160.000.50",
      cat: "phones",
      location: "Душанбе",
      images: [],
      specs: [],
      owner: state.alice,
    })
  );

  const row = await runWithRlsContext(SYSTEM_CONTEXT, () =>
    query(`SELECT price_num FROM listings WHERE id = $1`, [listing.id])
  );

  assert.equal(row.rows[0].price_num, null);
});

test("row level security keeps drafts private across pooled connections", async () => {
  await runWithRlsContext(SYSTEM_CONTEXT, () =>
    query(
      `INSERT INTO listing_drafts (user_id, payload)
       VALUES ($1, '{"form":{"title":"alice"}}'::jsonb),
              ($2, '{"form":{"title":"bob"}}'::jsonb)
       ON CONFLICT (user_id) DO UPDATE SET payload = EXCLUDED.payload`,
      [state.alice, state.bob]
    )
  );

  const readTitles = (ctx) =>
    runWithRlsContext(ctx, async () => {
      const res = await query(
        `SELECT payload->'form'->>'title' AS title FROM listing_drafts ORDER BY title`
      );
      return res.rows.map((r) => r.title);
    });

  assert.deepEqual(await readTitles(asUser(state.alice)), ["alice"]);
  assert.deepEqual(await readTitles(asUser(state.bob)), ["bob"]);
  assert.deepEqual(await readTitles(ANON_CONTEXT), []);

  // Alternating identities forces the pooled connection to switch context.
  for (let i = 0; i < 6; i += 1) {
    assert.deepEqual(await readTitles(asUser(state.alice)), ["alice"]);
    assert.deepEqual(await readTitles(asUser(state.bob)), ["bob"]);
  }

  // A failed statement must not leave a stale identity on the connection.
  await runWithRlsContext(asUser(state.bob), () =>
    query("SELECT 1 FROM does_not_exist").catch(() => {})
  );
  assert.deepEqual(await readTitles(asUser(state.alice)), ["alice"]);

  const concurrent = await Promise.all([
    readTitles(asUser(state.alice)),
    readTitles(asUser(state.bob)),
    readTitles(ANON_CONTEXT),
    readTitles(asUser(state.alice)),
  ]);

  assert.deepEqual(concurrent, [["alice"], ["bob"], [], ["alice"]]);
});

test("anonymous readers cannot see listings awaiting moderation", async () => {
  const listing = await runWithRlsContext(asUser(state.bob), () =>
    Listing.create({
      title: `Pending ${suffix}`,
      price: "700",
      cat: "phones",
      location: "Душанбе",
      images: [],
      specs: [],
      owner: state.bob,
    })
  );

  const asAnon = await runWithRlsContext(ANON_CONTEXT, () =>
    Listing.findById(listing.id)
  );
  const asOwner = await runWithRlsContext(asUser(state.bob), () =>
    Listing.findById(listing.id)
  );

  assert.equal(asAnon, null);
  assert.ok(asOwner?.id);
});

test("price range filtering uses the numeric column", async () => {
  await runWithRlsContext(SYSTEM_CONTEXT, () =>
    query(`UPDATE listings SET status = 'approved' WHERE owner = $1`, [
      state.alice,
    ])
  );

  const cheap = await runWithRlsContext(ANON_CONTEXT, () =>
    Listing.findAll({ owner: state.alice, priceTo: 2000, limit: 50 })
  );
  const pricey = await runWithRlsContext(ANON_CONTEXT, () =>
    Listing.findAll({ owner: state.alice, priceFrom: 10000, limit: 50 })
  );

  assert.ok(cheap.every((item) => item.title.startsWith("Test ")));
  assert.ok(pricey.some((item) => item.title === `Priced ${suffix}`));
  assert.equal(
    pricey.some((item) => item.title === `Odd price ${suffix}`),
    false,
    "a listing with no numeric price must not match a range filter"
  );
});

test("listing results carry owner details from the join", async () => {
  await runWithRlsContext(SYSTEM_CONTEXT, () =>
    query(
      `UPDATE users SET seller_type = 'company', company_name = 'Тест' WHERE id = $1`,
      [state.alice]
    )
  );

  const [first] = await runWithRlsContext(ANON_CONTEXT, () =>
    Listing.findAll({ owner: state.alice, limit: 1 })
  );

  assert.equal(first.ownerSellerType, "company");
  assert.equal(first.ownerCompanyName, "Тест");
});
