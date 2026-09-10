const Wallet = require("../models/Wallet");
const SiteSettings = require("../models/SiteSettings");
const { runWithRlsContext, SYSTEM_CONTEXT } = require("./rlsContext");
const { buildTransactionsCsv, sendFinanceReportEmail } = require("./mailer");

function monthBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const fmt = (value) => value.toISOString().slice(0, 10);

  return {
    from: fmt(start),
    to: fmt(end),
  };
}

async function sendFinanceReport({ to, from = "", toDate = "" }) {
  const [rows, report] = await Promise.all([
    Wallet.getTransactionsCsv({ from, to: toDate }),
    Wallet.getPeriodReport({ from, to: toDate }),
  ]);

  const csv = buildTransactionsCsv(rows);
  const summaryText = [
    `Операций: ${report.totalTransactions}`,
    `Пополнения: +${report.credits.toLocaleString("ru-RU")} TJS`,
    `Списания: ${report.debits.toLocaleString("ru-RU")} TJS`,
    `Корректировки: ${report.manualAdjustments} (${report.manualAdjustmentsSum.toLocaleString("ru-RU")} TJS)`,
  ].join("\n");

  await sendFinanceReportEmail({
    to,
    from,
    toDate,
    csv,
    summaryText,
  });

  return {
    sentTo: to,
    transactions: rows.length,
    report,
  };
}

async function maybeSendMonthlyReport() {
  const settings = await SiteSettings.get();

  if (!settings.monthlyReportEnabled || !settings.accountantReportEmail) {
    return false;
  }

  const now = new Date();

  if (now.getDate() !== 1 || now.getHours() < 8) {
    return false;
  }

  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  if (settings.lastFinanceReportSent === monthKey) {
    return false;
  }

  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const { from, to } = monthBounds(prevMonth);

  await sendFinanceReport({
    to: settings.accountantReportEmail,
    from,
    toDate: to,
  });

  await SiteSettings.update(
    {
      lastFinanceReportSent: monthKey,
    },
    null
  );

  console.log("Monthly finance report sent to", settings.accountantReportEmail);

  return true;
}

function startMonthlyReportScheduler() {
  // Reads wallet transactions across all users, so it runs as system now that
  // queries default to anonymous.
  const tick = () => {
    runWithRlsContext(SYSTEM_CONTEXT, maybeSendMonthlyReport).catch((e) => {
      console.error("MONTHLY_FINANCE_REPORT_ERROR:", e?.message);
    });
  };

  tick();
  setInterval(tick, 60 * 60 * 1000);
}

module.exports = {
  monthBounds,
  sendFinanceReport,
  maybeSendMonthlyReport,
  startMonthlyReportScheduler,
};
