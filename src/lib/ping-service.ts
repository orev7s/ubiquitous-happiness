import { getDeploymentsWithPingEnabled, updateDeploymentLastPing } from './deployments';

const PING_INTERVAL_MS = 4 * 60 * 1000;

let pingIntervalId: NodeJS.Timeout | null = null;

export const pingDeployment = async (url: string): Promise<boolean> => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response.ok;
    } catch {
        return false;
    }
};

export const pingAllEnabledDeployments = async (): Promise<{ success: number; failed: number }> => {
    const deployments = getDeploymentsWithPingEnabled();
    let success = 0;
    let failed = 0;

    for (const deployment of deployments) {
        if (deployment.public_url) {
            const ok = await pingDeployment(deployment.public_url);
            if (ok) {
                updateDeploymentLastPing(deployment.id);
                success++;
            } else {
                failed++;
            }
        }
    }

    return { success, failed };
};

export const startPingService = (): void => {
    if (pingIntervalId) return;

    console.log('[Ping Service] Starting keep-alive pinger...');

    pingAllEnabledDeployments();

    pingIntervalId = setInterval(async () => {
        const result = await pingAllEnabledDeployments();
        if (result.success > 0 || result.failed > 0) {
            console.log(`[Ping Service] Pinged ${result.success} success, ${result.failed} failed`);
        }
    }, PING_INTERVAL_MS);
};

export const stopPingService = (): void => {
    if (pingIntervalId) {
        clearInterval(pingIntervalId);
        pingIntervalId = null;
        console.log('[Ping Service] Stopped');
    }
};
