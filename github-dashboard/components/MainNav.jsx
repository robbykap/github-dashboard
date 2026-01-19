function MainNav({ activeView, onViewChange }) {
    return (
        <div className="main-nav">
            <button
                className={`main-nav-btn ${activeView === 'repos' ? 'active' : ''}`}
                onClick={() => onViewChange('repos')}
            >
                Repositories
            </button>
            <button
                className={`main-nav-btn ${activeView === 'activity' ? 'active' : ''}`}
                onClick={() => onViewChange('activity')}
            >
                My Activity
            </button>
        </div>
    );
}
