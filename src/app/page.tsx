'use client';

import { useState } from 'react';
import { ToastProvider, useToast, Spinner, StatusBadge } from '@/components';

interface DeploymentResult {
  deployment_id: number;
  service_id: string;
  service_name: string;
  public_url: string | null;
  status: string;
}

function DeployForm() {
  const { showToast } = useToast();

  const [userId, setUserId] = useState('');
  const [discordToken, setDiscordToken] = useState('');
  const [clientId, setClientId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [guildId, setGuildId] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeploymentResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          discord_token: discordToken,
          discord_client_id: clientId,
          discord_owner_id: ownerId,
          discord_guild_id: guildId || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        showToast('Bot deployment started!', 'success');
      } else {
        setError(data.error || 'Deployment failed');
        showToast(data.error || 'Deployment failed', 'error');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      setError(message);
      showToast(message, 'error');
    }

    setLoading(false);
  };

  const resetForm = () => {
    setUserId('');
    setDiscordToken('');
    setClientId('');
    setOwnerId('');
    setGuildId('');
    setResult(null);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 72,
            height: 72,
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, #8B5CF6 100%)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 style={{
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: 12,
            background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Deploy Your Bot
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 360, margin: '0 auto' }}>
            Launch your Discord bot in seconds. Just enter your credentials and we&apos;ll handle the rest.
          </p>
        </div>

        {result ? (
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{
              width: 56,
              height: 56,
              background: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="var(--accent-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
              Deployment Started!
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              Your bot is being deployed. It may take a few minutes to become available.
            </p>

            <div style={{
              background: 'var(--bg-base)',
              borderRadius: 'var(--radius-md)',
              padding: 16,
              marginBottom: 24,
              textAlign: 'left',
            }}>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Status</span>
                  <div style={{ marginTop: 4 }}><StatusBadge status={result.status} /></div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Service Name</span>
                  <div className="text-mono" style={{ fontSize: 13 }}>{result.service_name}</div>
                </div>
                {result.public_url && (
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Public URL</span>
                    <div>
                      <a
                        href={result.public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 13, wordBreak: 'break-all' }}
                      >
                        {result.public_url}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={resetForm}>
              Deploy Another Bot
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card">
            <div className="form-group">
              <label className="label" htmlFor="userId">User ID *</label>
              <input
                id="userId"
                className="input"
                placeholder="e.g., user123"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
              />
              <p className="form-hint">A unique identifier for your bot deployment</p>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="discordToken">Discord Bot Token *</label>
              <input
                id="discordToken"
                className="input"
                type="password"
                placeholder="Your bot token from Discord Developer Portal"
                value={discordToken}
                onChange={(e) => setDiscordToken(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="clientId">Discord Client ID *</label>
              <input
                id="clientId"
                className="input"
                placeholder="e.g., 123456789012345678"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="ownerId">Discord Owner ID *</label>
              <input
                id="ownerId"
                className="input"
                placeholder="Your Discord user ID"
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="guildId">Discord Guild ID (Optional)</label>
              <input
                id="guildId"
                className="input"
                placeholder="For guild-specific commands"
                value={guildId}
                onChange={(e) => setGuildId(e.target.value)}
              />
            </div>

            {error && (
              <div style={{
                padding: 12,
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--accent-error)',
                fontSize: 14,
                marginBottom: 20,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: 48 }}
              disabled={loading || !userId || !discordToken || !clientId || !ownerId}
            >
              {loading ? (
                <>
                  <Spinner size={18} />
                  <span>Deploying...</span>
                </>
              ) : (
                'Deploy Bot'
              )}
            </button>
          </form>
        )}

        <p style={{
          textAlign: 'center',
          marginTop: 24,
          fontSize: 13,
          color: 'var(--text-muted)',
        }}>
          Need help? Check the <a href="https://discord.com/developers/docs" target="_blank" rel="noopener noreferrer">Discord Developer Docs</a>
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <ToastProvider>
      <DeployForm />
    </ToastProvider>
  );
}
