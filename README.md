# StudyPlan — Student Study Planner

A lightweight, browser-based study planner that generates smart daily schedules based on exam urgency and subject difficulty. No backend required — all data lives in `localStorage`.

---

## Features

- **Add subjects** with name, exam date, difficulty (1–5), and colour label
- **Smart scheduling algorithm** — allocates daily study time proportional to `difficulty × urgency`
- **Today's plan** — ranked task list with priority badges and time estimates
- **Mark tasks complete** — tracks daily completion percentage
- **Progress tracking** — per-subject session history + bar chart
- **Study streak** — tracks consecutive days of study

---

## Project Structure

```
study-planner/
│
├── index.html          ← Dashboard / Today's Plan
├── subjects.html       ← Add / manage subjects
├── progress.html       ← Progress tracking & chart
│
├── css/
│   └── style.css       ← Full design system & all styling
│
├── js/
│   ├── app.js          ← Entry point, page routing, event wiring
│   ├── storage.js      ← All localStorage read/write (single source of truth)
│   ├── scheduler.js    ← Scheduling algorithm (pure functions, no side effects)
│   └── ui.js           ← DOM rendering helpers
│
├── assets/
│   └── icons/          ← SVG icons (if added)
│
└── README.md
```

---

## Architecture

### Module responsibilities

| File | Responsibility |
|------|----------------|
| `storage.js` | All `localStorage` access. No other file reads/writes storage directly. |
| `scheduler.js` | Pure algorithm: weight calculation, schedule generation, formatting. No DOM or storage. |
| `ui.js` | DOM rendering only. Receives data, returns HTML or mutates elements. |
| `app.js` | Wires everything together. Detects current page and calls the right init function. |

### Scheduling algorithm

```
score = difficulty (1–5) × urgency (1–6)

urgency:
  today     → 6
  ≤ 3 days  → 5
  ≤ 7 days  → 4
  ≤ 14 days → 3
  ≤ 30 days → 2
  > 30 days → 1

hours_for_subject = (score / total_score) × total_daily_hours
```

Total daily hours scales with number of subjects (1.5h each), capped at 8h.

---

## Getting Started

1. Clone the repo and open in VS Code
2. Use the **Live Server** extension (or any static server) to serve the project
3. Open `http://localhost:5500` in your browser
4. Add subjects in the **Subjects** tab and view your plan on the **Dashboard**

> **Note:** The project uses ES Modules (`type="module"`), so it must be served over HTTP — opening `index.html` directly as a `file://` URL will not work.

---

## GitHub Workflow

```
main              ← stable, demo-ready
feature/project-setup    ← file structure
feature/scheduler        ← algorithm work
feature/ui-dashboard     ← dashboard UI
feature/ui-subjects      ← subjects page
feature/ui-progress      ← progress page
```

---

## Roadmap

### Version 1 (current — MVP)
- [x] Add/remove subjects
- [x] Smart daily schedule generation
- [x] Mark tasks complete
- [x] Streak tracking
- [x] Progress chart

### Version 2
- [ ] Auto-adjust plan if a day is missed
- [ ] Weekly calendar view
- [ ] Notifications / reminders (Web Notifications API)
- [ ] Export schedule as PDF

### Version 3 (advanced)
- [ ] AI-generated study plans (Claude API)
- [ ] Weak topic detection
- [ ] PDF/notes integration
- [ ] Study chat assistant

---

## Tech Stack

- **HTML5** — semantic markup
- **CSS3** — custom properties, grid, flexbox (no framework)
- **Vanilla JS** — ES Modules, no build step required
- **Chart.js** — progress visualisation (CDN)
- **localStorage** — client-side persistence

---

## Phase 1 Demo Checklist

- [ ] Live demo running (Live Server or GitHub Pages)
- [ ] At least 3 subjects added with different exam dates
- [ ] Scheduling algorithm producing correct priority order
- [ ] GitHub repo with meaningful commit history
- [ ] GitHub Issues created for upcoming features
- [ ] GitHub Project board set up (To Do / In Progress / Done)