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
    return <ConfirmationModal isOpen title={config.title} message={Array.isArray(config.body) ? config.body.join('\n\n') : config.body}
        confirmLabel={config.confirmLabel} isDanger={config.dangerous} onConfirm={onConfirm} onCancel={onClose}
        theme={{ ...morkborgTheme.modal, container: `sdk-module--morkborg ${morkborgTheme.modal?.container ?? ''} mb-confirm-dialog` }} />;
}
