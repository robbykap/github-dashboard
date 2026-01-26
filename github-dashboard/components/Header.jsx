function Header({ username }) {
    return (
        <div className="header">
            <h1>Collaboration Coordinator</h1>
            <p>GitHub Project Management {username && `• ${username}`}</p>
        </div>
    );
}
