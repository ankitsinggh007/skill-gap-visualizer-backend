// lib/benchmark/loader.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const reactJuniorUnicorn = JSON.parse(
  fs.readFileSync(path.join(__dirname, "./react_junior_unicorn.json"), "utf-8"),
);
const react_senior_unicorn = JSON.parse(
  fs.readFileSync(path.join(__dirname, "./react_senior_unicorn.json"), "utf-8"),
);

const BENCHMARKS = {
  react: {
    junior: {
      unicorn: reactJuniorUnicorn,
    },
    senior: {
      unicorn: react_senior_unicorn,
    },
  },
};

export function loadBenchmark(role, level, companyType) {
  return BENCHMARKS?.[role]?.[level]?.[companyType] || null;
}
