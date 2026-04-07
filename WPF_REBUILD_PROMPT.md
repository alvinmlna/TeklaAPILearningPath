# Training Tracker — WPF Rebuild Specification

## Overview

Rebuild "Training Tracker" as a **WPF desktop application** (.NET 8+ or .NET Framework 4.8).  
The current implementation is an **Electron + React + Vite + TailwindCSS** app packaged as a portable `.exe`.

**Purpose:** Internal tool for tracking team progress through the Tekla API learning path.  
Trainees work through 5 sequential categories of lessons. Each lesson has a video, optional PDF, optional quiz, and/or a C# code challenge. Progress is stored in a shared JSON file on a network share.

---

## Tech Stack to Replace With

| Current | WPF Equivalent |
|---|---|
| React state / screens | WPF Pages or UserControls with ViewModel (MVVM) |
| TailwindCSS | WPF styles/templates in ResourceDictionary |
| Monaco Editor | AvalonEdit (NuGet: `AvalonEdit`) |
| YouTube iframe | WebView2 (`Microsoft.Web.WebView2`) |
| PDF viewer (iframe) | WebView2 or `PdfiumViewer` |
| Electron IPC | Direct C# file I/O (no IPC needed) |
| `data.json` + `training.json` | Same JSON files, read via `System.Text.Json` |
| `dotnet build` / C# runner | Same — use `Process` + `dotnet build` |
| Webcam selfie | `OpenCvSharp4` or WPF MediaCapture |

---

## Application Architecture

### Screens / Views (current → WPF equivalent)

| Screen | When shown | Description |
|---|---|---|
| Loading | App start | Splash while reading data and detecting current user |
| Setup | First run, no shared path configured | One-time configuration of network data path |
| Register | User not found by Windows account + hostname | New user profile creation with name + photo |
| Dashboard | Logged-in user | Main map of the learning path + team panel |
| Training | User clicks a lesson node | Lesson viewer with tabs: Video, PDF, Quiz, Code |
| Admin | PIN-protected | Manage lessons, quizzes, users, data source |

### Navigation Flow

```
App starts
  → Load data.json + training.json
  → Detect current user by: WindowsIdentity.GetCurrent().Name + Environment.MachineName
  → If match found → Dashboard
  → Else → Register
  → If DATA_PATH not configured → Setup first
```

---

## Data Model

All data lives in two JSON files in the same directory on a network share.

### `data.json` — users + progress

```json
{
  "users": [
    {
      "id": "user_1234567890_abc123",
      "name": "Alvin",
      "photo": "data:image/jpeg;base64,...",
      "windowsAccount": "alvin",
      "computerName": "PC-ALVIN",
      "registeredAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "progress": [
    {
      "userId": "user_1234567890_abc123",
      "itemId": "pf-1",
      "completedAt": "2025-01-02T00:00:00.000Z",
      "submittedCode": "using System; ..."
    }
  ],
  "version": 42
}
```

### `training.json` — training content

```json
{
  "trainingItems": [
    {
      "id": "pf-1",
      "category": "Programming Fundamental",
      "title": "Type of Application",
      "description": "...",
      "youtubeUrl": "https://youtu.be/...",
      "pdfPath": "C:\\share\\lesson1.pdf",
      "codeChallenge": {
        "title": "Hello, Console!",
        "prompt": "Print the following two lines exactly:\nHello, World!\nI am learning C#.",
        "starterCode": "using System;\n\nclass Program\n{\n    static void Main()\n    {\n        // TODO\n    }\n}",
        "testCases": [
          { "input": "", "expected": "Hello, World!\nI am learning C#." }
        ]
      },
      "quiz": {
        "passMark": 2,
        "questions": [
          {
            "id": "q1",
            "question": "What keyword is used to print output?",
            "options": ["Console.WriteLine", "print", "echo", "output"],
            "correctIndex": 0
          }
        ]
      }
    }
  ]
}
```

### Training Categories (in order, sequential unlock)

