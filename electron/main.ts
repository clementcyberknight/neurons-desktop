import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { AIBridge } from './ai-bridge'

// The built directory structure
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

const aiBridge = new AIBridge()

function createWindow() {
  win = new BrowserWindow({
    width: 1380,
    height: 880,
    minWidth: 1080,
    minHeight: 700,
    title: 'BAU Copilot — Offline Business OS',
    backgroundColor: '#090d16',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0d1322',
      symbolColor: '#94a3b8',
      height: 38,
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    // win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }
}

// IPC Handlers
ipcMain.handle('ai:generate', async (_, params) => {
  return await aiBridge.generate(params)
})

ipcMain.handle('ai:status', async () => {
  return true
})

ipcMain.handle('app:info', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: app.getVersion(),
  }
})

ipcMain.handle('app:export-data', async (_, jsonData: string) => {
  if (!win) return false
  const { filePath } = await dialog.showSaveDialog(win, {
    title: 'Export Business Data Backup',
    defaultPath: `bau-backup-${new Date().toISOString().split('T')[0]}.json`,
    filters: [{ name: 'JSON Backup', extensions: ['json'] }],
  })
  if (filePath) {
    fs.writeFileSync(filePath, jsonData, 'utf-8')
    return true
  }
  return false
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
