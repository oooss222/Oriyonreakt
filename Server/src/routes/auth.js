const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const SiteSettings = require("../models/SiteSettings");
const { requestOtp, verifyOtp } = require("../lib/phoneOtp");
const { formatPhoneDisplay, normalizePhone, isValidTjPhone } = require("../lib/phoneUtils");
const { getRegistrationDeviceFromRequest } = require("../lib/registrationDevice");

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

// Same cost as real hashes so a missing account is not faster to probe.
const DUMMY_PASSWORD_HASH =
  "$2b$10$IhtAsk1Aiy307Oy6ZmTaV.IiXn5qAvNdEWiTdG0qtEQEQ9KXAl69S";

function invalidCredentials(res) {
  return res.status(401).json({
    error: "Неверный email или пароль.",
    code: "INVALID_CREDENTIALS",
  });
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

    if (password.length < 8) {
      return res.status(400).json({
        error: "Пароль должен быть не короче 8 символов",
        code: "WEAK_PASSWORD",
      });
    }

    const exists = await User.findByEmail(email);

    if (exists) {
      return res.status(409).json({
        error: "Этот email уже зарегистрирован. Войдите в аккаунт.",
        code: "EMAIL_ALREADY_REGISTERED",
      });
    }

    if (phone) {
      const phoneUser = await User.findByPhone(phone);

      if (phoneUser) {
        return res.status(409).json({
          error: "Этот номер телефона уже привязан к другому аккаунту.",
          code: "PHONE_ALREADY_REGISTERED",
        });
      }
    }

    const user = await User.create({
      email,
      password,
      name,
      phone,
      sellerType,
      companyName,
      role: "user",
      ...getRegistrationDeviceFromRequest(req),
    });

    return res.json({
      token: makeToken(user),
      user: safeUser(user),
    });
  } catch (e) {
    console.error("REGISTER_ERROR:", e?.message, e?.code);

    if (e?.code === "23505") {
      return res.status(409).json({
        error: "Этот email уже зарегистрирован. Войдите в аккаунт.",
        code: "EMAIL_ALREADY_REGISTERED",
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
    const passwordOk = await bcrypt.compare(
      password,
      user?.password || DUMMY_PASSWORD_HASH
    );

    if (!user || !passwordOk) {
      return invalidCredentials(res);
    }

    if (user.isBlocked) {
      return res.status(403).json({
        error: "Аккаунт заблокирован",
        code: "USER_BLOCKED",
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

router.post("/check-identity", async (req, res) => {
  try {
    const intent = String(req.body?.intent || "").toLowerCase();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const phoneRaw = req.body?.phone;

    if (!["login", "register"].includes(intent)) {
      return res.status(400).json({
        error: "Некорректный режим проверки",
        code: "INVALID_INTENT",
      });
    }

    if (email) {
      if (!isValidEmail(email)) {
        return res.status(400).json({
          error: "Некорректный email",
          code: "INVALID_EMAIL",
        });
      }

      const user = await User.findByEmail(email);

      if (intent === "register" && user) {
        return res.json({
          ok: false,
          field: "email",
          exists: true,
          code: "EMAIL_ALREADY_REGISTERED",
          message: "Этот email уже зарегистрирован. Войдите в аккаунт.",
        });
      }

      if (intent === "login") {
        return res.json({
          ok: true,
          field: "email",
        });
      }

      return res.json({
        ok: true,
        field: "email",
        exists: Boolean(user),
      });
    }

    if (phoneRaw) {
      const phone = normalizePhone(phoneRaw);

      if (!isValidTjPhone(phone)) {
        return res.status(400).json({
          error: PHONE_ERRORS.INVALID_PHONE,
          code: "INVALID_PHONE",
        });
      }

      const user = await User.findByPhone(phone);

      if (intent === "register" && user) {
        return res.json({
          ok: false,
          field: "phone",
          exists: true,
          code: "PHONE_ALREADY_REGISTERED",
          message: "Этот номер уже зарегистрирован. Войдите в аккаунт.",
        });
      }

      if (intent === "login") {
        return res.json({
          ok: true,
          field: "phone",
        });
      }

      return res.json({
        ok: true,
        field: "phone",
        exists: Boolean(user),
      });
    }

    return res.status(400).json({
      error: "Укажите email или номер телефона",
      code: "IDENTITY_REQUIRED",
    });
  } catch (e) {
    console.error("CHECK_IDENTITY_ERROR:", e?.message);

    return res.status(500).json({
      error: "Не удалось проверить данные",
    });
  }
});

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
        const normalized = normalizePhone(phone);
        return res.json({
          ok: true,
          phone: normalized,
          phoneDisplay: formatPhoneDisplay(normalized),
          expiresInSec: 300,
          retryAfterSec: 60,
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
      return res.status(401).json({
        error: "Неверный код или номер.",
        code: "INVALID_CREDENTIALS",
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
        ...getRegistrationDeviceFromRequest(req),
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