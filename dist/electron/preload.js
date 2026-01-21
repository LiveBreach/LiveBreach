"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    scanProject: (path) => electron_1.ipcRenderer.invoke('scan-project', path),
    startAttack: (targetId) => electron_1.ipcRenderer.invoke('start-attack', targetId)
});
//# sourceMappingURL=preload.js.map