1. **Programming Fundamental** — 9 items, each with a C# code challenge (gate to unlock next item)
2. **Visual Studio** — 8 items, ends with a quiz gate
3. **Windows Form** — 2 items, ends with a quiz gate
4. **Tekla Open API** — 6 items, ends with a quiz gate
5. **Intermediate** — 4 items, no gate (just watch/mark complete)

**Lock rules:**
- Category N is locked until all items in category N-1 are completed
- Within a category, item N is locked until item N-1 is completed
- For code challenge items: completing = passing all test cases
- For quiz items: completing = passing the quiz (score >= passMark)
- For video-only items: completing = clicking "Mark Complete"

---

## All Training Items (seed data from `data.json`)

### Programming Fundamental

| ID | Title | Code Challenge |
|---|---|---|
| pf-1 | Type of Application | Hello, Console! — print "Hello, World!\nI am learning C#." |
| pf-2 | Intro | Full Name Greeter — read first + last name, print greeting |
| pf-3 | Data Type | Temperature Converter — Celsius to Fahrenheit |
| pf-4 | Variables | Age in Days — name + age → "[Name] is approximately [age*365] days old." |
| pf-5 | String Manipulation | Count Vowels — count a,e,i,o,u case-insensitive |
| pf-6 | Arithmetic Operators | Simple Calculator — two ints + operator, handle divide-by-zero → "Error" |
| pf-7 | User Input | Rectangle Area and Perimeter |
| pf-8 | If Statements | Grade Classifier — 90→A, 80→B, 70→C, 60→D, <60→F |
| pf-9 | Logical Operators | Leap Year Checker |

### Visual Studio

| ID | Title | Type |
|---|---|---|
| vs-1 | While Loops | Code challenge: Accumulate Until Zero |
| vs-2 | For Loops | Code challenge: Multiplication Table |
| vs-3 | Array | Code challenge: Find Max and Min |
| vs-4 | Foreach Loops | Code challenge: Count and Sum Even Numbers |
| vs-5 | Methods | Code challenge: Palindrome Checker |
| vs-6 | Return Keyword | Code challenge: FizzBuzz |
| vs-7 | List | Code challenge: Unique Sorted Numbers |
| vs-8 | Enums | Code challenge: Season Finder |

### Windows Form

| ID | Title | Type |
|---|---|---|
| wf-1 | How To Create A Windows Form App Part 1 | Video |
| wf-2 | How To Create A Windows Form App Part 3 | Video |

### Tekla Open API

| ID | Title | Type |
|---|---|---|
| ta-1 | Intro | Video |
| ta-2 | Connect with Tekla Model | Video |
| ta-3 | Create First Beam | Video |
| ta-4 | Change Profile and Material Grade | Video |
| ta-5 | Pick Two Points to Insert Beam | Video |
| ta-6 | Read and Insert UDA Value | Video |

### Intermediate

| ID | Title | Type |
|---|---|---|
| im-1 | Github | Video |
| im-2 | Exception Handling | Video |
| im-3 | Debugging Code | Video |
| im-4 | BackgroundWorker / Async | Video |

---

## Screen Specifications

### 1. Loading Screen

- Centered indigo icon (graduation cap emoji or similar icon)
- Text: "Loading Training Tracker…"
- Show while reading data files and matching current Windows user

### 2. Setup Screen

Shown when `DATA_PATH` is not configured (using local fallback).

