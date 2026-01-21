
Use this BEFORE adding any new keyword, synonym, or category.

⸻

1️⃣ NEVER add a keyword that appears in normal resume English

Examples ❌ (DO NOT ADD):
• “component”
• “team”
• “project”
• “error”
• “data”
• “design”
• “state”

These words appear in every resume → they will break weak-signal logic instantly.

Golden rule:

Only add keywords that uniquely point to this skill.

Examples ✔:
• useState
• useEffect
• RTK Query
• memo
• prop drilling

⸻

2️⃣ Dictionary EXPLICIT synonyms must ALWAYS be “pure equivalence”

Meaning:
If A matches B explicitly, they should mean the exact same skill.

Examples ✔:
• react = react.js = reactjs
• redux toolkit = rtk = redux/rtk
• jsx = react jsx

Examples ❌ (NEVER add):
• react → “frontend”
• react → “UI development”
• redux → “state management” (too broad)

Explicit synonyms are strict equality, not “loosely related”.

⸻

3️⃣ Dictionary WEAK synonyms must NEVER overlap with another skill’s explicit signals

Example of a dangerous overlap ❌:

"react router" weak: ["route"]

Because “route” appears in many contexts and may falsely trigger.

Safe weak synonyms ✔:

"react router": ["routing", "spa navigation", "navigation flow"]

⸻

4️⃣ Benchmark keywords must follow these rules

✔ Must be technical

✔ Must be strongly associated with the skill

✔ Must NOT appear in generic resumes

Bad ❌ (too generic):
• “state”
• “event”
• “performance”
• “component”

Good ✔:
• “useState”
• “prop drilling”
• “memoization”
• “redux slice”
• “context provider”

⸻

5️⃣ Category name changes DO NOT matter (logic uses skill.name)

But skill.name must stay stable.

If you rename a skill, also rename the dictionary entry.

Example:

Benchmark:

"name": "React State"

Dictionary key must be:

"react state": { ... }

⸻

6️⃣ NEVER add synonyms that themselves contain other skills

These will cause chain pollution.

Example ❌:

redux weak: ["react state management"]

Because “state” matches React Core.

You MUST keep dictionary synonyms isolated and non-overlapping.

⸻

7️⃣ ALWAYS test with 3 cases after each update

Your mandatory regression suite:

✔ Case A – Minimal resume

React + hooks only

✔ Case B – High signal resume

A full senior-level resume

✔ Case C – Noisy resume

Random text with many tech words

If any of these produce weird matching (like showing skills not present), revert the dictionary update.

⸻

8️⃣ Keep dictionary EXPLICIT list smaller than weak list

Explicit synonyms MUST be few and precise.
Weak synonyms can be more, but only safe words.

Rule:

explicit ≤ 5 items
weak ≤ 10 items

If you exceed this, your detection becomes unpredictable.

⸻

9️⃣ NEVER rely on weak-signal for important scoring

Weak signals should only:
• Display “possible evidence”
• Improve UX
• Give candidate hints

They should NOT:
• Increase core score
• Replace explicit match
• Rank candidates

This prevents noise from causing bad decisions.

⸻

🔟 Document every new synonym you add

Because 3 months later, you won’t remember why you added it.

Just keep a simple text like:

2025-01-05:
Added explicit synonyms for "Redux/RTK":

- redux
- rtk
  (Reason: candidates mostly write these abbreviations)

Added weak synonyms:

- state management
  (Reason: appears in project descriptions)

This keeps future updates safe.

⸻

🎯 FINAL TL VERDICT

If you follow this checklist:

🔥 Your resume analyzer WILL NOT break

🔥 No accidental skills will be inferred

🔥 Explicit detection will remain perfect

🔥 Weak signals will remain helpful, not noisy

🔥 You will be able to safely scale benchmark + dictionary

You now have a future-proof architecture, not a fragile one.

⸻

If you want, I can also give you:

👉 A “Dictionary Update Protocol” (step-by-step instructions before editing JSON)
👉 A “Benchmark Expansion Policy” used by real unicorns
👉 A validation script that automatically warns you when synonyms are dangerous

Just tell me which one you want.
----------------------------------------------------------------------------------------------------------
EXPLICIT Synonyms (strict match)
	•	Must be exact equivalents
	•	Cannot be generic
	•	Cannot be broader concepts
	•	Must NOT chain into other skills
	•	Max: 5 per skill

WEAK Synonyms (signal only)
	•	Must be resume phrases, not pure words
	•	Must not overlap with another skill
	•	Max: 10 per skill
	•	Cannot include generic nouns like “component”, “team”, “error”, “state”

Skill Keys
	•	Always use lowercase and match skill.name in benchmark after normalization