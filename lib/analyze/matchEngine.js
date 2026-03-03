// project/lib/analyze/matchEngine.js

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reactDictPath = path.join(__dirname, "../dictionary/react.json");
const reactDict = JSON.parse(fs.readFileSync(reactDictPath, "utf-8"));

/* -----------------------------------------------------
   Load dictionary (React only for now)
----------------------------------------------------- */
let DICT = reactDict;
let ALIAS_MAP = buildAliasMap(DICT);

export function resetLayerC() {
  // no-op in serverless; kept for test compatibility
  DICT = reactDict;
  ALIAS_MAP = buildAliasMap(DICT);
}
function loadDictionary() {
  return DICT || {};
}

function buildAliasMap(dict) {
  const map = new Map();
  if (!dict) return map;

  for (const [canonical, entry] of Object.entries(dict)) {
    const canon = norm(canonical);
    if (canon) map.set(canon, canon);

    const explicit = Array.isArray(entry?.explicit) ? entry.explicit : [];
    const weak = Array.isArray(entry?.weak) ? entry.weak : [];

    for (const alias of [...explicit, ...weak]) {
      const normalized = norm(alias);
      if (normalized) map.set(normalized, canon);
    }
  }

  return map;
}
/* -----------------------------------------------------
   Normalize text
----------------------------------------------------- */
export function norm(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, " ") // remove all special characters
    .replace(/\s+/g, " "); // collapse multiple spaces
}

/* -----------------------------------------------------
   Dictionary lookup for benchmark skill
----------------------------------------------------- */
function getSynonymGroups(skillName) {
  const dict = loadDictionary();
  const key = norm(skillName);

  const entry = dict[key];
  if (!entry) {
    return { explicit: [], weak: [] };
  }

  return {
    explicit: Array.isArray(entry.explicit) ? entry.explicit.map(norm) : [],
    weak: Array.isArray(entry.weak) ? entry.weak.map(norm) : [],
  };
}

/* -----------------------------------------------------
   EXPLICIT MATCHING
   - Direct user skill match
   - Benchmark keywords
----------------------------------------------------- */
export function checkExplicitMatch(skill, userSkillSet) {
  const main = norm(skill.name);

  // direct match
  if (userSkillSet.has(main)) {
    return true;
  }

  // keyword match
  if (skill.keywords) {
    for (const kw of skill.keywords) {
      const normedKw = norm(kw);
      if (userSkillSet.has(normedKw)) {
        return true;
      }
    }
  }

  return false;
}

/* -----------------------------------------------------
   WEAK SIGNAL MATCHING
   - Benchmark name
   - Benchmark keywords
   - Weak synonyms only
----------------------------------------------------- */
export function detectWeakSignal(skill, normalizedResume) {
  const text = normalizedResume.normalizedText;
  const freq = normalizedResume.frequencyMap;

  const searchTerms = new Set();

  searchTerms.add(norm(skill.name));

  if (skill.keywords) {
    for (const kw of skill.keywords) searchTerms.add(norm(kw));
  }

  const syns = getSynonymGroups(skill.name).weak;
  for (const s of syns) searchTerms.add(norm(s));

  for (const term of searchTerms) {
    if (term.length < 3) continue;

    if (freq[term]) {
      return true;
    }

    if (text.includes(term)) {
      return true;
    }
  }

  return false;
}

/* -----------------------------------------------------
   MAIN MATCH ENGINE
----------------------------------------------------- */
export function matchAllSkills(categories, normalizedResume, allUserSkills) {
  const userSkillSet = new Set();

  /* -----------------------------------------------------
     1. Build explicit matching set
        Add:
        - user skills
        - benchmark-explicit synonyms for each user skill
  ----------------------------------------------------- */
  for (const userSkill of allUserSkills.map(norm)) {
    if (!userSkill) continue;
    userSkillSet.add(userSkill);

    const canonical = ALIAS_MAP.get(userSkill);
    if (canonical) userSkillSet.add(canonical);

    const synGroups = getSynonymGroups(userSkill).explicit;
    for (const s of synGroups) {
      userSkillSet.add(norm(s));
    }
  }

  const matchedSkills = [];
  const weakSignals = [];
  const missingSkills = [];

  /* -----------------------------------------------------
     2. Evaluate each benchmark skill
  ----------------------------------------------------- */
  for (const category of categories) {
    for (const skill of category.skills) {
      const skillName = skill.name;

      // 1️⃣ explicit match
      if (checkExplicitMatch(skill, userSkillSet)) {
        matchedSkills.push({
          skill: skillName,
          category: category.name,
          type: "explicit",
        });
        continue;
      }

      // 2️⃣ weak match
      if (detectWeakSignal(skill, normalizedResume)) {
        weakSignals.push({
          skill: skillName,
          category: category.name,
          type: "weak-signal",
        });
        continue;
      }

      // 3️⃣ missing
      missingSkills.push({
        skill: skillName,
        category: category.name,
      });
    }
  }

  return { matchedSkills, weakSignals, missingSkills };
}
