function ActivityItem({ item, summary, files, mentions, priority, isExpanded, expandedFileItems, onToggle, onToggleFile }) {
    const isPR = !!item.pull_request;

    return (
        <div className="item-accordion">
            <div
                className="item-accordion-header"
                onClick={onToggle}
            >
                <span className="accordion-toggle">{isExpanded ? '▼' : '▶'}</span>
                <div className="item-preview">
                    <div className="item-preview-title">
                        <span>
                            #{item.number} {item.title}
                            <span className="item-repo-info">
                                {item.repository.owner.login}/{item.repository.name}
                            </span>
                        </span>
                        {!isPR && priority && (
                            <span className={`priority-badge ${getPriorityClass(priority)}`}>
                                #{priority} {getPriorityLabel(priority)}
                            </span>
                        )}
                    </div>
                    <div className="item-preview-meta">
                        <span>{item.comments} comments</span>
                    </div>
                    {!isExpanded && summary && (
                        <div className="item-preview-text">
                            {typeof summary === 'object' && summary.summary
                                ? summary.summary.substring(0, 100) + (summary.summary.length > 100 ? '...' : '')
                                : 'Click to expand...'
                            }
                        </div>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="item-accordion-content">
                    {summary ? (
                        <>
                            {!isPR && typeof summary === 'object' && summary.issue_type && (
                                <div className="issue-section">
                                    <h4>Issue Type:</h4>
                                    <div>
                                        <span className={`issue-type-badge ${getIssueTypeClass(summary.issue_type)}`}>
                                            {summary.issue_type}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {!isPR && mentions.length > 0 && (
                                <div className="issue-section">
                                    <h4>Mentioned Users:</h4>
                                    {mentions.length === 1 ? (
                                        <p>@{mentions[0]}</p>
                                    ) : (
                                        <ul className="mentioned-users-list">
                                            {mentions.map((user, idx) => (
                                                <li key={idx}>@{user}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}

                            <div className="issue-section">
                                <h4>Summary:</h4>
                                <p>
                                    {typeof summary === 'object' && summary.summary
                                        ? summary.summary
                                        : 'Loading summary...'
                                    }
                                </p>
                            </div>

                            {isPR && typeof summary === 'object' && summary.code_updates && (
                                <div className="issue-section">
                                    <h4>Code updates:</h4>
                                    <p>{summary.code_updates}</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="loading">Generating summary...</p>
                    )}

                    {isPR && files.length > 0 && (
                        <div className="issue-section">
                            <h4>List of files being changed:</h4>
                            <div className="pr-files-accordion">
                                {files.map((file, idx) => {
                                    const fileKey = `${item.id}-${idx}`;
                                    const isFileExpanded = expandedFileItems[fileKey];

                                    return (
                                        <FileAccordion
                                            key={idx}
                                            file={file}
                                            prUrl={item.html_url}
                                            prId={item.id}
                                            idx={idx}
                                            isExpanded={isFileExpanded}
                                            onToggle={() => onToggleFile(item.id, idx)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="issue-meta">
                        <a href={item.html_url} target="_blank" rel="noopener noreferrer" className="github-link">
                            View on GitHub →
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
