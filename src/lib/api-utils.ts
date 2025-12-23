import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';

export const validateAdminAuth = (request: NextRequest): boolean => {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return false;

    const password = authHeader.substring(7);
    return password === process.env.ADMIN_PASSWORD;
};

export const unauthorizedResponse = (): NextResponse<ApiResponse> => {
    return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
    );
};

export const errorResponse = (message: string, status = 400): NextResponse<ApiResponse> => {
    return NextResponse.json(
        { success: false, error: message },
        { status }
    );
};

export const successResponse = <T>(data: T): NextResponse<ApiResponse<T>> => {
    return NextResponse.json({ success: true, data });
};
