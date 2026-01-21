import { Project } from "ts-morph";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { analyzeCodeSnippet } from "./ai-engine";

export interface ScanResult {
    id: string;
    file: string;
    type: string;
    vuln: string;
    aiAnalysis?: string;
}

export async function scanProject(projectRoot: string): Promise<ScanResult[]> {
    const results: ScanResult[] = [];
    const project = new Project();

    console.log(`Scanning directory: ${projectRoot}`);

    // 1. Check Prisma Schema
    const prismaPath = path.join(projectRoot, "prisma", "schema.prisma");
    if (fs.existsSync(prismaPath)) {
        const content = fs.readFileSync(prismaPath, "utf-8");
        // Simple heuristic first
        if (content.includes("isAdmin") || content.includes("role")) {
            // AI Analysis
            const aiResult = await analyzeCodeSnippet(content, "Sensitive Field Exposure in Database Schema");

            if (aiResult.isVulnerable) {
                results.push({
                    id: crypto.randomUUID(),
                    file: "prisma/schema.prisma",
                    type: "Schema",
                    vuln: "Sensitive Field Exposure",
                    aiAnalysis: aiResult.reason
                });
            } else if (aiResult.reason.includes("Connection error")) {
                // Fallback if AI is down
                results.push({
                    id: crypto.randomUUID(),
                    file: "prisma/schema.prisma",
                    type: "Schema",
                    vuln: "Sensitive Field Exposure (Heuristic match, AI Offline)",
                    aiAnalysis: "AI Offline: Detected via keyword heuristic"
                });
            }
        }
    }

    // 2. Check Server Actions
    const searchPattern = path.join(projectRoot, "src", "**", "*.{ts,tsx}");
    const searchPatternRoot = path.join(projectRoot, "app", "**", "*.{ts,tsx}");

    try {
        project.addSourceFilesAtPaths([searchPattern, searchPatternRoot]);
    } catch (e) {
        console.warn("Could not add some source files:", e);
    }

    for (const sourceFile of project.getSourceFiles()) {
        const text = sourceFile.getText();
        if (text.includes("'use server'") || text.includes('"use server"')) {
            // Check for potential assignments
            if (text.includes("await prisma") || text.includes("update")) {
                const aiResult = await analyzeCodeSnippet(text.substring(0, 2000), "Mass Assignment in Server Action"); // Limit context size

                if (aiResult.isVulnerable) {
                    results.push({
                        id: crypto.randomUUID(),
                        file: path.relative(projectRoot, sourceFile.getFilePath()),
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
            id: crypto.randomUUID(),
            file: "demo/actions.ts",
            type: "Demo",
            vuln: "No confirmed vulnerabilities",
            aiAnalysis: "AI Analysis: Code appears secure or AI service unreachable."
        });
    }

    return results;
}
