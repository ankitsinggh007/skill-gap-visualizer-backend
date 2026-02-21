// lib/analyze/test/scoreEngine.test.js

import { scoreCategories } from "../scoring/scoreCategories.js";
import { totalScore } from "../scoring/totalScore.js";
import { matchAllSkills } from "../matchEngine.js";
import { preprocessResume } from "../preprocess.js";
import { normalizeSkills } from "../normalizeSkills.js";
import { loadBenchmark } from "../../benchmark/loader.js";

function runLayerDTest(name, data) {
  console.log("\n======================================");
  console.log(`🔥 LAYER-D TEST: ${name}`);
  console.log("======================================\n");

  const benchmark = loadBenchmark("react", "junior", "unicorn");

  // LAYER A/B
  const normalized = preprocessResume(data.resumeText);

  // LAYER B++
  const skills = normalizeSkills(data.extractedSkills, data.inferredSkills);

  // LAYER C
  const matches = matchAllSkills(
    benchmark.categories,
    normalized,
    skills.allSkills
  );

  // LAYER D
  const categoryScores = scoreCategories(matches, benchmark);
  const finalScore = totalScore(categoryScores);

  // const report = generateFinalReport({
  //   matches,
  //   categoryScores,
  //   finalScore,
  //   meta: {
  //     experienceYears: data.experienceYears || 0,
  //     resumeLength: data.resumeText.length
  //   }
  // });

  console.dir(
    {
      MATCHES: matches,
      CATEGORY_SCORES: categoryScores,
      FINAL_SCORE: finalScore,
      // FINAL_REPORT: report,      
    },
    { depth: null }
  );
}

const layerDTests = {
  "1. PERFECT RESUME (All skills)": {
    resumeText: "Contains all JS, React, Ecosystem, Tooling, and Soft skills.",
    extractedSkills: [
      { skill: "Variables & Scope" },
      { skill: "Closures" },
      { skill: "Async/Await & Promises" },
      { skill: "Event Loop" },
      { skill: "Hoisting" },
      { skill: "Prototypes" },
      { skill: "Array & Object APIs" },
      { skill: "Error Handling" },

      { skill: "JSX" },
      { skill: "Props" },
      { skill: "React State" },
      { skill: "Hooks" },
      { skill: "Context API" },
      { skill: "Lifecycle Understanding" },
      { skill: "Conditional Rendering" },
      { skill: "Forms & Validation" },
      { skill: "Lists & Keys" },
      { skill: "Error Boundaries" },

      { skill: "React Router" },
      { skill: "Redux/RTK" },
      { skill: "State Management Patterns" },
      { skill: "Query Libraries (React Query)" },

      { skill: "Vite/Webpack Basics" },
      { skill: "ESLint/Prettier" },
      { skill: "Package Managers" },
      { skill: "Git & Branching" },

      { skill: "Communication" },
      { skill: "Team Collaboration" },
      { skill: "Problem Breakdown" },
    ],
    inferredSkills: [],
    experienceYears: 1,
  },

  "2. EXTREMELY WEAK RESUME (Only soft skills)": {
    resumeText: "Teamwork, communication, leadership, breakdown.",
    extractedSkills: [
      { skill: "Communication" },
      { skill: "Team Collaboration" },
      { skill: "Problem Breakdown" },
    ],
    inferredSkills: [],
    experienceYears: 0,
  },

  "3. CHAOTIC TYPOS & BROKEN LANGUAGE": {
    resumeText: `reactk, jex, ustate, ueffeect, glbal stoer, ruter flwo, qury lib`,
    extractedSkills: [],
    inferredSkills: [
      { skill: "React Router", source: "ruter flwo" },
      { skill: "Hooks", source: "ustate / ueffeect" },
      { skill: "JSX", source: "jex" },
      { skill: "Query Libraries (React Query)", source: "qury lib" },
      { skill: "State Management Patterns", source: "glbal stoer" },
    ],
  },

  "4. ONLY JAVASCRIPT, NO REACT": {
    resumeText: `Worked deeply in closures, async patterns, prototypes, scope, event loop.`,
    extractedSkills: [
      { skill: "Closures" },
      { skill: "Async/Await & Promises" },
      { skill: "Prototypes" },
      { skill: "Variables & Scope" },
      { skill: "Event Loop" },
    ],
    inferredSkills: [],
  },

  "5. ONLY TOOLING, NO JS/REACT": {
    resumeText: `Used Git, GitHub, pnpm, webpack, eslint, prettier.`,
    extractedSkills: [
      { skill: "Git & Branching" },
      { skill: "Package Managers" },
      { skill: "ESLint/Prettier" },
      { skill: "Vite/Webpack Basics" },
    ],
    inferredSkills: [],
  },
};

Object.entries(layerDTests).forEach(([name, data]) => runLayerDTest(name, data));
