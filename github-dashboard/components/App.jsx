const { useState, useEffect } = React;

function App() {
    const [repos, setRepos] = useState([]);
    const [selectedRepo, setSelectedRepo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [username, setUsername] = useState('');
    const [activeTab, setActiveTab] = useState('create');
    const [token, setToken] = useState('');
    const [viewMode, setViewMode] = useState('repos');

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const res = await fetch('/api/config');
            const config = await res.json();
            if (!config.github_token) throw new Error('No token configured');
            setToken(config.github_token);
            await connect(config.github_token);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const connect = async (t) => {
        const userRes = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `token ${t}` }
        });
        if (!userRes.ok) throw new Error('Invalid token');
        const user = await userRes.json();
        setUsername(user.login);
        await loadRepos(t);
    };

    const loadRepos = async (t) => {
        const res = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
            headers: { 'Authorization': `token ${t}` }
        });
        if (!res.ok) throw new Error('Failed to load repos');
        setRepos(await res.json());
        setLoading(false);
    };


    return (
        <div className="app-container">
            <Header username={username} />
            <MainNav activeView={viewMode} onViewChange={setViewMode} />
            {error && <div className="error">{error}</div>}
            <div className="main-content">
                {viewMode === 'repos' ? (
                    <>
                        <Sidebar
                            repos={repos}
                            selectedRepo={selectedRepo}
                            onSelectRepo={setSelectedRepo}
                            loading={loading}
                        />
                        <div className="content-area">
                            <RepoHeader repo={selectedRepo} />
                            <Tabs active={activeTab} onChange={setActiveTab} />
                            <div className="tab-content">
                                {activeTab === 'create' && (
                                    <CreateTicketTab
                                        repos={repos}
                                        selectedRepo={selectedRepo?.full_name}
                                    />
                                )}
                                {activeTab === 'view' && (
                                    <ViewIssuesTab repo={selectedRepo} token={token} />
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <MyActivityTab token={token} />
                )}
            </div>
        </div>
    );
}
