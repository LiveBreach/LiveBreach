"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanProject = scanProject;
const ts_morph_1 = require("ts-morph");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const ai_engine_1 = require("./ai-engine");
async function scanProject(projectRoot) {
    const results = [];
    const project = new ts_morph_1.Project();
    console.log(`Scanning directory: ${projectRoot}`);
    // 1. Check Prisma Schema
    const prismaPath = path_1.default.join(projectRoot, "prisma", "schema.prisma");
    if (fs_1.default.existsSync(prismaPath)) {
        const content = fs_1.default.readFileSync(prismaPath, "utf-8");
        // Simple heuristic first
        if (content.includes("isAdmin") || content.includes("role")) {
            // AI Analysis
            const aiResult = await (0, ai_engine_1.analyzeCodeSnippet)(content, "Sensitive Field Exposure in Database Schema");
            if (aiResult.isVulnerable) {
                results.push({
                    id: crypto_1.default.randomUUID(),
                    file: "prisma/schema.prisma",
                    type: "Schema",
                    vuln: "Sensitive Field Exposure",
                    aiAnalysis: aiResult.reason
                });
            }
            else if (aiResult.reason.includes("Connection error")) {
                // Fallback if AI is down
                results.push({
                    id: crypto_1.default.randomUUID(),
                    file: "prisma/schema.prisma",
                    type: "Schema",
                    vuln: "Sensitive Field Exposure (Heuristic match, AI Offline)",
                    aiAnalysis: "AI Offline: Detected via keyword heuristic"
                });
            }
        }
    }
    // 2. Check Server Actions
    const searchPattern = path_1.default.join(projectRoot, "src", "**", "*.{ts,tsx}");
    const searchPatternRoot = path_1.default.join(projectRoot, "app", "**", "*.{ts,tsx}");
    try {
        project.addSourceFilesAtPaths([searchPattern, searchPatternRoot]);
    }
    catch (e) {
        console.warn("Could not add some source files:", e);
    }
    for (const sourceFile of project.getSourceFiles()) {
        const text = sourceFile.getText();
        if (text.includes("'use server'") || text.includes('"use server"')) {
            // Check for potential assignments
            if (text.includes("await prisma") || text.includes("update")) {
                const aiResult = await (0, ai_engine_1.analyzeCodeSnippet)(text.substring(0, 2000), "Mass Assignment in Server Action"); // Limit context size
                if (aiResult.isVulnerable) {
                    results.push({
                        id: crypto_1.default.randomUUID(),
                        file: path_1.default.relative(projectRoot, sourceFile.getFilePath()),
                        type: "Server Action",
                        vuln: "Mass Assignment Vulnerability",
                        aiAnalysis: aiResult.reason
                    });
                }
            }
        }
    }
    // If no results found and searching self (demo mode logic for empty results)
    if (results.length === 0) {
        results.push({
            id: crypto_1.default.randomUUID(),
            file: "demo/actions.ts",
            type: "Demo",
            vuln: "No confirmed vulnerabilities",
            aiAnalysis: "AI Analysis: Code appears secure or AI service unreachable."
        });
    }
    return results;
}
//# sourceMappingURL=scanner.js.map