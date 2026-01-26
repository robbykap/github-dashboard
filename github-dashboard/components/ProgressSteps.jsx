function ProgressSteps({ currentStep }) {
    const steps = [
        { id: 1, label: 'Chat', state: 'chatting' },
        { id: 2, label: 'Configure', state: 'editing_fields' },
        { id: 3, label: 'Complete', state: 'completed' }
    ];

    const getStepStatus = (stepId) => {
        const stepIndex = steps.findIndex(s => s.id === stepId);
        const currentIndex = steps.findIndex(s => s.state === currentStep);

        if (stepIndex < currentIndex || currentStep === 'completed') {
            return 'completed';
        } else if (stepIndex === currentIndex) {
            return 'active';
        } else {
            return 'pending';
        }
    };

    return (
        <div className="progress-steps">
            {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                    <div className={`progress-step ${getStepStatus(step.id)}`}>
                        <div className="step-number">
                            {getStepStatus(step.id) === 'completed' ? '✓' : step.id}
                        </div>
                        <div className="step-label">{step.label}</div>
                    </div>
                    {index < steps.length - 1 && (
                        <div className={`step-connector ${getStepStatus(step.id + 1) !== 'pending' ? 'active' : ''}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}
