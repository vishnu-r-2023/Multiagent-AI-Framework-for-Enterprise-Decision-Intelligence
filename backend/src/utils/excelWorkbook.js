import ExcelJS from "exceljs";

const hasCellContent = (value) => {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value === "boolean") {
    return true;
  }

  return String(value ?? "").trim() !== "";
};

const normalizeCellValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeCellValue(item)).join("");
  }

  if (typeof value === "object") {
    if ("result" in value && value.result !== null && value.result !== undefined) {
      return normalizeCellValue(value.result);
    }

    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((segment) => segment?.text || "").join("");
    }

    if ("text" in value && typeof value.text === "string") {
      return value.text;
    }

    if ("hyperlink" in value && typeof value.hyperlink === "string") {
      return value.hyperlink;
    }

    if ("error" in value) {
      return String(value.error || "");
    }

    if ("formula" in value) {
      return "";
    }
  }

  return value;
};

const buildHeaders = (headerRow, lastColumn) => {
  const seenHeaders = new Map();

  return Array.from({ length: lastColumn }, (_, index) => {
    const rawHeader = String(normalizeCellValue(headerRow.getCell(index + 1).value) || "").trim();
    const baseHeader = rawHeader || `Column_${index + 1}`;
    const duplicateCount = seenHeaders.get(baseHeader) || 0;

    seenHeaders.set(baseHeader, duplicateCount + 1);

    if (duplicateCount === 0) {
      return baseHeader;
    }

    return `${baseHeader}_${duplicateCount + 1}`;
  });
};

const findHeaderRowNumber = (worksheet) => {
  for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);

    if (!row.cellCount) {
      continue;
    }

    const hasValues = Array.from({ length: row.cellCount }, (_, index) =>
      hasCellContent(normalizeCellValue(row.getCell(index + 1).value))
    ).some(Boolean);

    if (hasValues) {
      return rowNumber;
    }
  }

  return null;
};

const worksheetToRows = (worksheet) => {
  const headerRowNumber = findHeaderRowNumber(worksheet);

  if (!headerRowNumber) {
    return [];
  }

  const headerRow = worksheet.getRow(headerRowNumber);
  const lastColumn = headerRow.cellCount;

  if (!lastColumn) {
    return [];
  }

  const headers = buildHeaders(headerRow, lastColumn);
  const rows = [];

  for (let rowNumber = headerRowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const entry = {};
    let hasValues = false;

    headers.forEach((header, index) => {
      const value = normalizeCellValue(row.getCell(index + 1).value);

      if (hasCellContent(value)) {
        hasValues = true;
      }

      entry[header] = hasCellContent(value) ? value : "";
    });

    if (hasValues) {
      rows.push(entry);
    }
  }

  return rows;
};

export const loadXlsxWorkbook = async (fileBuffer) => {
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.load(fileBuffer);
  } catch {
    throw new Error("Unable to read the Excel workbook. Save the file as .xlsx and try again.");
  }

  const sheetNames = workbook.worksheets.map((worksheet) => worksheet.name);
  const sheets = Object.fromEntries(
    workbook.worksheets.map((worksheet) => [worksheet.name, worksheetToRows(worksheet)])
  );

  return {
    sheetNames,
    sheets,
  };
};
