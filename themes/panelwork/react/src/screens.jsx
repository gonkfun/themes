import React, { useState } from 'react';
import { comparePosts, formatDate, latestPosts, matches, timeline, topicSegments } from './dashboard-data.js';

const lang = document.documentElement.lang || 'en';
const monthShort = new Intl.DateTimeFormat(lang, { month: 'short', timeZone: 'UTC' });
const monthFull = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' });

const entryUrl = post => `#post/${encodeURIComponent(post.id)}`;
const libraryUrl = (key, value) => `#library?${new URLSearchParams({ [key]: value })}`;

export function ScreenTitle({ title, description, children }) {
    return <section className="pw-summary pw-overview-head">
        <div><h1>{title}</h1>{description && <p>{description}</p>}</div>
        {children}
    </section>;
}

export function StatCards({ summary }) {
    const metrics = [
        ['Published entries', summary.count, 'All records in the loaded dataset'],
        ['Topics represented', summary.topics.length, 'Distinct labels across entries'],
        ['Latest publication', formatDate(summary.newest, lang), 'Most recent publication date'],
        ['Active months', summary.byMonth.size, 'Months with at least one entry']
    ];
    return <dl className="pw-stats">
        {metrics.map(([label, value, note]) => <div key={label} className="pw-card pw-stat">
            <dt><span aria-hidden="true" className="pw-stat-mark"></span>{label}</dt>
            <dd>{value}</dd><dd className="pw-stat-note">{note}</dd>
        </div>)}
    </dl>;
}

export function Charts({ summary }) {
    const [range, setRange] = useState(6);
    const [selected, setSelected] = useState('');
    const months = timeline(summary, range);
    const maximum = Math.max(1, ...months.map(month => month.count));
    const current = months.find(month => month.key === selected);
    const segments = topicSegments(summary.topics);
    return <div className="pw-charts">
        <section className="pw-card pw-chart">
            <div className="pw-card-heading">
                <div><h2>Publishing activity</h2><p>Entries by month, ending at the most recent publication.</p></div>
                <label><span className="pw-sr">Months shown</span>
                    <select className="pw-select" value={range} disabled={!months.length} onChange={event => { setRange(Number(event.target.value)); setSelected(''); }}>
                        <option value={6}>6 months</option><option value={3}>3 months</option><option value={12}>12 months</option>
                    </select>
                </label>
            </div>
            {months.length ? <>
                <ul className="pw-bars" aria-label="Posts by month">
                    {months.map(month => {
                        const description = `${monthFull.format(month.date)}: ${month.count} ${month.count === 1 ? 'post' : 'posts'}`;
                        return <li key={month.key}>
                            <button type="button" aria-label={description} aria-pressed={selected === month.key} onClick={() => setSelected(month.key)}>
                                <strong>{month.count}</strong>
                                <span className="pw-bar-area" aria-hidden="true"><span className="pw-bar" style={{ '--value': `${100 * month.count / maximum}%` }} /></span>
                                <span>{range > 6 ? monthShort.format(month.date).slice(0, 1) : monthShort.format(month.date)}</span>
                            </button>
                        </li>;
                    })}
                </ul>
                <p className="pw-chart-footer" aria-live="polite">
                    {current ? <><strong>{monthFull.format(current.date)}</strong> · {current.count} {current.count === 1 ? 'entry' : 'entries'} {current.count > 0 && <a href={libraryUrl('month', current.key)}>View entries</a>}</> : 'Select a month to see its entries.'}
                </p>
            </> : <p>No dated posts in this dataset.</p>}
        </section>
        <section className="pw-card pw-chart">
            <div className="pw-card-heading"><div><h2>Topic mix</h2><p>Counts of topic labels across all entries.</p></div></div>
            {segments.length ? <>
                <div className="pw-donut" aria-hidden="true" style={{ '--pw-segments': segments.map(seg => `${seg.color} ${seg.start}% ${seg.end}%`).join(', ') }}>
                    <strong>{summary.topics.length}</strong>
                </div>
                <ul className="pw-topics" aria-label="Posts by topic">
                    {segments.map(({ topic, count, color }) => <li key={topic} className="pw-topic-label">
                        <span className="pw-topic-legend" style={{ '--topic-color': color }}>{topic}</span><strong>{count}</strong>
                    </li>)}
                </ul>
            </> : <p>No topics in this dataset.</p>}
        </section>
    </div>;
}

