type CellValue = string | number | boolean | null | undefined;
type ExportRow = Record<string, CellValue>;

function stamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

export async function exportToXlsx(filename: string, sheetName: string, rows: ExportRow[]) {
  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  worksheet["!cols"] = headers.map(header => ({
    wch: Math.min(Math.max(header.length, ...rows.map(row => String(row[header] ?? "").length)) + 2, 42),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, `${filename}-${stamp()}.xlsx`);
}
