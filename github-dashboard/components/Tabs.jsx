function Tabs({ active, onChange }) {
    const tabs = [
        { id: 'create', label: 'Create Ticket' },
        { id: 'view', label: 'View Issues' }
    ];

    return (
        <div className="tabs">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    className={`tab ${active === tab.id ? 'active' : ''}`}
                    onClick={() => onChange(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
