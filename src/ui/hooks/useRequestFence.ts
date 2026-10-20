import { useCallback, useEffect, useRef } from 'react';
import { useSDK } from '@sheet-delver/sdk/react';

/** Retire consumer feedback, never cancel/replay an already submitted native write. */
export function useRequestFence(subject: string) {
    const sdk = useSDK();
    const scope = JSON.stringify([sdk.worldId, sdk.moduleId, sdk.currentUser?.id, sdk.currentUser?.role, sdk.isConnected, subject]);
    const previous = useRef(scope), epoch = useRef(0), mounted = useRef(true);
    if (previous.current !== scope) { previous.current = scope; epoch.current++; }
    useEffect(() => {
        mounted.current = true;
        let connected = sdk.isConnected;
        let worldId = sdk.worldId;
        const retire = () => { epoch.current++; };
        const disposers = [sdk.events.on('world:contextChanged', retire), sdk.events.on('world:ready', retire),
            sdk.events.on('world:teardown', () => { connected = false; retire(); }),
            sdk.events.on('connection:changed', event => {
                const nextWorld = event.worldId ?? worldId;
                if (event.connected === connected && nextWorld === worldId) return;
                connected = event.connected; worldId = nextWorld; retire();
            })];
        return () => { mounted.current = false; retire(); disposers.forEach(dispose => dispose()); };
    }, [sdk.events, sdk.isConnected, sdk.worldId]);
    return useCallback(() => { const started = epoch.current; return () => mounted.current && epoch.current === started; }, []);
}
