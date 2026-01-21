import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    scanProject: (path: string) => ipcRenderer.invoke('scan-project', path),
    startAttack: (targetId: string) => ipcRenderer.invoke('start-attack', targetId)
});
