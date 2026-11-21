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
    if (!date || !/^\d{4}-\d{2}-\d{2}/.test(date)) return '—';
    const day = new Date(date.slice(0, 10) + 'T00:00:00Z');
    if (!Number.isFinite(day.getTime())) return '—';
    return new Intl.DateTimeFormat(language || undefined, {
        dateStyle: 'medium', timeZone: 'UTC'
    }).format(day);
}

function matches(post, query, topic) {
    const text = [post.title, ...post.topics].join(' ').toLowerCase();
    return text.includes(query.trim().toLowerCase()) && (!topic || post.topics.includes(topic));
}

function comparePosts(left, right, order) {
    if (order === 'title') return left.title.localeCompare(right.title);
    if (!left.date || !right.date) return Number(!left.date) - Number(!right.date);
    return order === 'oldest' ? left.date.localeCompare(right.date) : right.date.localeCompare(left.date);
}

function latestPosts(posts, limit = 5) {
    return posts.filter(post => post.date).sort((a, b) => comparePosts(a, b, 'newest')).slice(0, limit);
}

function topicSegments(topics) {
    const total = topics.reduce((sum, [, count]) => sum + count, 0);
    const colors = ['var(--pw-accent)', 'var(--pw-teal)', 'var(--pw-coral)', '#7889c8', '#a98bce', '#98a5bc'];
    let position = 0;
    const shown = topics.slice(0, 5);
    if (topics.length > 5) shown.push(['Other topics', total - shown.reduce((sum, [, count]) => sum + count, 0)]);
    return shown.map(([topic, count], index) => {
        const start = position;
        position += 100 * count / total;
        return { topic, count, color: colors[index], start, end: position };
    });
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
        const list = document.querySelector('[data-pw-list]');
        if (!list) return;
        const posts = [...list.querySelectorAll('.pw-post-row')].map(row => ({
            element: row.closest('li.wp-block-post') || row.closest('li') || row,
            title: row.querySelector('h2, h3')?.textContent.trim() || '',
            href: row.querySelector('h2 a, h3 a')?.href || '',
            date: row.querySelector('time')?.getAttribute('datetime') || '',
            topics: [...row.querySelectorAll('.pw-post-topics a, .pw-post-topics span')].map(link => link.textContent.trim()).filter(Boolean)
        }));
        const metrics = document.querySelector('[data-pw-metrics]');
        if (metrics) renderMetrics(metrics, summarize(posts));
        renderActivity(posts);
        if (!posts.length) return;
        const filter = list.querySelector('[data-pw-filter]');
        filter.hidden = false;
        const query = filter.querySelector('input');
        const topic = filter.querySelector('#pw-topic');
        const sort = filter.querySelector('#pw-sort');
        const container = posts[0].element.parentElement;
        const message = list.querySelector('[data-pw-results]');
        const empty = list.querySelector('[data-pw-empty]');
        for (const [name] of summarize(posts).topics) topic.add(new Option(name, name));
        function update() {
            let visible = 0;
            const ordered = sort.value === 'default' ? posts : [...posts].sort((a, b) => comparePosts(a, b, sort.value));
            for (const post of ordered) {
                container.append(post.element);
                const show = matches(post, query.value, topic.value);
                post.element.hidden = !show;
                if (show) visible++;
            }
            empty.hidden = visible !== 0;
            message.textContent = visible === posts.length ? `${visible} posts on this page` : `${visible} of ${posts.length} posts on this page`;
        }
        query.addEventListener('input', update);
        topic.addEventListener('change', update);
        sort.addEventListener('change', update);
        filter.querySelector('button').addEventListener('click', () => {
            query.value = '';
            topic.value = '';
            sort.value = 'default';
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
        metrics.querySelector('[data-pw-active-months]').textContent = summary.byMonth.size;
        const detail = metrics.querySelector('[data-pw-month-detail]');
        const range = metrics.querySelector('[data-pw-range]');
        const bars = metrics.querySelector('.pw-bars');
        const noDates = metrics.querySelector('[data-pw-no-dates]');
        const label = new Intl.DateTimeFormat(language, { month: 'short', timeZone: 'UTC' });
        const full = new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric', timeZone: 'UTC' });

        function draw() {
            const months = timeline(summary, Number(range.value));
            bars.replaceChildren();
            detail.textContent = months.length ? "Select a month to see its total." : "";
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
                const button = document.createElement('button');
                button.type = 'button';
                const description = `${full.format(month.date)}: ${month.count} ${month.count === 1 ? 'post' : 'posts'}`;
                button.setAttribute('aria-label', description);
                button.setAttribute('aria-pressed', 'false');
                button.addEventListener('click', () => {
                    bars.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', 'false'));
                    button.setAttribute('aria-pressed', 'true');
                    detail.textContent = description;
                });
                button.append(count, column, name);
                item.append(button);
                bars.append(item);
            }
        }
        draw();
        range.addEventListener('change', draw);
        const topics = metrics.querySelector('.pw-topics');
        const segments = topicSegments(summary.topics);
        const donut = metrics.querySelector('.pw-donut');
        donut.hidden = !segments.length;
        if (segments.length) {
            donut.style.setProperty('--pw-segments', segments.map(seg => `${seg.color} ${seg.start}% ${seg.end}%`).join(', '));
            donut.querySelector('strong').textContent = summary.topics.length;
        }
        metrics.querySelector('[data-pw-no-topics]').hidden = !!segments.length;
        for (const {topic: name, count, color} of segments) {
            const item = document.createElement('li');
            const heading = document.createElement('span');
            const title = document.createElement('span');
            const number = document.createElement('strong');
            heading.className = 'pw-topic-label';
            title.className = 'pw-topic-legend';
            title.style.setProperty('--topic-color', color);
            title.textContent = name;
            number.textContent = count;
            heading.append(title, number);
            item.append(heading);
            topics.append(item);
        }
    }

    function renderActivity(posts) {
        const section = document.querySelector('[data-pw-activity]');
        const dated = latestPosts(posts, 3);
        if (!section || !dated.length) return;
        const list = section.querySelector('ol');
        for (const post of dated) {
            const item = document.createElement('li');
            const content = document.createElement('div');
            const linkable = /^https?:\/\//.test(post.href);
            const title = document.createElement(linkable ? 'a' : 'strong');
            if (linkable) title.href = post.href;
            title.textContent = post.title;
            const time = document.createElement('time');
            time.dateTime = post.date;
            time.textContent = formatDate(post.date, language);
            content.append(title, time);
            item.append(content);
            list.append(item);
        }
        section.hidden = false;
    }

    function ready() {
        navigation();
        dashboard();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
    else ready();
})();

})();
