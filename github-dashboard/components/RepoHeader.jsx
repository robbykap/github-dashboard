function RepoHeader({ repo }) {
    if (!repo) {
        return (
            <div className="repo-header">
                <p className="placeholder">Select a repository</p>
            </div>
        );
    }

    return (
        <div className="repo-header">
            <h2>
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                    {repo.owner.login}/{repo.name}
                </a>
            </h2>
            <p>{repo.description || 'No description'}</p>
        </div>
    );
}
