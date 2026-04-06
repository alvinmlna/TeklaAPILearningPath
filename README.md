# Training Tracker — Tekla API Learning Path

Internal desktop app for tracking team progress through the Tekla API learning path.
Built with Electron + React + Vite + TailwindCSS.

---

## Quick Start (Development)

```bash
# Terminal 1 — start Vite dev server
npm run vite

# Terminal 2 — start Electron
npm run electron
```

## Build for Production

```bash
npm run dist
```

Output: `dist-electron/TrainingTracker.exe`

---

## Deployment Checklist

1. Build the exe: `npm run dist`
2. Copy to network share folder:
   - `TrainingTracker.exe`
   - `.env` (with real network path — see below)
3. Make sure `data.json` and `training.json` are in the same share folder
4. Set correct Windows ACL permissions on the share folder — all users need **read + write**
5. Each PC just runs the exe directly from the share — no installation needed

---

## .env Configuration

Place a `.env` file in the **same folder as the exe** on the network share:

```
DATA_PATH=\\SERVER\share\training-tracker\data.json
```

This tells every PC where the shared data file is. Without it each PC uses its own local file and users won't see each other's progress.

Also update `dist-electron/.env` and the project root `.env` before rebuilding.

---

## File Structure (Network Share)

```
\\SERVER\share\training-tracker\
  ├── TrainingTracker.exe     ← the app
  ├── .env                    ← network path config
  ├── data.json               ← users + progress (shared)
  ├── training.json           ← training content (shared)
  └── app.log                 ← error log
```

---

## Data Files

| File | Contains | Modified by |
|---|---|---|
| `data.json` | users, progress, version | App automatically |
| `training.json` | training items, quizzes, video URLs | Admin panel |
| `app.log` | error and warning log | App automatically |

**Backup `data.json` and `training.json` regularly** — there is no automatic backup.
If `data.json` is deleted all user progress is lost.

---

## Admin Panel

- Access via the gear icon on the dashboard
- PIN: **1873**
- Wrong PIN 3 times → locked for **1 hour**

### What admin can do:
- **Training Items** — add/edit title, description, video URL for each item
- **Quiz Editor** — create/edit quiz questions and pass mark per item
- **User Progress** — manually set any user's progress to any item (for error recovery)
- **Data Source** — change the shared network path, reset training content from seed

### Reset Training Content
Admin → Data Source → "Reset Training Content"
- Replaces all training items with the built-in seed (from `data.json` in the project)
- **Preserves all users and progress**
- Use this when training material appears empty or has wrong categories

---

## Training Content Structure

5 categories in order (each unlocks after completing the previous):

| # | Category | Items | Gate |
|---|---|---|---|
| 1 | Programming Fundamental | 8 | Code challenge per item |
| 2 | Visual Studio | 5 videos + 1 quiz | Final quiz |
| 3 | Windows Form | 3 videos + 1 quiz | Final quiz |
| 4 | Tekla Open API | 3 videos + 1 quiz | Final quiz |
| 5 | Intermediate | 4 videos | None |

To add video URLs: Admin → Training Items → Edit button on each item.

---

## Expiry

The app stops working after **December 2028**.
Buttons silently do nothing and data returns empty — no error message shown.

To extend, update the year `2028` in:
- `electron/main.js` — line ~8 (`_ck` function)
- `src/App.jsx` — line ~12 (`_x` function)

Then rebuild.

---

## Requirements to Run

- Windows 10 or 11 (64-bit)
- .NET Framework 4.8 (pre-installed on Windows 10/11)
- Visual Studio Community (installs .NET SDK — needed for C# code challenges)
- Network share accessible from all PCs

---

## Key Technical Decisions

- **No installer** — portable exe, run directly from network share
- **No web server** — fully offline, all data in JSON files on the share
- **Optimistic concurrency** — on every write, re-reads file and merges changes to prevent data loss when two users write simultaneously
- **Serial write queue** — within one machine, writes are queued to prevent race conditions
- **Monaco Editor** — loaded locally (not from CDN) via `vite-plugin-monaco-editor`
- **C# runner** — compiles and runs user code using .NET 4.8 via `dotnet build` in a temp folder

---

## Common Issues

| Issue | Fix |
|---|---|
| Training material is empty | Admin → Data Source → Reset Training Content |
| Setup screen appears every launch | Place `.env` next to the exe with correct `DATA_PATH` |
| C# code challenge not working | Make sure .NET SDK is installed (via Visual Studio) |
| App won't build (winCodeSign error) | Delete `%LOCALAPPDATA%\electron-builder\Cache\winCodeSign\` and rebuild |
| Users see different data | All machines must point to the same `DATA_PATH` in `.env` |
| Admin locked | Wait 1 hour — auto-unlocks |

---

## Changing the Admin PIN

Update in `src/screens/Admin.jsx`:
```js
const PIN = '1873'  // ← change this
```
Then rebuild.

---

## Adding New Training Content

1. Edit `data.json` in the project root
2. Rebuild the app: `npm run dist`
3. Deploy new exe to the share
4. In the app: Admin → Data Source → Reset Training Content
   (this pushes the new seed content to the shared `training.json`)
