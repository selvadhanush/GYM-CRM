import { Layers } from 'lucide-react';

const EmptyState = ({
    icon: Icon = Layers,
    title = 'No Data Found',
    description = 'There are no records available to display right now.',
    primaryAction = null,
    secondaryAction = null,
    style = {}
}) => {
    return (
        <div className="empty-state-container" style={style}>
            <div className="empty-state-icon-wrapper">
                <Icon className="empty-state-icon" size={32} />
            </div>
            <h3 className="empty-state-title">{title}</h3>
            <p className="empty-state-description">{description}</p>
            {(primaryAction || secondaryAction) && (
                <div className="empty-state-actions">
                    {primaryAction && (
                        <button
                            onClick={primaryAction.onClick}
                            className="btn btn-primary"
                        >
                            {primaryAction.label}
                        </button>
                    )}
                    {secondaryAction && (
                        <button
                            onClick={secondaryAction.onClick}
                            className="btn btn-secondary"
                        >
                            {secondaryAction.label}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default EmptyState;