**Layout:**
- Warning box: "Currently using a local file — only this machine can see its own data"
- Text field: "Network data file path" (e.g. `\\SERVER\share\training-tracker\data.json`)
- Browse button → folder picker → appends `\data.json`
- Save button → saves to `settings.json` in `%APPDATA%\TrainingTracker\` → relaunches app
- Skip button → continue without shared path (local only)

**Validation:**
- Path must end with `.json`
- Parent directory must exist

### 3. Register Screen

Shown when current user is not found in `data.json`.

**Fields:**
- Profile photo (required) — upload file or take webcam snapshot
- Name (text input, required)
- Auto-detected display (read-only):
  - Windows account: `Environment.UserName`
  - Computer name: `Environment.MachineName`

**On submit:**
- Validate name and photo are filled
- Generate ID: `user_{timestamp}_{random6chars}`
- Append new user to `data.json`
- Navigate to Dashboard

**Photo options:**
- Upload from file (JPG/PNG → convert to base64 data URL)
- Webcam capture (show live preview → capture frame → convert to base64)

### 4. Dashboard Screen

**Header bar:**
- App branding (icon + "Training Tracker" + "Tekla API Learning Path")
- Overall progress bar: X of Y completed, percentage
- Toggle team panel button
- Admin button (gear icon) — opens Admin with PIN prompt
- Current user avatar + name + windows account

**Main area — Learning Path Map:**

Vertical list of 5 categories. Between categories: animated dashed connector line (if unlocked) or static grey line (if locked).

Each category section:
- Level label: "Level 1", "Level 2", etc. — grey if locked, indigo if unlocked
- Lock icon + "Locked" text if locked
- `MapZone` component for the category (see below)

**MapZone:**  
A horizontal row of lesson nodes (circles/cards) for each training item in the category.

Each node:
- Circle indicator: grey (incomplete), colored dot (in progress), colored checkmark (done)
- Lesson title (short, truncated)
- User avatar stacked on node if they are currently at this lesson (their latest completed item)
- Clickable if unlocked → opens Training screen

After all 5 categories: "Finish line" milestone (amber style if all done, grey if not).

**Graduates Board** (below finish line):  
Shows users who completed all items, ranked by completion date. Each card shows: rank number, avatar, name, Windows account, completion date.

**Team Panel (right sidebar, toggleable, 224px wide):**
- Header: "Team Progress"
- List of all users with avatar, name, progress bar (%), current level
- Highlighted if current user
- Footer: data file path (truncated)

### 5. Training Screen

**Header:**
- Back button → Dashboard
- Title: "Training Library"
- Keyboard hint: "Press Esc to go back"
- X of Y completed counter
- Current user avatar

**Left sidebar — Curriculum (240px):**
- Categories listed vertically
- Each category has a colored header with category name + "X/Y" count (or "Locked")
- Items listed under category: status dot (locked/done/incomplete), title
- Locked items greyed out and non-clickable
- Clicking an item selects it in the main content area

**Main content area:**

Item header:
- Category badge (colored pill)
- "Completed · [date]" badge if done
- Item title (large)
- Item description (small grey text)
- Action button/banner:
  - If has code challenge or quiz: amber warning "Pass the quiz/code challenge to complete"
  - If video-only and not done: "Mark Complete" button (indigo)
  - If done: green "Done" badge

Tab bar below header:
- **Video** tab — shown if `youtubeUrl` is set
- **PDF** tab — shown if `pdfPath` is set
- **Quiz** tab — shown if `quiz` is set (amber dot if not passed)
- **Code Challenge** tab — shown if `codeChallenge` is set (amber dot if not passed)

**Video tab:**
- Embed YouTube video (WebView2 with YouTube embed URL)
- "Also completed by" section showing other users who finished this item

**PDF tab:**
- Load PDF from `pdfPath` → display in WebView2 or PDF viewer

**Quiz tab:**
- Show questions one by one or all at once
- Multiple choice (radio buttons)
- Submit → check score vs `passMark`
- Pass → mark item complete
- Fail → show score, allow retry
- If already passed: read-only view showing questions + correct answers highlighted

**Code Challenge tab:**
- Challenge prompt text (title + description + test case summary pills)
- Monaco-style code editor (use AvalonEdit) with C# syntax highlighting
- Starter code pre-filled from `codeChallenge.starterCode`
- "Run Tests" button → compile and run (see C# Runner section)
- Results panel (right side, fixed 288px):
  - Each test case: pass/fail indicator, expandable row showing input / expected / got / stderr
  - "All tests passed!" banner when complete → marks item complete + saves submitted code
- If already passed: read-only view of submitted code

### 6. Admin Screen

**PIN Gate:**
- Text input for PIN
- PIN: `1873` (hardcoded, change in source)
- Max 3 attempts → locked for 1 hour
- Lock state stored in `%APPDATA%\TrainingTracker\settings.json` (or local file)
- Show countdown timer when locked

**After PIN accepted, 4 tabs:**

#### Tab 1 — Training Items

- List of all items grouped by category
- Each item row: title, category badge, edit button, delete button
- "Add Item" button → form to create new item (id, category, title, description, youtubeUrl)
- Edit → inline form or modal: title, description, YouTube URL, browse for PDF, browse for video

#### Tab 2 — Quiz Editor

- Select an item from dropdown
- Show existing quiz questions if any
- Add question: question text, 4 options, correct index (0-3)
- Set pass mark (integer)
- Save / delete quiz

#### Tab 3 — User Progress

- Table of all users × all training items
- Each cell: checkbox (completed / not completed)
- Toggling a checkbox writes to `data.json`
- Use this to manually fix stuck progress

#### Tab 4 — Data Source

- Show current data path
- Browse button to select new folder → sets path, relaunches
- "Reset Training Content" button → replaces `training.json` with seed data from `data.json` bundled with the app (preserves users and progress)

---

## C# Code Runner

Used by the Code Challenge tab. Must work on Windows 10/11 with .NET SDK or .NET Framework 4.8 installed.

**Logic:**
1. Create temp directory: `%APPDATA%\TrainingTracker\csharp-runner\`
2. Write a `.csproj` targeting `net48`:
   ```xml
   <Project Sdk="Microsoft.NET.Sdk">
     <PropertyGroup>
       <OutputType>Exe</OutputType>
       <TargetFramework>net48</TargetFramework>
       <Nullable>disable</Nullable>
       <ImplicitUsings>disable</ImplicitUsings>
     </PropertyGroup>
   </Project>
   ```
3. Write user code to `Program.cs` in that directory
4. Run `dotnet build` with 30s timeout
5. If build fails → return `{ success: false, buildError: "..." }`
6. If success → for each test case:
   - Run the compiled `.exe` with stdin = `tc.input`
   - Compare `stdout.Trim()` to `tc.expected.Trim()`
   - Return pass/fail + actual output + stderr
7. Timeout per run: 8 seconds

**Return structure:**
```csharp
public class RunResult
{
    public bool Success { get; set; }
    public string BuildError { get; set; }
    public List<TestResult> Results { get; set; }
}

