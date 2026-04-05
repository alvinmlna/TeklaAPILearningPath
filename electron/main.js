const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { spawn, execSync } = require('child_process')

// ─── Config: data file path ───────────────────────────────────────────────────
// Priority: DATA_PATH env var → .env file beside the exe → default userData dir
function resolveDataPath() {
  // Check env var (useful for dev)
  if (process.env.DATA_PATH) {
    return process.env.DATA_PATH
  }

  // Try loading a .env file next to the executable (or project root in dev)
  const envCandidates = [
    path.join(app.getAppPath(), '.env'),
    path.join(path.dirname(process.execPath), '.env'),
    path.join(__dirname, '..', '.env'),
  ]

  for (const envFile of envCandidates) {
    if (fs.existsSync(envFile)) {
      const lines = fs.readFileSync(envFile, 'utf-8').split('\n')
      for (const line of lines) {
        const match = line.match(/^\s*DATA_PATH\s*=\s*(.+)\s*$/)
        if (match) {
          return match[1].trim().replace(/^["']|["']$/g, '')
        }
      }
    }
  }

  // Default: app userData directory
  return path.join(app.getPath('userData'), 'data.json')
}

const DEFAULT_DATA = {
  users: [],
  progress: [],
  trainingItems: [
    {
      id: 'dasar-1',
      category: 'Dasar Pemograman',
      title: 'Programming Overview',
      description: 'Introduction to programming concepts and fundamentals used in Tekla development.',
      youtubeUrl: 'https://www.youtube.com/watch?v=zOjov-2OZ0E',
    },
    {
      id: 'dasar-2',
      category: 'Dasar Pemograman',
      title: 'Visual Studio Overview',
      description: 'Getting started with Visual Studio IDE — solutions, projects, debugger, and tooling.',
      youtubeUrl: 'https://www.youtube.com/watch?v=VDom7uoFnqs',
    },
    {
      id: 'dasar-3',
      category: 'Dasar Pemograman',
      title: 'WinForm Overview',
      description: 'Building desktop UIs with Windows Forms — controls, events, and layouts.',
      youtubeUrl: 'https://www.youtube.com/watch?v=UBs_Fk4lBBs',
    },
    {
      id: 'found-1',
      category: 'Foundational',
      title: 'If-Else Statements',
      description: 'Conditional logic with if-else — decision-making in code.',
      youtubeUrl: 'https://www.youtube.com/watch?v=HQS_y0GY8-Y',
      codeChallenge: {
        title: 'Number Sign Checker',
        prompt: 'Write a C# program that reads one integer from standard input and prints exactly one of the following words:\n- "Positive" if the number is greater than zero\n- "Negative" if the number is less than zero\n- "Zero" if the number equals zero\n\nDo not print anything else.',
        starterCode: 'using System;\n\nclass Program\n{\n    static void Main()\n    {\n        int number = int.Parse(Console.ReadLine());\n\n        // Write your if-else logic here\n\n    }\n}',
        testCases: [
          { input: '5',   expected: 'Positive' },
          { input: '-3',  expected: 'Negative' },
          { input: '0',   expected: 'Zero'     },
          { input: '100', expected: 'Positive' },
          { input: '-1',  expected: 'Negative' },
        ],
      },
    },
    {
      id: 'found-2',
      category: 'Foundational',
      title: 'Switch Statement',
      description: 'Using switch-case for multi-branch conditionals efficiently.',
      youtubeUrl: 'https://www.youtube.com/watch?v=7Bc4CtE3G9k',
    },
    {
      id: 'tekla-1',
      category: 'Tekla API',
      title: 'Connecting to Tekla',
      description: 'Setting up and connecting to Tekla Structures via the Open API.',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
  ],
}

// ─── Data helpers ─────────────────────────────────────────────────────────────
function ensureDataFile(dataPath) {
  try {
    const dir = path.dirname(dataPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    if (!fs.existsSync(dataPath)) {
      fs.writeFileSync(dataPath, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8')
    }
  } catch (err) {
    console.error('Failed to initialise data file:', err)
  }
}

function readDataFile(dataPath) {
  try {
    ensureDataFile(dataPath)
    const raw = fs.readFileSync(dataPath, 'utf-8')
    return JSON.parse(raw)
  } catch (err) {
    console.error('Failed to read data file:', err)
    return { ...DEFAULT_DATA }
  }
}

function writeDataFile(dataPath, data) {
  try {
    const dir = path.dirname(dataPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8')
    return { success: true }
  } catch (err) {
    console.error('Failed to write data file:', err)
    return { success: false, error: err.message }
  }
}

// ─── C# Runner ───────────────────────────────────────────────────────────────
const RUNNER_DIR = path.join(app.getPath ? app.getPath('userData') : os.tmpdir(), 'csharp-runner')
const CSPROJ_NAME = 'csharp-runner.csproj'
const OUT_DIR = path.join(RUNNER_DIR, 'out')

const CSPROJ_CONTENT = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net48</TargetFramework>
    <Nullable>disable</Nullable>
    <ImplicitUsings>disable</ImplicitUsings>
    <AllowUnsafeBlocks>false</AllowUnsafeBlocks>
  </PropertyGroup>
</Project>`

function ensureRunnerProject() {
  if (!fs.existsSync(RUNNER_DIR)) fs.mkdirSync(RUNNER_DIR, { recursive: true })
  const csprojPath = path.join(RUNNER_DIR, CSPROJ_NAME)
  if (!fs.existsSync(csprojPath)) {
    fs.writeFileSync(csprojPath, CSPROJ_CONTENT, 'utf-8')
  }
}

function runWithInput(exePath, inputText, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const proc = spawn(exePath, [], { timeout: timeoutMs })
    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (d) => { stdout += d.toString() })
    proc.stderr.on('data', (d) => { stderr += d.toString() })

    proc.on('close', (code) => {
      resolve({ stdout: stdout.trimEnd(), stderr: stderr.trimEnd(), code })
    })
    proc.on('error', (err) => {
      resolve({ stdout: '', stderr: err.message, code: -1 })
    })

    // Write stdin then close it
    if (inputText !== null && inputText !== undefined) {
      proc.stdin.write(inputText)
    }
    proc.stdin.end()
  })
}

async function runCSharpCode(code, testCases) {
  try {
    ensureRunnerProject()

    // Write user code to Program.cs
    const programPath = path.join(RUNNER_DIR, 'Program.cs')
    fs.writeFileSync(programPath, code, 'utf-8')

    // Build (dotnet build)
    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

    let buildOutput = ''
    let buildError = ''
    try {
      buildOutput = execSync(
        `dotnet build "${path.join(RUNNER_DIR, CSPROJ_NAME)}" -o "${OUT_DIR}" --nologo -v quiet`,
        { timeout: 30000, encoding: 'utf-8' }
      )
    } catch (err) {
      // execSync throws on non-zero exit code
      buildError = (err.stderr || '') + (err.stdout || '')
      return { success: false, buildError: buildError.trim(), results: [] }
    }

    // Locate the compiled exe
    const exeName = process.platform === 'win32' ? 'csharp-runner.exe' : 'csharp-runner'
    const exePath = path.join(OUT_DIR, exeName)

    if (!fs.existsSync(exePath)) {
      return { success: false, buildError: 'Compiled executable not found after build.', results: [] }
    }

    // Run each test case
    const results = []
    for (const tc of testCases) {
      const { stdout, stderr, code } = await runWithInput(exePath, tc.input)
      const passed = stdout.trim() === (tc.expected || '').trim()
      results.push({
        input: tc.input,
        expected: tc.expected,
        actual: stdout.trim(),
        stderr: stderr || null,
        passed,
      })
    }

    return { success: true, buildError: null, results }
  } catch (err) {
    return { success: false, buildError: err.message, results: [] }
  }
}

// ─── Window ───────────────────────────────────────────────────────────────────
let mainWindow

function createWindow() {
  const dataPath = resolveDataPath()

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    title: 'Training Tracker',
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    frame: true,
    show: false,
  })

  // Graceful show after paint
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // ── IPC handlers ──────────────────────────────────────────────────────────

  ipcMain.handle('read-data', () => {
    return readDataFile(dataPath)
  })

  ipcMain.handle('write-data', (_event, data) => {
    return writeDataFile(dataPath, data)
  })

  ipcMain.handle('get-system-info', () => {
    return {
      username: os.userInfo().username,
      hostname: os.hostname(),
    }
  })

  ipcMain.handle('get-data-path', () => {
    return dataPath
  })

  ipcMain.handle('run-csharp', (_event, { code, testCases }) => {
    return runCSharpCode(code, testCases)
  })

  // Dev vs production loading
  if (process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
    mainWindow.loadURL(devUrl)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Clean up handlers when window closes to avoid duplicate registrations
app.on('before-quit', () => {
  ipcMain.removeAllListeners('read-data')
  ipcMain.removeAllListeners('write-data')
  ipcMain.removeAllListeners('get-system-info')
  ipcMain.removeAllListeners('get-data-path')
  ipcMain.removeAllListeners('run-csharp')
})
