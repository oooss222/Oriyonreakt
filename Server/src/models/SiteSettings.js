const { query } = require("../db");

const DEFAULT_POLICY = `Политика конфиденциальности и условия использования

Настоящая Политика описывает, какие данные собираются при использовании сайта Oriyon.store, как они обрабатываются и защищаются.

1. Общие положения
- Сайт Oriyon.store предоставляет пользователям возможность размещать и просматривать объявления.
- При регистрации вы предоставляете имя, адрес электронной почты и пароль для входа.
- Администрация сайта обязуется не передавать персональные данные третьим лицам без вашего согласия, за исключением случаев, предусмотренных законом.

2. Сбор и использование информации
- Мы можем собирать технические данные о вашем устройстве, IP-адрес, время посещения и страницы сайта для анализа работы сервиса.
- Эти данные используются исключительно для улучшения качества обслуживания.

3. Объявления и пользовательский контент
Пользователь несёт полную ответственность за содержание размещаемых объявлений.

4. Cookies
Сайт может использовать cookies для сохранения настроек и улучшения интерфейса.

5. Контакты
Email: info@oriyon.store`;

const DEFAULTS = {
  vipPrice: 25,
  topPrice: 15,
  bumpPrice: 5,
  registrationEnabled: true,
  policyContent: DEFAULT_POLICY,
  accountantReportEmail: "",
  monthlyReportEnabled: false,
  lastFinanceReportSent: "",
  listingTtlDays: 60,
};

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

function readSettingPrice(value, fallback) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return roundMoney(Math.max(0, numeric));
}

function parseSettingPrice(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return readSettingPrice(value, fallback);
}

function normalizeSettings(row) {
  const data = {
    ...DEFAULTS,
    ...(row?.data || {}),
  };

  return {
    vipPrice: readSettingPrice(data.vipPrice, DEFAULTS.vipPrice),
    topPrice: readSettingPrice(data.topPrice, DEFAULTS.topPrice),
    bumpPrice: readSettingPrice(data.bumpPrice, DEFAULTS.bumpPrice),
    registrationEnabled: Boolean(data.registrationEnabled),
    policyContent: String(data.policyContent || DEFAULTS.policyContent),
    accountantReportEmail: String(data.accountantReportEmail || ""),
    monthlyReportEnabled: Boolean(data.monthlyReportEnabled),
    lastFinanceReportSent: String(data.lastFinanceReportSent || ""),
    listingTtlDays: Math.max(7, Number(data.listingTtlDays || DEFAULTS.listingTtlDays)),
    updatedAt: row?.updated_at || null,
    updatedBy: row?.updated_by || null,
  };
}

class SiteSettingsModel {
  static defaults() {
    return { ...DEFAULTS };
  }

  static async getRow() {
    const result = await query(
      `
      SELECT *
      FROM site_settings
      WHERE id = 1
      LIMIT 1
      `
    );

    if (result.rows[0]) {
      return result.rows[0];
    }

    await query(
      `
      INSERT INTO site_settings (id, data)
      VALUES (1, $1::jsonb)
      ON CONFLICT (id) DO NOTHING
      `,
      [JSON.stringify(DEFAULTS)]
    );

    const created = await query(
      `
      SELECT *
      FROM site_settings
      WHERE id = 1
      LIMIT 1
      `
    );

    return created.rows[0];
  }

  static async get() {
    const row = await this.getRow();
    return normalizeSettings(row);
  }

  static async getPublic() {
    const settings = await this.get();

    return {
      vipPrice: settings.vipPrice,
      topPrice: settings.topPrice,
      bumpPrice: settings.bumpPrice,
      registrationEnabled: settings.registrationEnabled,
    };
  }

  static async getPolicy() {
    const settings = await this.get();
    return {
      content: settings.policyContent,
      updatedAt: settings.updatedAt,
    };
  }

  static async isRegistrationEnabled() {
    const settings = await this.get();
    return settings.registrationEnabled;
  }

  static async update(payload, updatedBy) {
    const current = await this.get();

    const next = {
      vipPrice: parseSettingPrice(payload.vipPrice, current.vipPrice),
      topPrice: parseSettingPrice(payload.topPrice, current.topPrice),
      bumpPrice: parseSettingPrice(payload.bumpPrice, current.bumpPrice),
      registrationEnabled:
        payload.registrationEnabled !== undefined
          ? Boolean(payload.registrationEnabled)
          : current.registrationEnabled,
      policyContent:
        payload.policyContent !== undefined
          ? String(payload.policyContent)
          : current.policyContent,
      accountantReportEmail:
        payload.accountantReportEmail !== undefined
          ? String(payload.accountantReportEmail || "").trim()
          : current.accountantReportEmail,
      monthlyReportEnabled:
        payload.monthlyReportEnabled !== undefined
          ? Boolean(payload.monthlyReportEnabled)
          : current.monthlyReportEnabled,
      lastFinanceReportSent:
        payload.lastFinanceReportSent !== undefined
          ? String(payload.lastFinanceReportSent || "")
          : current.lastFinanceReportSent,
    };

    const result = await query(
      `
      INSERT INTO site_settings (id, data, updated_at, updated_by)
      VALUES (1, $1::jsonb, now(), $2)
      ON CONFLICT (id) DO UPDATE SET
        data = EXCLUDED.data,
        updated_at = now(),
        updated_by = EXCLUDED.updated_by
      RETURNING *
      `,
      [JSON.stringify(next), updatedBy || null]
    );

    if (!result.rows[0]) {
      throw new Error("SETTINGS_ROW_NOT_SAVED");
    }

    return normalizeSettings(result.rows[0]);
  }
}

module.exports = SiteSettingsModel;
