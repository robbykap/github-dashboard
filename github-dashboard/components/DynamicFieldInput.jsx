function DynamicFieldInput({ field, value, onChange }) {
    // Render different input types based on field.dataType
    switch (field.dataType) {
        case 'SINGLE_SELECT':
            return (
                <div className="form-group">
                    <label>{field.name}</label>
                    <select
                        className="form-control"
                        value={value || ''}
                        onChange={e => onChange(e.target.value)}
                    >
                        <option value="">Select...</option>
                        {field.options && field.options.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                    </select>
                </div>
            );

        case 'TEXT':
            return (
                <div className="form-group">
                    <label>{field.name}</label>
                    <input
                        type="text"
                        className="form-control"
                        value={value || ''}
                        onChange={e => onChange(e.target.value)}
                    />
                </div>
            );

        case 'NUMBER':
            return (
                <div className="form-group">
                    <label>{field.name}</label>
                    <input
                        type="number"
                        className="form-control"
                        value={value || ''}
                        onChange={e => onChange(e.target.value)}
                    />
                </div>
            );

        case 'DATE':
            return (
                <div className="form-group">
                    <label>{field.name}</label>
                    <input
                        type="date"
                        className="form-control"
                        value={value || ''}
                        onChange={e => onChange(e.target.value)}
                    />
                </div>
            );

        case 'ITERATION':
            return (
                <div className="form-group">
                    <label>{field.name}</label>
                    <select
                        className="form-control"
                        value={value || ''}
                        onChange={e => onChange(e.target.value)}
                    >
                        <option value="">Select iteration...</option>
                        {field.configuration && field.configuration.iterations &&
                            field.configuration.iterations.map(iteration => (
                                <option key={iteration.id} value={iteration.id}>
                                    {iteration.title}
                                </option>
                            ))}
                    </select>
                </div>
            );

        default:
            return null;
    }
}
