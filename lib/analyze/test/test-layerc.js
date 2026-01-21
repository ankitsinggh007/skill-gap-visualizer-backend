import { matchAllSkills } from "../matchEngine.js";

const benchmark = {
  categories: [
    {
      name: "React Core",
      skills: [
        { name: "Hooks" },
        { name: "State" },
        { name: "Error Boundaries" },
      ],
    },
  ],
};

const normalizedResume = {
  normalizedText: "i worked with react hooks and created state logic",
  tokens: [
    "i",
    "worked",
    "with",
    "react",
    "hooks",
    "and",
    "created",
    "state",
    "logic",
  ],
  frequencyMap: {
    react: 1,
    hooks: 1,
    state: 1,
    logic: 1,
  },
};

const allUserSkills = ["React", "Hooks"];

console.log(
  matchAllSkills(benchmark.categories, normalizedResume, allUserSkills)
);
