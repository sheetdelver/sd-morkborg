'use client';

import { useEffect } from 'react';

import { Check } from 'lucide-react';

import { type MorkBorgConfirmConfig } from '../types';

interface MorkBorgConfirmModalProps {
    config: MorkBorgConfirmConfig;
    onConfirm: () => void;
    onClose: () => void;
}

export default function MorkBorgConfirmModal({
    config,
    onConfirm,
    onClose,
}: MorkBorgConfirmModalProps) {
    const paragraphs = Array.isArray(config.body) ? config.body : [config.body];

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter') onConfirm();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose, onConfirm]);

    return (
        <div
            className="fixed inset-0 z-[200] overflow-y-auto"
            onClick={onClose}
        >
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />
                <div
                    className="bg-neutral-950 border-2 border-pink-900 shadow-[8px_8px_0_0_#831843] max-w-sm w-full p-6 relative rotate-1 my-8"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Title bar */}
                    <div className="flex items-center justify-between mb-5 border-b border-pink-900/50 pb-3">
                        <h2 className={`$"font-imfell" text-2xl text-yellow-400 uppercase tracking-widest leading-tight`}>
                            {config.title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-neutral-500 hover:text-white transition-colors text-sm font-mono uppercase tracking-widest cursor-pointer"
                        >
                            ✕ Close
                        </button>
                    </div>

                    {/* Body text */}
                    <div className="mb-6 space-y-3">
                        {paragraphs.map((p, i) => (
                            <p key={i} className="text-neutral-200 text-base leading-relaxed">
                                {p}
                            </p>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className={`$"font-imfell" flex-1 bg-black hover:bg-neutral-900 text-neutral-300 text-xl py-2 px-4 border-2 border-neutral-700 tracking-widest uppercase transition-colors cursor-pointer`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`$"font-imfell" flex-1 flex items-center justify-center gap-2 text-white text-xl py-2 px-4 border-2 tracking-widest uppercase transition-colors shadow-[4px_4px_0_0_#000] cursor-pointer ${config.dangerous
                                ? 'bg-red-900 hover:bg-red-700 border-red-500'
                                : 'bg-pink-900 hover:bg-pink-700 border-pink-500'
                                }`}
                        >
                            {config.confirmIcon ?? <Check className="w-5 h-5" />}
                            {config.confirmLabel ?? 'Confirm'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
