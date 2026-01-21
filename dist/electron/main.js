"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
let mainWindow;
const createWindow = () => {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
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
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on('activate', () => {
        if (mainWindow === null) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// IPC handlers
const scanner_1 = require("../lib/analysis/scanner");
const puppeteer_engine_1 = require("../lib/attack/puppeteer-engine");
electron_1.ipcMain.handle('scan-project', async (event, projectPath) => {
    console.log('Scanning project request received for:', projectPath);
    try {
        const results = await (0, scanner_1.scanProject)(projectPath);
        return { success: true, targets: results };
    }
    catch (error) {
        console.error("Scan failed:", error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('start-attack', async (event, targetId) => {
    console.log('Attack start request for:', targetId);
    // In a real app we would map targetId to specific attack details.
    // Here we simulate Mass Assignment
    const payload = {
        type: 'mass-assignment',
        field: 'isAdmin',
        value: 'true'
    };
    // Target URL should be passed or determined. Defaulting to localhost:3000 for demo
    const targetUrl = 'http://localhost:3000';
    try {
        const result = await (0, puppeteer_engine_1.executeAttack)(targetUrl, payload);
        return result;
    }
    catch (error) {
        return { success: false, logs: [error.message] };
    }
});
//# sourceMappingURL=main.js.map