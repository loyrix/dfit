#!/usr/bin/env node

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "../..");

const groups = {
  A: { name: "Cereals and Millets", expectedCount: 24, scope: "core_table_1" },
  B: { name: "Grain Legumes", expectedCount: 25, scope: "core_table_1" },
  C: { name: "Green Leafy Vegetables", expectedCount: 34, scope: "core_table_1" },
  D: { name: "Other Vegetables", expectedCount: 78, scope: "core_table_1" },
  E: { name: "Fruits", expectedCount: 68, scope: "core_table_1" },
  F: { name: "Roots and Tubers", expectedCount: 19, scope: "core_table_1" },
  G: { name: "Condiments and Spices", expectedCount: 33, scope: "core_table_1" },
  H: { name: "Nuts and Oil Seeds", expectedCount: 21, scope: "core_table_1" },
  I: { name: "Sugars", expectedCount: 2, scope: "core_table_1" },
  J: { name: "Mushrooms", expectedCount: 4, scope: "core_table_1" },
  K: { name: "Miscellaneous Foods", expectedCount: 2, scope: "core_table_1" },
  L: { name: "Milk and Milk Products", expectedCount: 4, scope: "core_table_1" },
  M: { name: "Egg and Egg Products", expectedCount: 15, scope: "core_table_1" },
  N: { name: "Poultry", expectedCount: 19, scope: "core_table_1" },
  O: { name: "Animal Meat", expectedCount: 63, scope: "core_table_1" },
  P: { name: "Marine Fish", expectedCount: 92, scope: "core_table_1" },
  Q: { name: "Marine Shellfish", expectedCount: 8, scope: "core_table_1" },
  R: { name: "Marine Mollusks", expectedCount: 7, scope: "core_table_1" },
  S: { name: "Fresh Water Fish and Shellfish", expectedCount: 10, scope: "core_table_1" },
  T: { name: "Edible Oils and Fats", expectedCount: 14, scope: "fatty_acid_table_12_only" },
};

// Ghostscript preserves the code rows well, but these PDF rows wrap the label away from the code.
// Keep the reviewed corrections explicit so extraction never silently guesses them.
const wrappedTable1Labels = {
  A002: "Amaranth seed, pale brown (Amaranthus cruentus)",
  C004: "Amaranth leaves, red and green mix (Amaranthus gangeticus)",
  C005: "Amaranth spined, leaves, green (Amaranthus spinosus)",
  C006: "Amaranth spined, leaves, red and green mix (Amaranthus spinosus)",
  C012: "Brussels sprouts (Brassica oleracea var. gemmifera)",
  C014: "Cabbage, collard greens (Brassica oleracea var. viridis)",
  C015: "Cabbage, green (Brassica oleracea var. capitata f. alba)",
  C016: "Cabbage, violet (Brassica oleracea var. capitata f. rubra)",
  C017: "Cauliflower leaves (Brassica oleracea var. botrytis)",
  C024: "Knol-Khol, leaves (Brassica oleracea var. gongylodes)",
  D004: "Bitter gourd, jagged, teeth ridges, elongate (Momordica charantia)",
  D005: "Bitter gourd, jagged, teeth ridges, short (Momordica charantia)",
  D006: "Bitter gourd, jagged, smooth ridges, elongate (Momordica charantia)",
  D007: "Bottle gourd, elongate, pale green (Lagenaria vulgaris)",
  D008: "Bottle gourd, round, pale green (Lagenaria vulgaris)",
  D009: "Bottle gourd, elongate, dark green (Lagenaria vulgaris)",
  D017: "Brinjal-8 (Solanum melongena)",
  D042: "Corn, baby (Zea mays)",
  D052: "Jack fruit, seed, mature (Artocarpus heterophyllus)",
  D070: "Snake gourd, long, pale green (Trichosanthes anguina)",
  D071: "Snake gourd, long, dark green (Trichosanthes anguina)",
  E065: "Water melon, dark green (sugar baby) (Citrullus vulgaris)",
  P092: "Eggs, Cat fish (Ompok bimaculatus)",
};

const table12Labels = {
  T001: "Coconut oil",
  T002: "Corn oil",
  T003: "Cotton seed oil",
  T004: "Gingelly oil",
  T005: "Groundnut oil",
  T006: "Mustard oil",
  T007: "Palm oil",
  T008: "Rice bran oil",
  T009: "Safflower oil",
  T010: "Safflower oil (blended)",
  T011: "Soyabean oil",
  T012: "Sunflower oil",
  T013: "Ghee",
  T014: "Vanaspati",
};

