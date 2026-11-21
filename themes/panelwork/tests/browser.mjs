import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.PANELWORK_URL || 'http://127.0.0.1:9461/';
const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN });
try {
    for (const [edition, target] of [['native preview', ''], ['React preview', 'react/']]) {
        for (const width of [390, 1440]) {
            const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: 'light' });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            const url = base + target;
            assert.equal((await page.goto(url)).status(), 200);
            await page.getByRole('heading', { name: 'Publishing overview' }).waitFor();
            assert.equal(await page.locator('.pw-bars li').count(), 6);
            assert.equal(await page.locator('.pw-post-row').count(), 12);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            if (width === 390) {
                const menu = page.getByRole('button', { name: 'Menu', exact: true });
                assert.equal(await page.locator('#panelwork-sidebar').isVisible(), false);
                await menu.click();
                assert.equal(await menu.getAttribute('aria-expanded'), 'true');
                await page.getByRole('link', { name: 'Overview', exact: true }).focus();
                await page.keyboard.press('Escape');
                assert.equal(await page.locator('#panelwork-sidebar').isVisible(), false);
                await menu.click();
            } else {
                const side = await page.locator('.pw-sidebar').boundingBox();
                const content = await page.locator('main').boundingBox();
                assert(side.x + side.width <= content.x);
            }
            await page.getByLabel('Appearance', { exact: true }).selectOption('dark');
            assert.equal(await page.locator('html').getAttribute('data-pw-mode'), 'dark');
            await page.reload();
            await page.getByRole('heading', { name: 'Publishing overview' }).waitFor();
            assert.equal(await page.locator('html').getAttribute('data-pw-mode'), 'dark');
            await page.getByLabel('Months shown').selectOption('3');
            assert.equal(await page.locator('.pw-bars li').count(), 3);
            await page.getByLabel('Filter by topic').selectOption('Community');
            assert.equal(await page.locator('.pw-post-row:visible').count(), 2);
            await page.getByLabel('Filter titles and topics').fill('nonexistent post');
            assert(await page.getByText('No posts match these filters.').isVisible());
            await page.getByRole('button', { name: 'Clear', exact: true }).click();
            await page.getByRole('link', { name: 'Release notes for the November edition' }).click();
            await page.getByRole('heading', { name: 'Release notes for the November edition', exact: true }).waitFor();
            assert.deepEqual(errors, []);
            await page.close();
            console.log(`${edition}, ${width}px: sidebar, colour mode, chart, filters and article passed`);
        }
    }
    if (process.env.PANELWORK_SCREENSHOT) {
        const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, colorScheme: 'light' });
        await page.goto(base);
        await page.screenshot({ path: process.env.PANELWORK_SCREENSHOT });
    }
} finally {
    await browser.close();
}