public class TestResult
{
    public string Input { get; set; }
    public string Expected { get; set; }
    public string Actual { get; set; }
    public string Stderr { get; set; }
    public bool Passed { get; set; }
}
```

---

## File I/O & Concurrency

### Configuration (`settings.json`)

Stored at: `%APPDATA%\TrainingTracker\settings.json`
```json
{ "dataPath": "\\\\SERVER\\share\\training-tracker\\data.json" }
```

### Data path resolution (priority order)

1. `DATA_PATH` environment variable
2. `.env` file next to exe: `DATA_PATH=\\SERVER\share\...`
3. `settings.json` → `dataPath`
4. Local fallback: `%APPDATA%\TrainingTracker\data.json` (signals "not configured" → show Setup)

### Reading data

Merge `data.json` (users + progress) and `training.json` (trainingItems) into one in-memory model.

### Writing data (Optimistic Concurrency)

**Important — multiple PCs write to the same shared file.**

Before every write:
1. Re-read the current file from disk
2. If `version` on disk differs from our in-memory version → merge:
   - Users: union by `id`
   - Progress: union by `userId:itemId` key, keep earlier record if conflict
3. Increment version by 1
4. Write atomically (write to temp file → rename)

**Within one process**, serialize all writes using a queue (async lock or `SemaphoreSlim(1,1)`).

### Logging

Write to `app.log` in the same directory as `data.json`.  
Format: `[2025-01-01T00:00:00.000Z] [INFO] [Context] Message`

---

## User Identity Detection

On startup, match current user by:
- `windowsAccount` == `Environment.UserName` (case-insensitive)
- `computerName` == `Environment.MachineName` (case-insensitive)

If both match → auto-login, go to Dashboard.

---

## Expiry / Kill Switch

The app silently stops working after December 2028.  
All data reads return empty, all buttons do nothing, no error shown.

```csharp
private static bool IsExpired()
{
    var now = DateTime.Now;
    return now.Year > 2028 || (now.Year == 2028 && now.Month >= 12);
}
```

---

## Admin Panel Details

**PIN:** `1873`  
**Max attempts:** 3  
**Lock duration:** 1 hour  
**Lock state:** stored locally (not in shared `data.json`)

---

## Visual Design Guidelines (WPF)

The current app uses TailwindCSS. Translate to WPF styles:

### Color Palette

| Usage | Color |
|---|---|
| Primary / brand | Indigo `#4F46E5` |
| Background | Slate `#F8FAFC` |
| Surface / cards | White `#FFFFFF` |
| Borders | Slate `#E2E8F0` |
| Text primary | Slate `#1E293B` |
| Text secondary | Slate `#64748B` |
| Text muted | Slate `#94A3B8` |
| Success | Emerald `#10B981` |
| Warning | Amber `#F59E0B` |
| Error | Rose `#F43F5E` |

