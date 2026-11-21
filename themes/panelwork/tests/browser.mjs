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
            assert.equal(await page.locator('.pw-post-row').count(), target ? 6 : 12);
            assert.equal(await page.locator('.pw-stat').count(), 4);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            const panel = page.locator(target ? '#panelwork-mobile-nav' : '#panelwork-sidebar');
            if (width === 390) {
                const menu = page.getByRole('button', { name: 'Menu', exact: true });
                assert.equal(await panel.isVisible(), false);
                await menu.click();
                assert.equal(await menu.getAttribute('aria-expanded'), 'true');
                await page.getByRole('link', { name: 'Overview', exact: true }).focus();
                await page.keyboard.press('Escape');
                assert.equal(await panel.isVisible(), false);
                await menu.click();
            } else {
                const side = await page.locator('.pw-sidebar').boundingBox();
                const content = await page.locator('main').boundingBox();
                assert(side.x + side.width <= content.x);
                if (target) {
                    const toggle = page.getByRole('button', { name: 'Hide sidebar' });
                    await toggle.click();
                    assert.equal(await page.locator('.pw-sidebar').isVisible(), false);
                    const expanded = await page.locator('main').boundingBox();
                    assert(expanded.width > content.width);
                    await page.reload();
                    await page.getByRole('button', { name: 'Show sidebar' }).waitFor();
                    assert.equal(await page.locator('.pw-sidebar').isVisible(), false);
                    await page.setViewportSize({ width: 390, height: 900 });
                    assert(await page.getByRole('button', { name: 'Menu', exact: true }).isVisible());
                    await page.setViewportSize({ width, height: 900 });
                    await page.getByRole('button', { name: 'Show sidebar' }).click();
                    assert(await page.locator('.pw-sidebar').isVisible());
                    assert.equal(await page.getByRole('button', { name: 'Hide sidebar' }).getAttribute('aria-expanded'), 'true');
                }
            }
            await page.getByLabel('Appearance', { exact: true }).selectOption('dark');
            assert.equal(await page.locator('html').getAttribute('data-pw-mode'), 'dark');
            await page.reload();
            await page.getByRole('heading', { name: 'Publishing overview' }).waitFor();
            assert.equal(await page.locator('html').getAttribute('data-pw-mode'), 'dark');
            await page.getByLabel('Months shown').selectOption('3');
            assert.equal(await page.locator('.pw-bars li').count(), 3);
            const month = page.getByRole('button', { name: 'October 2026: 4 posts' });
            await month.click();
            assert.equal(await month.getAttribute('aria-pressed'), 'true');
            if (target) {
                await page.getByRole('link', { name: 'View entries', exact: true }).click();
                await page.getByRole('heading', { name: 'Post library', level: 1 }).waitFor();
                assert.equal(await page.locator('.pw-post-row').count(), 4);
                await page.goto(url);
            } else {
                assert(await page.getByText('October 2026: 4 posts', { exact: true }).isVisible());
            }
            await page.getByLabel('Filter by topic').selectOption('Community');
            assert.equal(await page.locator('.pw-post-row:visible').count(), 2);
            await page.getByLabel('Filter titles and topics').fill('nonexistent post');
            assert(await page.getByText('No posts match these filters.').isVisible());
            await page.getByRole('button', { name: 'Clear', exact: true }).click();
            await page.locator('.pw-list').getByRole('link', { name: 'Release notes for the November edition' }).click();
            await page.getByRole('heading', { name: 'Release notes for the November edition', exact: true }).waitFor();
            assert.deepEqual(errors, []);
            if (target) {
                await page.goto(url + '#calendar');
                await page.getByRole('heading', { name: 'Publishing calendar' }).waitFor();
                await page.getByRole('button', { name: 'Previous month' }).click();
                assert(await page.getByRole('heading', { name: 'October 2026', exact: true }).isVisible());
                await page.getByRole('link', { name: 'Oct 24, 2026: 1 entry' }).click();
                await page.getByRole('heading', { name: 'Post library', level: 1 }).waitFor();
                assert.equal(await page.locator('.pw-post-row').count(), 1);
                await page.goto(url + '#topics');
                await page.getByRole('link', { name: 'Browse Community' }).click();
                await page.getByRole('heading', { name: 'Post library', level: 1 }).waitFor();
                assert.equal(await page.locator('.pw-post-row').count(), 2);
                const [download] = await Promise.all([
                    page.waitForEvent('download'),
                    page.getByRole('button', { name: 'Export CSV' }).click()
                ]);
                assert.equal(download.suggestedFilename(), 'panelwork-posts.csv');
                await page.goto(url + '#library');
                await page.getByLabel('Sort posts').selectOption('oldest');
                assert.match(await page.locator('.pw-post-row').first().innerText(), /Welcome to the publishing desk/);
                await page.getByRole('button', { name: 'Next', exact: true }).click();
                assert(await page.getByText('Page 2 of 2', { exact: true }).isVisible());
                await page.goto(url + '#activity');
                await page.getByRole('heading', { name: 'Publication timeline' }).waitFor();
                assert.equal(await page.locator('.pw-timeline li').count(), 12);
                await page.goto(url + '#settings');
                await page.getByRole('radio', { name: 'Compact' }).check();
                await page.reload();
                await page.getByRole('heading', { name: 'Settings', exact: true }).waitFor();
                assert.equal(await page.locator('.pw-shell').getAttribute('data-pw-density'), 'compact');
            }
            assert.deepEqual(errors, []);
            await page.close();
            console.log(`${edition}, ${width}px: sidebar, colour mode, chart, filters and article passed`);
        }
    }
    if (process.env.PANELWORK_REACT_SCREENSHOT) {
        const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, colorScheme: 'light' });
        await page.goto(base + 'react/');
        await page.getByRole('heading', { name: 'Publishing overview' }).waitFor();
        await page.screenshot({ path: process.env.PANELWORK_REACT_SCREENSHOT });
        await page.close();
    }
    if (process.env.PANELWORK_SCREENSHOT) {
        const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, colorScheme: 'light' });
        await page.goto(base);
        await page.screenshot({ path: process.env.PANELWORK_SCREENSHOT });
    }
} finally {
    await browser.close();
}
