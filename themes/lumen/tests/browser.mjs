import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.LUMEN_PREVIEW_URL || 'http://127.0.0.1:9457/';
const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN });
try {
    for (const width of [390, 1440]) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: 'dark' });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        for (const path of ['', 'archive.html', 'topic-essays.html', 'attention.html']) {
            const response = await page.goto(base + path);
            assert.equal(response.status(), 200);
            assert.equal(await page.locator('h1').count(), 1);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, path);
        }
        const select = page.getByLabel('Appearance', { exact: true });
        assert.equal(await select.inputValue(), 'system');
        assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), 'dark');
        await select.selectOption('light');
        await page.reload();
        assert.equal(await select.inputValue(), 'light');
        assert.equal(await page.locator('html').getAttribute('data-lumen-mode'), 'light');
        await select.selectOption('dark');
        await page.emulateMedia({ colorScheme: 'light' });
        assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), 'dark');
        await select.selectOption('system');
        assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), 'light');
        await page.goto(base + 'archive.html');
        await page.getByRole('link', { name: 'Reading notes', exact: true }).click();
        assert.equal(await page.locator('.lm-card').count(), 1);
        assert.deepEqual(errors, []);
        await page.close();
        console.log(`Lumen preview at ${width}px: links, reading layout and all appearance modes pass`);
    }
    if (process.env.LUMEN_SCREENSHOT) {
        const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, colorScheme: 'light' });
        await page.goto(base);
        await page.screenshot({ path: process.env.LUMEN_SCREENSHOT });
        await page.close();
    }
} finally {
    await browser.close();
}
