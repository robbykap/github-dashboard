function getIssueTypeClass(type) {
    const typeMap = {
        'bug': 'issue-type-bug',
        'feature': 'issue-type-feature',
        'documentation': 'issue-type-docs',
        'enhancement': 'issue-type-enhancement',
        'question': 'issue-type-question'
    };
    return typeMap[type] || 'issue-type-default';
}
