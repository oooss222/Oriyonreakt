const { toCsv } = require("./csv");

function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

async function getTransporter() {
  if (!isMailConfigured()) {
    return null;
  }

  const nodemailer = require("nodemailer");

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });
}

function buildTransactionsCsv(rows) {
  return toCsv(rows, [
    { label: "ID", value: (row) => row.id },
    { label: "User ID", value: (row) => row.user_id },
    { label: "Email", value: (row) => row.user_email },
    { label: "Имя", value: (row) => row.user_name },
    { label: "Тип", value: (row) => row.type },
    { label: "Сумма", value: (row) => row.amount },
    { label: "Статус", value: (row) => row.status },
    { label: "Описание", value: (row) => row.description },
    { label: "Создано", value: (row) => row.created_at },
  ]);
}

async function sendGenericEmail({ to, subject, text, html }) {
  const transporter = await getTransporter();

  if (!transporter) {
    throw new Error("SMTP is not configured on the server");
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    html: html || text.replace(/\n/g, "<br>"),
  });
}

async function sendFinanceReportEmail({ to, from, toDate, csv, summaryText = "" }) {
  const transporter = await getTransporter();

  if (!transporter) {
    throw new Error("SMTP is not configured on the server");
  }

  const periodLabel = [from, toDate].filter(Boolean).join(" — ") || "все время";

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `Oriyon — финансовый отчёт (${periodLabel})`,
    text: [
      "Финансовый отчёт Oriyon.store",
      "",
      summaryText,
      "",
      `Период: ${periodLabel}`,
      "Во вложении — CSV с транзакциями кошелька.",
    ].join("\n"),
    attachments: [
      {
        filename: "transactions.csv",
        content: `\uFEFF${csv}`,
        contentType: "text/csv; charset=utf-8",
      },
    ],
  });
}

async function sendListingExpiryEmail({ to, name, listings = [] }) {
  if (!listings.length) {
    return false;
  }

  const clientUrl = String(
    process.env.CLIENT_URL || process.env.APP_URL || "https://oriyon.store"
  ).replace(/\/$/, "");
  const lines = listings.map(
    (item) =>
      `- ${item.title} (${item.daysLeft} дн.) → ${clientUrl}/ad/${item.id}`
  );

  await sendGenericEmail({
    to,
    subject: "Oriyon — объявления скоро истекают",
    text: [
      `Здравствуйте${name ? `, ${name}` : ""}!`,
      "",
      "Срок публикации следующих объявлений скоро закончится:",
      ...lines,
      "",
      "Продлите публикацию или поднимите объявление в профиле Oriyon.",
      `${clientUrl}/profile?tab=my`,
    ].join("\n"),
  });

  return true;
}

async function sendSavedSearchAlertEmail({ to, name, searchLabel, listings = [] }) {
  if (!listings.length) {
    return false;
  }

  const clientUrl = String(
    process.env.CLIENT_URL || process.env.APP_URL || "https://oriyon.store"
  ).replace(/\/$/, "");
  const lines = listings.map(
    (item) => `- ${item.title} · ${item.price || "—"} · ${clientUrl}/ad/${item.id}`
  );

  await sendGenericEmail({
    to,
    subject: `Oriyon — новые объявления: ${searchLabel}`,
    text: [
      `Здравствуйте${name ? `, ${name}` : ""}!`,
      "",
      `По сохранённому поиску «${searchLabel}» появились новые объявления:`,
      ...lines,
      "",
      `Открыть каталог: ${clientUrl}/listing`,
    ].join("\n"),
  });

  return true;
}

module.exports = {
  isMailConfigured,
  buildTransactionsCsv,
  sendFinanceReportEmail,
  sendListingExpiryEmail,
  sendSavedSearchAlertEmail,
};
