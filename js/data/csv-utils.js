import { CSV_SCHEMAS } from "./csv-schema.js";

export function parseCsv(collection, text) {
  const schema = CSV_SCHEMAS[collection];
  const result = window.Papa.parse(text || schema.columns.join(";"), {
    header: true,
    delimiter: ";",
    skipEmptyLines: true
  });

  return result.data
    .filter((row) => row && Object.values(row).some((value) => String(value || "").trim() !== ""))
    .map((row) => normalizeRow(collection, row));
}

export function unparseCsv(collection, rows) {
  const schema = CSV_SCHEMAS[collection];
  const safeRows = (rows || []).map((row) => {
    return schema.columns.reduce((output, column) => {
      output[column] = row[column] ?? "";
      return output;
    }, {});
  });

  return window.Papa.unparse(safeRows, {
    delimiter: ";",
    columns: schema.columns
  });
}

export function normalizeRow(collection, row) {
  const schema = CSV_SCHEMAS[collection];
  return schema.columns.reduce((output, column) => {
    const rawValue = row[column] ?? "";
    output[column] = schema.numeric.includes(column) ? toNumber(rawValue) : String(rawValue);
    return output;
  }, {});
}

function toNumber(value) {
  if (value === "" || value == null) {
    return 0;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}
