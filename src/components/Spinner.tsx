export function Spinner({ size = 20 }: { size?: number }) {
    return (
        <div
            className="spinner"
            style={{ width: size, height: size }}
        />
    );
}

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
    return (
        <div className="empty-state">
            <Spinner size={32} />
            <p style={{ marginTop: 16 }}>{message}</p>
        </div>
    );
}
