'use client';

import React, { useState } from 'react';

import grunge from '../assets/grunge.png';
import { randomRotation } from './utils';



import { type MorkBorgRollType, type MorkBorgRollOptions } from '../types';

interface RestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRoll: (type: MorkBorgRollType, key: string, options: MorkBorgRollOptions) => void;
    actor: any;
}

export default function RestModal({
    isOpen,
    onClose,
    onRoll,
    actor
}: RestModalProps) {
    const [restLength, setRestLength] = useState<'short' | 'long'>('short');
    const [foodAndDrink, setFoodAndDrink] = useState<'eat' | 'donteat' | 'starve'>('eat');
    const [infected, setInfected] = useState(false);

    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const memoizedRotation = React.useMemo(() => randomRotation(), []);

    if (!isOpen) return null;

    const handleRest = () => {
        const options = {
            restLength,
            foodAndDrink,
            infected
        };
        onRoll('rest', 'rest', options);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[100] overflow-y-auto animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md" aria-hidden="true" />
                <div
                    className={`relative w-full max-w-[450px] bg-black border-[4px] border-black shadow-[20px_20px_0_0_rgba(255,20,147,0.1)] overflow-hidden transform ${memoizedRotation} my-8`}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Grunge Texture Overlay */}
                    <div
                        className="absolute inset-0 opacity-40 pointer-events-none mix-blend-overlay"
                        style={{ backgroundImage: `url(${grunge.src})`, backgroundSize: 'cover' }}
                    />

                    {/* Header */}
                    <div className="flex justify-between items-center px-4 py-2 bg-neutral-900 border-b-2 border-pink-600/30 relative z-10">
                        <span className={`$"font-imfell" text-xl uppercase tracking-[0.2em] text-white brightness-125`}>REST</span>
                        <button
                            onClick={onClose}
                            className="text-neutral-500 hover:text-white transition-colors flex items-center gap-1 uppercase text-[10px] font-bold tracking-widest"
                        >
                            ✕ Close
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-8 space-y-8 relative z-10 bg-black/40">

                        {/* Rest Length */}
                        <section className="space-y-4">
                            <h3 className={`$"font-imfell" text-3xl text-white border-b border-white/10 pb-1 flex items-center gap-2`}>
                                Rest Length
                            </h3>
                            <div className="space-y-3">
                                <label className="flex items-start gap-3 group cursor-pointer">
                                    <input
                                        type="radio"
                                        name="restLength"
                                        checked={restLength === 'short'}
                                        onChange={() => setRestLength('short')}
                                        className="mt-1 accent-pink-600 w-4 h-4"
                                    />
                                    <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">
                                        <strong className="text-white block uppercase tracking-wide">Short</strong>
                                        Catch your breath, have a drink. Restore d4 HP.
                                    </span>
                                </label>
                                <label className="flex items-start gap-3 group cursor-pointer">
                                    <input
                                        type="radio"
                                        name="restLength"
                                        checked={restLength === 'long'}
                                        onChange={() => setRestLength('long')}
                                        className="mt-1 accent-pink-600 w-4 h-4"
                                    />
                                    <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">
                                        <strong className="text-white block uppercase tracking-wide">Long</strong>
                                        Full night&apos;s sleep. Restore d6 HP, regain Omens if depleted, regain PRE+d4 Power uses for the day.
                                    </span>
                                </label>
                            </div>
                        </section>

                        {/* Food and Drink */}
                        <section className="space-y-4">
                            <h3 className={`$"font-imfell" text-3xl text-white border-b border-white/10 pb-1`}>
                                Food and Drink
                            </h3>
                            <div className="space-y-3">
                                <label className="flex items-start gap-3 group cursor-pointer">
                                    <input
                                        type="radio"
                                        name="foodAndDrink"
                                        checked={foodAndDrink === 'eat'}
                                        onChange={() => setFoodAndDrink('eat')}
                                        className="mt-1 accent-white w-4 h-4"
                                    />
                                    <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">
                                        <strong className="text-white block uppercase tracking-wide">Eat & Drink</strong>
                                        Restore stats as above, deduct food or drink.
                                    </span>
                                </label>
                                <label className="flex items-start gap-3 group cursor-pointer">
                                    <input
                                        type="radio"
                                        name="foodAndDrink"
                                        checked={foodAndDrink === 'donteat'}
                                        onChange={() => setFoodAndDrink('donteat')}
                                        className="mt-1 accent-white w-4 h-4"
                                    />
                                    <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">
                                        <strong className="text-white block uppercase tracking-wide">Don&apos;t eat or drink</strong>
                                        Restore no stats.
                                    </span>
                                </label>
                                <label className="flex items-start gap-3 group cursor-pointer">
                                    <input
                                        type="radio"
                                        name="foodAndDrink"
                                        checked={foodAndDrink === 'starve'}
                                        onChange={() => setFoodAndDrink('starve')}
                                        className="mt-1 accent-white w-4 h-4"
                                    />
                                    <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">
                                        <strong className="text-white block uppercase tracking-wide">Starve</strong>
                                        2+ days without food or drink. Restore no stats, lose d4 HP/day.
                                    </span>
                                </label>
                            </div>
                        </section>

                        {/* Infection */}
                        <section className="space-y-4">
                            <h3 className={`$"font-imfell" text-3xl text-white border-b border-white/10 pb-1`}>
                                Infection
                            </h3>
                            <label className="flex items-start gap-3 group cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={infected}
                                    onChange={(e) => setInfected(e.target.checked)}
                                    className="mt-1 accent-red-600 w-4 h-4"
                                />
                                <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">
                                    <strong className="text-red-500 block uppercase tracking-wide text-xs">Infected</strong>
                                    Restore no stats, lose d6 HP per day.
                                </span>
                            </label>
                        </section>
                    </div>

                    {/* Footer / Rest Button */}
                    <div className="p-4 bg-white relative z-10">
                        <button
                            onClick={handleRest}
                            className="w-full bg-white hover:bg-neutral-100 text-black py-4 border-2 border-black flex items-center justify-center gap-3 shadow-[8px_8px_0_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all group"
                        >
                            <span className={`$"font-imfell" text-4xl font-bold tracking-widest`}>REST</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
