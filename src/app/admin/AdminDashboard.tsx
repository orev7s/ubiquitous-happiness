'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth, useAdminApi } from './auth-context';
import { Modal, useToast, StatusBadge, EnabledBadge, Dropdown, DropdownItem, Spinner } from '@/components';

interface Account {
    id: number;
    name: string;
    api_key: string;
    app_id: string;
    instance_type: string;
    enabled: number;
    last_used_at: string | null;
    created_at: string;
}

interface Deployment {
    id: number;
    user_id: string;
    service_id: string;
    service_name: string;
    koyeb_account_id: number;
    discord_token: string;
    discord_client_id: string;
    discord_owner_id: string;
    discord_guild_id: string | null;
    public_url: string | null;
    status: string;
    ping_enabled: number;
    last_ping_at: string | null;
    created_at: string;
    account_name: string;
}

interface Stats {
    accounts: { total: number; enabled: number };
    deployments: { total: number; running: number; error: number; pinging: number };
}

interface EnvVar {
    key: string;
    value: string;
}

interface DeploymentDetails {
    deployment: Deployment;
    service: unknown;
    envVars: EnvVar[];
}

export function AdminDashboard() {
    const { logout } = useAdminAuth();
    const { fetchApi } = useAdminApi();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<'accounts' | 'deployments'>('accounts');
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [deployments, setDeployments] = useState<Deployment[]>([]);
    const [stats, setStats] = useState<Stats>({
        accounts: { total: 0, enabled: 0 },
        deployments: { total: 0, running: 0, error: 0, pinging: 0 },
    });
    const [loading, setLoading] = useState(true);
    const [showAddAccount, setShowAddAccount] = useState(false);
    const [showDetails, setShowDetails] = useState<DeploymentDetails | null>(null);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const loadAccounts = useCallback(async () => {
        const result = await fetchApi<{ accounts: Account[]; stats: { total: number; enabled: number } }>('/api/admin/accounts');
        if (result.success && result.data) {
            setAccounts(result.data.accounts);
            setStats(prev => ({ ...prev, accounts: result.data!.stats }));
        }
    }, [fetchApi]);

    const loadDeployments = useCallback(async () => {
        const result = await fetchApi<{ deployments: Deployment[]; stats: { total: number; running: number; error: number; pinging: number } }>('/api/admin/deployments');
        if (result.success && result.data) {
            setDeployments(result.data.deployments);
            setStats(prev => ({ ...prev, deployments: result.data!.stats }));
        }
    }, [fetchApi]);

    const loadData = useCallback(async () => {
        setLoading(true);
        await Promise.all([loadAccounts(), loadDeployments()]);
        setLoading(false);
    }, [loadAccounts, loadDeployments]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleAddAccount = async (data: { name: string; api_key: string; app_id: string; instance_type: string }) => {
        const result = await fetchApi('/api/admin/accounts', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        if (result.success) {
            showToast('Account added successfully', 'success');
            setShowAddAccount(false);
            loadAccounts();
        } else {
            showToast(result.error || 'Failed to add account', 'error');
        }
    };

    const handleToggleAccount = async (id: number, enabled: boolean) => {
        setActionLoading(id);
        const result = await fetchApi(`/api/admin/accounts/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ enabled }),
        });

        if (result.success) {
            showToast(`Account ${enabled ? 'enabled' : 'disabled'}`, 'success');
            loadAccounts();
        } else {
            showToast(result.error || 'Failed to update account', 'error');
        }
        setActionLoading(null);
    };

    const handleDeleteAccount = async (id: number) => {
        if (!confirm('Are you sure you want to delete this account?')) return;

        setActionLoading(id);
        const result = await fetchApi(`/api/admin/accounts/${id}`, {
            method: 'DELETE',
        });

        if (result.success) {
            showToast('Account deleted', 'success');
            loadAccounts();
        } else {
            showToast(result.error || 'Failed to delete account', 'error');
        }
        setActionLoading(null);
    };

    const handleDeploymentAction = async (id: number, action: string) => {
        setActionLoading(id);
        const result = await fetchApi(`/api/admin/deployments/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ action }),
        });

        if (result.success) {
            showToast(`Action "${action}" executed successfully`, 'success');
            loadDeployments();
        } else {
            showToast(result.error || 'Action failed', 'error');
        }
        setActionLoading(null);
    };

    const handleDeleteDeployment = async (id: number) => {
        if (!confirm('This will delete the bot from Koyeb. Are you sure?')) return;

        setActionLoading(id);
        const result = await fetchApi(`/api/admin/deployments/${id}`, {
            method: 'DELETE',
        });

        if (result.success) {
            showToast('Deployment deleted', 'success');
            loadDeployments();
        } else {
            showToast(result.error || 'Failed to delete deployment', 'error');
        }
        setActionLoading(null);
    };

    const handleViewDetails = async (id: number) => {
        setActionLoading(id);
        const result = await fetchApi<DeploymentDetails>(`/api/admin/deployments/${id}`);

        if (result.success && result.data) {
            setShowDetails(result.data);
        } else {
            showToast(result.error || 'Failed to load details', 'error');
        }
        setActionLoading(null);
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spinner size={32} />
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh' }}>
            <nav className="nav">
                <span className="nav-brand">Bot Platform</span>
                <div className="nav-links">
                    <button
                        className={`btn ${activeTab === 'accounts' ? 'btn-secondary' : 'btn-ghost'} btn-sm`}
                        onClick={() => setActiveTab('accounts')}
                    >
                        Accounts
                    </button>
                    <button
                        className={`btn ${activeTab === 'deployments' ? 'btn-secondary' : 'btn-ghost'} btn-sm`}
                        onClick={() => setActiveTab('deployments')}
                    >
                        Deployments
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={logout}>
                        Logout
                    </button>
                </div>
            </nav>

            <div className="container">
                <div className="grid-stats">
                    <div className="stat-card">
                        <span className="stat-label">Total Accounts</span>
                        <span className="stat-value">{stats.accounts.total}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Enabled Accounts</span>
                        <span className="stat-value">{stats.accounts.enabled}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Total Deployments</span>
                        <span className="stat-value">{stats.deployments.total}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Running</span>
                        <span className="stat-value" style={{ color: 'var(--accent-success)' }}>
                            {stats.deployments.running}
                        </span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Errors</span>
                        <span className="stat-value" style={{ color: 'var(--accent-error)' }}>
                            {stats.deployments.error}
                        </span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Pinging</span>
                        <span className="stat-value" style={{ color: 'var(--accent-info)' }}>
                            {stats.deployments.pinging}
                        </span>
                    </div>
                </div>

                {activeTab === 'accounts' && (
                    <div>
                        <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                            <h2 className="card-title">Koyeb Accounts</h2>
                            <button className="btn btn-primary btn-sm" onClick={() => setShowAddAccount(true)}>
                                Add Account
                            </button>
                        </div>

                        {accounts.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📦</div>
                                <div className="empty-state-title">No accounts yet</div>
                                <p>Add a Koyeb account to start deploying bots</p>
                            </div>
                        ) : (
                            <div className="table-wrapper">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>App ID</th>
                                            <th>Instance</th>
                                            <th>Status</th>
                                            <th>Last Used</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {accounts.map(account => (
                                            <tr key={account.id}>
                                                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                                    {account.name}
                                                </td>
                                                <td className="text-mono truncate">{account.app_id}</td>
                                                <td><span className="badge badge-info">{account.instance_type || 'micro'}</span></td>
                                                <td><EnabledBadge enabled={account.enabled === 1} /></td>
                                                <td>
                                                    {account.last_used_at
                                                        ? new Date(account.last_used_at).toLocaleDateString()
                                                        : 'Never'}
                                                </td>
                                                <td>
                                                    <div className="actions-row">
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            onClick={() => handleToggleAccount(account.id, account.enabled !== 1)}
                                                            disabled={actionLoading === account.id}
                                                        >
                                                            {account.enabled === 1 ? 'Disable' : 'Enable'}
                                                        </button>
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            onClick={() => handleDeleteAccount(account.id)}
                                                            disabled={actionLoading === account.id}
                                                            style={{ color: 'var(--accent-error)' }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'deployments' && (
                    <div>
                        <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                            <h2 className="card-title">Bot Deployments</h2>
                            <button className="btn btn-secondary btn-sm" onClick={loadDeployments}>
                                Refresh
                            </button>
                        </div>

                        {deployments.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">🤖</div>
                                <div className="empty-state-title">No deployments yet</div>
                                <p>Bots deployed from the public page will appear here</p>
                            </div>
                        ) : (
                            <div className="table-wrapper">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>User ID</th>
                                            <th>Service</th>
                                            <th>Account</th>
                                            <th>Status</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deployments.map(dep => (
                                            <tr key={dep.id}>
                                                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                                    {dep.user_id}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                        <span className="text-mono" style={{ fontSize: 13 }}>
                                                            {dep.service_name}
                                                        </span>
                                                        {dep.public_url && (
                                                            <a
                                                                href={dep.public_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{ fontSize: 12 }}
                                                            >
                                                                {dep.public_url}
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>{dep.account_name || 'Unknown'}</td>
                                                <td><StatusBadge status={dep.status} /></td>
                                                <td>{new Date(dep.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <Dropdown
                                                        trigger={
                                                            <button className="btn btn-ghost btn-sm" disabled={actionLoading === dep.id}>
                                                                {actionLoading === dep.id ? <Spinner size={14} /> : 'Actions ▾'}
                                                            </button>
                                                        }
                                                    >
                                                        <DropdownItem onClick={() => handleViewDetails(dep.id)}>
                                                            View Details
                                                        </DropdownItem>
                                                        <DropdownItem onClick={() => handleDeploymentAction(dep.id, 'sync')}>
                                                            Sync Status
                                                        </DropdownItem>
                                                        <DropdownItem onClick={() => handleDeploymentAction(dep.id, 'pause')}>
                                                            Pause
                                                        </DropdownItem>
                                                        <DropdownItem onClick={() => handleDeploymentAction(dep.id, 'resume')}>
                                                            Resume
                                                        </DropdownItem>
                                                        <DropdownItem onClick={() => handleDeploymentAction(dep.id, 'redeploy')}>
                                                            Redeploy
                                                        </DropdownItem>
                                                        <DropdownItem onClick={() => handleDeploymentAction(dep.id, dep.ping_enabled ? 'ping_disable' : 'ping_enable')}>
                                                            {dep.ping_enabled ? '🔕 Disable Ping' : '🔔 Enable Ping'}
                                                        </DropdownItem>
                                                        <DropdownItem danger onClick={() => handleDeleteDeployment(dep.id)}>
                                                            Delete
                                                        </DropdownItem>
                                                    </Dropdown>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <AddAccountModal
                isOpen={showAddAccount}
                onClose={() => setShowAddAccount(false)}
                onSubmit={handleAddAccount}
            />

            <DeploymentDetailsModal
                details={showDetails}
                onClose={() => setShowDetails(null)}
            />
        </div>
    );
}

function AddAccountModal({
    isOpen,
    onClose,
    onSubmit,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { name: string; api_key: string; app_id: string; instance_type: string }) => Promise<void>;
}) {
    const [name, setName] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [appId, setAppId] = useState('');
    const [instanceType, setInstanceType] = useState('micro');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSubmit({ name, api_key: apiKey, app_id: appId, instance_type: instanceType });
        setLoading(false);
        setName('');
        setApiKey('');
        setAppId('');
        setInstanceType('micro');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Koyeb Account"
            footer={
                <>
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={loading || !name || !apiKey || !appId}
                    >
                        {loading ? <Spinner size={16} /> : 'Add Account'}
                    </button>
                </>
            }
        >
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="label">Account Name</label>
                    <input
                        className="input"
                        placeholder="e.g., Production Account 1"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label className="label">API Key</label>
                    <input
                        className="input"
                        type="password"
                        placeholder="Your Koyeb API key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                    />
                    <p className="form-hint">
                        Get your API key from Koyeb Dashboard → Account → API
                    </p>
                </div>
                <div className="form-group">
                    <label className="label">App ID</label>
                    <input
                        className="input"
                        placeholder="The Koyeb App ID to deploy services to"
                        value={appId}
                        onChange={(e) => setAppId(e.target.value)}
                    />
                    <p className="form-hint">
                        Find in your app URL: app.koyeb.com/apps/[app-id]
                    </p>
                </div>
                <div className="form-group">
                    <label className="label">Instance Type</label>
                    <select
                        className="input"
                        value={instanceType}
                        onChange={(e) => setInstanceType(e.target.value)}
                    >
                        <option value="free">Free (scales to 0)</option>
                        <option value="micro">Micro (always-on)</option>
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                    </select>
                    <p className="form-hint">
                        Free instances sleep when idle. Paid instances stay online 24/7.
                    </p>
                </div>
            </form>
        </Modal>
    );
}

function DeploymentDetailsModal({
    details,
    onClose,
}: {
    details: DeploymentDetails | null;
    onClose: () => void;
}) {
    if (!details) return null;

    const { deployment, envVars } = details;

    return (
        <Modal isOpen={true} onClose={onClose} title="Deployment Details">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                    <h4 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                        SERVICE INFO
                    </h4>
                    <div className="card" style={{ padding: 16 }}>
                        <div style={{ display: 'grid', gap: 12 }}>
                            <div>
                                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Service Name</span>
                                <div className="text-mono">{deployment.service_name}</div>
                            </div>
                            <div>
                                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Service ID</span>
                                <div className="text-mono" style={{ fontSize: 12 }}>{deployment.service_id}</div>
                            </div>
                            <div>
                                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Status</span>
                                <div><StatusBadge status={deployment.status} /></div>
                            </div>
                            {deployment.public_url && (
                                <div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Public URL</span>
                                    <div>
                                        <a href={deployment.public_url} target="_blank" rel="noopener noreferrer">
                                            {deployment.public_url}
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <h4 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                        ENVIRONMENT VARIABLES
                    </h4>
                    <div className="env-list">
                        {envVars.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                                No environment variables found
                            </p>
                        ) : (
                            envVars.map((env, i) => (
                                <div key={i} className="env-item">
                                    <span className="env-key">{env.key}</span>
                                    <span className="env-value">{env.value}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
