import { useCallback, useEffect, useRef, useState } from 'react';
import { useSDK } from '@sheet-delver/sdk/react';

/** Per-consumer request retirement; the host continues to own world/document state. */
export function useScopedCatalog<T>(url: string) {
    const sdk = useSDK();
    const scope = JSON.stringify([sdk.worldId, sdk.moduleId, sdk.currentUser?.id, sdk.currentUser?.role, sdk.isConnected, url]);
    const sequence = useRef(0);
    const [retry, setRetry] = useState(0);
    const [state, setState] = useState<{ scope: string; generation: number; status: 'loading' | 'ready' | 'failed'; data?: T; error?: string }>({ scope, generation: 0, status: 'loading' });
    useEffect(() => {
        let retired = false;
        let connected = sdk.isConnected;
        let connectedWorld = sdk.worldId;
        const refresh = async (connected = sdk.isConnected) => {
            const generation = ++sequence.current;
            setState({ scope, generation, status: 'loading' });
            if (!connected || !sdk.currentUser || !sdk.worldId) {
                setState({ scope, generation, status: 'failed', error: 'Reconnect to the world to load content.' }); return;
            }
            try {
                const response = await sdk.fetchWithAuth(url, { cache: 'no-store' });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error ?? 'Content unavailable');
                if (!retired && generation === sequence.current) setState({ scope, generation, status: 'ready', data });
            } catch (e) {
                if (!retired && generation === sequence.current) setState({ scope, generation, status: 'failed', error: e instanceof Error ? e.message : 'Content unavailable' });
            }
        };
        void refresh();
        const disposers = [
            sdk.events.on('world:contextChanged', () => { void refresh(); }),
            sdk.events.on('world:ready', () => { void refresh(); }),
            sdk.events.on('world:teardown', () => { connected = false; void refresh(false); }),
            sdk.events.on('connection:changed', event => {
                // Core reports link health on every status heartbeat. A repeated
                // healthy status does not invalidate content or the user's work.
                const nextWorld = event.worldId ?? connectedWorld;
                if (event.connected === connected && nextWorld === connectedWorld) return;
                connected = event.connected; connectedWorld = nextWorld;
                void refresh(event.connected);
            }),
            sdk.events.on('document:listInvalidated', () => { void refresh(); }),
        ];
        return () => { retired = true; sequence.current++; disposers.forEach(dispose => dispose()); };
    }, [scope, retry, sdk.events, sdk.fetchWithAuth]);
    const isCurrent = useCallback((generation: number) => generation === sequence.current, []);
    return { ...(state.scope === scope ? state : { scope, generation: sequence.current, status: 'loading' as const }),
        retry: () => setRetry(n => n + 1), isCurrent };
}
