import { app, BrowserWindow, ipcMain, safeStorage } from 'electron';
import { join } from 'node:path';
import fs from 'node:fs';
import path from 'node:path';
import { registerRhinoSecureStorage } from '@rhino-dev/rhino-react/electron';

// Persist the Rhino token/user/org encrypted at rest via the OS keychain
// (safeStorage), reachable from the renderer over IPC — NOT in renderer
// localStorage. This is the whole point of the desktop integration.
function setupSecureStorage() {
  registerRhinoSecureStorage({ ipcMain, safeStorage, app, fs, path });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1120,
    height: 780,
    minWidth: 880,
    minHeight: 600,
    show: false,
    title: 'Rhino Desktop — TaskFlow',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
    },
  });

  win.once('ready-to-show', () => win.show());

  // Dev: electron-vite serves the renderer with HMR. Prod: load the built file.
  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  setupSecureStorage();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
