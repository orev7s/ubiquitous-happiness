interface BadgeProps {
    status: string;
}

const statusColorMap: Record<string, string> = {
    running: 'badge-success',
    deploying: 'badge-info',
    pending: 'badge-info',
    stopped: 'badge-neutral',
    paused: 'badge-neutral',
    error: 'badge-error',
    deleted: 'badge-error',
    healthy: 'badge-success',
    unhealthy: 'badge-error',
    starting: 'badge-info',
};

export function StatusBadge({ status }: BadgeProps) {
    const colorClass = statusColorMap[status.toLowerCase()] || 'badge-neutral';
    return <span className={`badge ${colorClass}`}>{status}</span>;
}

interface EnabledBadgeProps {
    enabled: boolean;
}

export function EnabledBadge({ enabled }: EnabledBadgeProps) {
    return (
        <span className={`badge ${enabled ? 'badge-success' : 'badge-neutral'}`}>
            {enabled ? 'Enabled' : 'Disabled'}
        </span>
    );
}
