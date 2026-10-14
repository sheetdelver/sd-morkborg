'use client';

import React, { useEffect, useId, useRef, type ReactNode } from 'react';
import { Dices, Pencil } from 'lucide-react';

/** Shared by sheet rolls and the bounded SDK initiative adapter. */
export function RollEntryMode({ manual, onChange, canAuto = true, canManual = true, manualLabel = 'Manual' }: {
    manual: boolean;
    onChange: (manual: boolean) => void;
    canAuto?: boolean;
    canManual?: boolean;
    manualLabel?: string;
}) {
    return <div className="flex border border-neutral-800 mb-4">
        {(['auto', 'manual'] as const).filter(mode => mode === 'auto' ? canAuto : canManual).map(mode => <button
            key={mode} type="button" aria-pressed={(mode === 'manual') === manual}
            onClick={() => onChange(mode === 'manual')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs uppercase tracking-widest font-mono transition-all cursor-pointer ${(mode === 'manual') === manual ? 'bg-pink-900 text-white' : 'bg-black text-neutral-500 hover:text-neutral-300'}`}>
            {mode === 'auto' ? <><Dices className="w-3.5 h-3.5" /> Auto</> : <><Pencil className="w-3.5 h-3.5" /> {manualLabel}</>}
        </button>)}
    </div>;
}

export default function MorkBorgRollFrame({ title, subtitle, onClose, children }: {
    title: string;
    subtitle: string;
    onClose: () => void;
    children: ReactNode;
}) {
    const titleId = useId();
    const ref = useRef<HTMLDivElement>(null);
    const closeRef = useRef(onClose);
    useEffect(() => { closeRef.current = onClose; }, [onClose]);
    useEffect(() => {
        const prior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        ref.current?.querySelector('button')?.focus();
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeRef.current();
            if (event.key !== 'Tab') return;
            const controls = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)') || []);
            const first = controls[0], last = controls.at(-1);
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        };
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('keydown', onKey); prior?.focus(); };
    }, []);
    return <div className="fixed inset-0 z-[210] overflow-y-auto" onClick={onClose}>
        <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />
            <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId}
                className="bg-neutral-950 border-2 border-pink-900 shadow-[8px_8px_0_0_#831843] max-w-sm w-full p-6 relative -rotate-1 text-left inline-block transform transition-all"
                onClick={event => event.stopPropagation()}>
                <button type="button" onClick={onClose} aria-label="Close"
                    className="absolute -top-3 -right-3 text-2xl select-none">💀</button>
                <h2 id={titleId} className="font-imfell text-2xl text-yellow-400 uppercase tracking-wide mb-1 leading-tight">{title}</h2>
                <div className="text-pink-500 font-mono text-xs uppercase tracking-widest mb-4">{subtitle}</div>
                {children}
            </div>
        </div>
    </div>;
}
