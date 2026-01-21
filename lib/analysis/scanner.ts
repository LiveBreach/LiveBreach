import { Project } from "ts-morph";
import path from "path";
import fs from "fs";
import crypto from "crypto";

export interface ScanResult {
    id: string;
    file: string;
    type: string;
    vuln: string;
}

export async function scanProject(projectRoot: string): Promise<ScanResult[]> {
    const results: ScanResult[] = [];
    const project = new Project();

    console.log(`Scanning directory: ${projectRoot}`);

    // 1. Check Prisma Schema
    const prismaPath = path.join(projectRoot, "prisma", "schema.prisma");
    if (fs.existsSync(prismaPath)) {
        const content = fs.readFileSync(prismaPath, "utf-8");
        if (content.includes("isAdmin") || content.includes("role")) {
            results.push({
                id: crypto.randomUUID(),
                file: "prisma/schema.prisma",
                type: "Schema",
                vuln: "Sensitive Field Exposure (role/isAdmin detected)"
            });
        }
    }

    // 2. Check Server Actions
    // We try to add files. Limit to src or app to avoid node_modules
    const searchPattern = path.join(projectRoot, "src", "**", "*.{ts,tsx}");
    const searchPatternRoot = path.join(projectRoot, "app", "**", "*.{ts,tsx}");

    try {
        project.addSourceFilesAtPaths([searchPattern, searchPatternRoot]);
    } catch (e) {
        console.warn("Could not add some source files:", e);
    }

    project.getSourceFiles().forEach(sourceFile => {
        const text = sourceFile.getText();
        if (text.includes("'use server'") || text.includes('"use server"')) {
            results.push({
                id: crypto.randomUUID(),
                file: path.relative(projectRoot, sourceFile.getFilePath()),
                type: "Server Action",
                vuln: "Potential Mass Assignment Endpoint"
            });
        }
    });

    // If no results found, add a dummy one for demonstration if searching the own project
    if (results.length === 0) {
        results.push({
            id: crypto.randomUUID(),
            file: "demo/actions.ts",
            type: "Demo",
            vuln: "No vulnerabilities found (Demo)"
        });
    }

    return results;
}
