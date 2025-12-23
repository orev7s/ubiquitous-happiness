import { z } from 'zod';

export const AddAccountSchema = z.object({
    name: z.string().min(1, 'Account name is required'),
    api_key: z.string().min(1, 'API key is required'),
    app_id: z.string().min(1, 'App ID is required'),
    instance_type: z.enum(['free', 'micro', 'small', 'medium', 'large']).default('micro'),
});

export const DeployBotSchema = z.object({
    user_id: z.string().min(1, 'User ID is required'),
    discord_token: z.string().min(1, 'Discord token is required'),
    discord_client_id: z.string().min(1, 'Discord client ID is required'),
    discord_owner_id: z.string().min(1, 'Discord owner ID is required'),
    discord_guild_id: z.string().optional(),
});

export const AdminAuthSchema = z.object({
    password: z.string().min(1, 'Password is required'),
});

export type AddAccountInput = z.infer<typeof AddAccountSchema>;
export type DeployBotInput = z.infer<typeof DeployBotSchema>;
export type AdminAuthInput = z.infer<typeof AdminAuthSchema>;

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface DeploymentResult {
    deployment_id: number;
    service_id: string;
    service_name: string;
    public_url: string | null;
    status: string;
}
