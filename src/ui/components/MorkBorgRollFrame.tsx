'use client';
import React, { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Dices, Pencil } from 'lucide-react';

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
            const controls = () => [...root.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex]:not([tabindex="-1"])')].filter(el => el.getClientRects().length > 0);
            controls()[0]?.focus();
            const onKey = (e: KeyboardEvent) => {
                if (dialogs.at(-1) !== root || !root.contains(document.activeElement)) return;
                if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close.current(); }
                if (e.key === 'Tab') {
                    const all = controls(), first = all[0], last = all.at(-1);
                    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
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
    const titleId = useId(), root = useRef<HTMLDivElement>(null), layer = useRef<HTMLDivElement>(null);
    useDialogFocus(() => root.current, onClose);
    useEffect(() => {
        const oldOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const siblings = [...document.body.children].filter(el => el !== layer.current) as HTMLElement[];
        const previous = siblings.map(el => [el, el.inert] as const);
        siblings.forEach(el => { el.inert = true; });
        return () => { previous.forEach(([el, inert]) => { el.inert = inert; }); document.body.style.overflow = oldOverflow; };
    }, []);
    const content = <div ref={layer} className="sdk-module--morkborg"><div className="fixed inset-0 z-[120] overflow-y-auto bg-black/80 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
        <div className="flex min-h-full items-center justify-center p-4 pointer-events-none">
            <div ref={root} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`pointer-events-auto bg-neutral-950 text-white border-2 border-pink-900 shadow-[8px_8px_0_0_#831843] ${wide ? 'max-w-2xl' : 'max-w-sm'} w-full p-5 sm:p-6 my-6 relative text-left`}>
                <button type="button" onClick={onClose} aria-label={`Close ${title}`} className="absolute top-2 right-3 text-xl text-pink-400">×</button>
                <h2 id={titleId} className="font-imfell text-2xl text-yellow-400 uppercase pr-8 mb-2">{title}</h2>
                {subtitle && <p className="text-pink-400 text-xs font-mono mb-4">{subtitle}</p>}
                {children}
            </div>
        </div>
    </div></div>;
    return typeof document === 'undefined' ? content : createPortal(content, document.body);
}
