function FileAccordion({ file, prUrl, prId, idx, isExpanded, onToggle }) {
    return (
        <div className="file-accordion">
            <div
                className="file-accordion-header"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                }}
            >
                <span className="accordion-toggle-small">
                    {isExpanded ? '▼' : '▶'}
                </span>
                <span className={`file-status file-status-${file.status}`}>
                    {file.status}
                </span>
                <span className="file-name">{file.filename}</span>
                <span className="file-stats">
                    <span className="additions">+{file.additions}</span>
                    <span className="deletions">-{file.deletions}</span>
                </span>
            </div>

            {isExpanded && (
                <div className="file-accordion-content">
                    {file.changes > 500 ? (
                        <div className="large-file-notice">
                            <p>This file has {file.changes} changes (too large to display efficiently)</p>
                            <a
                                href={`${prUrl}/files#diff-${btoa(file.filename).replace(/=/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="view-file-link"
                            >
                                View this file on GitHub →
                            </a>
                        </div>
                    ) : (
                        <DiffViewer patch={file.patch} prUrl={prUrl} filename={file.filename} />
                    )}
                </div>
            )}
        </div>
    );
}
