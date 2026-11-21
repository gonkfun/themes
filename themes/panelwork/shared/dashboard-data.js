// Pure calculations shared by the native themes and the React starter.
export function summarize(posts) {
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

export function timeline(summary, count) {
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

export function formatDate(date, language) {
    if (!date || !/^\d{4}-\d{2}-\d{2}/.test(date)) return '—';
    const day = new Date(date.slice(0, 10) + 'T00:00:00Z');
    if (!Number.isFinite(day.getTime())) return '—';
    return new Intl.DateTimeFormat(language || undefined, {
        dateStyle: 'medium', timeZone: 'UTC'
    }).format(day);
}

export function matches(post, query, topic) {
    const text = [post.title, ...post.topics].join(' ').toLowerCase();
    return text.includes(query.trim().toLowerCase()) && (!topic || post.topics.includes(topic));
}

export function comparePosts(left, right, order) {
    if (order === 'title') return left.title.localeCompare(right.title);
    if (!left.date || !right.date) return Number(!left.date) - Number(!right.date);
    return order === 'oldest' ? left.date.localeCompare(right.date) : right.date.localeCompare(left.date);
}

export function latestPosts(posts, limit = 5) {
    return posts.filter(post => post.date).sort((a, b) => comparePosts(a, b, 'newest')).slice(0, limit);
}

export function topicSegments(topics) {
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
