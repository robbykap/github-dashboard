const { useState, useEffect } = React;

function MyActivityTab({ token }) {
    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('prs');
    const [sortBy, setSortBy] = useState('date');

    useEffect(() => {
        fetchMyActivity();
    }, [token]);

    const fetchMyActivity = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/my-activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });

            if (res.ok) {
                const data = await res.json();
                setAllItems(data.items);
            }
        } catch (err) {
            console.error('Failed to fetch:', err);
        }
        setLoading(false);
    };

    // Filter items based on active tab
    const getFilteredItems = () => {
        if (activeTab === 'prs') {
            return allItems.filter(item => item.pull_request);
        } else if (activeTab === 'clean-prs') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            return allItems.filter(item => {
                // Must be a PR
                if (!item.pull_request) return false;

                // Check updated date (within last 30 days)
                const updatedDate = new Date(item.updated_at);
                if (updatedDate < thirtyDaysAgo) return false;

                // Not a draft PR
                if (item.draft === true) return false;

                // Not from archived repository
                if (item.repository?.archived === true) return false;

                return true;
            });
        } else {
            return allItems.filter(item => !item.pull_request);
        }
    };

    // Sort items based on sortBy
    const getSortedItems = () => {
        const filtered = getFilteredItems();

        switch (sortBy) {
            case 'date':
                return [...filtered].sort((a, b) =>
                    new Date(b.updated_at) - new Date(a.updated_at)
                );
            case 'org':
                return [...filtered].sort((a, b) =>
                    a.repository.owner.login.localeCompare(b.repository.owner.login)
                );
            case 'repo':
                return [...filtered].sort((a, b) =>
                    a.repository.name.localeCompare(b.repository.name)
                );
            case 'title':
                return [...filtered].sort((a, b) =>
                    a.title.localeCompare(b.title)
                );
            default:
                return filtered;
        }
    };

    const sortedItems = getSortedItems();
    const prCount = allItems.filter(item => item.pull_request).length;
    const issueCount = allItems.filter(item => !item.pull_request).length;
    const cleanPrCount = allItems.filter(item => {
        if (!item.pull_request) return false;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const updatedDate = new Date(item.updated_at);
        return updatedDate >= thirtyDaysAgo &&
               item.draft !== true &&
               item.repository?.archived !== true;
    }).length;

    return (
        <div className="content-area-full">
            <div className="activity-header-full">
                <h2>My Activity</h2>
                <div className="activity-controls">
                    <select
                        className="sort-dropdown"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="date">Sort by Date</option>
                        <option value="org">Sort by Organization</option>
                        <option value="repo">Sort by Repository</option>
                        <option value="title">Sort by Title</option>
                    </select>
                </div>
            </div>
            <ActivityTabs active={activeTab} onChange={setActiveTab} prCount={prCount} issueCount={issueCount} cleanPrCount={cleanPrCount} />
            <div className="tab-content">
                {loading && <p className="loading">Loading your activity...</p>}
                {!loading && allItems.length === 0 && (
                    <p className="placeholder">No issues or pull requests found</p>
                )}
                {!loading && sortedItems.length === 0 && allItems.length > 0 && (
                    <p className="placeholder">
                        No {activeTab === 'prs' ? 'pull requests' : activeTab === 'clean-prs' ? 'clean pull requests' : 'issues'} found
                    </p>
                )}
                {!loading && sortedItems.length > 0 && (
                    <ActivityContent
                        items={sortedItems}
                        activeTab={activeTab}
                        token={token}
                    />
                )}
            </div>
        </div>
    );
}
