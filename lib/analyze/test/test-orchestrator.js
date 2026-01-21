// lib/test/runAllTests.js

import { analyzeResume } from "../index.js";

// ------------------------------
// TEST CASES
// ------------------------------
const tests = {
  A_emptyResume: {
    description: "A. Empty resume - no content",
    input: {
      resumeText: "",
      extractedSkills: [],
      inferredSkills: [],
      role: "react",
      level: "junior",
      companyType: "unicorn",
    },
  },

  B_perfectResume: {
    description: "B. Perfect resume - full coverage",
    input: {
      resumeText: "Full coverage resume including every required React/JS skill.",

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
      role: "react",
      level: "junior",
      companyType: "unicorn",
    },
  },

  C_onlyJS: {
    description: "C. JS-only resume",
    input: {
      resumeText: "JavaScript ES6 async closures prototypes hoisting arrays errors",
      extractedSkills: [
        { skill: "Closures" },
        { skill: "Async/Await & Promises" },
        { skill: "Prototypes" },
      ],
      inferredSkills: [],
    },
  },

  D_onlyReact: {
    description: "D. React-only resume",
    input: {
      resumeText: "React JSX Hooks Props Component State Lifecycle",
      extractedSkills: [{ skill: "React State" }, { skill: "Hooks" }],
      inferredSkills: [{ skill: "JSX" }],
    },
  },

  E_onlySoftSkills: {
    description: "E. Only soft-skills resume",
    input: {
      resumeText: "Communication teamwork collaboration planning leadership",
      extractedSkills: [{ skill: "Communication" }],
      inferredSkills: [{ skill: "Team Collaboration" }],
    },
  },

  F_emptySkillsButResumeTextPresent: {
    description: "F. Missing extracted & inferred but resume text exists",
    input: {
      resumeText: "I am a frontend engineer who worked with React and JS",
      extractedSkills: [],
      inferredSkills: [],
    },
  },

  G_spamText: {
    description: "G. Spam / irrelevant resume",
    input: {
      resumeText: "asdf qwer lorem ipsum blah blah blah random words",
      extractedSkills: [],
      inferredSkills: [],
    },
  },

  H_partialCoverage: {
    description: "H. Some skills present, many missing",
    input: {
      resumeText: "React hooks context router async javascript",
      extractedSkills: [{ skill: "Hooks" }],
      inferredSkills: [{ skill: "React Router" }],
    },
  },

  I_duplicateSkills: {
    description: "I. Duplicate extracted/inferred",
    input: {
      resumeText: "React React React JS JS JS",
      extractedSkills: [
        { skill: "React State" },
        { skill: "React State" },
        { skill: "Hooks" },
        { skill: "Hooks" },
      ],
      inferredSkills: [
        { skill: "Hooks" },
        { skill: "Hooks" },
      ],
    },
  },

  J_inferredOverridesMissing: {
    description: "J. Inferred skill covers missing explicit",
    input: {
      resumeText: "Used Redux state management",
      extractedSkills: [],
      inferredSkills: [{ skill: "Redux/RTK" }],
    },
  },

  K_noisePlusOneRealSkill: {
    description: "K. Mostly noise text + one actual skill",
    input: {
      resumeText: "lorem ipsum blah blah xyz abc Hooks blah foo bar",
      extractedSkills: [],
      inferredSkills: [{ skill: "Hooks" }],
    },
  },

  L_massiveResume: {
    description: "L. Massive resume stress test",
    input: (() => {
      const longText = Array(200).fill("React Hooks Redux Router").join(" ");

      return {
        resumeText: longText,
        extractedSkills: [{ skill: "React" }],
        inferredSkills: [{ skill: "Hooks" }, { skill: "Redux/RTK" }],
      };
    })(),
  },
};

// ------------------------------
// RUNNER
// ------------------------------
async function run() {
  console.log("==============================================");
  console.log("🔥 RUNNING FULL ENGINE TESTS");
  console.log("==============================================\n");

  for (const key of Object.keys(tests)) {
    const test = tests[key];
    console.log(`\n----------------------------------------------`);
    console.log(`🧪 TEST → ${test.description}`);
    console.log(`----------------------------------------------`);

    try {
      const result = await analyzeResume(test.input);
      console.dir(result, { depth: null });
    } catch (err) {
      console.error(`❌ ERROR in ${key}:`, err);
    }
  }

  console.log("\n==============================================");
  console.log("🔥🔥 ALL TESTS COMPLETED");
  console.log("==============================================");
}

run();