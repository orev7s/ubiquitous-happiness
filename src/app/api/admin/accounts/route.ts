import { NextRequest } from 'next/server';
import {
    validateAdminAuth,
    unauthorizedResponse,
    errorResponse,
    successResponse,
    getAllAccounts,
    createAccount,
    getAccountCount,
} from '@/lib';
import { AddAccountSchema } from '@/types';

export async function GET(request: NextRequest) {
    if (!validateAdminAuth(request)) {
        return unauthorizedResponse();
    }

    try {
        const accounts = getAllAccounts();
        const stats = getAccountCount();

        const safeAccounts = accounts.map(acc => ({
            ...acc,
            api_key: acc.api_key.substring(0, 8) + '...',
        }));

        return successResponse({ accounts: safeAccounts, stats });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch accounts';
        return errorResponse(message, 500);
    }
}

export async function POST(request: NextRequest) {
    if (!validateAdminAuth(request)) {
        return unauthorizedResponse();
    }

    try {
        const body = await request.json();
        const validation = AddAccountSchema.safeParse(body);

        if (!validation.success) {
            return errorResponse(validation.error.issues[0].message);
        }

        const { name, api_key, app_id, instance_type } = validation.data;
        const account = createAccount(name, api_key, app_id, instance_type);

        return successResponse({
            account: {
                ...account,
                api_key: account.api_key.substring(0, 8) + '...',
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create account';
        return errorResponse(message, 500);
    }
}
