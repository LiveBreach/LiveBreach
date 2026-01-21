import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('scan-project', async (event, projectPath) => {
    console.log('Scanning project request received for:', projectPath);
    // TODO: Implement actual scanning
    // specific scanner logic will be imported from lib/analysis/scanner
    return { 
      success: true, 
      targets: [
        { id: '1', file: 'app/actions.ts', type: 'Server Action', vuln: 'Mass Assignment (Possible)' },
        { id: '2', file: 'prisma/schema.prisma', type: 'Schema', vuln: 'Sensitive Field Exposure' }
      ] 
    };
});

ipcMain.handle('start-attack', async (event, targetId) => {
    console.log('Attack start request for:', targetId);
    // TODO: Implement actual attack
    return { 
      success: true, 
      logs: [
        `[INFO] Starting attack on target ${targetId}`,
        `[INFO] Injecting malicious payload...`,
        `[SUCCESS] Payload executed. Data leakage detected.`
      ] 
    };
});
