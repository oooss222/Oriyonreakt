const { query } = require("../db");

const REASONS = new Set([
  "fraud",
  "spam",
  "prohibited",
  "wrong_category",
  "duplicate",
  "other",
]);

function mapReport(row) {
  if (!row) return null;

  return {
    id: row.id,
    listingId: row.listing_id,
    listingTitle: row.listing_title || "",
    listingOwnerId: row.listing_owner_id || null,
    listingOwnerName: row.listing_owner_name || "",
    reporterId: row.reporter_id,
    reporterName: row.reporter_name || "",
    reason: row.reason,
    details: row.details || "",
    status: row.status,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

class ReportModel {
  static isValidReason(reason) {
    return REASONS.has(reason);
  }

  static async create({ listingId, reporterId, reason, details = "" }) {
    try {
      const result = await query(
        `
        INSERT INTO listing_reports (
          listing_id,
          reporter_id,
          reason,
          details
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [listingId, reporterId, reason, String(details || "").trim()]
      );

      return mapReport(result.rows[0]);
    } catch (e) {
      if (e.code === "23505") {
        throw new Error("ALREADY_REPORTED");
      }

      throw e;
    }
  }

  static async findForModeration({
    status = "pending",
    limit = 100,
    offset = 0,
  } = {}) {
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    const result = await query(
      `
      SELECT
        r.*,
        l.title AS listing_title,
        l.owner AS listing_owner_id,
        ou.name AS listing_owner_name,
        u.name AS reporter_name
      FROM listing_reports r
      JOIN listings l ON l.id = r.listing_id
      JOIN users u ON u.id = r.reporter_id
      LEFT JOIN users ou ON ou.id = l.owner
      WHERE r.status = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [status, safeLimit, safeOffset]
    );

    return result.rows.map(mapReport);
  }

  static async findGroupedForModeration({
    status = "pending",
    limit = 50,
    offset = 0,
  } = {}) {
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    const groupsResult = await query(
      `
      SELECT
        r.listing_id,
        l.title AS listing_title,
        l.owner AS listing_owner_id,
        ou.name AS listing_owner_name,
        COUNT(*)::int AS report_count,
        MAX(r.created_at) AS latest_at,
        ARRAY_AGG(r.reason ORDER BY r.created_at DESC) AS reasons
      FROM listing_reports r
      JOIN listings l ON l.id = r.listing_id
      LEFT JOIN users ou ON ou.id = l.owner
      WHERE r.status = $1
      GROUP BY r.listing_id, l.title, l.owner, ou.name
      ORDER BY COUNT(*) DESC, MAX(r.created_at) DESC
      LIMIT $2 OFFSET $3
      `,
      [status, safeLimit, safeOffset]
    );

    if (!groupsResult.rows.length) {
      return [];
    }

    const listingIds = groupsResult.rows.map((row) => row.listing_id);

    const reportsResult = await query(
      `
      SELECT
        r.*,
        l.title AS listing_title,
        l.owner AS listing_owner_id,
        ou.name AS listing_owner_name,
        u.name AS reporter_name
      FROM listing_reports r
      JOIN listings l ON l.id = r.listing_id
      JOIN users u ON u.id = r.reporter_id
      LEFT JOIN users ou ON ou.id = l.owner
      WHERE r.status = $1
        AND r.listing_id = ANY($2::uuid[])
      ORDER BY r.created_at DESC
      `,
      [status, listingIds]
    );

    const byListing = new Map();

    for (const row of reportsResult.rows) {
      const report = mapReport(row);
      const key = String(report.listingId);

      if (!byListing.has(key)) {
        byListing.set(key, []);
      }

      byListing.get(key).push(report);
    }

    return groupsResult.rows.map((row) => ({
      listingId: row.listing_id,
      listingTitle: row.listing_title || "",
      listingOwnerId: row.listing_owner_id || null,
      listingOwnerName: row.listing_owner_name || "",
      reportCount: Number(row.report_count || 0),
      latestAt: row.latest_at,
      reasons: row.reasons || [],
      reports: byListing.get(String(row.listing_id)) || [],
      highPriority: Number(row.report_count || 0) >= 3,
    }));
  }

  static async findById(id) {
    const result = await query(
      `
      SELECT
        r.*,
        l.title AS listing_title,
        l.owner AS listing_owner_id,
        ou.name AS listing_owner_name,
        u.name AS reporter_name
      FROM listing_reports r
      JOIN listings l ON l.id = r.listing_id
      JOIN users u ON u.id = r.reporter_id
      LEFT JOIN users ou ON ou.id = l.owner
      WHERE r.id = $1
      LIMIT 1
      `,
      [id]
    );

    return mapReport(result.rows[0]);
  }

  static async updateStatus(id, status, reviewerId) {
    const result = await query(
      `
      UPDATE listing_reports
      SET
        status = $2,
        reviewed_by = $3,
        reviewed_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id, status, reviewerId]
    );

    return mapReport(result.rows[0]);
  }
}

module.exports = ReportModel;
