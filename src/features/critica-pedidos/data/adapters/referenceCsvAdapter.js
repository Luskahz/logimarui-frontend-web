export function normalizeHeader(value) {
    return value
        .replace(/^\uFEFF/, "")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .replace(/\s+/g, " ");
}
export function cleanText(value) {
    const cleaned = String(value ?? "")
        .replace(/^\uFEFF/, "")
        .replace(/\s+/g, " ")
        .trim();
    if (!cleaned || cleaned === "-" || cleaned.toLowerCase() === "null") {
        return null;
    }
    return cleaned;
}
export function cleanId(value) {
    const cleaned = cleanText(value);
    if (!cleaned) {
        return "";
    }
    const onlyDigits = cleaned.replace(/\D/g, "");
    if (onlyDigits.length > 0 && onlyDigits.length === cleaned.replace(/\s/g, "").length) {
        return String(Number(onlyDigits));
    }
    return cleaned;
}
export function parsePtNumber(value) {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
    }
    const cleaned = cleanText(value);
    if (!cleaned || /[a-z]/i.test(cleaned)) {
        return null;
    }
    const numeric = cleaned.replace(/\s/g, "").replace(/[^0-9,.-]/g, "");
    if (!numeric || numeric === "-" || numeric === "," || numeric === ".") {
        return null;
    }
    const normalized = numeric.includes(",") ? numeric.replace(/\./g, "").replace(",", ".") : numeric;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
}
export function parsePtDate(value) {
    const cleaned = cleanText(value);
    if (!cleaned) {
        return null;
    }
    const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
    if (!match) {
        return cleaned;
    }
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2000) {
        return null;
    }
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
export function decodeCsvBuffer(buffer) {
    try {
        return {
            encoding: "utf-8",
            text: new TextDecoder("utf-8", { fatal: true }).decode(buffer),
        };
    }
    catch {
        return {
            encoding: "windows-1252",
            text: new TextDecoder("windows-1252").decode(buffer),
        };
    }
}
export function detectDelimiter(text) {
    const firstLine = text.split(/\r?\n/).find((line) => cleanText(line));
    if (!firstLine) {
        return ";";
    }
    const semicolons = countChar(firstLine, ";");
    const commas = countChar(firstLine, ",");
    return semicolons >= commas ? ";" : ",";
}
export function parseCsvText(text, delimiter = detectDelimiter(text), encoding = "utf-8") {
    const records = splitCsvRecords(text);
    const headers = parseCsvRecord(records[0] ?? "", delimiter).map((header) => header.replace(/^\uFEFF/, "").trim());
    const normalizedHeaders = dedupeHeaders(headers.map(normalizeHeader));
    const rows = records
        .slice(1)
        .map((record) => parseCsvRecord(record, delimiter))
        .filter((values) => values.some((value) => cleanText(value)))
        .map((values) => {
        const row = {};
        normalizedHeaders.forEach((header, index) => {
            row[header] = values[index]?.trim() ?? "";
        });
        return row;
    });
    return {
        delimiter,
        encoding,
        headers,
        normalizedHeaders,
        rows,
    };
}
export function getField(row, candidates) {
    for (const candidate of candidates) {
        const value = row[normalizeHeader(candidate)];
        const cleaned = cleanText(value);
        if (cleaned !== null) {
            return cleaned;
        }
    }
    return null;
}
function countChar(value, char) {
    return Array.from(value).filter((item) => item === char).length;
}
function splitCsvRecords(text) {
    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
    const records = [];
    let current = "";
    lines.forEach((line) => {
        current = current ? `${current}\n${line}` : line;
        if (hasBalancedQuotes(current)) {
            records.push(current);
            current = "";
        }
    });
    if (current) {
        records.push(current);
    }
    return records.filter((record) => record.trim().length > 0);
}
function hasBalancedQuotes(record) {
    let quoteCount = 0;
    for (let index = 0; index < record.length; index += 1) {
        if (record[index] === '"') {
            if (record[index + 1] === '"') {
                index += 1;
            }
            else {
                quoteCount += 1;
            }
        }
    }
    return quoteCount % 2 === 0;
}
function parseCsvRecord(record, delimiter) {
    const values = [];
    let current = "";
    let quoted = false;
    for (let index = 0; index < record.length; index += 1) {
        const char = record[index];
        const next = record[index + 1];
        if (char === '"') {
            if (quoted && next === '"') {
                current += '"';
                index += 1;
            }
            else {
                quoted = !quoted;
            }
            continue;
        }
        if (char === delimiter && !quoted) {
            values.push(current);
            current = "";
            continue;
        }
        current += char;
    }
    values.push(current);
    return values;
}
function dedupeHeaders(headers) {
    const counts = new Map();
    return headers.map((header, index) => {
        const base = header || `coluna ${index + 1}`;
        const count = counts.get(base) ?? 0;
        counts.set(base, count + 1);
        return count === 0 ? base : `${base} ${count + 1}`;
    });
}
