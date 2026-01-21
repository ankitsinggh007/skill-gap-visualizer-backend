// // lib/analyze/ats/computeATSKeywordReadiness.js

// /**
//  * Compute ATS Keyword Readiness
//  *
//  * Very simple, safe logic:
//  * - Extract all benchmark skill keywords
//  * - Normalize resume tokens (already preprocessed)
//  * - Count how many benchmark keywords appear in resume
//  * - Provide score + summary + missing keywords
//  */

// export function computeATSKeywordReadiness({ normalizedResume, benchmark }) {
//   if (!benchmark || !benchmark.categories || !normalizedResume) {
//     return {
//       score: 0,
//       percentage: 0,
//       matchedKeywords: [],
//       missingKeywords: [],
//     };
//   }

//   // ----------------------------
//   // 1. Collect all benchmark keywords
//   // ----------------------------
//   const benchmarkSkills = [];
//   benchmark.categories.forEach((cat) => {
//     cat.skills.forEach((s) => {
//       benchmarkSkills.push(s.name.toLowerCase());
//     });
//   });

//   // Convert to Set to avoid duplication
//   const uniqueBenchmarkSkills = Array.from(new Set(benchmarkSkills));

//   // ----------------------------
//   // 2. Resume tokens (already normalized in Layer A)
//   // ----------------------------
//   const resumeTokens = new Set(normalizedResume.tokens);

//   // ----------------------------
//   // 3. Compute keyword hits
//   // ----------------------------
//   const matchedKeywords = [];
//   const missingKeywords = [];

//   for (const keyword of uniqueBenchmarkSkills) {
//     if (resumeTokens.has(keyword)) {
//       matchedKeywords.push(keyword);
//     } else {
//       missingKeywords.push(keyword);
//     }
//   }

//   const score = matchedKeywords.length;
//   const total = uniqueBenchmarkSkills.length;
//   const percentage = total > 0 ? score / total : 0;

//   return {
//     score,
//     total,
//     percentage: Number(percentage.toFixed(4)),
//     matchedKeywords,
//     missingKeywords,
//   };
// }
// lib/analyze/ats/computeATSKeywordReadiness.js

/**
 * Compute ATS Keyword Readiness
 *
 * Correct logic:
 * - Collect ALL benchmark keywords (not skill names)
 * - Normalize
 * - Match against resume tokens
 */

export function computeATSKeywordReadiness({ normalizedResume, benchmark }) {
  if (!benchmark || !benchmark.categories || !normalizedResume) {
    return {
      score: 0,
      total: 0,
      percentage: 0,
      matchedKeywords: [],
      missingKeywords: [],
    };
  }

  // ----------------------------------
  // 1. Collect benchmark keywords
  // ----------------------------------
  const keywordSet = new Set();

  benchmark.categories.forEach((cat) => {
    cat.skills.forEach((skill) => {
      if (Array.isArray(skill.keywords)) {
        skill.keywords.forEach((kw) => {
          if (typeof kw === "string" && kw.trim()) {
            keywordSet.add(kw.toLowerCase());
          }
        });
      }
    });
  });

  const allKeywords = Array.from(keywordSet);

  // ----------------------------------
  // 2. Resume tokens (already normalized)
  // ----------------------------------
  const resumeTokens = new Set(normalizedResume.tokens);

  // ----------------------------------
  // 3. Match keywords
  // ----------------------------------
  const matchedKeywords = [];
  const missingKeywords = [];

  for (const kw of allKeywords) {
    if (resumeTokens.has(kw)) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  }

  const score = matchedKeywords.length;
  const total = allKeywords.length;
  const percentage = total > 0 ? score / total : 0;

  return {
    score,
    total,
    percentage: Number(percentage.toFixed(4)),
    matchedKeywords,
    missingKeywords,
  };
}
// lib/analyze/ats/computeATSKeywordReadiness.js
