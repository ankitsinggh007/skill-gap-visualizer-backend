import { EMPTY_EXTRACTION_SCHEMA } from "./extractionSchema.js";

export function buildExtractionPrompt(resumeText) {
  return `
You are an AI engine designed to extract structured information from resumes.
Your ONLY task is to extract information strictly from the provided resume text.

IMPORTANT RULES:
- Output MUST BE valid JSON only.
- Do NOT include any explanation, commentary, or markdown.
- Do NOT invent skills that are not present.
- If unsure, leave fields empty.
- Use the EXACT schema provided below.

SCHEMA:
${JSON.stringify(EMPTY_EXTRACTION_SCHEMA, null, 2)}

DEFINITIONS:
- "extractedSkills": Skills explicitly mentioned in the resume text.
- "inferredSkills": Skills that can be reasonably inferred from context. 
   Example: If the resume mentions “worked on REST APIs”, infer "API Integration".
   Each inferred skill MUST have a reason.
- "experienceYears": Numerical estimate based on text (use null if unclear).
- "educationLevel": Highest education level mentioned.
- "tools": Developer tools explicitly mentioned.
- "projects": Brief project titles extracted from resume text.
- "rawSummary": 1–2 sentence neutral summary of candidate profile.

TASK:
Extract all information from the following resume text and return JSON only.

RESUME_TEXT:
"""
${resumeText}
"""
  
Return ONLY valid JSON matching the schema.
  `;
}
