const { useState, useEffect } = React;

function LiveIssuePreview({ conversationHistory, messages, previewData, flowState, onApprove, onReject }) {
    const [displayData, setDisplayData] = useState({
        title: '',
        body: '',
        labels: [],
        type: '',
        priority: ''
    });

    useEffect(() => {
        if (previewData) {
            // Use AI-provided preview data
            setDisplayData({
                title: previewData.title || '',
                body: previewData.body || '',
                labels: previewData.labels || [],
                type: previewData.issue_type || '',
                priority: previewData.priority || ''
            });
        } else {
            // Reset to empty if no preview data
            setDisplayData({
                title: '',
                body: '',
                labels: [],
                type: '',
                priority: ''
            });
        }
    }, [previewData]);

    const renderMarkdown = (text) => {
        if (!text || !window.marked || !window.DOMPurify) return text || '';
        try {
            const rawHTML = marked.parse(text);
            return DOMPurify.sanitize(rawHTML);
        } catch (e) {
            console.error('Markdown rendering error in preview:', e);
            return text || '';
        }
    };

    const hasAnyContent = displayData.title || displayData.body || displayData.type ||
                       displayData.priority || displayData.labels.length > 0;
    const isEmpty = !hasAnyContent;
    const isReviewMode = flowState === 'preview' || flowState === 'editing_fields' || flowState === 'creating';

    return (
        <div className="live-preview-container">
            <div className="live-preview-header">
                <h3>{isReviewMode ? '📋 Issue Preview' : 'Live Preview'}</h3>
                {!isEmpty && !isReviewMode && (
                    <span className="preview-status">AI Generated</span>
                )}
                {isReviewMode && (
                    <span className="preview-status preview-status-ready">Ready for Review</span>
                )}
            </div>

            {isEmpty ? (
                <div className="live-preview-empty">
                    <div className="empty-icon">💬</div>
                    <p>Start chatting to build your issue...</p>
                    <p className="empty-hint">The AI will generate a preview as you provide details</p>
                </div>
            ) : (
                <div className="live-preview-content">
                    {!isReviewMode && (
                        <div className="preview-progress">
                            <small>
                                Building your issue...
                                {displayData.title && ' ✓ Title'}
                                {displayData.type && ' ✓ Type'}
                                {displayData.body && ' ✓ Description'}
                            </small>
                        </div>
                    )}

                    {displayData.title && (
                        <div className="preview-title-section">
                            <label>Title</label>
                            <h4>{displayData.title}</h4>
                        </div>
                    )}

                    {displayData.type && (
                        <div className="preview-metadata">
                            <span className={`badge badge-type badge-${displayData.type}`}>
                                {displayData.type}
                            </span>
                            {displayData.priority && (
                                <span className={`badge badge-priority badge-priority-${displayData.priority}`}>
                                    {displayData.priority}
                                </span>
                            )}
                        </div>
                    )}

                    {displayData.body ? (
                        <div className="preview-body-section">
                            <label>Description</label>
                            <div
                                className="markdown-content"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(displayData.body) }}
                            />
                        </div>
                    ) : displayData.title && !isReviewMode ? (
                        <div className="preview-body-section preview-incomplete">
                            <label>Description</label>
                            <p className="preview-placeholder">
                                Continue the conversation to add more details...
                            </p>
                        </div>
                    ) : null}

                    {displayData.labels.length > 0 && (
                        <div className="preview-labels-section">
                            <label>Suggested Labels</label>
                            <div className="preview-labels">
                                {displayData.labels.map((label, idx) => (
                                    <span key={idx} className="label-badge">{label}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {!isReviewMode && (
                        <div className="preview-note">
                            <small>This preview is generated by AI and will be refined as you provide more details.</small>
                        </div>
                    )}

                    {/* Show action buttons in review mode */}
                    {flowState === 'preview' && onApprove && onReject && (
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
                    )}
                </div>
            )}
        </div>
    );
}
