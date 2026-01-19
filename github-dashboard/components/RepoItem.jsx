function RepoItem({ repo, selected, onSelect }) {
    return (
        <div
            className={`repo-item ${selected ? 'selected' : ''}`}
            onClick={onSelect}
        >
            <div className="repo-name">{repo.name}</div>
            <div className="repo-desc">{repo.description || 'No description'}</div>
        </div>
    );
}
