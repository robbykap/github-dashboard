const { useState, useEffect } = React;

function Sidebar({ repos, selectedRepo, onSelectRepo, loading }) {
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState({});

    const filtered = repos.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase())
    );

    const grouped = filtered.reduce((acc, repo) => {
        const owner = repo.owner.login;
        if (!acc[owner]) acc[owner] = [];
        acc[owner].push(repo);
        return acc;
    }, {});

    const owners = Object.keys(grouped).sort();

    useEffect(() => {
        if (owners.length > 0 && Object.keys(expanded).length === 0) {
            setExpanded({ [owners[0]]: true });
        }
    }, [owners.length]);

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h3>Repositories</h3>
                <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            <div className="repo-list">
                {loading && <div className="loading">Loading...</div>}
                {!loading && owners.map(owner => (
                    <div key={owner} className="owner-group">
                        <div
                            className="owner-header"
                            onClick={() => setExpanded(prev => ({ ...prev, [owner]: !prev[owner] }))}
                        >
                            <span className="owner-toggle">{expanded[owner] ? '▼' : '▶'}</span>
                            <span className="owner-name">{owner}</span>
                            <span className="owner-count">({grouped[owner].length})</span>
                        </div>
                        {expanded[owner] && (
                            <div className="owner-repos">
                                {grouped[owner].map(repo => (
                                    <RepoItem
                                        key={repo.id}
                                        repo={repo}
                                        selected={selectedRepo?.id === repo.id}
                                        onSelect={() => onSelectRepo(repo)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
