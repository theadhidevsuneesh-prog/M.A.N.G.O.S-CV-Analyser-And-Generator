# 🥭 M.A.N.G.O.S — CV Analyser & Generator

An advanced, **zero-dependency** résumé toolkit for software engineers. Open `index.html` and it runs — no build, no server, no account. Your CV never leaves your browser.

| | |
|---|---|
| **✍️ Builder** | Structured CV editor with live preview, 3 ATS-friendly templates, autosave, and exports to **PDF, Word (.doc), HTML, plain text (what an ATS sees) and JSON**. |
| **🔍 Analyser** | Upload a **PDF / DOCX / TXT / MD** (or paste) and get a 0–100 score, grade, and an *honest* review written from the point of view of a senior engineer who is hiring: the good, the bad, line-by-line fixes, and the interview questions they'd ask. |
| **🏢 MNC tailoring** | 22 hiring profiles (Google, Microsoft, Amazon, Meta, Apple, Netflix, NVIDIA, Adobe, Salesforce, Oracle, IBM, Intel, Cisco, SAP, Uber, Atlassian, Accenture, TCS, Infosys, JPMorgan Chase, Goldman Sachs, Deloitte). See your fit score, keyword gaps, and what each company weighs — then tailor the CV with one click. |
| **🤖 Optional AI review** | Bring your own Anthropic API key for a deeper LLM read. Off by default; nothing is sent unless you press the button. |

## Run it

```bash
# just open the file
start index.html          # Windows
open index.html           # macOS

# or serve it (recommended; some browsers restrict file:// workers)
npx serve .               # or: python -m http.server 8080
```

## How the analyser scores (100 pts)

| Area | Pts | What it looks at |
|---|---|---|
| Impact & metrics | 25 | % of bullets with numbers; outcome verbs (reduced / increased / saved…) |
| Technical depth | 20 | Stack breadth across 7 areas, depth signals (scale, latency, design…), skills that are backed by experience, keyword-stuffing penalty |
| Language & clarity | 15 | Strong action verbs, weak phrases ("responsible for"), clichés, pronouns, bullet length, repetition |
| Structure & ATS | 15 | Standard sections, contact info, length for your seniority, dates |
| Credibility & seniority | 15 | Ownership/leadership signals vs experience level, verifiable links, gaps, job-hopping, self-rated skill bars |
| Presentation | 10 | Typos, bullet/date consistency, summary quality, email professionalism |

Hard caps apply (e.g. no experience/projects → max 45; nothing is ever above 95 because claims can't be verified).

> **Be aware:** this is a transparent, rules-based review — not a human and not an LLM. It can't verify claims and can miss nuance. Treat the score as a strong checklist, not a verdict. Tailoring only *reorders* your content and suggests keywords; it never invents experience, and you should only add skills you can defend in an interview.

## Project layout

```
index.html            app shell
css/styles.css        UI theme (dark/light)
js/data.js            tech dictionary, role lenses, MNC profiles, language dictionaries
js/analyzer.js        parser + scoring engine + company matching (DOM-free, runs in Node)
js/generator.js       CV model, templates, exports, tailoring
js/app.js             UI controller (file parsing, rendering, state)
tests/analyzer.test.js  node tests/analyzer.test.js
```

## Extend it

* **Add a company** — append an object to `MANGOS.COMPANIES` in `js/data.js` (`tech` keywords, culture `signals`, `tips`).
* **Add a role lens** — add to `MANGOS.ROLES`.
* **Tune scoring** — weights live in `analyze()` in `js/analyzer.js`; run the tests after changing them.

## Privacy

All parsing, scoring and storage happens locally (`localStorage`). External requests: PDF.js and Mammoth from cdnjs (for reading PDF/DOCX), and — only if you use the optional AI review — `api.anthropic.com`.

## Tests

```bash
node tests/analyzer.test.js
```
