export const KOYEB_API_BASE = 'https://app.koyeb.com/v1';

export const BOT_DOCKER_IMAGE = 'ghcr.io/orev7s/botmanifest:latest';

export const DEFAULT_INSTANCE_TYPE = 'micro';

export const DEFAULT_PORT = 3000;

export const SERVICE_TYPE = 'WEB';

export const DEPLOYMENT_STATUSES = {
    PENDING: 'pending',
    DEPLOYING: 'deploying',
    RUNNING: 'running',
    STOPPED: 'stopped',
    ERROR: 'error',
    DELETED: 'deleted',
} as const;

export const KOYEB_STATUS_MAP: Record<string, string> = {
    STARTING: 'deploying',
    HEALTHY: 'running',
    UNHEALTHY: 'error',
    STOPPING: 'stopped',
    STOPPED: 'stopped',
    ERRORING: 'error',
    ERROR: 'error',
    DELETING: 'deleted',
    DELETED: 'deleted',
    PENDING: 'pending',
    PROVISIONING: 'deploying',
    SLEEPING: 'stopped',
};
