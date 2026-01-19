function RepoIssueTab({ repos, selectedRepo, setSelectedRepo, title, setTitle, body, setBody, onSubmit }) {
    return (
        <div className="card">
            <h2>Create Repository Issue</h2>
            <div className="form-group">
                <label>Repository</label>
                <select value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)}>
                    <option value="">Select repository</option>
                    {repos.map(repo => (
                        <option key={repo.id} value={repo.full_name}>{repo.name}</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label>Title</label>
                <input
                    type="text"
                    placeholder="Issue title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                />
            </div>
            <div className="form-group">
                <label>Description</label>
                <textarea
                    placeholder="Issue description"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                />
            </div>
            <button
                className="btn btn-primary"
                onClick={onSubmit}
                disabled={!selectedRepo || !title.trim()}
            >
                Create Issue
            </button>
        </div>
    );
}
