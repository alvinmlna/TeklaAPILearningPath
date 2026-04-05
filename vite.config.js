import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import _monacoEditorPlugin from 'vite-plugin-monaco-editor'
const monacoEditorPlugin = _monacoEditorPlugin.default ?? _monacoEditorPlugin

export default defineConfig({
  plugins: [
    react(),
    monacoEditorPlugin({ languageWorkers: ['editorWorkerService'] }),
  ],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
})
