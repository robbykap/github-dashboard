function IssueItem({ issue, summary, priority, mentions, isExpanded, onToggle }) {
    return (
        <div className="item-accordion">
            <div
                className="item-accordion-header"
                onClick={onToggle}
            >
                <span className="accordion-toggle">{isExpanded ? '▼' : '▶'}</span>
                <div className="item-preview">
                    <div className="item-preview-title">
                        <span>#{issue.number} {issue.title}</span>
                        {priority && (
                            <span className={`priority-badge ${getPriorityClass(priority)}`}>
                                #{priority} {getPriorityLabel(priority)}
                            </span>
                        )}
                    </div>
                    <div className="item-preview-meta">
                        <span>By <strong>{issue.user.login}</strong> • {issue.comments} comments</span>
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
                            {typeof summary === 'object' && summary.issue_type && (
                                <div className="issue-section">
                                    <h4>Issue Type:</h4>
                                    <div>
                                        <span className={`issue-type-badge ${getIssueTypeClass(summary.issue_type)}`}>
                                            {summary.issue_type}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {mentions.length > 0 && (
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
                        </>
                    ) : (
                        <p className="loading">Generating summary...</p>
                    )}

                    <div className="issue-meta">
                        <a href={issue.html_url} target="_blank" rel="noopener noreferrer" className="github-link">
                            View on GitHub →
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
