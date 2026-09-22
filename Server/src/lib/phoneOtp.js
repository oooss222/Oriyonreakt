const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { query } = require("../db");
const {
  normalizePhone,
  isValidTjPhone,
} = require("./phoneUtils");

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_SENDS_PER_HOUR = 5;
const MAX_VERIFY_ATTEMPTS = 5;

function generateCode() {
  return String(crypto.randomInt(100000, 999999));
}

function shouldExposeDevCode() {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return process.env.SMS_EXPOSE_CODE !== "false";
}

function otpMessage(code) {
  return `Код Diyor: ${code}. Действует 5 минут.`;
}

function payomchiDigits(phone) {
  return String(phone || "").replace(/\D/g, "");
}

async function sendViaPayomchi(phone, code) {
  const apiKey = String(process.env.PAYOMCHI_API_KEY || "").trim();
  const base = String(
    process.env.PAYOMCHI_API_URL || "https://api.payomchi.tj"
  ).replace(/\/$/, "");
  const senderId = String(process.env.PAYOMCHI_SENDER_ID || "").trim();
  const payload = {
    phone: payomchiDigits(phone),
    message: otpMessage(code),
    channel: "sms",
  };

  if (senderId) {
    payload.senderId = senderId;
  }

  let res;

  try {
    res = await fetch(`${base}/api/v1/user/sms`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
  } catch (e) {
    console.error("[payomchi] SMS request error", e?.message);
    const err = new Error("SMS_SEND_FAILED");
    err.status = 502;
    throw err;
  }

  if (res.status !== 200 && res.status !== 201) {
    let detail = "";

    try {
      const data = await res.json();
      detail = data?.message || data?.error || data?.title || "";
    } catch {
      detail = "";
    }

    console.error("[payomchi] SMS failed", res.status, detail);
    const err = new Error("SMS_SEND_FAILED");
    err.status = 502;
    throw err;
  }
}

async function sendSms(phone, code) {
  if (String(process.env.PAYOMCHI_API_KEY || "").trim()) {
    await sendViaPayomchi(phone, code);
    return;
  }

  const webhook = process.env.SMS_WEBHOOK_URL;

  if (webhook) {
    const res = await fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.SMS_WEBHOOK_TOKEN
          ? { Authorization: `Bearer ${process.env.SMS_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        phone,
        code,
        message: otpMessage(code),
      }),
    });

    if (!res.ok) {
      throw new Error(`SMS webhook failed: HTTP ${res.status}`);
    }

    return;
  }

  if (process.env.NODE_ENV === "production") {
    const err = new Error("SMS_NOT_CONFIGURED");
    err.status = 500;
    throw err;
  }

  console.log(`[phone-otp] ${phone} → ${code}`);
}

async function getOtpRow(phone) {
  const { rows } = await query(
    `SELECT phone, code_hash, attempts, send_count, last_sent_at, expires_at
     FROM phone_otps
     WHERE phone = $1`,
    [phone]
  );

  return rows[0] || null;
}

async function requestOtp(rawPhone) {
  const phone = normalizePhone(rawPhone);

  if (!isValidTjPhone(phone)) {
    const err = new Error("INVALID_PHONE");
    err.status = 400;
    throw err;
  }

  const now = Date.now();
  const existing = await getOtpRow(phone);

  if (existing?.last_sent_at) {
    const lastSent = new Date(existing.last_sent_at).getTime();

    if (now - lastSent < RESEND_COOLDOWN_MS) {
      const err = new Error("RESEND_TOO_SOON");
      err.status = 429;
      err.retryAfterSec = Math.ceil(
        (RESEND_COOLDOWN_MS - (now - lastSent)) / 1000
      );
      throw err;
    }
  }

  const hourAgo = new Date(now - 60 * 60 * 1000);
  const sendCount =
    existing?.last_sent_at &&
    new Date(existing.last_sent_at) > hourAgo
      ? Number(existing.send_count || 0) + 1
      : 1;

  if (sendCount > MAX_SENDS_PER_HOUR) {
    const err = new Error("TOO_MANY_REQUESTS");
    err.status = 429;
    throw err;
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(now + OTP_TTL_MS);

  await query(
    `INSERT INTO phone_otps (phone, code_hash, attempts, send_count, last_sent_at, expires_at)
     VALUES ($1, $2, 0, $3, now(), $4)
     ON CONFLICT (phone) DO UPDATE SET
       code_hash = EXCLUDED.code_hash,
       attempts = 0,
       send_count = EXCLUDED.send_count,
       last_sent_at = now(),
       expires_at = EXCLUDED.expires_at`,
    [phone, codeHash, sendCount, expiresAt]
  );

  try {
    await sendSms(phone, code);
  } catch (err) {
    await query(`DELETE FROM phone_otps WHERE phone = $1`, [phone]);
    throw err;
  }

  const result = {
    ok: true,
    phone,
    expiresInSec: Math.floor(OTP_TTL_MS / 1000),
    retryAfterSec: Math.floor(RESEND_COOLDOWN_MS / 1000),
  };

  if (shouldExposeDevCode()) {
    result.devCode = code;
  }

  return result;
}

async function verifyOtp(rawPhone, code) {
  const phone = normalizePhone(rawPhone);

  if (!isValidTjPhone(phone)) {
    const err = new Error("INVALID_PHONE");
    err.status = 400;
    throw err;
  }

  if (!code || !/^\d{6}$/.test(String(code))) {
    const err = new Error("INVALID_CODE");
    err.status = 400;
    throw err;
  }

  const row = await getOtpRow(phone);

  if (!row) {
    const err = new Error("CODE_NOT_FOUND");
    err.status = 400;
    throw err;
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    await query(`DELETE FROM phone_otps WHERE phone = $1`, [phone]);
    const err = new Error("CODE_EXPIRED");
    err.status = 400;
    throw err;
  }

  if (Number(row.attempts) >= MAX_VERIFY_ATTEMPTS) {
    const err = new Error("TOO_MANY_ATTEMPTS");
    err.status = 429;
    throw err;
  }

  const ok = await bcrypt.compare(String(code), row.code_hash);

  if (!ok) {
    await query(
      `UPDATE phone_otps SET attempts = attempts + 1 WHERE phone = $1`,
      [phone]
    );
    const err = new Error("WRONG_CODE");
    err.status = 400;
    throw err;
  }

  await query(`DELETE FROM phone_otps WHERE phone = $1`, [phone]);

  return phone;
}

module.exports = {
  requestOtp,
  verifyOtp,
};
