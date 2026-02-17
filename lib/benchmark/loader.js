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

function buildSupportedBenchmarks(map) {
  const roles = new Set();
  const levels = new Set();
  const companyTypes = new Set();
  const combinations = [];

  for (const [role, levelMap] of Object.entries(map || {})) {
    for (const [level, companyMap] of Object.entries(levelMap || {})) {
      for (const [companyType, benchmark] of Object.entries(companyMap || {})) {
        if (!benchmark) continue;
        roles.add(role);
        levels.add(level);
        companyTypes.add(companyType);
        combinations.push({ role, level, companyType });
      }
    }
  }

  const sortedRoles = Array.from(roles).sort();
  const sortedLevels = Array.from(levels).sort();
  const sortedCompanyTypes = Array.from(companyTypes).sort();
  const sortedCombinations = combinations.sort((a, b) => {
    if (a.role !== b.role) return a.role.localeCompare(b.role);
    if (a.level !== b.level) return a.level.localeCompare(b.level);
    return a.companyType.localeCompare(b.companyType);
  });

  return {
    roles: sortedRoles,
    levels: sortedLevels,
    companyTypes: sortedCompanyTypes,
    combinations: sortedCombinations,
  };
}

const SUPPORTED_BENCHMARKS = buildSupportedBenchmarks(BENCHMARKS);

export function loadBenchmark(role, level, companyType) {
  return BENCHMARKS?.[role]?.[level]?.[companyType] || null;
}

export function listSupportedBenchmarks() {
  return SUPPORTED_BENCHMARKS;
}
