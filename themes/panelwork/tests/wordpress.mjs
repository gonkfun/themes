import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.PANELWORK_WP_URL || 'http://127.0.0.1:9462/';
const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN });
try {
    for (const width of [390, 1440]) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        await page.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
        for (const path of ['', 'a-house-sparrow-learns-the-feeder/', 'category/birds/', '?s=sparrow', 'missing-panelwork-page/']) {
            const response = await page.goto(base + path, { waitUntil: 'domcontentloaded' });
            assert.equal(response.status(), path.startsWith('missing-') ? 404 : 200);
            assert.equal(await page.locator('h1').count(), 1, path);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, path);
            if (!path) {
                await page.locator('[data-pw-metrics]').waitFor();
                const rows = await page.locator('.pw-post-row').count();
                assert(rows > 0);
                assert.equal(await page.locator('[data-pw-count]').textContent(), String(rows));
                assert.equal(await page.locator('.pw-bars li').count(), 6);
                assert.notEqual(await page.locator('[data-pw-newest]').textContent(), '—');
                await page.getByLabel('Months shown').selectOption('3');
                assert.equal(await page.locator('.pw-bars li').count(), 3);
                await page.getByLabel('Filter titles and topics').fill('sparrow');
                assert.equal(await page.locator('.pw-post-row:visible').count(), 1);
                await page.getByLabel('Filter titles and topics').fill('missing title');
                assert(await page.getByText('No posts match these filters.').isVisible());
                if (width === 390) {
                    await page.getByRole('button', { name: 'Menu', exact: true }).click();
                    assert(await page.locator('#panelwork-sidebar').isVisible());
                    await page.keyboard.press('Escape');
                    assert.equal(await page.locator('#panelwork-sidebar').isVisible(), false);
                }
            } else if (path.includes('feeder')) {
                assert(await page.locator('.wp-block-post-content').isVisible());
                assert(await page.locator('.wp-block-comments').isVisible());
            } else if (!path.startsWith('missing-')) {
                assert(await page.locator('.pw-post-row').count() > 0);
            }
        }
        await page.close();
        console.log(`Panelwork WordPress at ${width}px: publish data, filtering, post, category, search and 404 passed`);
    }
} finally {
    await browser.close();
}
