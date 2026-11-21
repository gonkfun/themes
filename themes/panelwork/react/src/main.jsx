import React, { Fragment, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { formatDate, matches, summarize, timeline } from './dashboard-data.js';
import samplePosts from './posts.json';
import './panelwork.css';

const modes = ['system', 'light', 'dark'];
const modeKey = 'gonk-panelwork-mode';
const language = document.documentElement.lang || 'en';
const shortMonth = new Intl.DateTimeFormat(language, { month: 'short', timeZone: 'UTC' });
const fullMonth = new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric', timeZone: 'UTC' });

function readMode() {
    try {
        const stored = localStorage.getItem(modeKey);
        return modes.includes(stored) ? stored : 'system';
    } catch {
        return 'system';
    }
}

function useAppearance() {
    const [mode, setMode] = useState(readMode);
    useEffect(() => {
        if (mode === 'system') document.documentElement.removeAttribute('data-pw-mode');
        else document.documentElement.setAttribute('data-pw-mode', mode);
        try { localStorage.setItem(modeKey, mode); } catch { /* Current page only. */ }
    }, [mode]);
    return [mode, setMode];
}

function Sidebar({ route, mode, setMode }) {
    const [open, setOpen] = useState(false);
    function closeWithEscape(event) {
        if (event.key === 'Escape' && open) {
            setOpen(false);
            event.currentTarget.querySelector('button').focus();
        }
    }
    return <header className="pw-sidebar" data-pw-collapsible="" data-pw-open={open ? '' : undefined} onKeyDown={closeWithEscape}>
        <div className="pw-brand-line">
            <a className="pw-brand" href="#overview" onClick={() => setOpen(false)}>Panelwork</a>
            <button className="pw-menu" type="button" aria-expanded={open} aria-controls="panelwork-sidebar" onClick={() => setOpen(!open)}>Menu</button>
        </div>
        <div className="pw-rail-panel" id="panelwork-sidebar">
            <nav className="pw-nav" aria-label="Main navigation">
                <a href="#overview" aria-current={route === 'overview' ? 'page' : undefined} onClick={() => setOpen(false)}>Overview</a>
                <a href="#library" aria-current={route === 'library' ? 'page' : undefined} onClick={() => setOpen(false)}>Post library</a>
            </nav>
            <label className="pw-mode">Appearance
                <select aria-label="Appearance" value={mode} onChange={event => setMode(event.target.value)}>
                    {modes.map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
                </select>
            </label>
        </div>
    </header>;
}

function StatCards({ summary }) {
    const metrics = [
        ['Posts in this dataset', summary.count],
        ['Topics represented', summary.topics.length],
        ['Latest publication', formatDate(summary.newest, language)]
    ];
    return <dl className="pw-stats">
        {metrics.map(([label, value]) => <div key={label} className="pw-card pw-stat">
            <dt><span aria-hidden="true" className="pw-stat-mark"></span>{label}</dt><dd>{value}</dd>
        </div>)}
    </dl>;
}

function Charts({ summary }) {
    const [range, setRange] = useState(6);
    const months = timeline(summary, range);
    const maximum = Math.max(1, ...months.map(month => month.count));
    const topicMaximum = summary.topics[0]?.[1] || 1;
    return <div className="pw-charts">
        <section className="pw-card pw-chart">
            <div className="pw-card-heading">
                <div><h2>Publishing activity</h2><p>Post dates in the dataset, ending at the newest month.</p></div>
                <label><span className="pw-sr">Months shown</span>
                    <select className="pw-select" value={range} onChange={event => setRange(Number(event.target.value))} disabled={!months.length}>
                        <option value={6}>6 months</option><option value={3}>3 months</option>
                    </select>
                </label>
            </div>
            {months.length ? <ul className="pw-bars" aria-label="Posts by month">
                {months.map(month => <li key={month.key} aria-label={`${fullMonth.format(month.date)}: ${month.count} posts`}>
                    <strong>{month.count}</strong>
                    <span className="pw-bar-area" aria-hidden="true"><span className="pw-bar" style={{ '--value': `${100 * month.count / maximum}%` }} /></span>
                    <span>{shortMonth.format(month.date)}</span>
                </li>)}
            </ul> : <p>No dated posts in this dataset.</p>}
        </section>
        <section className="pw-card pw-chart">
            <div className="pw-card-heading"><div><h2>Top topics</h2><p>Most used topics in this dataset.</p></div></div>
            {summary.topics.length ? <ul className="pw-topics" aria-label="Posts by topic">
                {summary.topics.slice(0, 5).map(([topic, count]) => <li key={topic}>
                    <span className="pw-topic-label"><span>{topic}</span><strong>{count}</strong></span>
                    <div className="pw-topic-track" aria-hidden="true"><span className="pw-topic-fill" style={{ '--value': `${100 * count / topicMaximum}%` }} /></div>
                </li>)}
            </ul> : <p>No topics in this dataset.</p>}
        </section>
    </div>;
}

function PostLibrary({ posts, topics }) {
    const [query, setQuery] = useState('');
    const [topic, setTopic] = useState('');
    const filtered = posts.filter(post => matches(post, query, topic));
    return <section className="pw-card pw-list">
        <div className="pw-card-heading">
            <div><h2>Post library</h2><p aria-live="polite">{filtered.length} of {posts.length} posts</p></div>
            <div className="pw-filter">
                <label className="pw-sr" htmlFor="pw-query">Filter titles and topics</label>
                <input id="pw-query" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Filter titles and topics" />
                <label className="pw-sr" htmlFor="pw-topic">Filter by topic</label>
                <select id="pw-topic" className="pw-select" value={topic} onChange={event => setTopic(event.target.value)}>
                    <option value="">All topics</option>
                    {topics.map(([name]) => <option value={name} key={name}>{name}</option>)}
                </select>
                <button className="pw-clear" type="button" onClick={() => { setQuery(''); setTopic(''); }}>Clear</button>
            </div>
        </div>
        <div className="pw-columns" aria-hidden="true"><span>Post</span><span>Topics</span><span>Published</span></div>
        {filtered.length ? <ul className="pw-post-rows">
            {filtered.map(post => <li key={post.id}><div className="pw-post-row">
                <h3><a href={`#post/${encodeURIComponent(post.id)}`}>{post.title}</a></h3>
                <div className="pw-post-topics">{post.topics.map(name => <span key={name}>{name}</span>)}</div>
                <time className="pw-post-date" dateTime={post.date}>{formatDate(post.date, language)}</time>
            </div></li>)}
        </ul> : <p className="pw-empty">No posts match these filters.</p>}
    </section>;
}

function Article({ post }) {
    return <article className="pw-card pw-article">
        <a href="#library">← Post library</a>
        <h1>{post.title}</h1>
        <time className="pw-post-date" dateTime={post.date}>{formatDate(post.date, language)}</time>
        <div className="pw-prose"><p>{post.summary}</p>
            {post.body && <p>{post.body}</p>}
        </div>
    </article>;
}

function currentRoute() {
    return location.hash.slice(1) || 'overview';
}

function App({ posts }) {
    const [route, setRoute] = useState(currentRoute);
    const [mode, setMode] = useAppearance();
    const summary = summarize(posts);
    const post = route.startsWith('post/') ? posts.find(entry => encodeURIComponent(entry.id) === route.slice(5)) : undefined;

    useEffect(() => {
        function navigate() {
            setRoute(currentRoute());
            window.scrollTo(0, 0);
        }
        window.addEventListener('hashchange', navigate);
        return () => window.removeEventListener('hashchange', navigate);
    }, []);

    let content;
    if (route === 'overview') {
        content = <Fragment>
            <section className="pw-summary"><h1>Publishing overview</h1><p>Activity and topics from the posts in your dataset.</p></section>
            <StatCards summary={summary} />
            <Charts summary={summary} />
            <PostLibrary posts={posts} topics={summary.topics} />
        </Fragment>;
    } else if (route === 'library') {
        content = <Fragment><section className="pw-summary"><h1>Archive</h1></section><PostLibrary posts={posts} topics={summary.topics} /></Fragment>;
    } else if (post) {
        content = <Article post={post} />;
    } else {
        content = <section className="pw-summary"><h1>Page not found</h1><a href="#overview">Back to overview</a></section>;
    }

    return <Fragment>
        <a className="pw-skip" href="#content" onClick={event => { event.preventDefault(); document.getElementById('content').focus(); }}>Skip to content</a>
        <div className="pw-shell">
            <Sidebar route={route} mode={mode} setMode={setMode} />
            <main id="content" tabIndex={-1}><div className="pw-wrap pw-content">
                <div className="pw-top"><p>Publishing desk</p><p>Example content</p></div>
                {content}
            </div></main>
            <footer className="pw-footer"><div className="pw-wrap">Powered by <a href="https://gonk.fun/" rel="nofollow">gonk.fun</a></div></footer>
        </div>
    </Fragment>;
}

createRoot(document.getElementById('root')).render(<App posts={samplePosts} />);
