const bcrypt = require("bcryptjs");
const { query, mapUser } = require("../db");

class UserModel {
  static async create({
    email,
    password,
    name,
    phone = "",
    sellerType = "private",
    role = "user",
  }) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(
      `
      INSERT INTO users (
        email,
        password,
        name,
        phone,
        seller_type,
        role
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [email, hashedPassword, name, phone, sellerType, role]
    );

    return mapUser(result.rows[0]);
  }

  static async findByEmail(email) {
    const result = await query(
      `
      SELECT *
      FROM users
      WHERE email = $1
      LIMIT 1
      `,
      [email]
    );

    return mapUser(result.rows[0]);
  }

  static async findById(id) {
    const result = await query(
      `
      SELECT *
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    return mapUser(result.rows[0]);
  }

  static async getAll() {
    const result = await query(
      `
      SELECT *
      FROM users
      ORDER BY created_at DESC
      `
    );

    return result.rows.map(mapUser);
  }

  static async findPaginated({
    q = "",
    role = "",
    status = "",
    sort = "created_desc",
    limit = 25,
    offset = 0,
  } = {}) {
    const conditions = [];
    const values = [];

    if (role && role !== "all") {
      values.push(role);
      conditions.push(`role = $${values.length}`);
    }

    if (status === "active") {
      conditions.push("is_blocked = false");
    } else if (status === "blocked") {
      conditions.push("is_blocked = true");
    }

    const search = String(q || "").trim();

    if (search) {
      values.push(`%${search}%`);
      const idx = values.length;

      conditions.push(`
        (
          name ILIKE $${idx}
          OR email ILIKE $${idx}
          OR phone ILIKE $${idx}
        )
      `);
    }

    const whereSql = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const sortMap = {
      created_desc: "created_at DESC",
      created_asc: "created_at ASC",
      balance_desc: "wallet_balance DESC NULLS LAST",
      balance_asc: "wallet_balance ASC NULLS LAST",
      role_asc: "role ASC, name ASC",
      name_asc: "name ASC",
    };

    const orderBy = sortMap[sort] || sortMap.created_desc;
    const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    const countResult = await query(
      `
      SELECT COUNT(*)::int AS total
      FROM users
      ${whereSql}
      `,
      values
    );

    const listValues = [...values, safeLimit, safeOffset];
    const limitIdx = listValues.length - 1;
    const offsetIdx = listValues.length;

    const result = await query(
      `
      SELECT *
      FROM users
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `,
      listValues
    );

    const total = Number(countResult.rows[0]?.total || 0);

    return {
      items: result.rows.map(mapUser),
      total,
      limit: safeLimit,
      offset: safeOffset,
      page: Math.floor(safeOffset / safeLimit) + 1,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  }

  static async comparePassword(user, password) {
    return bcrypt.compare(password, user.password);
  }

  static sanitizePublic(user, { listingsCount = 0 } = {}) {
    if (!user || user.isBlocked) return null;

    return {
      id: user.id,
      _id: user.id,
      name: user.name || "Продавец",
      sellerType: user.sellerType || "private",
      whatsapp: user.whatsapp || "",
      telegram: user.telegram || "",
      emailVerified: Boolean(user.emailVerified),
      createdAt: user.createdAt,
      listingsCount,
    };
  }

  static async getPublicProfile(id) {
    const user = await this.findById(id);

    if (!user || user.isBlocked) {
      return null;
    }

    const countResult = await query(
      `
      SELECT COUNT(*)::int AS count
      FROM listings
      WHERE owner = $1 AND status = 'approved'
      `,
      [id]
    );

    const listingsCount = Number(countResult.rows[0]?.count || 0);

    return this.sanitizePublic(user, { listingsCount });
  }

  static sanitize(user) {
    if (!user) return null;

    return {
      id: user.id,
      _id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      whatsapp: user.whatsapp || "",
      telegram: user.telegram || "",
      sellerType: user.sellerType,
      role: user.role || "user",
      isBlocked: Boolean(user.isBlocked),
      emailVerified: user.emailVerified,
      walletBalance: Number(user.walletBalance || 0),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static async updateProfile(id, {
    name,
    phone,
    whatsapp,
    telegram,
    sellerType,
  }) {
    const result = await query(
      `
      UPDATE users
      SET
        name = COALESCE($2, name),
        phone = COALESCE($3, phone),
        whatsapp = COALESCE($4, whatsapp),
        telegram = COALESCE($5, telegram),
        seller_type = COALESCE($6, seller_type),
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id, name, phone, whatsapp, telegram, sellerType]
    );

    return mapUser(result.rows[0]);
  }

  static async adjustWallet(id, amount, { description = "", createdBy = null } = {}) {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount === 0) {
      throw new Error("INVALID_AMOUNT");
    }

    if (numericAmount < 0) {
      const current = await this.findById(id);

      if (!current) {
        throw new Error("NOT_FOUND");
      }

      if (Number(current.walletBalance || 0) + numericAmount < 0) {
        throw new Error("INSUFFICIENT_BALANCE");
      }
    }

    const result = await query(
      `
      UPDATE users
      SET
        wallet_balance = wallet_balance + $2,
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id, numericAmount]
    );

    const user = mapUser(result.rows[0]);

    if (user) {
      const Wallet = require("./Wallet");

      await Wallet.recordTransaction({
        userId: id,
        type: "manual_adjustment",
        amount: numericAmount,
        description:
          description ||
          (numericAmount > 0
            ? "Начисление администратором"
            : "Списание администратором"),
        createdBy,
      });
    }

    return user;
  }

  static async chargeWallet(id, amount, { description = "" } = {}) {
    const numericAmount = Math.abs(Number(amount));

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      throw new Error("INVALID_AMOUNT");
    }

    const current = await this.findById(id);

    if (!current) {
      throw new Error("NOT_FOUND");
    }

    if (Number(current.walletBalance || 0) < numericAmount) {
      throw new Error("INSUFFICIENT_BALANCE");
    }

    const result = await query(
      `
      UPDATE users
      SET
        wallet_balance = wallet_balance - $2,
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id, numericAmount]
    );

    const user = mapUser(result.rows[0]);

    if (user) {
      const Wallet = require("./Wallet");

      await Wallet.recordTransaction({
        userId: id,
        type: "payment",
        amount: -numericAmount,
        description,
        createdBy: id,
      });
    }

    return user;
  }

  static async topUpWallet(id, amount) {
    const result = await query(
      `
      UPDATE users
      SET
        wallet_balance = wallet_balance + $2,
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id, amount]
    );

    const user = mapUser(result.rows[0]);

    if (user) {
      const Wallet = require("./Wallet");

      await Wallet.recordTransaction({
        userId: id,
        type: "top_up",
        amount,
        description: "Пополнение баланса",
        createdBy: id,
      });
    }

    return user;
  }

  static async setRole(id, role) {
    const result = await query(
      `
      UPDATE users
      SET
        role = $2,
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id, role]
    );

    return mapUser(result.rows[0]);
  }

  static async blockUser(id) {
    const result = await query(
      `
      UPDATE users
      SET
        is_blocked = true,
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    return mapUser(result.rows[0]);
  }

  static async unblockUser(id) {
    const result = await query(
      `
      UPDATE users
      SET
        is_blocked = false,
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    return mapUser(result.rows[0]);
  }


static async touchLastSeen(id) {
  const result = await query(
    `
    UPDATE users
    SET last_seen = now()
    WHERE id = $1
    RETURNING *
    `,
    [id]
  );

  return mapUser(result.rows[0]);
}
}
module.exports = UserModel;