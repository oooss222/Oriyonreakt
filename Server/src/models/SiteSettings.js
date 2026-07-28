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
  registrationEnabled: true,
  policyContent: DEFAULT_POLICY,
};

function normalizeSettings(row) {
  const data = {
    ...DEFAULTS,
    ...(row?.data || {}),
  };

  return {
    vipPrice: Number(data.vipPrice) || DEFAULTS.vipPrice,
    topPrice: Number(data.topPrice) || DEFAULTS.topPrice,
    registrationEnabled: Boolean(data.registrationEnabled),
    policyContent: String(data.policyContent || DEFAULTS.policyContent),
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
      vipPrice: Math.max(
        0,
        Number(payload.vipPrice ?? current.vipPrice) || current.vipPrice
      ),
      topPrice: Math.max(
        0,
        Number(payload.topPrice ?? current.topPrice) || current.topPrice
      ),
      registrationEnabled:
        payload.registrationEnabled !== undefined
          ? Boolean(payload.registrationEnabled)
          : current.registrationEnabled,
      policyContent:
        payload.policyContent !== undefined
          ? String(payload.policyContent)
          : current.policyContent,
    };

    const result = await query(
      `
      UPDATE site_settings
      SET
        data = $2::jsonb,
        updated_at = now(),
        updated_by = $3
      WHERE id = 1
      RETURNING *
      `,
      [1, JSON.stringify(next), updatedBy || null]
    );

    return normalizeSettings(result.rows[0]);
  }
}

module.exports = SiteSettingsModel;
