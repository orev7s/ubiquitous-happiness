import { NextRequest } from 'next/server';
import {
    validateAdminAuth,
    unauthorizedResponse,
    successResponse,
    errorResponse,
} from '@/lib';
import { pingAllEnabledDeployments } from '@/lib/ping-service';
import { getDeploymentsWithPingEnabled } from '@/lib/deployments';

export async function GET(request: NextRequest) {
    if (!validateAdminAuth(request)) {
        return unauthorizedResponse();
    }

    try {
        const deployments = getDeploymentsWithPingEnabled();
        return successResponse({
            count: deployments.length,
            deployments: deployments.map(d => ({
                id: d.id,
                service_name: d.service_name,
                public_url: d.public_url,
                last_ping_at: d.last_ping_at,
            }))
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get ping status';
        return errorResponse(message, 500);
    }
}

export async function POST(request: NextRequest) {
    if (!validateAdminAuth(request)) {
        return unauthorizedResponse();
    }

    try {
        const result = await pingAllEnabledDeployments();
        return successResponse(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Ping failed';
        return errorResponse(message, 500);
    }
}
