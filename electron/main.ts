import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
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
    title: 'Neurons — Offline Business OS',
    backgroundColor: '#ffffff',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#ffffff',
      symbolColor: '#171717',
      height: 38,
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Open external links in user's default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
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
  return await aiBridge.checkStatus()
})

ipcMain.handle('ai:download-model', async (event) => {
  return await aiBridge.downloadModel((progress) => {
    event.sender.send('ai:download-progress', progress)
  })
})

ipcMain.handle('app:info', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: app.getVersion(),
  }
})

ipcMain.handle('app:open-external', async (_, url: string) => {
  if (url && (url.startsWith('https:') || url.startsWith('http:'))) {
    await shell.openExternal(url)
    return true
  }
  return false
})

ipcMain.handle('app:export-data', async (_, jsonData: string) => {
  if (!win) return false
  const { filePath } = await dialog.showSaveDialog(win, {
    title: 'Export Business Data Backup',
    defaultPath: `neurons-backup-${new Date().toISOString().split('T')[0]}.json`,
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
