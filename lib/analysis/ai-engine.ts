
export interface AIAnalysisResult {
    isVulnerable: boolean;
    reason: string;
    suggestedFix?: string;
}

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const MODEL_NAME = 'WhiteRabbitNeo/Llama-3.1-WhiteRabbitNeo-2-8B';

export async function analyzeCodeSnippet(code: string, context: string): Promise<AIAnalysisResult> {
    const prompt = `
You are a cybersecurity expert. Analyze the following code snippet for potential security vulnerabilities, specifically focusing on ${context}.
Code Snippet:
\`\`\`
${code}
\`\`\`

Instructions:
1. Determine if there is a vulnerability.
2. If scanning for Mass Assignment (Server Action), check if 'isAdmin', 'role', or similar sensitive fields can be updated without validation.
3. If scanning Prisma Schema, check for sensitive fields exposed in potential update operations.

Respond in JSON format only:
{
    "isVulnerable": boolean,
    "reason": "Short explanation of the vulnerability",
    "suggestedFix": "Brief suggestion on how to fix it"
}
`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await fetch(OLLAMA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                prompt: prompt,
                stream: false,
                format: "json"
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error(`Ollama API error: ${response.statusText}`);
            return { isVulnerable: false, reason: "AI Analysis failed (API error)" };
        }

        const data = await response.json();
        try {
            const result = JSON.parse(data.response);
            return {
                isVulnerable: result.isVulnerable,
                reason: result.reason,
                suggestedFix: result.suggestedFix
            };
        } catch (e) {
            console.error("Failed to parse AI response:", data.response);
            return { isVulnerable: false, reason: "AI Analysis failed (Parse error)" };
        }

    } catch (error: any) {
        console.error("AI Engine connection error:", error);
        return { isVulnerable: false, reason: `AI Analysis failed (Connection error: ${error.message})` };
    }
}
