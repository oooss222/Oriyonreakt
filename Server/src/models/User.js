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

  static async comparePassword(user, password) {
    return bcrypt.compare(password, user.password);
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

    return mapUser(result.rows[0]);
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
}

module.exports = UserModel;