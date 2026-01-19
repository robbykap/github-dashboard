function getPriorityLabel(priority) {
    if (priority === 1) return 'CRITICAL';
    if (priority === 2) return 'HIGH';
    if (priority === 3) return 'MEDIUM';
    return 'LOW';
}

function getPriorityClass(priority) {
    if (priority === 1) return 'priority-critical';
    if (priority === 2) return 'priority-high';
    if (priority === 3) return 'priority-medium';
    return 'priority-low';
}
