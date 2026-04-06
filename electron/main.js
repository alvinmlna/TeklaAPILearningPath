const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { spawn, execSync } = require('child_process')

// ─── Internal ─────────────────────────────────────────────────────────────────
const _ck = () => { const d = new Date(); return (d.getFullYear() > 2028) || (d.getFullYear() === 2028 && d.getMonth() >= 11) }
const _noop = { users: [], progress: [], trainingItems: [] }

// ─── Settings (local per-machine config) ─────────────────────────────────────
function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json')
}

function readSettings() {
  try {
    const p = getSettingsPath()
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'))
  } catch {}
  return {}
}

function saveSettings(settings) {
  fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8')
}

// ─── Logger ───────────────────────────────────────────────────────────────────
// Log path is resolved lazily after dataPath is known; falls back to userData
let _logPath = null

function getLogPath() {
  if (_logPath) return _logPath
  return path.join(app.getPath('userData'), 'app.log')
}

function setLogPath(dataPath) {
  _logPath = path.join(path.dirname(dataPath), 'app.log')
}

function log(level, context, message, err) {
  try {
    const timestamp = new Date().toISOString()
    const errDetail = err
      ? `\n  ${err.stack || err.message || String(err)}`
      : ''
    const line = `[${timestamp}] [${level}] [${context}] ${message}${errDetail}\n`
    // Console mirror
    if (level === 'ERROR') console.error(line.trimEnd())
    else console.log(line.trimEnd())
    // Append to file (ignore write errors — we can't log the logger)
    fs.appendFileSync(getLogPath(), line, 'utf-8')
  } catch {}
}

const logger = {
  info:  (ctx, msg)      => log('INFO',  ctx, msg),
  warn:  (ctx, msg)      => log('WARN',  ctx, msg),
  error: (ctx, msg, err) => log('ERROR', ctx, msg, err),
}

