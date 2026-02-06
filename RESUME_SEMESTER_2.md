# RESUME SEMESTER 2 - Instructions for Claude

When user says "resume semester 2" or similar, follow this script:

---

## Step 1: Greeting

Say exactly:
> "Here we fucking go again! 🎓 Time for semester 2!"

---

## Step 2: Ask for New Subjects

Ask:
> "What new subjects/courses do we have now? List them all, and for each subject tell me:
> 1. Subject name (short, e.g., 'Media-Law')
> 2. Full name (e.g., 'Medienrecht')
> 3. How many lectures/PDFs do you have for it?"

---

## Step 3: After User Responds - Add Subjects to Code

Edit `E:\exam\exam-generator\src\db\models.ts`:

1. Update `Subject` type (line 1)
2. Update `SUBJECTS` array (line 68)
3. Update `SUBJECT_COLORS` (line 70+)

Use these colors for new subjects:
- `bg-red-100 text-red-800`
- `bg-cyan-100 text-cyan-800`
- `bg-pink-100 text-pink-800`
- `bg-indigo-100 text-indigo-800`
- `bg-teal-100 text-teal-800`
- `bg-amber-100 text-amber-800`

---

## Step 4: Remind User About Files

Say:
> "Before we generate questions, let's make sure we have ALL materials ready.
>
> **CHECKLIST - Please confirm:**
> - [ ] All PDFs for each lecture are in their folders
> - [ ] Each subject folder contains ALL lecture materials (Vorlesung 1-X)
> - [ ] No missing lectures or partial uploads
>
> **Why this matters:** We want to generate questions covering 100% of the course content. Missing files = gaps in your exam prep!
>
> Tell me the folder structure, e.g.:
> ```
> E:\exam\semester2\
> ├── Media-Law\
> │   ├── VL01_Intro.pdf
> │   ├── VL02_Copyright.pdf
> │   └── ...
> ├── Digital-Marketing\
> │   └── ...
> ```"

---

## Step 5: Generate Questions - Full Coverage Prompt

For EACH subject, use this prompt structure when generating with Claude API:

```
You are creating exam questions for a university course.

SUBJECT: [Subject Name]
LECTURE: [Lecture Number] - [Lecture Topic]

SOURCE MATERIAL:
[Paste extracted text from PDF(s) for this lecture]

REQUIREMENTS:
1. Generate 15-20 questions covering ALL key concepts from this lecture
2. Mix of question types:
   - 8-10 Multiple Choice (4 options, one correct)
   - 4-5 Short Answer (1-2 sentence response)
   - 3-4 Fill in the Blank

3. Mix of difficulty:
   - 5 Easy (basic recall, definitions)
   - 8 Medium (understanding, application)
   - 5 Hard (analysis, connections between concepts)

4. Mix of taxonomy:
   - Recall: Facts, definitions, names, dates
   - Conceptual: Understanding relationships, explaining why
   - Application: Using knowledge in scenarios

5. For each question provide:
   - questionText: The question in German
   - questionType: "multiple_choice" | "short_answer" | "fill_in"
   - difficulty: "easy" | "medium" | "hard"
   - taxonomyType: "recall" | "conceptual" | "application"
   - correctAnswer: The correct answer
   - options: (for MC only) Array of 4 options ["A) ...", "B) ...", "C) ...", "D) ..."]
   - explanation: Brief explanation why this is correct (German)

6. IMPORTANT: Cover EVERY major topic from the lecture. Don't skip sections!

OUTPUT FORMAT: JSON array of question objects
```

---

## Step 6: Track Coverage

Create a coverage tracking document:

```markdown
# Semester 2 - Question Generation Progress

## [Subject 1]
| Lecture | Topic | PDFs Processed | Questions Generated | Status |
|---------|-------|----------------|---------------------|--------|
| VL01 | Intro | ✅ | 18 | Done |
| VL02 | Topic2 | ✅ | 15 | Done |
| VL03 | Topic3 | ⏳ | 0 | Pending |

## [Subject 2]
...
```

---

## Step 7: Update Coverage Overview Component

After all questions are generated, update:
`E:\exam\exam-generator\src\components\Coverage\CoverageOverview.tsx`

Update the `coverageData` array with new subjects and their lectures:

```typescript
const coverageData: SubjectCoverage[] = [
  {
    name: 'Media-Law',
    displayName: 'Medienrecht',
    questionCount: XX, // actual count
    lectures: [
      { id: '01', topic: 'Einführung ins Medienrecht', covered: true },
      { id: '02', topic: 'Urheberrecht', covered: true },
      // ... all lectures
    ]
  },
  // ... other subjects
];
```

---

## Step 8: Build and Deploy

```bash
cd E:\exam\exam-generator
npm run build
git add -A
git commit -m "Add semester 2 subjects and questions coverage"
git push
vercel --prod --yes
```

---

## Step 9: Final Verification

Ask user to verify:
> "Let's do a final check:
> 1. Open https://exam-generator-seven.vercel.app
> 2. Go to 'Start' - do you see the Coverage Overview with all new subjects?
> 3. Go to 'Fragenbank' - are all questions imported?
> 4. Go to 'Prüfung' - can you start an exam for each new subject?
>
> All good? 🎉"

---

## Summary Checklist

- [ ] Asked for new subjects
- [ ] Added subjects to models.ts
- [ ] User confirmed all PDFs ready
- [ ] Generated questions for ALL lectures
- [ ] Created/updated coverage tracking
- [ ] Updated CoverageOverview.tsx
- [ ] Built and deployed
- [ ] User verified everything works

---

## File Locations Reference

| File | Purpose |
|------|---------|
| `src/db/models.ts` | Subject definitions |
| `src/components/Coverage/CoverageOverview.tsx` | Coverage display |
| `E:\exam\questions_[subject].json` | Question files |
| `SEMESTER_UPDATE_INSTRUCTIONS.md` | Detailed technical guide |
