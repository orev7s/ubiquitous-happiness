import { getDatabase } from './database';
import type { KoyebAccount } from '@/types';

export const getAllAccounts = (): KoyebAccount[] => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM koyeb_accounts ORDER BY created_at DESC').all() as KoyebAccount[];
};

export const getEnabledAccounts = (): KoyebAccount[] => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM koyeb_accounts WHERE enabled = 1 ORDER BY last_used_at ASC NULLS FIRST').all() as KoyebAccount[];
};

export const getAccountById = (id: number): KoyebAccount | undefined => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM koyeb_accounts WHERE id = ?').get(id) as KoyebAccount | undefined;
};

export const createAccount = (name: string, apiKey: string, appId: string, instanceType: string = 'micro'): KoyebAccount => {
    const db = getDatabase();
    const result = db.prepare(
        'INSERT INTO koyeb_accounts (name, api_key, app_id, instance_type) VALUES (?, ?, ?, ?)'
    ).run(name, apiKey, appId, instanceType);

    return getAccountById(result.lastInsertRowid as number) as KoyebAccount;
};

export const deleteAccount = (id: number): boolean => {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM koyeb_accounts WHERE id = ?').run(id);
    return result.changes > 0;
};

export const toggleAccountEnabled = (id: number, enabled: boolean): boolean => {
    const db = getDatabase();
    const result = db.prepare('UPDATE koyeb_accounts SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, id);
    return result.changes > 0;
};

export const updateAccountLastUsed = (id: number): void => {
    const db = getDatabase();
    db.prepare("UPDATE koyeb_accounts SET last_used_at = datetime('now') WHERE id = ?").run(id);
};

export const getNextAvailableAccount = (): KoyebAccount | null => {
    const accounts = getEnabledAccounts();
    if (accounts.length === 0) return null;
    return accounts[0];
};

export const getAccountCount = (): { total: number; enabled: number } => {
    const db = getDatabase();
    const total = db.prepare('SELECT COUNT(*) as count FROM koyeb_accounts').get() as { count: number };
    const enabled = db.prepare('SELECT COUNT(*) as count FROM koyeb_accounts WHERE enabled = 1').get() as { count: number };
    return { total: total.count, enabled: enabled.count };
};
