'use client';

import { AdminAuthProvider, useAdminAuth } from './auth-context';
import { ToastProvider } from '@/components';
import { LoginForm } from './LoginForm';
import { AdminDashboard } from './AdminDashboard';

function AdminContent() {
    const { isAuthenticated } = useAdminAuth();

    if (!isAuthenticated) {
        return <LoginForm />;
    }

    return <AdminDashboard />;
}

export default function AdminPage() {
    return (
        <ToastProvider>
            <AdminAuthProvider>
                <AdminContent />
            </AdminAuthProvider>
        </ToastProvider>
    );
}
