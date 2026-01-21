import { runExtractionEngine } from "../lib/extraction/extractorEngine.js";
import fs from "fs";

async function testExtraction(rawText, label) {
  console.log("\n=========================");
  console.log("TEST:", label);
  console.log("=========================\n");

  const result = await runExtractionEngine(rawText);

  console.log(JSON.stringify(result, null, 2));
}

async function main() {
  // -------- TEST 1: Normal resume --------
  const resume1 = `
  Ankit Singh
  Frontend Developer with experience in React, JavaScript, Tailwind.
  Worked on API integrations and dashboards.
  Education: B.Tech CSE
  `;

  await testExtraction(resume1, "Normal FE Resume");

  // -------- TEST 2: Minimal resume --------
  const resume2 = `
  John Doe
  Fresher looking for opportunities.
  `;

  await testExtraction(resume2, "Minimal Fresher Resume");

  // -------- TEST 3: Image-only PDF fallback --------
  const resume3 = `
  (this would be empty text from OCR-less PDF)
  `;

  await testExtraction(resume3, "Image Only Fallback");

  // -------- TEST 4: Skill heavy resume --------
  const resume4 = `
  Node.js, React, Express, SQL, REST APIs, OAuth, Docker, AWS.
  Worked on backend microservices and React apps.
  `;

  await testExtraction(resume4, "Skill Heavy Resume");

  // -------- TEST 5: Dirty JSON failure simulation --------
  // Sends incomplete text to see fallback
  await testExtraction("", "Empty Resume Text");
}

main();
