export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { startPingService } = await import('./lib/ping-service');
        startPingService();
    }
}
