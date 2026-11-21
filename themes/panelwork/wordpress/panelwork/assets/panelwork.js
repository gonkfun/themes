(() => {
'use strict';
// Pure calculations shared by the native themes and the React starter.
function summarize(posts) {
    const topics = new Map();
    const byMonth = new Map();
    let newest = '';
    for (const post of posts) {
        for (const topic of new Set(post.topics)) {
            topics.set(topic, (topics.get(topic) || 0) + 1);
        }
        const date = post.date?.match(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])/)?.[0];
        if (!date) continue;
        if (date > newest) newest = date;
        const month = date.slice(0, 7);
        byMonth.set(month, (byMonth.get(month) || 0) + 1);
    }
    return {
        newest,
        count: posts.length,
        topics: [...topics].sort(([a, left], [b, right]) => right - left || a.localeCompare(b)),
        byMonth
    };
}

function timeline(summary, count) {
    if (!summary.newest) return [];
    const [year, month] = summary.newest.split('-').map(Number);
    const months = [];
    for (let offset = count - 1; offset >= 0; offset--) {
        const date = new Date(Date.UTC(year, month - 1 - offset, 1));
        const key = date.toISOString().slice(0, 7);
        months.push({ key, date, count: summary.byMonth.get(key) || 0 });
    }
    return months;
}

function formatDate(date, language) {
    if (!date) return '—';
    return new Intl.DateTimeFormat(language || undefined, {
        dateStyle: 'medium', timeZone: 'UTC'
    }).format(new Date(date.slice(0, 10) + 'T00:00:00Z'));
}

function matches(post, query, topic) {
    const text = [post.title, ...post.topics].join(' ').toLowerCase();
    return text.includes(query.trim().toLowerCase()) && (!topic || post.topics.includes(topic));
}
(() => {
    const root = document.documentElement;
    const language = root.lang || undefined;
    const modeKey = 'gonk-panelwork-mode';
    const modes = ['system', 'light', 'dark'];
    let current = 'system';
    try {
        const saved = localStorage.getItem(modeKey);
        if (modes.includes(saved)) current = saved;
    } catch {
        // The appearance still works for the current page.
    }

    function applyMode(mode) {
        if (mode === 'system') root.removeAttribute('data-pw-mode');
        else root.setAttribute('data-pw-mode', mode);
    }
    applyMode(current);

    function navigation() {
        document.querySelectorAll('[data-pw-mode-select]').forEach(control => {
            control.closest('.pw-mode').hidden = false;
            control.value = current;
            control.addEventListener('change', () => {
                current = control.value;
                applyMode(current);
                try { localStorage.setItem(modeKey, current); } catch { /* Current page only. */ }
            });
        });
        const button = document.querySelector('[data-pw-menu]');
        if (!button) return;
        const sidebar = button.closest('.pw-sidebar');
        const panel = document.getElementById(button.getAttribute('aria-controls'));
        if (!sidebar?.contains(panel)) return;
        sidebar.setAttribute('data-pw-collapsible', '');
        button.hidden = false;
        const setOpen = open => {
            button.setAttribute('aria-expanded', String(open));
            sidebar.toggleAttribute('data-pw-open', open);
        };
        button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
        sidebar.addEventListener('keydown', event => {
            if (event.key === 'Escape' && sidebar.hasAttribute('data-pw-open')) {
                setOpen(false);
                button.focus();
            }
        });
    }

    function dashboard() {
        const list = document.querySelector('[data-pw-list], #post-library');
        if (!list) return;
        const posts = [...list.querySelectorAll('.pw-post-row')].map(row => ({
            element: row.closest('li.wp-block-post') || row.closest('li') || row,
            title: row.querySelector('h2, h3')?.textContent.trim() || '',
            date: row.querySelector('time')?.getAttribute('datetime') || '',
            topics: [...row.querySelectorAll('.pw-post-topics a, .pw-post-topics span')].map(link => link.textContent.trim()).filter(Boolean)
        }));
        const metrics = document.querySelector('[data-pw-metrics]');
        if (metrics) renderMetrics(metrics, summarize(posts));
        if (!posts.length) return;
        const filter = list.querySelector('[data-pw-filter]');
        filter.hidden = false;
        const query = filter.querySelector('input');
        const topic = filter.querySelector('select');
        const message = list.querySelector('[data-pw-results]');
        const empty = list.querySelector('[data-pw-empty]');
        for (const [name] of summarize(posts).topics) topic.add(new Option(name, name));
        function update() {
            let visible = 0;
            for (const post of posts) {
                const show = matches(post, query.value, topic.value);
                post.element.hidden = !show;
                if (show) visible++;
            }
            empty.hidden = visible !== 0;
            message.textContent = visible === posts.length ? `${visible} posts on this page` : `${visible} of ${posts.length} posts on this page`;
        }
        query.addEventListener('input', update);
        topic.addEventListener('change', update);
        filter.querySelector('button').addEventListener('click', () => {
            query.value = '';
            topic.value = '';
            update();
            query.focus();
        });
        update();
    }

    function fill(className, value) {
        const bar = document.createElement('span');
        bar.className = className;
        bar.style.setProperty('--value', `${value}%`);
        bar.setAttribute('aria-hidden', 'true');
        return bar;
    }

    function renderMetrics(metrics, summary) {
        metrics.hidden = false;
        metrics.querySelector('[data-pw-count]').textContent = summary.count;
        metrics.querySelector('[data-pw-topic-count]').textContent = summary.topics.length;
        metrics.querySelector('[data-pw-newest]').textContent = formatDate(summary.newest, language);
        const range = metrics.querySelector('[data-pw-range]');
        const bars = metrics.querySelector('.pw-bars');
        const noDates = metrics.querySelector('[data-pw-no-dates]');
        const label = new Intl.DateTimeFormat(language, { month: 'short', timeZone: 'UTC' });
        const full = new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric', timeZone: 'UTC' });

        function draw() {
            const months = timeline(summary, Number(range.value));
            bars.replaceChildren();
            noDates.hidden = months.length > 0;
            range.disabled = months.length === 0;
            const maximum = Math.max(1, ...months.map(month => month.count));
            for (const month of months) {
                const item = document.createElement('li');
                const count = document.createElement('strong');
                const column = document.createElement('span');
                const name = document.createElement('span');
                count.textContent = month.count;
                column.className = 'pw-bar-area';
                column.append(fill('pw-bar', 100 * month.count / maximum));
                name.textContent = label.format(month.date);
                item.setAttribute('aria-label', `${full.format(month.date)}: ${month.count} posts`);
                item.append(count, column, name);
                bars.append(item);
            }
        }
        draw();
        range.addEventListener('change', draw);
        const topics = metrics.querySelector('.pw-topics');
        const maximum = summary.topics[0]?.[1] || 1;
        metrics.querySelector('[data-pw-no-topics]').hidden = !!summary.topics.length;
        for (const [name, count] of summary.topics.slice(0, 5)) {
            const item = document.createElement('li');
            const heading = document.createElement('span');
            const title = document.createElement('span');
            const number = document.createElement('strong');
            const track = document.createElement('div');
            heading.className = 'pw-topic-label';
            title.textContent = name;
            number.textContent = count;
            heading.append(title, number);
            track.className = 'pw-topic-track';
            track.append(fill('pw-topic-fill', 100 * count / maximum));
            item.append(heading, track);
            topics.append(item);
        }
    }

    function ready() {
        navigation();
        dashboard();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
    else ready();
})();

})();
