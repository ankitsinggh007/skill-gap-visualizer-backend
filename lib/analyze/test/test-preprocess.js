import { preprocessResume } from "../preprocess.js";

// Utility printer for clarity
function print(title, output) {
  console.log("\n=== " + title + " ===");
  console.log(output);
}

// ------------------------------------------
// TEST CASES
// ------------------------------------------

const tests = [
  {
    name: "Simple sentence",
    input: "I worked on React and Redux.",
  },
  {
    name: "Complex punctuation",
    input: "React, Redux!! Hooks... Performance? Optimization;",
  },
  {
    name: "Mixed casing",
    input: "ReAcT rEdUx HOOKS",
  },
  {
    name: "Extra spaces & newline noise",
    input: "React     \n\n   Redux   \t Hooks",
  },
  {
    name: "Numbers included",
    input: "3 years experience with React 18 and Node 20.",
  },
  {
    name: "Skill repeated (frequency test)",
    input: "React React hooks Hooks hooks",
  },
  {
    name: "Empty string",
    input: "",
  },
  {
    name: "Only punctuation",
    input: "!!!! ??? .... ////",
  },
  {
    name: "Garbage resume (OCR issues)",
    input: "R3@ct D3v $$ H00ks ### Pr0m!ses",
  },
  {
    name: "Long resume snippet",
    input:
      "Worked on React components, optimizing rendering, handling async APIs, and improving performance bottlenecks in Redux-driven UIs.",
  },
];

// ------------------------------------------
// RUN ALL TESTS
// ------------------------------------------

for (const t of tests) {
  const result = preprocessResume(t.input);
  print(t.name, result);
}
