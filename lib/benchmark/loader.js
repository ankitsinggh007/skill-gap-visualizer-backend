// lib/benchmark/loader.js
import reactJuniorUnicorn from "./react_junior_unicorn.json";
import react_senior_unicorn from "./react_senior_unicorn.json";

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
