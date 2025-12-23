import { NextRequest } from 'next/server';
import {
    validateAdminAuth,
    unauthorizedResponse,
    errorResponse,
    successResponse,
    getDeploymentById,
    deleteDeployment,
    updateDeploymentStatus,
    getAccountById,
    deleteKoyebService,
    pauseKoyebService,
    resumeKoyebService,
    redeployKoyebService,
    getKoyebService,
    getServiceEnvVars,
    mapKoyebStatus,
} from '@/lib';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    if (!validateAdminAuth(request)) {
        return unauthorizedResponse();
    }

    try {
        const { id } = await params;
        const deploymentId = parseInt(id, 10);

        if (isNaN(deploymentId)) {
            return errorResponse('Invalid deployment ID');
        }

        const deployment = getDeploymentById(deploymentId);
        if (!deployment) {
            return errorResponse('Deployment not found', 404);
        }

        const account = getAccountById(deployment.koyeb_account_id);
        if (!account) {
            return errorResponse('Associated Koyeb account not found', 404);
        }

        const [service, envVars] = await Promise.all([
            getKoyebService(account, deployment.service_id),
            getServiceEnvVars(account, deployment.service_id),
        ]);

        const maskedEnvVars = envVars.map(env => ({
            key: env.key,
            value: env.key.includes('TOKEN') || env.key.includes('SECRET')
                ? env.value.substring(0, 10) + '...'
                : env.value,
        }));

        return successResponse({
            deployment: {
                ...deployment,
                discord_token: deployment.discord_token.substring(0, 10) + '...',
            },
            service,
            envVars: maskedEnvVars,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch deployment details';
        return errorResponse(message, 500);
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    if (!validateAdminAuth(request)) {
        return unauthorizedResponse();
    }

    try {
        const { id } = await params;
        const deploymentId = parseInt(id, 10);

        if (isNaN(deploymentId)) {
            return errorResponse('Invalid deployment ID');
        }

        const deployment = getDeploymentById(deploymentId);
        if (!deployment) {
            return errorResponse('Deployment not found', 404);
        }

        const account = getAccountById(deployment.koyeb_account_id);
        if (account) {
            await deleteKoyebService(account, deployment.service_id);
        }

        deleteDeployment(deploymentId);
        return successResponse({ deleted: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete deployment';
        return errorResponse(message, 500);
    }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    if (!validateAdminAuth(request)) {
        return unauthorizedResponse();
    }

    try {
        const { id } = await params;
        const deploymentId = parseInt(id, 10);

        if (isNaN(deploymentId)) {
            return errorResponse('Invalid deployment ID');
        }

        const body = await request.json();
        const { action } = body;

        const validActions = ['pause', 'resume', 'redeploy', 'sync'];
        if (!validActions.includes(action)) {
            return errorResponse(`Invalid action. Must be one of: ${validActions.join(', ')}`);
        }

        const deployment = getDeploymentById(deploymentId);
        if (!deployment) {
            return errorResponse('Deployment not found', 404);
        }

        const account = getAccountById(deployment.koyeb_account_id);
        if (!account) {
            return errorResponse('Associated Koyeb account not found', 404);
        }

        switch (action) {
            case 'pause':
                await pauseKoyebService(account, deployment.service_id);
                updateDeploymentStatus(deploymentId, 'stopped');
                break;
            case 'resume':
                await resumeKoyebService(account, deployment.service_id);
                updateDeploymentStatus(deploymentId, 'deploying');
                break;
            case 'redeploy':
                await redeployKoyebService(account, deployment.service_id);
                updateDeploymentStatus(deploymentId, 'deploying');
                break;
            case 'sync':
                const service = await getKoyebService(account, deployment.service_id);
                if (service) {
                    const status = mapKoyebStatus(service.status);
                    updateDeploymentStatus(deploymentId, status);
                    return successResponse({ synced: true, status });
                } else {
                    updateDeploymentStatus(deploymentId, 'deleted');
                    return successResponse({ synced: true, status: 'deleted' });
                }
        }

        return successResponse({ action, success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to perform action';
        return errorResponse(message, 500);
    }
}
