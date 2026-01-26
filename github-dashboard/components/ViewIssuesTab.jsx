const { useState } = React;

function ViewIssuesTab({ repo, token }) {
    const {
        issues,
        prs,
        loading,
        summaries,
        prFiles,
        mentionedUsers,
        priorities,
        totalSummaries,
        completedSummaries
    } = useRepositoryIssues(repo, token);

    const [expandedItems, setExpandedItems] = useState({});
    const [expandedFileItems, setExpandedFileItems] = useState({});

    const toggleItem = (id) => {
        setExpandedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const toggleFile = (prId, fileIdx) => {
        const key = `${prId}-${fileIdx}`;
        setExpandedFileItems(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    if (!repo) {
        return (
            <div className="card">
                <h2>View Issues & PRs</h2>
                <p className="placeholder">Select a repository to view its issues and pull requests</p>
            </div>
        );
    }

    return (
        <div className="card">
            <h2>Issues & PRs for {repo.name}</h2>
            {loading && <p className="loading">Loading and prioritizing...</p>}
            {!loading && totalSummaries > 0 && completedSummaries < totalSummaries && (
                <p className="loading">
                    Generating summaries... ({completedSummaries}/{totalSummaries} complete)
                </p>
            )}

            {!loading && (
                <>
                    <IssueList
                        issues={issues}
                        summaries={summaries}
                        priorities={priorities}
                        mentionedUsers={mentionedUsers}
                        expandedItems={expandedItems}
                        onToggle={toggleItem}
                    />

                    <PRList
                        prs={prs}
                        summaries={summaries}
                        prFiles={prFiles}
                        expandedItems={expandedItems}
                        expandedFileItems={expandedFileItems}
                        onToggle={toggleItem}
                        onToggleFile={toggleFile}
                    />
                </>
            )}
        </div>
    );
}
