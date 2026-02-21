// ------------------------------------------------------
// 1. Clean a skill string into canonical normalized form
// ------------------------------------------------------
export function cleanSkillName(raw) {
  if (!raw || typeof raw !== "string") return "";

  return raw
    .toLowerCase()
    .replace(/[^a-z0-9+\s/.-]/g, "") // remove weird unicode junk
    .replace(/\s+/g, " ")            // collapse spaces
    .trim();
}

// ------------------------------------------------------
// 2. Extract skill name from ANY shape thrown by AI
//    "React", { skill: "React" }, { name: "ReactJS" }
// ------------------------------------------------------
function extractSkillName(item) {
  if (!item) return "";

  // Case 1: direct string  → "React"
  if (typeof item === "string") return cleanSkillName(item);

  // Case 2: { skill: "React" }
  if (typeof item.skill === "string") return cleanSkillName(item.skill);

  // Case 3: { name: "React" }
  if (typeof item.name === "string") return cleanSkillName(item.name);

  // Case 4: Unexpected shape → ignore
  return "";
}

// ------------------------------------------------------
// 3. Extract source from inferred items (fallback to reason)
// ------------------------------------------------------
function extractSource(item) {
  if (!item || typeof item !== "object") return "";
  if (typeof item.source === "string") return item.source.trim();
  if (typeof item.reason === "string") return item.reason.trim();
  return "";
}

// ------------------------------------------------------
// 4. Normalize extractedSkills → ["react", "hooks", ...]
// ------------------------------------------------------
export function normalizeExtractedSkills(list) {
  if (!Array.isArray(list)) return [];

  const output = [];

  for (const item of list) {
    const cleaned = extractSkillName(item);
    if (cleaned) output.push(cleaned);
  }

  return output;
}

// ------------------------------------------------------
// 5. Normalize inferredSkills
//    Output: [{ skill: "state management", source: "..." }]
// ------------------------------------------------------
export function normalizeInferredSkills(list) {
  if (!Array.isArray(list)) return [];

  const output = [];

  for (const item of list) {
    const cleaned = extractSkillName(item);
    if (!cleaned) continue;

    const source = extractSource(item);

    output.push({ skill: cleaned, source });
  }

  return output;
}

// ------------------------------------------------------
// 6. Merge extracted + inferred into unique allSkills[]
// ------------------------------------------------------
export function mergeSkills(extracted, inferred) {
  const set = new Set();

  for (const s of extracted) set.add(s);
  for (const obj of inferred) set.add(obj.skill);

  return Array.from(set);
}

// ------------------------------------------------------
// 7. MASTER NORMALIZER — pure, predictable output
// ------------------------------------------------------
export function normalizeSkills(extractedSkills, inferredSkills) {

  const extracted = normalizeExtractedSkills(extractedSkills);
  const inferred = normalizeInferredSkills(inferredSkills);
  const allSkills = mergeSkills(extracted, inferred);


  return { extracted, inferred, allSkills };
}
