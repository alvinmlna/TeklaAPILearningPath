const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Read the full data.json and return the parsed object.
   * @returns {Promise<object>}
   */
  readData: () => ipcRenderer.invoke('read-data'),

  /**
   * Write the full data object back to data.json.
   * @param {object} data
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  writeData: (data) => ipcRenderer.invoke('write-data', data),

  /**
   * Get Windows username and hostname from the OS.
   * @returns {Promise<{ username: string, hostname: string }>}
   */
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

  /**
   * Get the resolved path to data.json (for display in settings).
   * @returns {Promise<string>}
   */
  getDataPath: () => ipcRenderer.invoke('get-data-path'),

  /**
   * Compile and run user-supplied C# code against test cases.
   */
  runCSharp: (opts) => ipcRenderer.invoke('run-csharp', opts),

  /**
   * Get current data path settings.
   * @returns {Promise<{ dataPath: string, isLocalFallback: boolean, settingsPath: string }>}
   */
  getSettings: () => ipcRenderer.invoke('get-settings'),

  /**
   * Save a new data path to settings.json and relaunch.
   * @param {string} newPath
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  setDataPath: (newPath) => ipcRenderer.invoke('set-data-path', newPath),

  /**
   * Open a folder picker dialog and return the selected data.json path.
   * @returns {Promise<string|null>}
   */
  browseForFolder: () => ipcRenderer.invoke('browse-for-folder'),
})
