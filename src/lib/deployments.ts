import { getDatabase } from './database';
import type { Deployment, DeploymentWithAccount, DeploymentStatus } from '@/types';

export const getAllDeployments = (): DeploymentWithAccount[] => {
    const db = getDatabase();
    return db.prepare(`
    SELECT d.*, ka.name as account_name 
    FROM deployments d 
    LEFT JOIN koyeb_accounts ka ON d.koyeb_account_id = ka.id 
    ORDER BY d.created_at DESC
  `).all() as DeploymentWithAccount[];
};

export const getDeploymentById = (id: number): DeploymentWithAccount | undefined => {
    const db = getDatabase();
    return db.prepare(`
    SELECT d.*, ka.name as account_name 
    FROM deployments d 
    LEFT JOIN koyeb_accounts ka ON d.koyeb_account_id = ka.id 
    WHERE d.id = ?
  `).get(id) as DeploymentWithAccount | undefined;
};

export const getDeploymentByServiceId = (serviceId: string): Deployment | undefined => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM deployments WHERE service_id = ?').get(serviceId) as Deployment | undefined;
};

export const getDeploymentsByUserId = (userId: string): DeploymentWithAccount[] => {
    const db = getDatabase();
    return db.prepare(`
    SELECT d.*, ka.name as account_name 
    FROM deployments d 
    LEFT JOIN koyeb_accounts ka ON d.koyeb_account_id = ka.id 
    WHERE d.user_id = ?
    ORDER BY d.created_at DESC
  `).all(userId) as DeploymentWithAccount[];
};

export const createDeployment = (data: {
    user_id: string;
    service_id: string;
    service_name: string;
    koyeb_account_id: number;
    discord_token: string;
    discord_client_id: string;
    discord_owner_id: string;
    discord_guild_id?: string;
    public_url?: string;
    status?: DeploymentStatus;
}): Deployment => {
    const db = getDatabase();
    const result = db.prepare(`
    INSERT INTO deployments (
      user_id, service_id, service_name, koyeb_account_id,
      discord_token, discord_client_id, discord_owner_id, discord_guild_id,
      public_url, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
        data.user_id,
        data.service_id,
        data.service_name,
        data.koyeb_account_id,
        data.discord_token,
        data.discord_client_id,
        data.discord_owner_id,
        data.discord_guild_id || null,
        data.public_url || null,
        data.status || 'pending'
    );

    return getDeploymentById(result.lastInsertRowid as number) as Deployment;
};

export const updateDeploymentStatus = (id: number, status: DeploymentStatus): boolean => {
    const db = getDatabase();
    const result = db.prepare('UPDATE deployments SET status = ? WHERE id = ?').run(status, id);
    return result.changes > 0;
};

export const updateDeploymentUrl = (id: number, publicUrl: string): boolean => {
    const db = getDatabase();
    const result = db.prepare('UPDATE deployments SET public_url = ? WHERE id = ?').run(publicUrl, id);
    return result.changes > 0;
};

export const deleteDeployment = (id: number): boolean => {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM deployments WHERE id = ?').run(id);
    return result.changes > 0;
};

export const getDeploymentStats = (): { total: number; running: number; error: number; pinging: number } => {
    const db = getDatabase();
    const total = db.prepare('SELECT COUNT(*) as count FROM deployments').get() as { count: number };
    const running = db.prepare("SELECT COUNT(*) as count FROM deployments WHERE status = 'running'").get() as { count: number };
    const error = db.prepare("SELECT COUNT(*) as count FROM deployments WHERE status = 'error'").get() as { count: number };
    const pinging = db.prepare("SELECT COUNT(*) as count FROM deployments WHERE ping_enabled = 1").get() as { count: number };
    return { total: total.count, running: running.count, error: error.count, pinging: pinging.count };
};

export const toggleDeploymentPing = (id: number, enabled: boolean): boolean => {
    const db = getDatabase();
    const result = db.prepare('UPDATE deployments SET ping_enabled = ? WHERE id = ?').run(enabled ? 1 : 0, id);
    return result.changes > 0;
};

export const getDeploymentsWithPingEnabled = (): Deployment[] => {
    const db = getDatabase();
    return db.prepare("SELECT * FROM deployments WHERE ping_enabled = 1 AND public_url IS NOT NULL").all() as Deployment[];
};

export const updateDeploymentLastPing = (id: number): void => {
    const db = getDatabase();
    db.prepare("UPDATE deployments SET last_ping_at = datetime('now') WHERE id = ?").run(id);
};
