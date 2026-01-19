function renderMarkdown(text) {
    if (!text || !window.marked || !window.DOMPurify) return text || '';
    try {
        const rawHTML = marked.parse(text);
        return DOMPurify.sanitize(rawHTML);
    } catch (e) {
        console.error('Markdown rendering error:', e);
        return text || '';
    }
}
