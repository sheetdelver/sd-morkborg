'use client';

import React, { useState } from 'react';

import grunge from '../assets/grunge.png';
import { randomRotation } from './utils';



import { type MorkBorgRollType, type MorkBorgRollOptions } from '../types';

interface RollModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRoll: (type: MorkBorgRollType, key: string, options: MorkBorgRollOptions) => void;
    title: string;
    item: any;
    actor: any;
    type: 'attack' | 'defend';
}

export default function RollModal({
    isOpen,
    onClose,
    onRoll,
    title,
    item,
    actor,
    type
}: RollModalProps) {
    const [baseDR, setBaseDR] = useState(12);
    // For attack, target armor usually defaults to something or 0.
    // For defend, incoming attack defaults to 1d4 or similar.
    const [extraValue, setExtraValue] = useState(type === 'attack' ? '0' : '1d4');

    // Calculate Modified DR
    const encumbered = actor.derived?.encumbered || false;
    const encumbranceMod = encumbered ? 2 : 0;
    const modifiedDR = baseDR + encumbranceMod;

    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const memoizedRotation = React.useMemo(() => randomRotation(), []);

    if (!isOpen) return null;

    const handleRoll = () => {
        const options: any = {
            rollType: type,
            baseDR,
            modifiedDR,
            [type === 'attack' ? 'targetArmor' : 'incomingAttack']: extraValue
        };
        onRoll('item', item.id || item._id, options);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[100] overflow-y-auto animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" aria-hidden="true" />
                <div
                    className={`relative w-full max-w-[400px] bg-black border-[4px] border-black shadow-[15px_15px_0_0_rgba(255,20,147,0.2)] overflow-hidden transform ${memoizedRotation} my-8`}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Grunge Texture Overlay */}
                    <div
                        className="absolute inset-0 opacity-40 pointer-events-none mix-blend-overlay"
                        style={{ backgroundImage: `url(${grunge.src})`, backgroundSize: 'cover' }}
                    />

                    {/* Header */}
                    <div className="flex justify-between items-center px-4 py-2 bg-neutral-900 border-b-2 border-pink-500/20 relative z-10">
                        <span className={`$"font-imfell" text-xl uppercase tracking-[0.2em] text-white brightness-125`}>{title}</span>
                        <button
                            onClick={onClose}
                            className="text-neutral-500 hover:text-white transition-colors flex items-center gap-1 uppercase text-[10px] font-bold tracking-widest"
                        >
                            ✕ Close
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-8 space-y-6 relative z-10 bg-black/40">
                        {/* DR Input Row */}
                        <div className="flex items-center justify-between gap-4">
                            <label className={`$"font-imfell" text-3xl text-white drop-shadow-lg`}>
                                {type === 'attack' ? 'Target DR:' : 'Difficulty DR:'}
                            </label>
                            <input
                                type="number"
                                step="1"
                                value={baseDR}
                                onChange={(e) => setBaseDR(parseInt(e.target.value) || 0)}
                                className="bg-neutral-900 border-2 border-neutral-700 p-2 text-2xl text-white w-20 text-center focus:border-pink-500 outline-none transition-colors font-mono"
                            />
                        </div>

                        {/* Modified DR Row */}
                        <div className="flex items-center justify-between gap-4">
                            <label className={`$"font-imfell" text-3xl text-white drop-shadow-lg`}>
                                Modified DR:
                            </label>
                            <div className="bg-transparent border-2 border-neutral-800 p-2 text-2xl text-neutral-500 w-20 text-center font-mono brightness-75">
                                {modifiedDR}
                            </div>
                        </div>

                        {/* Encumbrance Subtext */}
                        <div className={`text-center h-6 transition-all duration-300 ${encumbered ? 'opacity-100' : 'opacity-0'}`}>
                            <span className="text-yellow-500 text-lg italic tracking-tight font-serif">( Encumbered: DR +2 )</span>
                        </div>

                        {/* Target/Incoming Row */}
                        <div className="flex flex-col gap-2">
                            <label className={`$"font-imfell" text-3xl text-white leading-tight drop-shadow-lg`}>
                                {type === 'attack' ? 'Target Armor:' : 'Incoming Attack:'}
                            </label>
                            <input
                                type="text"
                                value={extraValue}
                                onChange={(e) => setExtraValue(e.target.value)}
                                className="bg-neutral-900 border-2 border-neutral-700 p-2 text-2xl text-white w-full text-center focus:border-pink-500 outline-none transition-colors font-mono"
                            />
                            <p className="text-[10px] text-neutral-500 uppercase tracking-widest text-center mt-1">
                                {type === 'attack'
                                    ? 'Reduces your total damage (e.g. d2, d4, 1)'
                                    : 'The formula used to hit you (e.g. 1d4, 1d2)'}
                            </p>
                        </div>
                    </div>

                    {/* Footer / Roll Button */}
                    <div className="p-4 bg-white relative z-10">
                        <button
                            onClick={handleRoll}
                            className="w-full bg-white hover:bg-neutral-100 text-black py-4 border-2 border-black flex items-center justify-center gap-3 shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all group"
                        >
                            <span className="text-3xl animate-pulse">🎲</span>
                            <span className={`$"font-imfell" text-4xl font-bold tracking-tighter`}>ROLL</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
