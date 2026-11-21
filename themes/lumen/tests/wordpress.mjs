import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.LUMEN_WP_URL || 'http://127.0.0.1:9460/';
const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN });
try {
    for (const width of [390, 1440]) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: 'dark' });
        await page.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const paths = ['', 'a-house-sparrow-learns-the-feeder/', 'category/birds/', '?s=sparrow', 'no-such-lumen-page/'];
        for (const path of paths) {
            const response = await page.goto(base + path, { waitUntil: 'domcontentloaded' });
            assert.equal(response.status(), path.startsWith('no-such') ? 404 : 200);
            assert.equal(await page.locator('h1').count(), 1, path);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, path);
            const mode = page.getByLabel('Appearance', { exact: true });
            assert.equal(await mode.inputValue(), 'system');
            assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(32, 26, 23)');
            assert(await page.locator('.lm-footer a[rel=nofollow]').isVisible());
            if (!path) {
                assert(await page.locator('.lm-feature-label:visible').count() === 1);
                assert(await page.locator('.wp-block-post-title').count() >= 2);
                const panel = page.locator('#lumen-navigation');
                const menu = page.getByRole('button', { name: 'Menu', exact: true });
                if (width === 390) {
                    assert.equal(await panel.isVisible(), false);
                    await menu.click();
                    assert(await panel.isVisible());
                    await page.keyboard.press('Escape');
                    assert.equal(await panel.isVisible(), false);
                    await menu.click();
                } else {
                    const sidebar = await page.locator('.lm-sidebar').boundingBox();
                    const content = await page.locator('main').boundingBox();
                    assert(sidebar.x + sidebar.width <= content.x);
                    assert(await panel.isVisible());
                }
                await mode.selectOption('light');
                await page.reload({ waitUntil: 'domcontentloaded' });
                if (width === 390) await menu.click();
                assert.equal(await mode.inputValue(), 'light');
                assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(250, 246, 239)');
                await mode.selectOption('system');
            }
            if (path === 'a-house-sparrow-learns-the-feeder/') {
                assert(await page.locator('.lm-prose').isVisible());
                assert(await page.locator('.lm-comments').isVisible());
            }
            if (path === 'category/birds/' || path === '?s=sparrow') {
                assert(await page.locator('.wp-block-post-title').count() > 0);
            }
        }
        assert.deepEqual(errors, []);
        await page.close();
        console.log(`Lumen WordPress at ${width}px: homepage, article, comments, category, search and 404 pass`);
    }
} finally {
    await browser.close();
}
