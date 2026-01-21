'use client';

import { useState, useEffect, useRef } from 'react';

type ScanTarget = {
    id: string;
    file: string;
    type: string;
    vuln: string;
    severity: 'high' | 'medium' | 'low';
};

export default function Home() {
    const [projectPath, setProjectPath] = useState<string>('');
    const [isScanning, setIsScanning] = useState(false);
    const [targets, setTargets] = useState<ScanTarget[]>([]);
    const [attackLogs, setAttackLogs] = useState<string[]>([]);
    const [attackingId, setAttackingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'scan' | 'monitor'>('scan');

    const logsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [attackLogs]);

    const handleScan = async () => {
        if (!projectPath) {
            // Default to current directory if empty for demo
            // In electron main logic, we passed it through.
        }
        setIsScanning(true);
        setTargets([]);
        setAttackLogs([]);

        // Simulate delay for effect
        setTimeout(async () => {
            if (window.electronAPI) {
                try {
                    const result = await window.electronAPI.scanProject(projectPath || process.cwd());
                    if (result.success && result.targets) {
                        setTargets(result.targets.map((t: any) => ({ ...t, severity: 'high' })));
                        setAttackLogs(prev => [...prev, `[SYSTEM] Scan completed. ${result.targets?.length} targets found.`]);
                    }
                } catch (e) {
                    console.error(e);
                    setAttackLogs(prev => [...prev, `[ERROR] Scan failed.`]);
                }
            } else {
                // Browser Mock
                setAttackLogs(prev => [...prev, `[WARN] Running in browser mode. Using mock data.`]);
                setTargets([
                    { id: '1', file: 'app/actions.ts', type: 'Server Action', vuln: 'Mass Assignment (Potential)', severity: 'high' },
                    { id: '2', file: 'prisma/schema.prisma', type: 'Schema', vuln: 'Sensitive Data Exposure', severity: 'medium' }
                ]);
            }
            setIsScanning(false);
        }, 1500);
    };

    const handleAttack = async (target: ScanTarget) => {
        setAttackingId(target.id);
        setActiveTab('monitor');
        setAttackLogs(prev => [...prev, `[SYSTEM] Initiating attack simulation on ${target.file}...`]);

        if (window.electronAPI) {
            const result = await window.electronAPI.startAttack(target.id);
            if (result.success && result.logs) {
                result.logs.forEach((log: string, i: number) => {
                    setTimeout(() => {
                        setAttackLogs(prev => [...prev, log]);
                    }, i * 800);
                });
            }
        } else {
            // Mock sequence
            const steps = [
                `[INFO] Target: ${target.file}`,
                `[INFO] Analyzing parameter structure...`,
                `[ATTACK] Injecting payload into DOM...`,
                `[SUCCESS] Admin privilege escalated via Mass Assignment!`,
                `[CRITICAL] Data leakage confirmed.`
            ];
            steps.forEach((step, i) => {
                setTimeout(() => {
                    setAttackLogs(prev => [...prev, step]);
                    if (i === steps.length - 1) setAttackingId(null);
                }, i * 1000);
            });
        }
    };

    return (
        <div className="flex h-screen bg-neutral-950 text-white scanline overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 border-r border-neutral-800 bg-neutral-900/50 flex flex-col backdrop-blur-md">
                <div className="p-6 border-b border-neutral-800">
                    <h1 className="text-2xl font-bold tracking-tighter text-red-500">
                        LIVE<span className="text-white">BREACH</span>
                    </h1>
                    <p className="text-xs text-neutral-500 mt-1">v0.1.0-alpha</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('scan')}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all ${activeTab === 'scan' ? 'bg-neutral-800 text-red-500 border border-neutral-700' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
                    >
                        <span className="mr-2">◉</span> Target Scan
                    </button>
                    <button
                        onClick={() => setActiveTab('monitor')}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all ${activeTab === 'monitor' ? 'bg-neutral-800 text-blue-400 border border-neutral-700' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
                    >
                        <span className="mr-2">⚡</span> Attack Console
                    </button>
                </nav>

                <div className="p-4 border-t border-neutral-800">
                    <div className="text-xs text-neutral-600">Status: <span className="text-green-500">Connected</span></div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-900/10 via-neutral-950 to-neutral-950 -z-10"></div>

                {activeTab === 'scan' && (
                    <div className="p-8 max-w-5xl mx-auto w-full animate-in fade-in zoom-in duration-300">
                        <div className="mb-8">
                            <h2 className="text-3xl font-light mb-2">Target Acquisition</h2>
                            <p className="text-neutral-400">Select scanning directory to identify vulnerable endpoints.</p>
                        </div>

                        <div className="flex gap-4 mb-12">
                            <input
                                type="text"
                                value={projectPath}
                                onChange={(e) => setProjectPath(e.target.value)}
                                placeholder="Enter absolute project path (default: current)"
                                className="flex-1 bg-black/30 border border-neutral-700 rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 transition-colors text-sm font-mono"
                            />
                            <button
                                onClick={handleScan}
                                disabled={isScanning}
                                className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-lg font-medium transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {isScanning ? (
                                    <span className="flex items-center gap-2">Scanning <span className="animate-pulse">...</span></span>
                                ) : (
                                    <span className="group-hover:tracking-wider transition-all duration-300">INITIALIZE SCAN</span>
                                )}
                            </button>
                        </div>

                        {targets.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-4">Derived Targets ({targets.length})</h3>
                                <div className="grid gap-4">
                                    {targets.map((target) => (
                                        <div key={target.id} className="group bg-neutral-900/40 border border-neutral-800 hover:border-red-500/50 rounded-xl p-5 transition-all flex items-center justify-between">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-red-500/10 rounded-lg text-red-500 text-xl">⚠</div>
                                                <div>
                                                    <h4 className="font-mono text-lg text-white mb-1">{target.file}</h4>
                                                    <div className="flex gap-2">
                                                        <span className="text-xs px-2 py-1 bg-neutral-800 rounded text-neutral-300">{target.type}</span>
                                                        <span className="text-xs px-2 py-1 bg-red-900/30 text-red-400 rounded border border-red-900/50">{target.vuln}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleAttack(target)}
                                                className="px-4 py-2 bg-neutral-800 hover:bg-white hover:text-black text-neutral-300 rounded text-sm font-mono transition-colors"
                                            >
                                                &gt; EXPLOIT
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'monitor' && (
                    <div className="flex-1 flex flex-col bg-black/90 p-4 font-mono text-sm">
                        <div className="flex-1 overflow-y-auto space-y-1 p-4" id="console-output">
                            {attackLogs.map((log, idx) => (
                                <div key={idx} className={`${log.includes('[ERROR]') || log.includes('[FAIL]') ? 'text-red-500' :
                                    log.includes('[SUCCESS]') ? 'text-green-500 font-bold' :
                                        log.includes('[WARN]') ? 'text-yellow-500' :
                                            log.includes('[ATTACK]') ? 'text-purple-400' :
                                                'text-neutral-400'
                                    }`}>
                                    <span className="opacity-30 mr-2">
                                        {new Date().toLocaleTimeString()}
                                    </span>
                                    {log}
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                        {attackingId && (
                            <div className="p-2 border-t border-neutral-800 text-center text-xs animate-pulse text-red-500">
                                -- ATTACK SEQUENCE IN PROGRESS --
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
