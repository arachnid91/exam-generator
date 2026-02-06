# Exam Generator - Semester Update Instructions

## Project Overview
This is a React/TypeScript exam practice app deployed on Vercel.
- **Live URL:** https://exam-generator-seven.vercel.app
- **GitHub:** https://github.com/arachnid91/exam-generator
- **Project Path:** E:\exam\exam-generator

## Current Subjects (Semester 1)
- PR (Public Relations)
- Journalism
- Publicity (Publizistik)
- Audio-Visualism (Audiovisueller Journalismus)

---

## How to Add New Subjects for Semester 2

### Step 1: Edit `src/db/models.ts`

Open: `E:\exam\exam-generator\src\db\models.ts`

#### 1.1 Update Subject Type (Line 1)
```typescript
// BEFORE:
export type Subject = 'PR' | 'Audio-Visualism' | 'Publicity' | 'Journalism';

// AFTER (add new subjects):
export type Subject = 'PR' | 'Audio-Visualism' | 'Publicity' | 'Journalism' | 'NewSubject1' | 'NewSubject2';
```

#### 1.2 Update SUBJECTS Array (Line 68)
```typescript
// BEFORE:
export const SUBJECTS: Subject[] = ['PR', 'Audio-Visualism', 'Publicity', 'Journalism'];

// AFTER:
export const SUBJECTS: Subject[] = ['PR', 'Audio-Visualism', 'Publicity', 'Journalism', 'NewSubject1', 'NewSubject2'];
```

#### 1.3 Update SUBJECT_COLORS (Line 70-75)
```typescript
export const SUBJECT_COLORS: Record<Subject, string> = {
  'PR': 'bg-blue-100 text-blue-800',
  'Audio-Visualism': 'bg-purple-100 text-purple-800',
  'Publicity': 'bg-green-100 text-green-800',
  'Journalism': 'bg-orange-100 text-orange-800',
  // ADD NEW SUBJECTS HERE:
  'NewSubject1': 'bg-red-100 text-red-800',
  'NewSubject2': 'bg-cyan-100 text-cyan-800',
};
```

#### Available Tailwind Colors:
- `bg-red-100 text-red-800`
- `bg-yellow-100 text-yellow-800`
- `bg-cyan-100 text-cyan-800`
- `bg-pink-100 text-pink-800`
- `bg-indigo-100 text-indigo-800`
- `bg-teal-100 text-teal-800`
- `bg-lime-100 text-lime-800`
- `bg-amber-100 text-amber-800`
- `bg-rose-100 text-rose-800`
- `bg-sky-100 text-sky-800`

### Step 2: (Optional) Update Folder Mapping for Batch Import

If you want to import files from folders automatically, update SUBJECT_FOLDER_MAP (Line 61-66):

```typescript
export const SUBJECT_FOLDER_MAP: Record<string, Subject> = {
  'Public Relations': 'PR',
  'journalismus': 'Journalism',
  'Audiovisueller Jurnalismus': 'Audio-Visualism',
  'publizistik wissenschaft': 'Publicity',
  // ADD NEW FOLDER MAPPINGS:
  'new folder name': 'NewSubject1',
};
```

### Step 3: Build and Deploy

```bash
cd E:\exam\exam-generator
npm run build
git add -A
git commit -m "Add semester 2 subjects"
git push
vercel --prod --yes
```

---

## How to Generate Questions for New Subjects

### Option A: Import from JSON
1. Create questions JSON file with the new subject name
2. Go to Fragenbank → Verwalten → Import JSON

### Option B: Generate with Claude AI
1. Upload PDFs in Library tab
2. Go to Fragenbank → Generieren
3. Add your Claude API key
4. Select files and generate

---

## How to Remove Old Subjects

If you want to REMOVE semester 1 subjects completely:

1. Export any questions you want to keep (Fragenbank → Verwalten → Export JSON)
2. Remove from `Subject` type, `SUBJECTS` array, and `SUBJECT_COLORS`
3. Build and deploy
4. Users will need to clear browser data (old questions with removed subjects won't work)

**Better approach:** Keep old subjects but just don't use them. They won't appear if there are no questions for them.

---

## File Structure Reference

```
exam-generator/
├── src/
│   ├── db/
│   │   └── models.ts          ← EDIT THIS FOR SUBJECTS
│   ├── components/
│   ├── pages/
│   ├── i18n/
│   │   └── translations.ts    ← For language strings
│   └── services/
├── package.json
└── vite.config.ts
```

---

## Quick Commands Reference

```bash
# Navigate to project
cd E:\exam\exam-generator

# Install dependencies (if needed)
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel --prod --yes

# Full deploy pipeline
npm run build && git add -A && git commit -m "Update" && git push && vercel --prod --yes
```

---

## Troubleshooting

### "vercel: command not found"
```bash
npm install -g vercel
vercel login
```

### TypeScript errors after adding subjects
Make sure the subject name is EXACTLY the same in all 3 places:
1. `Subject` type
2. `SUBJECTS` array
3. `SUBJECT_COLORS` object

### Questions not showing
- Clear browser cache
- Check if subject name matches in JSON file

---

## Contact / Notes

- Created: February 2026
- User: arachnid91
- Vercel Account: Connected to GitHub arachnid91

---

## Example: Adding Semester 2 Subjects

If semester 2 has courses like "Media Law", "Digital Marketing", "Research Methods":

```typescript
// Line 1
export type Subject = 'PR' | 'Audio-Visualism' | 'Publicity' | 'Journalism' | 'Media-Law' | 'Digital-Marketing' | 'Research-Methods';

// Line 68
export const SUBJECTS: Subject[] = ['PR', 'Audio-Visualism', 'Publicity', 'Journalism', 'Media-Law', 'Digital-Marketing', 'Research-Methods'];

// Line 70+
export const SUBJECT_COLORS: Record<Subject, string> = {
  'PR': 'bg-blue-100 text-blue-800',
  'Audio-Visualism': 'bg-purple-100 text-purple-800',
  'Publicity': 'bg-green-100 text-green-800',
  'Journalism': 'bg-orange-100 text-orange-800',
  'Media-Law': 'bg-red-100 text-red-800',
  'Digital-Marketing': 'bg-cyan-100 text-cyan-800',
  'Research-Methods': 'bg-pink-100 text-pink-800',
};
```

Then run: `npm run build && git add -A && git commit -m "Add semester 2 subjects" && git push && vercel --prod --yes`
