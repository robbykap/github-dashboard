const { useState, useEffect } = React;

function ProjectFieldsForm({
    projects,
    selectedProject,
    projectFields,
    fieldValues,
    assignees,
    onProjectSelect,
    onFieldChange,
    onAssigneesChange,
    onSubmit,
    onCancel,
    onSkip,
    isLoading
}) {
    return (
        <div className="project-fields-form">
            <h3>Configure Project Details (Optional)</h3>
            <p className="text-muted">
                Link this issue to a project board or skip to create a standalone issue.
            </p>

            {/* Project Selector */}
            <div className="form-group">
                <label>Project Board</label>
                <select
                    className="form-control"
                    value={selectedProject}
                    onChange={e => onProjectSelect(e.target.value)}
                    disabled={isLoading}
                >
                    <option value="">Select a project (optional)...</option>
                    {projects.map(project => (
                        <option key={project.id} value={project.id}>
                            {project.title}
                            {project.shortDescription && ` - ${project.shortDescription}`}
                        </option>
                    ))}
                </select>
            </div>

            {/* Assignees */}
            <div className="form-group">
                <label>Assignees (Optional)</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Enter GitHub usernames (comma-separated)"
                    value={assignees.join(', ')}
                    onChange={e => {
                        const value = e.target.value;
                        const assigneeList = value
                            .split(',')
                            .map(a => a.trim())
                            .filter(a => a.length > 0);
                        onAssigneesChange(assigneeList);
                    }}
                    disabled={isLoading}
                />
            </div>

            {/* Dynamic Project Fields */}
            {selectedProject && projectFields.length > 0 && (
                <div className="project-custom-fields">
                    <h4>Project Fields</h4>
                    {projectFields.map(field => (
                        <DynamicFieldInput
                            key={field.id}
                            field={field}
                            value={fieldValues[field.id]}
                            onChange={value => onFieldChange(field.id, value)}
                        />
                    ))}
                </div>
            )}

            <div className="form-actions">
                <button
                    className="btn btn-secondary"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    Back to Preview
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={onSkip}
                    disabled={isLoading}
                >
                    Skip Project Setup
                </button>
                <button
                    className="btn btn-primary"
                    onClick={onSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? 'Creating...' : 'Create Issue'}
                </button>
            </div>
        </div>
    );
}
