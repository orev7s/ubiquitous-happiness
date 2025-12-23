import { NextRequest } from 'next/server';
import {
    errorResponse,
    successResponse,
    getNextAvailableAccount,
    updateAccountLastUsed,
    createDeployment,
    updateDeploymentStatus,
    updateDeploymentUrl,
    createKoyebService,
} from '@/lib';
import { DeployBotSchema, type DeploymentResult } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = DeployBotSchema.safeParse(body);

        if (!validation.success) {
            return errorResponse(validation.error.issues[0].message);
        }

        const {
            user_id,
            discord_token,
            discord_client_id,
            discord_owner_id,
            discord_guild_id
        } = validation.data;

        const account = getNextAvailableAccount();
        if (!account) {
            return errorResponse('No available Koyeb accounts. Please try again later.', 503);
        }

        let serviceResponse;
        try {
            serviceResponse = await createKoyebService(account, {
                userId: user_id,
                discordToken: discord_token,
                discordClientId: discord_client_id,
                discordOwnerId: discord_owner_id,
                discordGuildId: discord_guild_id,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to deploy to Koyeb';
            return errorResponse(message, 500);
        }

        updateAccountLastUsed(account.id);

        const publicUrl = `https://${serviceResponse.service.name}.koyeb.app`;

        const deployment = createDeployment({
            user_id,
            service_id: serviceResponse.service.id,
            service_name: serviceResponse.service.name,
            koyeb_account_id: account.id,
            discord_token,
            discord_client_id,
            discord_owner_id,
            discord_guild_id,
            public_url: publicUrl,
            status: 'deploying',
        });

        updateDeploymentStatus(deployment.id, 'deploying');
        updateDeploymentUrl(deployment.id, publicUrl);

        const result: DeploymentResult = {
            deployment_id: deployment.id,
            service_id: serviceResponse.service.id,
            service_name: serviceResponse.service.name,
            public_url: publicUrl,
            status: 'deploying',
        };

        return successResponse(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        return errorResponse(message, 500);
    }
}