### Category Colors

| Category | Color |
|---|---|
| Programming Fundamental | Indigo `#6366F1` |
| Visual Studio | Violet `#7C3AED` |
| Windows Form | Sky `#0EA5E9` |
| Tekla Open API | Emerald `#10B981` |
| Intermediate | Orange `#F97316` |

### Layout

- Window minimum: 1024 × 640
- Window default: 1280 × 800
- No system menu or custom titlebar — use standard WPF chrome
- No installer — portable exe, run directly from network share

### Corner Radii

| Element | Radius |
|---|---|
| Cards | 16px |
| Buttons | 8-12px |
| Badges | 6px |
| Input fields | 8px |

---

## File Structure (Network Share)

```
\\SERVER\share\training-tracker\
  ├── TrainingTracker.exe     ← the app
  ├── .env                    ← optional: DATA_PATH=...
  ├── data.json               ← users + progress (shared)
  ├── training.json           ← training content (shared)
  └── app.log                 ← error log (written by app)
```

---

## Key Behaviors to Preserve

1. **No installer** — portable exe
2. **No web server** — fully offline, all data in JSON on network share
3. **Multi-user safe** — optimistic concurrency + write queue
4. **Auto-login** — by Windows username + hostname match
5. **Sequential unlock** — category and item locks enforced strictly
6. **Code challenges gate progress** — must pass all test cases to mark complete
7. **Quiz gates progress** — must score >= passMark
8. **Submitted code stored** — so completed code challenge shows read-only submitted solution
9. **Graduates board** — ranked list of users who completed everything, by date
10. **Admin "Reset Training Content"** — replaces training.json with seed, preserves users/progress
11. **Admin: User Progress override** — admin can manually toggle any user's progress on any item

---

## NuGet Packages Needed

| Package | Use |
|---|---|
| `AvalonEdit` | C# code editor in Code Challenge tab |
| `Microsoft.Web.WebView2` | YouTube video embedding + PDF display |
| `System.Text.Json` | JSON serialization |
| `AForge.Video.DirectShow` or `OpenCvSharp4.Windows` | Webcam capture in Register screen |

---

## What Does NOT Need to Be Rebuilt

- Electron / Node.js / IPC bridge — replaced by direct C# file I/O
- Vite / React / TailwindCSS — replaced by WPF XAML
- `preload.js` — not needed
- `npm` build pipeline — replaced by standard `.csproj` / `dotnet build`

---

## Starting Point Recommendation

1. Create a WPF App (.NET 8) project
2. Set up MVVM (can use `CommunityToolkit.Mvvm` NuGet)
3. Create `DataService.cs` — handles all JSON file read/write with concurrency logic
4. Create `AppState.cs` — holds current user, data, navigation state
5. Implement screens in order: Loading → Register → Dashboard → Training → Admin
6. Add `CSharpRunner.cs` — wraps `dotnet build` + process spawn
7. Style with WPF ResourceDictionary matching the color palette above
