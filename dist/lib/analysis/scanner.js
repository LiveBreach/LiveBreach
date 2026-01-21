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
async function scanProject(projectRoot) {
    const results = [];
    const project = new ts_morph_1.Project();
    console.log(`Scanning directory: ${projectRoot}`);
    // 1. Check Prisma Schema
    const prismaPath = path_1.default.join(projectRoot, "prisma", "schema.prisma");
    if (fs_1.default.existsSync(prismaPath)) {
        const content = fs_1.default.readFileSync(prismaPath, "utf-8");
        if (content.includes("isAdmin") || content.includes("role")) {
            results.push({
                id: crypto_1.default.randomUUID(),
                file: "prisma/schema.prisma",
                type: "Schema",
                vuln: "Sensitive Field Exposure (role/isAdmin detected)"
            });
        }
    }
    // 2. Check Server Actions
    // We try to add files. Limit to src or app to avoid node_modules
    const searchPattern = path_1.default.join(projectRoot, "src", "**", "*.{ts,tsx}");
    const searchPatternRoot = path_1.default.join(projectRoot, "app", "**", "*.{ts,tsx}");
    try {
        project.addSourceFilesAtPaths([searchPattern, searchPatternRoot]);
    }
    catch (e) {
        console.warn("Could not add some source files:", e);
    }
    project.getSourceFiles().forEach(sourceFile => {
        const text = sourceFile.getText();
        if (text.includes("'use server'") || text.includes('"use server"')) {
            results.push({
                id: crypto_1.default.randomUUID(),
                file: path_1.default.relative(projectRoot, sourceFile.getFilePath()),
                type: "Server Action",
                vuln: "Potential Mass Assignment Endpoint"
            });
        }
    });
    // If no results found, add a dummy one for demonstration if searching the own project
    if (results.length === 0) {
        results.push({
            id: crypto_1.default.randomUUID(),
            file: "demo/actions.ts",
            type: "Demo",
            vuln: "No vulnerabilities found (Demo)"
        });
    }
    return results;
}
//# sourceMappingURL=scanner.js.map