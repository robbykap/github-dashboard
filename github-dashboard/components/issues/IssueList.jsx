const { useState } = React;

function IssueList({ issues, summaries, priorities, mentionedUsers, onToggle, expandedItems }) {
    const [issuesExpanded, setIssuesExpanded] = useState(true);

    return (
        <div className="accordion-section">
            <div
                className="accordion-header"
                onClick={() => setIssuesExpanded(!issuesExpanded)}
            >
                <span className="accordion-toggle">{issuesExpanded ? '▼' : '▶'}</span>
                <span className="accordion-title">Issues ({issues.length})</span>
            </div>
            {issuesExpanded && (
                <div className="accordion-content">
                    {issues.length === 0 && (
                        <p className="placeholder">No open issues</p>
                    )}
                    {issues.map(issue => (
                        <IssueItem
                            key={issue.id}
                            issue={issue}
                            summary={summaries[issue.id]}
                            priority={priorities[issue.id]}
                            mentions={mentionedUsers[issue.id] || []}
                            isExpanded={expandedItems[issue.id]}
                            onToggle={() => onToggle(issue.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
