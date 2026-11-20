# ResumeLens — Browser-only Resume Analyzer

A React + Vite static application. Resume parsing, section checks, skill extraction, and job matching run in the user's browser. There is no application backend, login, or database.

## Features
- Upload PDF and DOCX resumes. PDF text extraction uses PDF.js; DOCX extraction uses Mammoth.
- Detect common resume sections, contact details, known technical skills, and quantified details.
- Compare resume text against a pasted job description using skill overlap and keyword matching.
- Best-effort import of publicly accessible job pages through Jina Reader. Some sites (including LinkedIn pages requiring sign-in) will not be accessible; paste the job description when import fails.
- Download a plain-text comparison report.
- No resume is stored by the app. Reloading or closing the tab clears the current analysis.

## Run locally
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Deploy to Vercel
- Framework preset: Vite
- Root directory: `.` (the folder containing this package.json)
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`
- No start command is required for Vercel static hosting.

## Privacy notes
- Resume files are parsed locally in the browser and are not sent to a backend.
- Job URL import sends the entered URL to the third-party Jina Reader service to retrieve public page text. Do not use this feature with private or confidential URLs. The service cannot bypass authentication, anti-bot controls, or platform restrictions.
- No resume text or analysis is persisted. Do not add localStorage/sessionStorage if you want to keep the no-storage design.

## Matching limitations
The match score is a heuristic based on a built-in skill vocabulary and frequent job-description keywords. It is not a semantic AI model, does not judge the quality/context of experience, and is not a probability of being hired. It may miss synonyms, uncommon technologies, and skills implied rather than explicitly named.

Scanned/image-only PDFs are not OCR'd; use a text-based PDF or DOCX.

## Latest UI improvements
- Increased text sizes across the results dashboard for better readability.
- Added a resume quality improvement plan with High, Medium and Low priority actions.
- Added visual analytics: section-coverage donut, skill-category bar chart, improvement workflow, and job-skill overlap chart after comparison.
- Charts are generated from the locally extracted resume/job text; they do not require a backend or external charting service.
