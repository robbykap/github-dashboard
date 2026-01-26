function ActivityTabs({ active, onChange, prCount = 0, issueCount = 0, cleanPrCount = 0 }) {
    return (
        <div className="tabs">
            <button
                className={`tab ${active === 'prs' ? 'active' : ''}`}
                onClick={() => onChange('prs')}
            >
                Pull Requests ({prCount})
            </button>
            <button
                className={`tab ${active === 'clean-prs' ? 'active' : ''}`}
                onClick={() => onChange('clean-prs')}
            >
                Clean PRs ({cleanPrCount})
            </button>
            <button
                className={`tab ${active === 'issues' ? 'active' : ''}`}
                onClick={() => onChange('issues')}
            >
                Issues ({issueCount})
            </button>
        </div>
    );
}
