/**
 * storage.js — thin wrapper around window.electronAPI
 *
 * All data access from React must go through these functions.
 * Never import 'fs' or call ipcRenderer directly from a component.
 */

const api = () => {
  if (!window.electronAPI) {
    throw new Error('electronAPI is not available. Are you running inside Electron?')
  }
  return window.electronAPI
}

export async function readData() {
  return api().readData()
}

export async function writeData(data) {
  return api().writeData(data)
}

export async function getSystemInfo() {
  return api().getSystemInfo()
}

export async function getDataPath() {
  return api().getDataPath()
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

export async function addUser(user) {
  const data = await readData()
  data.users.push(user)
  return writeData(data)
}

export async function markComplete(userId, itemId) {
  const data = await readData()
  const alreadyDone = data.progress.some(
    (p) => p.userId === userId && p.itemId === itemId
  )
  if (alreadyDone) return { success: true, alreadyExisted: true }

  data.progress.push({
    userId,
    itemId,
    completedAt: new Date().toISOString(),
  })
  const result = await writeData(data)
  return { ...result, alreadyExisted: false }
}

export async function addTrainingItem(item) {
  const data = await readData()
  data.trainingItems.push(item)
  return writeData(data)
}

export async function deleteTrainingItem(itemId) {
  const data = await readData()
  data.trainingItems = data.trainingItems.filter((i) => i.id !== itemId)
  // Optionally also clean up progress records for that item
  data.progress = data.progress.filter((p) => p.itemId !== itemId)
  return writeData(data)
}

export function isCompleted(progress, userId, itemId) {
  return progress.some((p) => p.userId === userId && p.itemId === itemId)
}

export function completedAt(progress, userId, itemId) {
  const record = progress.find((p) => p.userId === userId && p.itemId === itemId)
  return record ? record.completedAt : null
}

export function getUsersOnNode(progress, users, itemId) {
  const userIds = progress.filter((p) => p.itemId === itemId).map((p) => p.userId)
  return users.filter((u) => userIds.includes(u.id))
}

/**
 * For the dashboard map: returns a map of { userId → itemId } where each value
 * is the most recently completed item for that user.
 * Used to show only the user's current "position" on the map (latest node).
 */
export function getLatestItemPerUser(progress) {
  const latest = {}
  for (const p of progress) {
    if (!latest[p.userId] || new Date(p.completedAt) > new Date(latest[p.userId].completedAt)) {
      latest[p.userId] = p
    }
  }
  return latest // { [userId]: { userId, itemId, completedAt } }
}

// ─── C# Code Challenge ────────────────────────────────────────────────────────

/**
 * Compile and run user C# code against the challenge test cases.
 * @param {string} code - Full C# source code
 * @param {Array<{ input: string, expected: string }>} testCases
 * @returns {Promise<{ success: boolean, buildError: string|null, results: Array }>}
 */
export async function runCSharp(code, testCases) {
  return api().runCSharp({ code, testCases })
}
