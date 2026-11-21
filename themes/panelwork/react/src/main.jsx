import React, { Fragment, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { formatDate, summarize } from './dashboard-data.js';
import { Activity, Calendar, Charts, PostLibrary, ScreenTitle, Settings, StatCards, Topics } from './screens.jsx';
import samplePosts from './posts.json';
import './panelwork.css';

const modes = ['system', 'light', 'dark'];
const languages = document.documentElement.lang || 'en';
const links = {
    Overview: [['overview', 'Overview', '◈'], ['library', 'Post library', '≡'], ['topics', 'Topics', '◇']],
    Workspace: [['calendar', 'Calendar', '▦'], ['activity', 'Activity', '∙'], ['settings', 'Settings', '◌']]
};

function usePreference(key, choices, fallback) {
    const [value, setValue] = useState(() => {
        try {
            const stored = localStorage.getItem(key);
            return choices.includes(stored) ? stored : fallback;
        } catch {
            return fallback;
        }
    });
    useEffect(() => {
        try { localStorage.setItem(key, value); } catch { /* Current page only. */ }
    }, [key, value]);
    return [value, setValue];
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
                {Object.entries(links).map(([group, items]) => <Fragment key={group}>
                    <p className="pw-rail-label pw-nav-label">{group === 'Overview' ? 'Publishing' : group}</p>
                    {items.map(([id, label, glyph]) => <a key={id} className="pw-nav-link" href={`#${id}`} aria-current={id === route ? 'page' : undefined} onClick={() => setOpen(false)}>
                        <span className="pw-nav-glyph" aria-hidden="true">{glyph}</span>{label}
                    </a>)}
                </Fragment>)}
            </nav>
            <label className="pw-mode">Appearance
                <select aria-label="Appearance" value={mode} onChange={event => setMode(event.target.value)}>
                    {modes.map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
                </select>
            </label>
        </div>
    </header>;
}

function Article({ post }) {
    return <article className="pw-card pw-article">
        <a href="#library">← Post library</a>
        <h1>{post.title}</h1>
        <time className="pw-post-date" dateTime={post.date}>{formatDate(post.date, languages)}</time>
        <div className="pw-prose"><p>{post.summary}</p>{post.body && <p>{post.body}</p>}</div>
    </article>;
}

function currentRoute() {
    return location.hash.slice(1) || 'overview';
}

function App({ posts }) {
    const [route, setRoute] = useState(currentRoute);
    const [mode, setMode] = usePreference('gonk-panelwork-mode', modes, 'system');
    const [density, setDensity] = usePreference('gonk-panelwork-density', ['comfortable', 'compact'], 'comfortable');
    const [screen, search] = route.split('?');
    const summary = summarize(posts);
    const params = new URLSearchParams(search);
    const post = screen.startsWith('post/') ? posts.find(entry => encodeURIComponent(entry.id) === screen.slice(5)) : undefined;
    const screenLabel = Object.values(links).flat().find(([id]) => id === screen)?.[1] || (post ? 'Article' : 'Workspace');

    useEffect(() => {
        function navigate() {
            setRoute(currentRoute());
            window.scrollTo(0, 0);
        }
        window.addEventListener('hashchange', navigate);
        return () => window.removeEventListener('hashchange', navigate);
    }, []);
    useEffect(() => {
        if (mode === 'system') document.documentElement.removeAttribute('data-pw-mode');
        else document.documentElement.setAttribute('data-pw-mode', mode);
    }, [mode]);

    let content;
    switch (screen) {
        case 'overview':
            content = <>
                <ScreenTitle title="Publishing overview" description="A summary of this workspace’s entries, topics, and publishing cadence.">
                    <a className="pw-action" href="#library">Open post library ↗</a>
                </ScreenTitle>
                <StatCards summary={summary} />
                <Charts summary={summary} />
                <div className="pw-section-grid">
                    <Activity posts={posts} limit={4}/>
                    <section className="pw-card">
                        <div className="pw-card-heading"><div><h2>Library coverage</h2><p>How entries are organized.</p></div></div>
                        <dl className="pw-distribution">
                            <div><dt>Entries with labels</dt><dd>{posts.filter(entry => entry.topics.length).length}</dd></div>
                            <div><dt>Entries without labels</dt><dd>{posts.filter(entry => !entry.topics.length).length}</dd></div>
                            <div><dt>Entries with a date</dt><dd>{posts.filter(entry => entry.date).length}</dd></div>
                        </dl>
                        <a className="pw-quiet-link" href="#topics">Explore topics</a>
                    </section>
                </div>
                <PostLibrary key={route} posts={posts} topics={summary.topics} preview />
            </>;
            break;
        case 'library':
            content = <><ScreenTitle title="Post library" description="Find, sort, and export entries from the workspace." />
                <PostLibrary key={route} posts={posts} topics={summary.topics} initialTopic={params.get('topic') || ''}
                    initialMonth={/^\d{4}-(0[1-9]|1[0-2])$/.test(params.get('month')) ? params.get('month') : ''}
                    initialDate={formatDate(params.get('date'), languages) !== '—' ? params.get('date') : ''} /></>;
            break;
        case 'topics':
            content = <><ScreenTitle title="Topics" description="Browse the labels used across published entries."/><Topics summary={summary} /></>;
            break;
        case 'calendar':
            content = <><ScreenTitle title="Publishing calendar" description="Select a date with posts to open those entries."/><Calendar posts={posts} newest={summary.newest} /></>;
            break;
        case 'activity':
            content = <><ScreenTitle title="Activity" description="Publication history for this workspace."/><Activity posts={posts} title="Publication timeline" /></>;
            break;
        case 'settings':
            content = <><ScreenTitle title="Settings" description="Preferences apply to this browser."/><Settings mode={mode} setMode={setMode} density={density} setDensity={setDensity} /></>;
            break;
        default:
            content = post ? <Article post={post}/> : <ScreenTitle title="Page not found"><a className="pw-action" href="#overview">Back to overview</a></ScreenTitle>;
    }

    return <Fragment>
        <a className="pw-skip" href="#content" onClick={event => { event.preventDefault(); document.getElementById('content').focus(); }}>Skip to content</a>
        <div className="pw-shell" data-pw-density={density}>
            <Sidebar route={screen} mode={mode} setMode={setMode} />
            <main id="content" tabIndex={-1}><div className="pw-wrap pw-content">
                <div className="pw-top"><p className="pw-top-service">Publishing desk / {screenLabel}</p><p className="pw-top-badge">Example content</p></div>
                {content}
            </div></main>
            <footer className="pw-footer"><div className="pw-wrap">Powered by <a href="https://gonk.fun/" rel="nofollow">gonk.fun</a></div></footer>
        </div>
    </Fragment>;
}

createRoot(document.getElementById('root')).render(<App posts={samplePosts} />);