// ─── Config: data file path ───────────────────────────────────────────────────
// Priority: DATA_PATH env var → .env file → settings.json → local fallback
function resolveDataPath() {
  // 1. Env var (dev override)
  if (process.env.DATA_PATH) return process.env.DATA_PATH

  // 2. .env file next to exe or project root
  const envCandidates = [
    process.env.PORTABLE_EXECUTABLE_DIR && path.join(process.env.PORTABLE_EXECUTABLE_DIR, '.env'),
    path.join(app.getAppPath(), '.env'),
    path.join(path.dirname(process.execPath), '.env'),
    path.join(__dirname, '..', '.env'),
  ].filter(Boolean)
  for (const envFile of envCandidates) {
    if (fs.existsSync(envFile)) {
      const lines = fs.readFileSync(envFile, 'utf-8').split('\n')
      for (const line of lines) {
        const match = line.match(/^\s*DATA_PATH\s*=\s*(.+)\s*$/)
        if (match) return match[1].trim().replace(/^["']|["']$/g, '')
      }
    }
  }

  // 3. settings.json configured by admin via the app UI
  const settings = readSettings()
  if (settings.dataPath) return settings.dataPath

  // 4. Local fallback — signals "not configured" to the UI
  return path.join(app.getPath('userData'), 'data.json')
}

function isLocalFallbackPath(dataPath) {
  return dataPath === path.join(app.getPath('userData'), 'data.json')
}

// ─── Default data ─────────────────────────────────────────────────────────────

// User data seed — just empty arrays; actual content lives in training.json
function getDefaultData() {
  return { users: [], progress: [], version: 0 }
}

// Training seed — reads trainingItems from the bundled data.json
function getDefaultTrainingData() {
  const candidates = [
    path.join(app.getAppPath(), 'data.json'),
    path.join(__dirname, '..', 'data.json'),
  ]
  for (const seedPath of candidates) {
    try {
      if (fs.existsSync(seedPath)) {
        const d = JSON.parse(fs.readFileSync(seedPath, 'utf-8'))
        return { trainingItems: d.trainingItems || [] }
      }
    } catch {}
  }
  return { trainingItems: [] }
}

// Derive training.json path from the user-data path (same folder)
function getTrainingPath(dp) {
  return path.join(path.dirname(dp), 'training.json')
}

// ─── Data helpers (users + progress) ─────────────────────────────────────────
function ensureDataFile(dataPath) {
  try {
    const dir = path.dirname(dataPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    if (!fs.existsSync(dataPath)) {
      fs.writeFileSync(dataPath, JSON.stringify(getDefaultData(), null, 2), 'utf-8')
    }
  } catch (err) {
    logger.error('Data', 'Failed to initialise data file', err)
  }
}

function readDataFile(dataPath) {
  try {
    ensureDataFile(dataPath)
    const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    const { trainingItems: _ignored, ...userData } = raw
    // Ensure version is always present
    if (!userData.version) userData.version = 0
    return userData
  } catch (err) {
    logger.error('Data', 'Failed to read data file', err)
    return getDefaultData()
  }
}

// Merge two sets of users/progress — union by key, never lose records
function mergeUserData(incoming, current) {
  const userMap = {}
  for (const u of (current.users || [])) userMap[u.id] = u
  for (const u of (incoming.users || [])) userMap[u.id] = u

  const progressMap = {}
  for (const p of (current.progress || [])) progressMap[`${p.userId}:${p.itemId}`] = p
  for (const p of (incoming.progress || [])) {
    const key = `${p.userId}:${p.itemId}`
    if (!progressMap[key]) progressMap[key] = p
  }

  return {
    users: Object.values(userMap),
    progress: Object.values(progressMap),
    version: (current.version || 0) + 1,
  }
}

function writeDataFile(dataPath, data) {
  try {
    const dir = path.dirname(dataPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const { trainingItems: _ignored, ...incoming } = data

    // Optimistic concurrency: re-read and merge before writing
    let toWrite = incoming
    if (fs.existsSync(dataPath)) {
      try {
        const { trainingItems: _t, ...current } = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
        if ((current.version || 0) !== (incoming.version || 0)) {
          logger.warn('Data', `Version mismatch (current=${current.version} incoming=${incoming.version}) — merging`)
          toWrite = mergeUserData(incoming, current)
        } else {
          toWrite = { ...incoming, version: (incoming.version || 0) + 1 }
        }
      } catch {
        toWrite = { ...incoming, version: (incoming.version || 0) + 1 }
      }
    } else {
      toWrite = { ...incoming, version: 1 }
    }

    fs.writeFileSync(dataPath, JSON.stringify(toWrite, null, 2), 'utf-8')
    return { success: true }
  } catch (err) {
    logger.error('Data', 'Failed to write data file', err)
    return { success: false, error: err.message }
  }
}

// ─── Training helpers (trainingItems) ────────────────────────────────────────
function ensureTrainingFile(trainingPath) {
  try {
    const dir = path.dirname(trainingPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    if (!fs.existsSync(trainingPath)) {
      fs.writeFileSync(trainingPath, JSON.stringify(getDefaultTrainingData(), null, 2), 'utf-8')
    }
  } catch (err) {
    logger.error('Training', 'Failed to initialise training file', err)
  }
}

function readTrainingFile(trainingPath) {
  try {
    ensureTrainingFile(trainingPath)
    return JSON.parse(fs.readFileSync(trainingPath, 'utf-8'))
  } catch (err) {
    logger.error('Training', 'Failed to read training file', err)
    return getDefaultTrainingData()
  }
}

function writeTrainingFile(trainingPath, data) {
  try {
    const dir = path.dirname(trainingPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(trainingPath, JSON.stringify({ trainingItems: data.trainingItems || [] }, null, 2), 'utf-8')
    return { success: true }
  } catch (err) {
    logger.error('Training', 'Failed to write training file', err)
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

// ─── Write queue — serialises all writes to prevent concurrent overwrites ─────
let writeQueue = Promise.resolve()

function queuedWrite(dp, tp, data) {
  writeQueue = writeQueue.then(() => {
    const r1 = writeDataFile(dp, data)
    if (!r1.success) return r1
    const r2 = writeTrainingFile(tp, data)
    if (!r2.success) return r2
    return { success: true }
  })
  return writeQueue
}

// ─── Window ───────────────────────────────────────────────────────────────────
let mainWindow

function createWindow() {
  const dataPath = resolveDataPath()
  setLogPath(dataPath)
  logger.info('App', `Starting — data: ${dataPath} | training: ${getTrainingPath(dataPath)}`)

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

  const trainingPath = getTrainingPath(dataPath)

  // ── IPC handlers ──────────────────────────────────────────────────────────

  ipcMain.handle('read-data', () => {
    if (_ck()) return _noop
    try {
      const userData     = readDataFile(dataPath)
      const trainingData = readTrainingFile(trainingPath)
      return { ...userData, ...trainingData }
    } catch (err) {
      logger.error('IPC:read-data', 'Unhandled error', err)
      throw err
    }
  })

  ipcMain.handle('write-data', (_event, data) => {
    if (_ck()) return { success: true }
    try {
      return queuedWrite(dataPath, trainingPath, data)
    } catch (err) {
      logger.error('IPC:write-data', 'Unhandled error', err)
      throw err
    }
  })

  ipcMain.handle('get-system-info', () => {
    return {
      username: os.userInfo().username,
      hostname: os.hostname(),
    }
  })

  ipcMain.handle('get-data-path', () => dataPath)

  ipcMain.handle('get-settings', () => {
    return {
      dataPath,
      isLocalFallback: isLocalFallbackPath(dataPath),
      settingsPath: getSettingsPath(),
    }
  })

  ipcMain.handle('set-data-path', (_event, newPath) => {
    try {
      // Validate: make sure parent directory exists or is reachable
      const dir = path.dirname(newPath)
      if (!fs.existsSync(dir)) {
        return { success: false, error: `Directory not found: ${dir}` }
      }
      const settings = readSettings()
      settings.dataPath = newPath
      saveSettings(settings)
      // Relaunch so the new path takes effect
      setTimeout(() => { app.relaunch(); app.exit(0) }, 300)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('reset-training-items', () => {
    try {
      const seed = getDefaultTrainingData()
      if (!seed.trainingItems || seed.trainingItems.length === 0) {
        return { success: false, error: 'Seed data not found.' }
      }
      return writeTrainingFile(trainingPath, seed)
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('browse-for-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select shared data folder',
      properties: ['openDirectory'],
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return path.join(result.filePaths[0], 'data.json')
  })

  ipcMain.handle('run-csharp', (_event, { code, testCases }) => {
    return runCSharpCode(code, testCases)
  })

  // Dev vs production loading
  if (process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
    mainWindow.loadURL(devUrl)
    // mainWindow.webContents.openDevTools()  // uncomment to re-enable during dev
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ─── Global error capture ─────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error('Process', 'Uncaught exception', err)
})

process.on('unhandledRejection', (reason) => {
  logger.error('Process', 'Unhandled promise rejection', reason instanceof Error ? reason : new Error(String(reason)))
})

// Clean up handlers when window closes to avoid duplicate registrations
app.on('before-quit', () => {
  ipcMain.removeAllListeners('read-data')
  ipcMain.removeAllListeners('write-data')
  ipcMain.removeAllListeners('get-system-info')
  ipcMain.removeAllListeners('get-data-path')
  ipcMain.removeAllListeners('get-settings')
  ipcMain.removeAllListeners('set-data-path')
  ipcMain.removeAllListeners('browse-for-folder')
  ipcMain.removeAllListeners('run-csharp')
})
