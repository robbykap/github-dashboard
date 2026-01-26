function PRItem({ pr, summary, files, isExpanded, onToggle, expandedFileItems, onToggleFile }) {
    return (
        <div className="item-accordion">
            <div
                className="item-accordion-header"
                onClick={onToggle}
            >
                <span className="accordion-toggle">{isExpanded ? '▼' : '▶'}</span>
                <div className="item-preview">
                    <div className="item-preview-title">
                        <span>#{pr.number} {pr.title}</span>
                    </div>
                    <div className="item-preview-meta">
                        <span>By <strong>{pr.user.login}</strong> • {pr.comments} comments</span>
                    </div>
                    {!isExpanded && summary && (
                        <div className="item-preview-text">
                            {typeof summary === 'object' && summary.summary
                                ? summary.summary.substring(0, 100) + (summary.summary.length > 100 ? '...' : '')
                                : 'Loading...'
                            }
                        </div>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="item-accordion-content">
                    {summary ? (
                        <>
                            <div className="issue-section">
                                <h4>Summary:</h4>
                                <p>
                                    {typeof summary === 'object' && summary.summary
                                        ? summary.summary
                                        : 'Loading summary...'
                                    }
                                </p>
                            </div>

                            {typeof summary === 'object' && summary.code_updates && (
                                <div className="issue-section">
                                    <h4>Code updates:</h4>
                                    <p>{summary.code_updates}</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="loading">Generating summary...</p>
                    )}

                    {files.length > 0 && (
                        <div className="issue-section">
                            <h4>List of files being changed:</h4>
                            <div className="pr-files-accordion">
                                {files.map((file, idx) => {
                                    const fileKey = `${pr.id}-${idx}`;
                                    const isFileExpanded = expandedFileItems[fileKey];

                                    return (
                                        <FileAccordion
                                            key={idx}
                                            file={file}
                                            prUrl={pr.html_url}
                                            prId={pr.id}
                                            idx={idx}
                                            isExpanded={isFileExpanded}
                                            onToggle={() => onToggleFile(pr.id, idx)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="issue-meta">
                        <a href={pr.html_url} target="_blank" rel="noopener noreferrer" className="github-link">
                            View on GitHub →
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
