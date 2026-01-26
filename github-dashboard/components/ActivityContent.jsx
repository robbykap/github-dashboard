const { useState } = React;

function ActivityContent({ items, activeTab, token }) {
    const {
        summaries,
        prFiles,
        mentionedUsers,
        priorities,
        completedSummaries,
        totalSummaries
    } = useActivitySummaries(items);

    const [expandedItems, setExpandedItems] = useState({});
    const [expandedFileItems, setExpandedFileItems] = useState({});

    const toggleItem = (id) => {
        setExpandedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const toggleFile = (itemId, fileIdx) => {
        const key = `${itemId}-${fileIdx}`;
        setExpandedFileItems(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    return (
        <div className="activity-content">
            {totalSummaries > 0 && completedSummaries < totalSummaries && (
                <p className="loading">
                    Generating summaries... ({completedSummaries}/{totalSummaries} complete)
                </p>
            )}
            {items.map(item => (
                <ActivityItem
                    key={item.id}
                    item={item}
                    summary={summaries[item.id]}
                    files={prFiles[item.id] || []}
                    mentions={mentionedUsers[item.id] || []}
                    priority={priorities[item.id]}
                    isExpanded={expandedItems[item.id]}
                    expandedFileItems={expandedFileItems}
                    onToggle={() => toggleItem(item.id)}
                    onToggleFile={toggleFile}
                />
            ))}
        </div>
    );
}
