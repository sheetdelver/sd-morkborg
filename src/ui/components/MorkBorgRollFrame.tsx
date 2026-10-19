'use client';
import React, { useEffect, useLayoutEffect, useId, useRef, type ReactNode } from 'react';
import { Dices, Pencil } from 'lucide-react';
import { useSDK } from '@sheet-delver/sdk/react';

export function RollEntryMode({ manual, onChange, canAuto = true, canManual = true, manualLabel = 'Manual' }: {
    manual: boolean; onChange: (manual: boolean) => void; canAuto?: boolean; canManual?: boolean; manualLabel?: string;
}) {
    return <div className="flex border border-neutral-800 mb-4">
        {(['auto', 'manual'] as const).filter(mode => mode === 'auto' ? canAuto : canManual).map(mode => <button
            key={mode} type="button" aria-pressed={(mode === 'manual') === manual} onClick={() => onChange(mode === 'manual')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs uppercase font-mono ${((mode === 'manual') === manual) ? 'bg-pink-900 text-white' : 'bg-black text-neutral-300'}`}>
            {mode === 'auto' ? <><Dices className="w-3 h-3" /> Auto</> : <><Pencil className="w-3 h-3" /> {manualLabel}</>}
        </button>)}
    </div>;
}
const dialogs: HTMLElement[] = [];
export function useDialogFocus(find: () => HTMLElement | null, onClose: () => void) {
    const close = useRef(onClose); close.current = onClose;
    useEffect(() => {
        let cleanup: (() => void) | undefined;
        const attach = () => {
            const root = find();
            if (!root || cleanup) return;
            const prior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true');
            if (!root.hasAttribute('aria-label') && !root.hasAttribute('aria-labelledby')) root.setAttribute('aria-label', root.querySelector('h2,h3')?.textContent ?? 'Confirmation');
            dialogs.push(root);
            const controls = () => [...root.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[contenteditable=true],a[href],[tabindex]:not([tabindex="-1"])')].filter(el => el.getClientRects().length > 0);
            controls()[0]?.focus();
            const onKey = (e: KeyboardEvent) => {
                // A saved editor can remove its focused button. Recover only body
                // focus; another mounted dialog's focused control retains authority.
                const lostFocus = document.activeElement === document.body;
                if (dialogs.at(-1) !== root || (!root.contains(document.activeElement) && !lostFocus)) return;
                if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close.current(); }
                if (e.key === 'Tab') {
                    const all = controls(), first = all[0], last = all.at(-1);
                    if (lostFocus) { e.preventDefault(); (e.shiftKey ? last : first)?.focus(); }
                    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
                    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
                }
            };
            document.addEventListener('keydown', onKey, true);
            cleanup = () => { document.removeEventListener('keydown', onKey, true); dialogs.splice(dialogs.indexOf(root), 1); queueMicrotask(() => { if (prior?.isConnected && !prior.closest('[inert]')) prior.focus(); }); };
        };
        attach();
        const observer = new MutationObserver(attach); observer.observe(document.body, { childList: true, subtree: true });
        return () => { observer.disconnect(); cleanup?.(); };
    }, []);
}
/** Shared form composition: public RollDialog cannot represent raw combat/item forms. */
export default function MorkBorgRollFrame({ title, subtitle = '', onClose, children, wide = false }: {
    title: string; subtitle?: string; onClose: () => void; children: ReactNode; wide?: boolean;
}) {
    const titleId = useId(), dialog = useRef<HTMLDialogElement>(null);
    const { events } = useSDK();
    const close = useRef(onClose); close.current = onClose;
    const yielded = useRef(false);
    useEffect(() => events.on('content:shared', ({ kind }) => {
        if (!kind) return;
        // Core owns shared presentation. An HTML top-layer form must retire
        // before Core's overlay can receive pointer/keyboard focus.
        yielded.current = true;
        close.current();
    }), [events]);
    useLayoutEffect(() => {
        const node = dialog.current;
        if (!node) return;
        const prior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const oldOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        // The browser top layer supplies containment, focus order and Escape.
        // Released installed Core does not expose react-dom.createPortal.
        node.showModal();
        return () => {
            // Close before DOM removal so the browser restores the trigger
            // before Core's newly mounted overlay captures its return focus.
            if (node.open) node.close();
            document.body.style.overflow = oldOverflow;
            queueMicrotask(() => { if (!yielded.current && prior?.isConnected && !prior.closest('[inert]')) prior.focus(); });
        };
    }, []);
    return <dialog ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId}
        className="sdk-module--morkborg mb-form-dialog"
        style={{ position: 'fixed', inset: 0, margin: 0, width: '100vw', height: '100dvh', maxWidth: 'none', maxHeight: 'none', padding: 0, border: 0, background: 'transparent', overflowY: 'auto' }}
        onKeyDown={event => {
            if (event.key !== 'Tab' || !dialog.current) return;
            const controls = [...dialog.current.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[contenteditable=true],a[href],[tabindex]:not([tabindex="-1"])')].filter(el => el.getClientRects().length > 0);
            const first = controls[0], last = controls.at(-1);
            // Browser chrome is otherwise a native dialog's next Tab stop.
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }}
        onCancel={event => { event.preventDefault(); onClose(); }}>
        <style>{`.sdk-module--morkborg.mb-form-dialog::backdrop { background: rgba(0,0,0,.8); backdrop-filter: blur(4px); }`}</style>
        <div className="flex min-h-full items-center justify-center p-4" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
            <div className={`bg-neutral-950 text-white border-2 border-pink-900 shadow-[8px_8px_0_0_#831843] ${wide ? 'max-w-2xl' : 'max-w-sm'} w-full p-5 sm:p-6 my-6 relative text-left`}>
                <button type="button" onClick={onClose} aria-label={`Close ${title}`} className="absolute top-2 right-3 text-xl text-pink-400">×</button>
                <h2 id={titleId} className="font-imfell text-2xl text-yellow-400 uppercase pr-8 mb-2">{title}</h2>
                {subtitle && <p className="text-pink-400 text-xs font-mono mb-4">{subtitle}</p>}
                {children}
            </div>
        </div>
    </dialog>;
}
