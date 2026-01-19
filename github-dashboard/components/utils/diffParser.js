// Parse unified diff into side-by-side format
function parseDiff(patch) {
    if (!patch) return [];

    const lines = patch.split('\n');
    const result = [];
    let leftLineNum = 0;
    let rightLineNum = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Parse hunk header to get line numbers
        if (line.startsWith('@@')) {
            const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
            if (match) {
                leftLineNum = parseInt(match[1]);
                rightLineNum = parseInt(match[2]);
            }
            result.push({ type: 'hunk', content: line });
            continue;
        }

        if (line.startsWith('-')) {
            // Removed line (only in left/old)
            result.push({
                type: 'remove',
                leftLine: leftLineNum++,
                leftContent: line.substring(1),
                rightLine: null,
                rightContent: ''
            });
        } else if (line.startsWith('+')) {
            // Added line (only in right/new)
            result.push({
                type: 'add',
                leftLine: null,
                leftContent: '',
                rightLine: rightLineNum++,
                rightContent: line.substring(1)
            });
        } else if (line.startsWith(' ')) {
            // Context line (in both)
            result.push({
                type: 'context',
                leftLine: leftLineNum++,
                leftContent: line.substring(1),
                rightLine: rightLineNum++,
                rightContent: line.substring(1)
            });
        }
    }

    return result;
}
