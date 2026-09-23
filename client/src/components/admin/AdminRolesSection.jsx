import React from "react";
import { ACTION_CAPABILITIES, ROLES, roleLabel } from "../../lib/adminUtils";
import { useI18n } from "../../i18n";

const CAPABILITY_KEYS = {
  "users.view": "admin.roles.usersView",
  "users.block": "admin.roles.usersBlock",
  "users.role": "admin.roles.usersRole",
  "listings.moderate": "admin.roles.listingsModerate",
  "listings.delete": "admin.roles.listingsDelete",
  "reports.review": "admin.roles.reportsReview",
  "ads.manage": "admin.roles.adsManage",
  "wallet.view": "admin.roles.walletView",
  "wallet.adjust": "admin.roles.walletAdjust",
  "settings.edit": "admin.roles.settingsEdit",
  "audit.view": "admin.roles.auditView",
};

export default function AdminRolesSection({ stats }) {
  const { t } = useI18n();
  const counts = {
    user: Math.max(
      0,
      Number(stats?.users?.total || 0) -
        Number(stats?.users?.admins || 0) -
        Number(stats?.users?.superAdmins || 0) -
        Number(stats?.users?.moderators || 0) -
        Number(stats?.users?.accountants || 0)
    ),
    moderator: stats?.users?.moderators,
    accountant: stats?.users?.accountants,
    admin: stats?.users?.admins,
    super_admin: stats?.users?.superAdmins,
  };

  return (
    <section className="admin-panel">
      <header className="admin-panel__head">
        <div>
          <h2 className="admin-panel__title">{t("admin.roles.title")}</h2>
          <p className="text-sm text-ink-500 mt-1">{t("admin.roles.notice")}</p>
        </div>
      </header>
      <div className="admin-panel__body">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("admin.roles.capability")}</th>
                {ROLES.map((role) => (
                  <th key={role}>
                    {roleLabel(role)}
                    <div className="font-normal normal-case tracking-normal text-ink-400">
                      {stats ? Number(counts[role] ?? 0) : "—"}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ACTION_CAPABILITIES.map((item) => (
                <tr key={item.id}>
                  <th scope="row">{t(CAPABILITY_KEYS[item.id] || item.id)}</th>
                  {ROLES.map((role) => (
                    <td key={role} className="text-center">
                      {item.roles.includes(role) ? (
                        <span className="admin-badge admin-badge--ok" aria-label={t("admin.roles.allowed")}>
                          {t("admin.roles.yes")}
                        </span>
                      ) : (
                        <span className="admin-badge admin-badge--neutral" aria-label={t("admin.roles.denied")}>
                          {t("admin.roles.no")}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
