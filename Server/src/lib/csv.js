function csvEscape(value) {
  const str = String(value ?? "");

  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

function toCsv(rows, columns) {
  const header = columns.map((col) => csvEscape(col.label)).join(",");

  const body = rows
    .map((row) =>
      columns.map((col) => csvEscape(col.value(row))).join(",")
    )
    .join("\n");

  return `\uFEFF${header}\n${body}`;
}

module.exports = {
  toCsv,
};
