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
   * @param {{ code: string, testCases: Array<{ input: string, expected: string }> }} opts
   * @returns {Promise<{ success: boolean, buildError: string|null, results: Array<{ input, expected, actual, stderr, passed }> }>}
   */
  runCSharp: (opts) => ipcRenderer.invoke('run-csharp', opts),
})
