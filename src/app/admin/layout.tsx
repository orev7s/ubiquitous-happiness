import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Admin Panel - Bot Platform',
    description: 'Manage Koyeb accounts and bot deployments',
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
