import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { writeFile } from "node:fs/promises";

type Card = { de: string; en: string; category: string };
type Forms = Record<string, string>;
type SeedWord = {
  german: string; english: string; categories: string[];
  presentForm: string | null; preteriteForm: string | null; perfectForm: string | null;
};

const args = process.argv.slice(2);
const value = (name: string, fallback: string) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const source = resolve(value("--source", "legacy-source"));
const output = resolve(value("--output", "api/src/main/resources/seed/legacy-vocabulary.json"));
const reportPath = resolve(value("--report", "reports/legacy-import-report.json"));
const dryRun = args.includes("--dry-run");

const vocabulary = await import(pathToFileURL(resolve(source, "app/vocabulary.ts")).href) as { cards: Card[] };
const formsModule = await import(pathToFileURL(resolve(source, "app/irregular-forms.ts")).href) as { irregularForms: Forms };

const normalized = new Map<string, SeedWord>();
let duplicateRows = 0;
for (const card of vocabulary.cards) {
  const german = card.de.trim();
  const english = card.en.trim();
  if (!german || !english) continue;
  const key = `${german.toLocaleLowerCase("de-DE")}\u0000${english.toLocaleLowerCase("en")}`;
  const existing = normalized.get(key);
  if (existing) {
    duplicateRows++;
    if (!existing.categories.includes(card.category)) existing.categories.push(card.category);
    continue;
  }
  const rawForms = formsModule.irregularForms[german] ?? "";
  const match = rawForms.match(/^Präsens:\s*(.*?)\s*·\s*Präteritum:\s*(.*?)\s*·\s*Perfekt:\s*(.*)$/);
  normalized.set(key, {
    german, english, categories: [card.category],
    presentForm: match?.[1]?.trim() || null,
    preteriteForm: match?.[2]?.trim() || null,
    perfectForm: match?.[3]?.trim() || null
  });
}

const words = [...normalized.values()].sort((a, b) => a.german.localeCompare(b.german, "de"));
const categories = [...new Set(words.flatMap(word => word.categories))].sort();
const report = {
  sourceRows: vocabulary.cards.length,
  uniqueWords: words.length,
  duplicateRowsMerged: duplicateRows,
  categories: categories.length,
  missingEnglish: words.filter(word => !word.english).map(word => word.german),
  irregularWordsWithoutForms: words.filter(word => word.categories.includes("Irregular verbs") && !word.presentForm).map(word => word.german),
  dryRun
};

await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (!dryRun) await writeFile(output, `${JSON.stringify({ version: 1, categories, words }, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

