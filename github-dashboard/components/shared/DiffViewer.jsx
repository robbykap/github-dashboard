function DiffViewer({ patch, prUrl, filename }) {
    if (!patch) {
        return (
            <div className="large-file-notice">
                <p>File is too large to display or binary file</p>
                <a
                    href={`${prUrl}/files#diff-${btoa(filename).replace(/=/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-file-link"
                >
                    View this file on GitHub →
                </a>
            </div>
        );
    }

    return (
        <div className="diff-container">
            <table className="diff-table">
                <tbody>
                    {parseDiff(patch).map((row, idx) => {
                        if (row.type === 'hunk') {
                            return (
                                <tr key={idx} className="diff-hunk-header">
                                    <td colSpan="4">{row.content}</td>
                                </tr>
                            );
                        }
                        return (
                            <tr key={idx} className={`diff-row diff-row-${row.type}`}>
                                <td className="diff-line-num">{row.leftLine || ''}</td>
                                <td className="diff-code diff-code-left">{row.leftContent}</td>
                                <td className="diff-line-num">{row.rightLine || ''}</td>
                                <td className="diff-code diff-code-right">{row.rightContent}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
