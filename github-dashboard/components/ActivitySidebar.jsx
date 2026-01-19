const { useState, useEffect } = React;

function ActivitySidebar({ items, selectedOrg, onSelectOrg }) {
    const [expanded, setExpanded] = useState({});

    // Extract unique orgs from items
    const orgs = {};
    Object.keys(items).forEach(org => {
        const orgData = items[org];
        const totalCount = orgData.issues.length + orgData.prs.length;
        if (totalCount > 0) {
            orgs[org] = {
                prCount: orgData.prs.length,
                issueCount: orgData.issues.length,
                total: totalCount
            };
        }
    });

    const orgNames = Object.keys(orgs).sort();

    useEffect(() => {
        // Auto-expand all orgs and select first one
        const autoExpand = {};
        orgNames.forEach(org => {
            autoExpand[org] = true;
        });
        setExpanded(autoExpand);

        if (orgNames.length > 0 && !selectedOrg) {
            onSelectOrg(orgNames[0]);
        }
    }, [Object.keys(items).join(',')]);

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h3>Organizations ({orgNames.length})</h3>
            </div>
            <div className="repo-list">
                {orgNames.map(org => (
                    <div key={org} className="owner-group">
                        <div
                            className={`owner-header ${selectedOrg === org ? 'selected' : ''}`}
                            onClick={() => onSelectOrg(org)}
                        >
                            <span className="owner-name">{org}</span>
                            <div className="org-counts">
                                <span className="count-badge pr-badge">{orgs[org].prCount} PRs</span>
                                <span className="count-badge issue-badge">{orgs[org].issueCount} Issues</span>
                            </div>
                        </div>
                    </div>
                ))}
                {orgNames.length === 0 && (
                    <div className="placeholder">No activity found</div>
                )}
            </div>
        </div>
    );
}
