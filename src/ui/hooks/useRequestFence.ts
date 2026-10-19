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
        const retire = () => { epoch.current++; };
        const disposers = [sdk.events.on('world:contextChanged', retire), sdk.events.on('world:ready', retire),
            sdk.events.on('world:teardown', retire), sdk.events.on('connection:changed', retire)];
        return () => { mounted.current = false; retire(); disposers.forEach(dispose => dispose()); };
    }, [sdk.events]);
    return useCallback(() => { const started = epoch.current; return () => mounted.current && epoch.current === started; }, []);
}