function downloadCsv(posts) {
    function cell(value) {
        const text = String(value ?? '');
        const safe = /^\s*[=+@-]/.test(text) ? "'" + text : text;
        return '"' + safe.replaceAll('"', '""') + '"';
    }
    const rows = [['Title', 'Topics', 'Published'], ...posts.map(post => [post.title, post.topics.join('; '), post.date])];
    const uri = URL.createObjectURL(new Blob([rows.map(row => row.map(cell).join(',')).join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = uri;
    link.download = 'panelwork-posts.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(uri), 1000);
}

export function PostLibrary({ posts, topics, initialTopic = '', initialMonth = '', initialDate = '', preview = false }) {
    const [query, setQuery] = useState('');
    const [topic, setTopic] = useState(initialTopic);
    const [month, setMonth] = useState(initialMonth);
    const [date, setDate] = useState(initialDate);
    const [sort, setSort] = useState('newest');
    const [size, setSize] = useState(preview ? 6 : 8);
    const [page, setPage] = useState(1);
    const filtered = posts.filter(post => matches(post, query, topic) && (!month || post.date?.startsWith(month)) && (!date || post.date === date))
        .sort((a, b) => comparePosts(a, b, sort));
    const pageCount = Math.max(1, Math.ceil(filtered.length / size));
    const visiblePage = Math.min(page, pageCount);
    const start = (visiblePage - 1) * size;
    const rows = filtered.slice(start, start + size);
    const months = [...new Set(posts.map(post => post.date?.slice(0, 7)).filter(Boolean))].sort().reverse();
    const change = setter => event => { setter(event.target.value); setPage(1); };
    function sortBy(column) {
        setSort(column === 'title' ? 'title' : sort === 'newest' ? 'oldest' : 'newest');
        setPage(1);
    }
    function clear() {
        setQuery(''); setTopic(''); setMonth(''); setDate(''); setSort('newest'); setPage(1);
    }
    return <section className="pw-card pw-list">
        <div className="pw-card-heading">
            <div><h2>Post library</h2><p aria-live="polite">{filtered.length} of {posts.length} entries{date ? ` · ${formatDate(date, lang)}` : ''}</p></div>
            <button className="pw-action" type="button" onClick={() => downloadCsv(filtered)} disabled={!filtered.length}>Export CSV</button>
        </div>
        <div className="pw-filter pw-library-toolbar">
            <label className="pw-sr" htmlFor="pw-query">Filter titles and topics</label>
            <input id="pw-query" type="search" value={query} onChange={change(setQuery)} placeholder="Find an entry"/>
            <label className="pw-sr" htmlFor="pw-topic">Filter by topic</label>
            <select id="pw-topic" className="pw-select" value={topic} onChange={change(setTopic)}>
                <option value="">All topics</option>
                {topics.map(([name]) => <option value={name} key={name}>{name}</option>)}
            </select>
            <label className="pw-sr" htmlFor="pw-month">Filter by month</label>
            <select id="pw-month" className="pw-select" value={month} onChange={event => { change(setMonth)(event); setDate(''); }}>
                <option value="">All months</option>
                {months.map(value => <option value={value} key={value}>{monthFull.format(new Date(value + '-01T00:00:00Z'))}</option>)}
            </select>
            <label className="pw-sr" htmlFor="pw-sort-react">Sort posts</label>
            <select id="pw-sort-react" className="pw-select" value={sort} onChange={change(setSort)}>
                <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Title A–Z</option>
            </select>
            <button className="pw-clear" type="button" onClick={clear}>Clear</button>
        </div>
        <div className="pw-columns">
            <button type="button" className="pw-column-order" onClick={() => sortBy('title')}>Post {sort === 'title' ? '↑' : ''}</button>
            <span>Topics</span>
            <button type="button" className="pw-column-order" onClick={() => sortBy('date')}>Published {sort === 'oldest' ? '↑' : sort === 'newest' ? '↓' : ''}</button>
        </div>
        {rows.length ? <ul className="pw-post-rows">
            {rows.map(post => <li key={post.id}><div className="pw-post-row">
                <h3><a href={entryUrl(post)}>{post.title}</a></h3>
                <div className="pw-post-topics">{post.topics.map(name => <a href={libraryUrl('topic', name)} key={name}>{name}</a>)}</div>
                <time className="pw-post-date" dateTime={post.date}>{formatDate(post.date, lang)}</time>
            </div></li>)}
        </ul> : <p className="pw-empty">No posts match these filters.</p>}
        <div className="pw-list-footer">
            <div>{filtered.length ? `${start + 1}–${start + rows.length} of ${filtered.length}` : '0 entries'}
                <label><span className="pw-sr">Entries per page</span>
                    <select className="pw-select" value={size} onChange={event => { setSize(Number(event.target.value)); setPage(1); }}>
                        <option value={6}>6 rows</option><option value={8}>8 rows</option><option value={12}>12 rows</option><option value={24}>24 rows</option>
                    </select>
                </label>
            </div>
            <div><button type="button" className="pw-action" disabled={visiblePage <= 1} onClick={() => setPage(visiblePage - 1)}>Previous</button>
                <span>Page {visiblePage} of {pageCount}</span>
                <button type="button" className="pw-action" disabled={visiblePage >= pageCount} onClick={() => setPage(visiblePage + 1)}>Next</button>
            </div>
        </div>
    </section>;
}

export function Activity({ posts, limit, title = 'Recent publications' }) {
    const dated = latestPosts(posts, limit || posts.length);
    return <section className="pw-card pw-screen-card">
        <div className="pw-card-heading"><div><h2>{title}</h2><p>Entries ordered by publication date.</p></div>
        {limit && <a className="pw-quiet-link" href="#activity">All activity</a>}</div>
        {dated.length ? <ol className="pw-timeline">
            {dated.map(post => <li key={post.id}><div><a href={entryUrl(post)}>{post.title}</a><time dateTime={post.date}>{formatDate(post.date, lang)}</time></div></li>)}
        </ol> : <p>No dated posts yet.</p>}
    </section>;
}

export function Topics({ summary }) {
    return <div className="pw-topic-grid">
        {summary.topics.map(([name, count]) => <article key={name} className="pw-card">
            <h2>{name}</h2><p>{count} of {summary.count} entries use this topic</p>
            <div className="pw-topic-track" aria-hidden="true"><span className="pw-topic-fill" style={{ '--value': `${100 * count / summary.count}%` }} /></div>
            <a className="pw-action" href={libraryUrl('topic', name)}>Browse {name}</a>
        </article>)}
        {!summary.topics.length && <p>No topics in this dataset.</p>}
    </div>;
}

export function Calendar({ posts, newest }) {
    const [month, setMonth] = useState(() => {
        const date = newest ? new Date(newest + 'T00:00:00Z') : new Date();
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    });
    const y = month.getUTCFullYear();
    const m = month.getUTCMonth();
    const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const leading = (month.getUTCDay() + 6) % 7;
    const dates = new Map();
    for (const post of posts) dates.set(post.date, (dates.get(post.date) || 0) + 1);
    return <section className="pw-card pw-screen-card">
        <div className="pw-card-heading pw-calendar-toolbar">
            <h2>{monthFull.format(month)}</h2>
            <div>
                <button className="pw-action" type="button" onClick={() => setMonth(new Date(Date.UTC(y, m - 1, 1)))}>Previous month</button>
                <button className="pw-action" type="button" onClick={() => setMonth(new Date(Date.UTC(y, m + 1, 1)))}>Next month</button>
            </div>
        </div>
        <div className="pw-calendar" aria-label={monthFull.format(month)}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <span key={day}>{day}</span>)}
            {Array.from({ length: leading }, (_, index) => <div className="pw-off" key={`before-${index}`} aria-hidden="true" />)}
            {Array.from({ length: days }, (_, index) => {
                const day = index + 1;
                const key = new Date(Date.UTC(y, m, day)).toISOString().slice(0, 10);
                const count = dates.get(key);
                return <div key={key}>{count ? <a href={libraryUrl('date', key)} aria-label={`${formatDate(key, lang)}: ${count} ${count === 1 ? 'entry' : 'entries'}`}>{day}<small>{count} {count === 1 ? 'post' : 'posts'}</small></a> : day}</div>;
            })}
        </div>
    </section>;
}

export function Settings({ mode, setMode, density, setDensity }) {
    return <div className="pw-settings">
        <section className="pw-card">
            <h2>Appearance</h2><p>Change the colour scheme for this browser.</p>
            <fieldset><legend className="pw-sr">Colour scheme</legend>
                {['system', 'light', 'dark'].map(value => <label key={value}>
                    <input type="radio" name="appearance" value={value} checked={mode === value} onChange={() => setMode(value)} />
                    {value[0].toUpperCase() + value.slice(1)}
                </label>)}
            </fieldset>
        </section>
        <section className="pw-card">
            <h2>Library density</h2><p>Fit more rows on screen or leave more room between entries.</p>
            <fieldset><legend className="pw-sr">Row spacing</legend>
                {['comfortable', 'compact'].map(value => <label key={value}>
                    <input type="radio" name="spacing" value={value} checked={density === value} onChange={() => setDensity(value)} />
                    {value[0].toUpperCase() + value.slice(1)}
                </label>)}
            </fieldset>
        </section>
    </div>;
}
