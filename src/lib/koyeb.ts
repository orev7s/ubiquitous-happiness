import {
    KOYEB_API_BASE,
    BOT_DOCKER_IMAGE,
    DEFAULT_INSTANCE_TYPE,
    DEFAULT_PORT,
    SERVICE_TYPE,
    KOYEB_STATUS_MAP,
} from '@/config/constants';
import type {
    KoyebAccount,
    KoyebServiceDefinition,
    KoyebServiceResponse,
    KoyebServiceDetails,
    KoyebDeploymentInfo,
    ServiceEnvVar,
    DeploymentStatus
} from '@/types';

interface DeployConfig {
    userId: string;
    discordToken: string;
    discordClientId: string;
    discordOwnerId: string;
    discordGuildId?: string;
}

export const createServiceDefinition = (
    account: KoyebAccount,
    config: DeployConfig
) => {
    const timestamp = Date.now();
    const serviceName = `bot-${config.userId}-${timestamp}`;
    const instanceType = account.instance_type || 'micro';
    const minScale = instanceType === 'free' ? 0 : 1;

    return {
        app_id: account.app_id,
        definition: {
            name: serviceName,
            docker: {
                image: BOT_DOCKER_IMAGE,
            },
            env: [
                { key: 'DISCORD_TOKEN', value: config.discordToken },
                { key: 'DISCORD_CLIENT_ID', value: config.discordClientId },
                { key: 'DISCORD_OWNER_ID', value: config.discordOwnerId },
                { key: 'DISCORD_GUILD_ID', value: config.discordGuildId || '' },
                { key: 'API_ENABLED', value: 'true' },
                { key: 'PORT', value: String(DEFAULT_PORT) },
            ],
            ports: [{ port: DEFAULT_PORT, protocol: 'http' }],
            routes: [{ path: '/', port: DEFAULT_PORT }],
            instance_types: [{ type: instanceType }],
            regions: ['was'],
            scalings: [{ min: minScale, max: 1 }],
        },
    };
};

export const createKoyebService = async (
    account: KoyebAccount,
    config: DeployConfig
): Promise<KoyebServiceResponse> => {
    const definition = createServiceDefinition(account, config);

    const response = await fetch(`${KOYEB_API_BASE}/services`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${account.api_key}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(definition),
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Koyeb API error (${response.status})`;
        try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorText;
        } catch {
            errorMessage = errorText || errorMessage;
        }
        console.error('Koyeb API Error:', errorMessage, 'Payload:', JSON.stringify(definition, null, 2));
        throw new Error(errorMessage);
    }

    return response.json();
};

export const getKoyebService = async (
    account: KoyebAccount,
    serviceId: string
): Promise<KoyebServiceDetails | null> => {
    const response = await fetch(`${KOYEB_API_BASE}/services/${serviceId}`, {
        headers: {
            'Authorization': `Bearer ${account.api_key}`,
        },
    });

    if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to get service: ${response.status}`);
    }

    const data = await response.json();
    return data.service;
};

export const getKoyebServiceDeployments = async (
    account: KoyebAccount,
    serviceId: string
): Promise<KoyebDeploymentInfo[]> => {
    const response = await fetch(`${KOYEB_API_BASE}/deployments?service_id=${serviceId}`, {
        headers: {
            'Authorization': `Bearer ${account.api_key}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to get deployments: ${response.status}`);
    }

    const data = await response.json();
    return data.deployments || [];
};

export const getServiceEnvVars = async (
    account: KoyebAccount,
    serviceId: string
): Promise<ServiceEnvVar[]> => {
    const deployments = await getKoyebServiceDeployments(account, serviceId);
    if (deployments.length === 0) return [];

    const latestDeployment = deployments[0];
    return latestDeployment.definition?.env || [];
};

export const pauseKoyebService = async (
    account: KoyebAccount,
    serviceId: string
): Promise<void> => {
    const response = await fetch(`${KOYEB_API_BASE}/services/${serviceId}/pause`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${account.api_key}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to pause service: ${response.status}`);
    }
};

export const resumeKoyebService = async (
    account: KoyebAccount,
    serviceId: string
): Promise<void> => {
    const response = await fetch(`${KOYEB_API_BASE}/services/${serviceId}/resume`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${account.api_key}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to resume service: ${response.status}`);
    }
};

export const deleteKoyebService = async (
    account: KoyebAccount,
    serviceId: string
): Promise<void> => {
    const response = await fetch(`${KOYEB_API_BASE}/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${account.api_key}`,
        },
    });

    if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete service: ${response.status}`);
    }
};

export const redeployKoyebService = async (
    account: KoyebAccount,
    serviceId: string
): Promise<void> => {
    const response = await fetch(`${KOYEB_API_BASE}/services/${serviceId}/redeploy`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${account.api_key}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to redeploy service: ${response.status}`);
    }
};

export const mapKoyebStatus = (koyebStatus: string): DeploymentStatus => {
    const normalized = koyebStatus?.toUpperCase() || 'PENDING';
    return (KOYEB_STATUS_MAP[normalized] || 'pending') as DeploymentStatus;
};

export const getServicePublicUrl = (serviceName: string, appName?: string): string => {
    return `https://${serviceName}-${appName || 'app'}.koyeb.app`;
};

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
    try {
        const response = await fetch(`${KOYEB_API_BASE}/apps`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });
        return response.ok;
    } catch {
        return false;
    }
};
