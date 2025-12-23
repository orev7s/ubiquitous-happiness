import { NextRequest } from 'next/server';
import {
    validateAdminAuth,
    unauthorizedResponse,
    errorResponse,
    successResponse,
    getAllDeployments,
    getDeploymentStats,
} from '@/lib';

export async function GET(request: NextRequest) {
    if (!validateAdminAuth(request)) {
        return unauthorizedResponse();
    }

    try {
        const deployments = getAllDeployments();
        const stats = getDeploymentStats();

        const safeDeployments = deployments.map(dep => ({
            ...dep,
            discord_token: dep.discord_token.substring(0, 10) + '...',
        }));

        return successResponse({ deployments: safeDeployments, stats });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch deployments';
        return errorResponse(message, 500);
    }
}
