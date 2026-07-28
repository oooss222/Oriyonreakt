const { query } = require("../db");

function mapAudit(row) {
  if (!row) return null;

  return {
    id: row.id,
    actorId: row.actor_id,
    actorName: row.actor_name || "",
    actorEmail: row.actor_email || "",
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    details: row.details || {},
    createdAt: row.created_at,
  };
}

class AdminAuditModel {
  static async log({
    actorId,
    action,
    targetType,
    targetId = null,
    details = {},
  }) {
    const result = await query(
      `
      INSERT INTO admin_audit_log (
        actor_id,
        action,
        target_type,
        target_id,
        details
      )
      VALUES ($1, $2, $3, $4, $5::jsonb)
      RETURNING *
      `,
      [
        actorId,
        action,
        targetType,
        targetId,
        JSON.stringify(details || {}),
      ]
    );

    return mapAudit(result.rows[0]);
  }

  static async findRecent({
    limit = 50,
    offset = 0,
    action = "",
  } = {}) {
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const safeOffset = Math.max(Number(offset) || 0, 0);
    const values = [];
    let actionFilter = "";

    if (action) {
      values.push(action);
      actionFilter = `WHERE a.action = $${values.length}`;
    }

    values.push(safeLimit);
    const limitIdx = values.length;
    values.push(safeOffset);
    const offsetIdx = values.length;

    const result = await query(
      `
      SELECT
        a.*,
        u.name AS actor_name,
        u.email AS actor_email
      FROM admin_audit_log a
      LEFT JOIN users u ON u.id = a.actor_id
      ${actionFilter}
      ORDER BY a.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `,
      values
    );

    return result.rows.map(mapAudit);
  }
}

module.exports = AdminAuditModel;