const args = parseArgs(process.argv.slice(2));
if (!args.pdfPath) {
  fail(
    [
      "Missing required --pdf argument.",
      "Example:",
      "  pnpm data:ifct:index -- --pdf /absolute/path/to/IFCT2017.pdf",
    ].join("\n"),
  );
}

const outDir = path.resolve(args.outDir ?? path.join(repoRoot, "docs/data"));
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ifct2017-"));
const table1TextPath = path.join(tempDir, "table1.txt");

extractPagesToText(args.pdfPath, table1TextPath, 41, 70);

const table1Rows = parseTable1Rows(fs.readFileSync(table1TextPath, "utf8"));
const table12Rows = Object.entries(table12Labels).map(([code, officialLabel]) =>
  createRow({
    code,
    officialLabel,
    sourceTable: "Table 12",
    extractionMethod: "manual_reviewed_table_12",
    reviewStatus: "reviewed",
    reviewNote: "Group T appears in fatty-acid tables, not Table 1.",
  }),
);
const rows = [...table1Rows, ...table12Rows].sort((left, right) =>
  left.code.localeCompare(right.code),
);

const validation = validateRows(rows);
fs.mkdirSync(outDir, { recursive: true });
writeCsv(path.join(outDir, "ifct2017_food_index.csv"), rows);
writeMarkdown(path.join(outDir, "ifct2017_food_index.md"), rows, validation, args.pdfPath);

process.stdout.write(
  [
    `Wrote ${rows.length} IFCT source rows to ${outDir}`,
    `Core Table 1 rows: ${validation.coreCount}`,
    `Extended rows including Table 12 oils/fats: ${validation.totalCount}`,
    `Review flags: ${validation.reviewRows.length}`,
  ].join("\n") + "\n",
);

function parseArgs(rawArgs) {
  const parsed = {};
  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    const value = rawArgs[index + 1];
    if (arg === "--") {
      continue;
    }
    if (arg === "--pdf") {
      parsed.pdfPath = path.resolve(value ?? "");
      index += 1;
    } else if (arg === "--out-dir") {
      parsed.outDir = value;
      index += 1;
    } else {
      fail(`Unknown argument: ${arg}`);
    }
  }
  return parsed;
}

function extractPagesToText(pdfPath, outputPath, firstPage, lastPage) {
  if (!fs.existsSync(pdfPath)) fail(`PDF not found: ${pdfPath}`);

  execFileSync("gs", [
    "-q",
    "-dNOPAUSE",
    "-dBATCH",
    `-dFirstPage=${firstPage}`,
    `-dLastPage=${lastPage}`,
    "-sDEVICE=txtwrite",
    `-sOutputFile=${outputPath}`,
    pdfPath,
  ]);
}

function parseTable1Rows(text) {
  return text
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(/^\s*([A-S]\d{3})\b(.*)$/);
      if (!match) return undefined;

      const code = match[1];
      const rest = match[2];
      const directLabel = extractDirectLabel(rest);
      const wrappedLabel = wrappedTable1Labels[code];
      const officialLabel = wrappedLabel ?? directLabel;
      if (!officialLabel) fail(`Missing label for ${code}`);

      return createRow({
        code,
        officialLabel,
        sourceTable: "Table 1",
        extractionMethod: wrappedLabel ? "manual_reviewed_wrapped_row" : "direct_extract",
        reviewStatus: wrappedLabel ? "reviewed" : undefined,
        reviewNote: reviewNoteFor(code, officialLabel, wrappedLabel),
      });
    })
    .filter(Boolean);
}

function extractDirectLabel(rest) {
  const match = rest.match(/^\s*(.*?)\s{2,}\d{1,2}\s{2,}/);
  return match?.[1].trim().replace(/\s+/g, " ");
}

function createRow({
  code,
  officialLabel,
  sourceTable,
  extractionMethod,
  reviewStatus,
  reviewNote,
}) {
  const groupCode = code[0];
  const group = groups[groupCode];
  if (!group) fail(`Unknown group for ${code}`);

  return {
    code,
    groupCode,
    groupName: group.name,
    datasetScope: group.scope,
    officialLabel: officialLabel.replace(/\s+/g, " ").trim(),
    sourceTable,
    extractionMethod,
    reviewStatus: reviewStatus ?? (reviewNote ? "needs_review" : "reviewed"),
    reviewNote,
  };
}

function reviewNoteFor(code, officialLabel, wrappedLabel) {
  if (code === "D075") return "Source label contains doubled opening parenthesis in the PDF.";
  if (wrappedLabel) return "";
  if (!officialLabel) return "Missing direct label.";
  return "";
}

