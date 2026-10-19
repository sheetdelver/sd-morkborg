'use client';
import { useSDKComponents } from '@sheet-delver/sdk/react';
import { useDialogFocus } from './MorkBorgRollFrame';
import { morkborgTheme } from '../themes/morkborg';
import type { MorkBorgConfirmConfig } from '../types';
export default function MorkBorgConfirmModal({ config, onConfirm, onClose }: {
    config: MorkBorgConfirmConfig; onConfirm: () => void | Promise<void>; onClose: () => void;
}) {
    const { ConfirmationModal } = useSDKComponents();
    // Released shared confirmation supplies its shell/actions but no focus/keyboard contract.
    useDialogFocus(() => [...document.querySelectorAll<HTMLElement>('.mb-confirm-dialog')].at(-1) ?? null, onClose);
    return <>
        {/* The SDK portal container is the scope root; packaged utility selectors
            address descendants. Own its declared frame without host CSS leakage. */}
        <style>{`.sdk-module--morkborg.mb-confirm-dialog { position: relative; z-index: 10; width: 100%; max-width: 28rem; overflow: hidden; background: #000; border: 4px solid #000; box-shadow: 8px 8px 0 #000; }`}</style>
        <ConfirmationModal isOpen title={config.title} message={Array.isArray(config.body) ? config.body.join('\n\n') : config.body}
        confirmLabel={config.confirmLabel} isDanger={config.dangerous} onConfirm={onConfirm} onCancel={onClose}
        theme={{ ...morkborgTheme.modal, container: `sdk-module--morkborg ${morkborgTheme.modal?.container ?? ''} mb-confirm-dialog` }} />
    </>;
}
