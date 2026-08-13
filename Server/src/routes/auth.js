const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const SiteSettings = require("../models/SiteSettings");
const { requestOtp, verifyOtp } = require("../lib/phoneOtp");
const { formatPhoneDisplay } = require("../lib/phoneUtils");

function makeToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || "user",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

function isValidEmail(email = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function safeUser(user) {
  return User.sanitize(user);
}

router.post("/register", async (req, res) => {
  try {
    const registrationEnabled = await SiteSettings.isRegistrationEnabled();

    if (!registrationEnabled) {
      return res.status(403).json({
        error: "Registration is temporarily disabled",
      });
    }

    let { email, password, name, phone } = req.body || {};

    email = String(email || "").trim().toLowerCase();
    password = String(password || "");
    name = String(name || "").trim();
    phone = String(phone || "").trim();
    const sellerType = "private";
    const companyName = "";

    if (!email || !password || !name) {
      return res.status(400).json({
        error: "name, email, password required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: "Invalid email",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 chars",
      });
    }

    const exists = await User.findByEmail(email);

    if (exists) {
      return res.status(409).json({
        error: "Email already registered",
      });
    }

    const user = await User.create({
      email,
      password,
      name,
      phone,
      sellerType,
      companyName,
      role: "user",
    });

    return res.json({
      token: makeToken(user),
      user: safeUser(user),
    });
  } catch (e) {
    console.error("REGISTER_ERROR:", e?.message, e?.code);

    if (e?.code === "23505") {
      return res.status(409).json({
        error: "Email already registered",
      });
    }

    if (/JWT_SECRET/i.test(e?.message || "")) {
      return res.status(500).json({
        error: "Server misconfigured: JWT_SECRET missing",
      });
    }

    return res.status(500).json({
      error: "Register failed",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body || {};

    email = String(email || "").trim().toLowerCase();
    password = String(password || "");

    if (!email || !password) {
      return res.status(400).json({
        error: "email, password required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: "Invalid email",
      });
    }

    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        error: "User is blocked",
      });
    }

    const ok = await User.comparePassword(user, password);

    if (!ok) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    return res.json({
      token: makeToken(user),
      user: safeUser(user),
    });
  } catch (e) {
    console.error("LOGIN_ERROR:", e?.message, e?.code);

    return res.status(500).json({
      error: "Login failed",
      details: e?.message || "Unknown error",
    });
  }
});

router.get("/verification", (req, res) => {
  res.json({
    emailVerified: false,
    pending: false,
  });
});

router.post("/verification", (req, res) => {
  res.json({
    ok: true,
    pending: true,
  });
});

const PHONE_ERRORS = {
  INVALID_PHONE:
    "Неверный номер. Введите мобильный номер Таджикистана, например 90 123 45 67",
  RESEND_TOO_SOON: "Подождите перед повторной отправкой кода",
  TOO_MANY_REQUESTS: "Слишком много запросов. Попробуйте позже",
  INVALID_CODE: "Введите 6-значный код из SMS",
  CODE_NOT_FOUND: "Сначала запросите код подтверждения",
  CODE_EXPIRED: "Код истёк. Запросите новый",
  TOO_MANY_ATTEMPTS: "Слишком много попыток. Запросите новый код",
  WRONG_CODE: "Неверный код",
  USER_NOT_FOUND: "Пользователь с этим номером не найден. Зарегистрируйтесь",
  NAME_REQUIRED: "Укажите, как к вам обращаться",
};

function phoneError(res, err, fallback = "Ошибка") {
  const code = err?.message || "";
  const message = PHONE_ERRORS[code] || fallback;

  return res.status(err?.status || 500).json({
    error: message,
    code,
    retryAfterSec: err?.retryAfterSec,
  });
}

router.post("/phone/send-code", async (req, res) => {
  try {
    const registrationEnabled = await SiteSettings.isRegistrationEnabled();
    const mode = String(req.body?.mode || "register").toLowerCase();
    const phone = req.body?.phone;

    if (mode === "register" && !registrationEnabled) {
      return res.status(403).json({
        error: "Регистрация временно отключена",
      });
    }

    if (mode === "login") {
      const existing = await User.findByPhone(phone);

      if (!existing) {
        return res.status(404).json({
          error: PHONE_ERRORS.USER_NOT_FOUND,
          code: "USER_NOT_FOUND",
        });
      }

      if (existing.isBlocked) {
        return res.status(403).json({
          error: "Аккаунт заблокирован",
        });
      }
    } else {
      const existing = await User.findByPhone(phone);

      if (existing) {
        return res.status(409).json({
          error: "Этот номер уже зарегистрирован. Войдите в аккаунт",
          code: "PHONE_ALREADY_REGISTERED",
        });
      }
    }

    const result = await requestOtp(phone);

    return res.json({
      ok: true,
      phone: result.phone,
      phoneDisplay: formatPhoneDisplay(result.phone),
      expiresInSec: result.expiresInSec,
      retryAfterSec: result.retryAfterSec,
      ...(result.devCode ? { devCode: result.devCode } : {}),
    });
  } catch (e) {
    console.error("PHONE_SEND_CODE_ERROR:", e?.message);

    if (PHONE_ERRORS[e?.message]) {
      return phoneError(res, e);
    }

    return res.status(500).json({
      error: "Не удалось отправить код",
    });
  }
});

router.post("/phone/verify", async (req, res) => {
  try {
    const registrationEnabled = await SiteSettings.isRegistrationEnabled();
    const mode = String(req.body?.mode || "register").toLowerCase();
    const phone = req.body?.phone;
    const code = String(req.body?.code || "").trim();
    const name = String(req.body?.name || "").trim();

    let verifiedPhone;

    try {
      verifiedPhone = await verifyOtp(phone, code);
    } catch (e) {
      if (PHONE_ERRORS[e?.message]) {
        return phoneError(res, e);
      }

      throw e;
    }

    let user = await User.findByPhone(verifiedPhone);

    if (user) {
      if (user.isBlocked) {
        return res.status(403).json({
          error: "Аккаунт заблокирован",
        });
      }
    } else if (mode === "login") {
      return res.status(404).json({
        error: PHONE_ERRORS.USER_NOT_FOUND,
        code: "USER_NOT_FOUND",
      });
    } else {
      if (!registrationEnabled) {
        return res.status(403).json({
          error: "Регистрация временно отключена",
        });
      }

      if (!name) {
        return res.status(400).json({
          error: PHONE_ERRORS.NAME_REQUIRED,
          code: "NAME_REQUIRED",
        });
      }

      user = await User.createFromPhone({
        phone: verifiedPhone,
        name,
      });
    }

    if (!user.phoneVerified) {
      await User.updatePhoneVerified(user.id, true);
      user.phoneVerified = true;
    }

    return res.json({
      token: makeToken(user),
      user: safeUser(user),
    });
  } catch (e) {
    console.error("PHONE_VERIFY_ERROR:", e?.message, e?.code);

    if (e?.code === "23505") {
      return res.status(409).json({
        error: "Этот номер уже зарегистрирован",
      });
    }

    return res.status(500).json({
      error: "Не удалось подтвердить код",
    });
  }
});

module.exports = router;