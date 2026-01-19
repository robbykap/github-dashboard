const { useState } = React;

function PRList({ prs, summaries, prFiles, onToggle, expandedItems, expandedFileItems, onToggleFile }) {
    const [prsExpanded, setPrsExpanded] = useState(true);

    return (
        <div className="accordion-section">
            <div
                className="accordion-header"
                onClick={() => setPrsExpanded(!prsExpanded)}
            >
                <span className="accordion-toggle">{prsExpanded ? '▼' : '▶'}</span>
                <span className="accordion-title">Pull Requests ({prs.length})</span>
            </div>
            {prsExpanded && (
                <div className="accordion-content">
                    {prs.length === 0 && (
                        <p className="placeholder">No open pull requests</p>
                    )}
                    {prs.map(pr => (
                        <PRItem
                            key={pr.id}
                            pr={pr}
                            summary={summaries[pr.id]}
                            files={prFiles[pr.id] || []}
                            isExpanded={expandedItems[pr.id]}
                            expandedFileItems={expandedFileItems}
                            onToggle={() => onToggle(pr.id)}
                            onToggleFile={onToggleFile}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
