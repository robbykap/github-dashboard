const { useState } = React;

function CollapsibleSection({ title, isExpanded, onToggle, children, defaultExpanded = true }) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    const handleToggle = () => {
        if (onToggle) {
            onToggle();
        } else {
            setExpanded(!expanded);
        }
    };

    const actualExpanded = onToggle !== undefined ? isExpanded : expanded;

    return (
        <div className={`collapsible-section ${actualExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="section-header" onClick={handleToggle}>
                <div className="section-header-content">
                    <span className="section-icon">{actualExpanded ? '▼' : '▶'}</span>
                    <h3>{title}</h3>
                </div>
            </div>
            {actualExpanded && (
                <div className="section-content">
                    {children}
                </div>
            )}
        </div>
    );
}
