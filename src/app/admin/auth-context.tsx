'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

interface AdminAuthContextType {
    isAuthenticated: boolean;
    token: string | null;
    login: (password: string) => Promise<boolean>;
    logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

const STORAGE_KEY = 'admin_token';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
            setToken(stored);
            setIsAuthenticated(true);
        }
    }, []);

    const login = useCallback(async (password: string): Promise<boolean> => {
        try {
            const response = await fetch('/api/admin/accounts', {
                headers: {
                    'Authorization': `Bearer ${password}`,
                },
            });

            if (response.ok) {
                sessionStorage.setItem(STORAGE_KEY, password);
                setToken(password);
                setIsAuthenticated(true);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }, []);

    const logout = useCallback(() => {
        sessionStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setIsAuthenticated(false);
    }, []);

    return (
        <AdminAuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
            {children}
        </AdminAuthContext.Provider>
    );
}

export function useAdminAuth() {
    const context = useContext(AdminAuthContext);
    if (!context) {
        throw new Error('useAdminAuth must be used within AdminAuthProvider');
    }
    return context;
}

export function useAdminApi() {
    const { token } = useAdminAuth();

    const fetchApi = useCallback(async <T,>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<{ success: boolean; data?: T; error?: string }> => {
        try {
            const response = await fetch(endpoint, {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            return data;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Request failed',
            };
        }
    }, [token]);

    return { fetchApi };
}
