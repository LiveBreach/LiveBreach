interface ElectronAPI {
    scanProject: (path: string) => Promise<{ success: boolean; targets?: any[]; error?: string }>;
    startAttack: (targetId: string) => Promise<{ success: boolean; logs?: string[] }>;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
export { };
