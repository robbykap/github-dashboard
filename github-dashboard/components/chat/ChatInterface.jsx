function ChatInterface({ messages, inputValue, isLoading, flowState, messagesEndRef, onInputChange, onSendMessage, onNewTicket, onKeyPress }) {
    return (
        <div className="chat-column">
            <div className="card chat-container">
                <div className="chat-header">
                    <h3>Chat with AI Assistant</h3>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={onNewTicket}
                        disabled={isLoading}
                    >
                        New Ticket
                    </button>
                </div>

                <div className="chat-messages">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`message message-${msg.role}`}>
                            <div
                                className="message-content markdown-content"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                            />
                        </div>
                    ))}
                    {isLoading && (
                        <div className="message message-assistant">
                            <div className="message-content typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-container">
                    <textarea
                        className="chat-input"
                        value={inputValue}
                        onChange={(e) => onInputChange(e.target.value)}
                        onKeyPress={onKeyPress}
                        placeholder="Type your message..."
                        disabled={isLoading || flowState !== 'chatting'}
                        rows="3"
                    />
                    <button
                        className="btn btn-primary"
                        onClick={onSendMessage}
                        disabled={!inputValue.trim() || isLoading || flowState !== 'chatting'}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
