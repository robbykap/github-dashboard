const { useState } = React;

function IssuePreviewCard({ issueData, onApprove, onReject }) {
    const renderMarkdown = (text) => {
        if (!text || !window.marked || !window.DOMPurify) return text;
        try {
            const rawHTML = marked.parse(text);
            return DOMPurify.sanitize(rawHTML);
        } catch (e) {
            return text;
        }
    };

    return (
        <div className="preview-card">
            <div className="preview-header">
                <h3>Issue Preview</h3>
                <div className="preview-badges">
                    <span className={`badge badge-type badge-${issueData.issue_type}`}>
                        {issueData.issue_type}
                    </span>
                    {issueData.priority && (
                        <span className={`badge badge-priority badge-priority-${issueData.priority}`}>
                            {issueData.priority}
                        </span>
                    )}
                </div>
            </div>

            <div className="preview-content">
                <h4 className="preview-title">{issueData.title}</h4>

                <div
                    className="preview-body markdown-content"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(issueData.body) }}
                />

                {issueData.labels && issueData.labels.length > 0 && (
                    <div className="preview-labels">
                        <strong>Labels:</strong>
                        {issueData.labels.map((label, idx) => (
                            <span key={idx} className="label-badge">{label}</span>
                        ))}
                    </div>
                )}
            </div>

            <div className="preview-actions">
                <button
                    className="btn btn-secondary"
                    onClick={onReject}
                >
                    Request Changes
                </button>
                <button
                    className="btn btn-primary"
                    onClick={onApprove}
                >
                    Approve & Configure Project
                </button>
            </div>
        </div>
    );
}
