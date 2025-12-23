import { NextRequest } from 'next/server';
import {
    validateAdminAuth,
    unauthorizedResponse,
    errorResponse,
    successResponse,
    getAccountById,
    deleteAccount,
    toggleAccountEnabled,
} from '@/lib';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    if (!validateAdminAuth(request)) {
        return unauthorizedResponse();
    }

    try {
        const { id } = await params;
        const accountId = parseInt(id, 10);

        if (isNaN(accountId)) {
            return errorResponse('Invalid account ID');
        }

        const account = getAccountById(accountId);
        if (!account) {
            return errorResponse('Account not found', 404);
        }

        deleteAccount(accountId);
        return successResponse({ deleted: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete account';
        return errorResponse(message, 500);
    }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    if (!validateAdminAuth(request)) {
        return unauthorizedResponse();
    }

    try {
        const { id } = await params;
        const accountId = parseInt(id, 10);

        if (isNaN(accountId)) {
            return errorResponse('Invalid account ID');
        }

        const body = await request.json();
        const { enabled } = body;

        if (typeof enabled !== 'boolean') {
            return errorResponse('enabled field must be a boolean');
        }

        const account = getAccountById(accountId);
        if (!account) {
            return errorResponse('Account not found', 404);
        }

        toggleAccountEnabled(accountId, enabled);
        return successResponse({ updated: true, enabled });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update account';
        return errorResponse(message, 500);
    }
}