function validateRows(rows) {
  const uniqueCodes = new Set(rows.map((row) => row.code));
  if (uniqueCodes.size !== rows.length) fail("Duplicate IFCT codes detected.");

  const countsByGroup = Object.fromEntries(
    Object.keys(groups).map((groupCode) => [
      groupCode,
      rows.filter((row) => row.groupCode === groupCode).length,
    ]),
  );

  for (const [groupCode, group] of Object.entries(groups)) {
    if (countsByGroup[groupCode] !== group.expectedCount) {
      fail(
        `Unexpected ${groupCode} count. Expected ${group.expectedCount}, received ${countsByGroup[groupCode]}.`,
      );
    }
  }

  const coreCount = rows.filter((row) => row.datasetScope === "core_table_1").length;
  if (coreCount !== 528) fail(`Expected 528 Table 1 rows, received ${coreCount}.`);

  return {
    totalCount: rows.length,
    coreCount,
    countsByGroup,
    reviewRows: rows.filter((row) => row.reviewStatus === "needs_review"),
  };
}

function writeCsv(outputPath, rows) {
  const headers = [
    "ifct_code",
    "group_code",
    "group_name",
    "dataset_scope",
    "official_label",
    "source_table",
    "extraction_method",
    "review_status",
    "review_note",
  ];
  const body = rows.map((row) =>
    [
      row.code,
      row.groupCode,
      row.groupName,
      row.datasetScope,
      row.officialLabel,
      row.sourceTable,
      row.extractionMethod,
      row.reviewStatus,
      row.reviewNote,
    ]
      .map(csvEscape)
      .join(","),
  );

  fs.writeFileSync(outputPath, [headers.join(","), ...body].join("\n") + "\n");
}

function writeMarkdown(outputPath, rows, validation, pdfPath) {
  const groupSummary = Object.entries(groups)
    .map(([code, group]) => {
      const actual = validation.countsByGroup[code];
      return `| ${code} | ${group.name} | ${group.scope} | ${actual} |`;
    })
    .join("\n");

  const reviewRows =
    validation.reviewRows.length === 0
      ? "_No rows flagged._"
      : [
          "| Code | Label | Note |",
          "| --- | --- | --- |",
          ...validation.reviewRows.map(
            (row) =>
              `| ${row.code} | ${escapeMarkdown(row.officialLabel)} | ${escapeMarkdown(row.reviewNote)} |`,
          ),
        ].join("\n");

  const groupedRows = Object.entries(groups)
    .map(([code, group]) => {
      const lines = rows
        .filter((row) => row.groupCode === code)
        .map((row) => `| ${row.code} | ${escapeMarkdown(row.officialLabel)} | ${row.sourceTable} |`)
        .join("\n");
      return [
        `## ${code}. ${group.name}`,
        "",
        "| Code | Official label | Source table |",
        "| --- | --- | --- |",
        lines,
      ].join("\n");
    })
    .join("\n\n");

  const markdown = [
    "# IFCT 2017 Food Index",
    "",
    "Status: review artifact only; do not seed production tables from this file until source-rights approval and nutrient-field validation are complete.",
    "",
    "## Source And Trust Notes",
    "",
    `- Source PDF used for this extraction: \`${path.basename(pdfPath)}\``,
    "- Table 1 contains 528 core food rows across groups A-S.",
    "- Group T adds 14 edible oils and fats in Table 12, so the extended source index contains 542 rows.",
    "- The PDF front matter says the publication cannot be electronically stored or reproduced for product creation without prior permission from NIN; treat this file as internal review material until licensing is resolved.",
    "- Extraction keeps official IFCT labels and codes separate from any future DFit canonical names, aliases, recipes, or portion conversions.",
    "",
    "## Validation",
    "",
    `- Core Table 1 rows: ${validation.coreCount}`,
    `- Extended source rows including Table 12 oils/fats: ${validation.totalCount}`,
    `- Unique IFCT codes: ${rows.length}`,
    `- Rows flagged for visual review: ${validation.reviewRows.length}`,
    "",
    "| Group | Name | Scope | Rows |",
    "| --- | --- | --- | ---: |",
    groupSummary,
    "",
    "## Rows Needing Visual Review",
    "",
    reviewRows,
    "",
    groupedRows,
    "",
  ].join("\n");

  fs.writeFileSync(outputPath, markdown);
}

function csvEscape(value) {
  const stringValue = String(value ?? "");
  if (!/[",\n]/.test(stringValue)) return stringValue;
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function escapeMarkdown(value) {
  return String(value ?? "").replace(/\|/g, "\\|");
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
