import React, { useState, useEffect, useMemo } from 'react';

import grunge from '../assets/grunge.png';
import { randomRotation } from './utils';



interface EditScvmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (path: string, value: any) => void;
    actor: any;
}

export default function MorkBorgEditScvmModal({ isOpen, onClose, onUpdate, actor }: EditScvmModalProps) {
    const memoizedRotation = useMemo(() => randomRotation(), []);

    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const [localData, setLocalData] = useState<any>({});

    useEffect(() => {
        if (isOpen && actor) {
            setLocalData({
                name: actor.name || '',
                abilities: {
                    strength: actor.system?.abilities?.strength?.value ?? 0,
                    agility: actor.system?.abilities?.agility?.value ?? 0,
                    presence: actor.system?.abilities?.presence?.value ?? 0,
                    toughness: actor.system?.abilities?.toughness?.value ?? 0,
                },
                hp: {
                    value: actor.system?.hp?.value ?? 0,
                    max: actor.system?.hp?.max ?? 0
                },
                omens: {
                    value: actor.system?.omens?.value ?? 0,
                    max: actor.system?.omens?.max ?? 0
                },
                powerUses: {
                    value: actor.system?.powerUses?.value ?? 0,
                    max: actor.system?.powerUses?.max ?? 0
                },
                silver: actor.system?.silver ?? 0
            });
        }
    }, [isOpen, actor]);

    if (!isOpen || !actor) return null;

    const handleLocalChange = (group: string, field: string | null, value: any) => {
        setLocalData((prev: any) => {
            if (field === null) {
                // Top-level field like 'name' or 'silver'
                return { ...prev, [group]: value };
            } else {
                // Nested field like 'abilities' -> 'strength'
                return {
                    ...prev,
                    [group]: {
                        ...prev[group],
                        [field]: value
                    }
                };
            }
        });
    };

    const handleAbilityChange = (field: string, rawValue: string) => {
        // Allow the user to type "-" to eventually type "-1"
        if (rawValue === '-' || rawValue === '') {
            handleLocalChange('abilities', field, rawValue);
            return;
        }

        // Parse and clamp
        let val = parseInt(rawValue, 10);
        if (isNaN(val)) return;

        if (val < -3) val = -3;
        if (val > 6) val = 6;

        handleLocalChange('abilities', field, val);
    };

    const handleConfirm = () => {
        // Dispatch all accumulated changes to the parent
        if (localData.name !== actor.name) onUpdate('name', localData.name);

        const sys = actor.system || {};

        // Parse any lingering raw "-" to 0 before saving
        const getAbilitySafe = (val: any) => {
            const parsed = parseInt(val, 10);
            return isNaN(parsed) ? 0 : parsed;
        };

        if (getAbilitySafe(localData.abilities.strength) !== (sys.abilities?.strength?.value ?? 0)) onUpdate('system.abilities.strength.value', getAbilitySafe(localData.abilities.strength));
        if (getAbilitySafe(localData.abilities.agility) !== (sys.abilities?.agility?.value ?? 0)) onUpdate('system.abilities.agility.value', getAbilitySafe(localData.abilities.agility));
        if (getAbilitySafe(localData.abilities.presence) !== (sys.abilities?.presence?.value ?? 0)) onUpdate('system.abilities.presence.value', getAbilitySafe(localData.abilities.presence));
        if (getAbilitySafe(localData.abilities.toughness) !== (sys.abilities?.toughness?.value ?? 0)) onUpdate('system.abilities.toughness.value', getAbilitySafe(localData.abilities.toughness));

        if (localData.hp.value !== (sys.hp?.value ?? 0)) onUpdate('system.hp.value', localData.hp.value);
        if (localData.hp.max !== (sys.hp?.max ?? 0)) onUpdate('system.hp.max', localData.hp.max);

        if (localData.omens.value !== (sys.omens?.value ?? 0)) onUpdate('system.omens.value', localData.omens.value);
        if (localData.omens.max !== (sys.omens?.max ?? 0)) onUpdate('system.omens.max', localData.omens.max);

        if (localData.powerUses.value !== (sys.powerUses?.value ?? 0)) onUpdate('system.powerUses.value', localData.powerUses.value);
        if (localData.powerUses.max !== (sys.powerUses?.max ?? 0)) onUpdate('system.powerUses.max', localData.powerUses.max);

        if (localData.silver !== (sys.silver ?? 0)) onUpdate('system.silver', localData.silver);

        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto animate-in fade-in duration-300" onClick={onClose}>
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" aria-hidden="true" />
                <div
                    className={`relative w-full max-w-xl bg-black border-[4px] border-black shadow-[15px_15px_0_0_rgba(255,20,147,0.2)] overflow-hidden transform ${memoizedRotation} flex flex-col max-h-[90vh] my-8`}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Grunge Texture Overlay */}
                    <div
                        className="absolute inset-0 opacity-40 pointer-events-none mix-blend-overlay"
                        style={{ backgroundImage: `url(${grunge.src})`, backgroundSize: 'cover' }}
                    />

                    {/* Spinners style block */}
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        input[type=number]::-webkit-inner-spin-button, 
                        input[type=number]::-webkit-outer-spin-button { 
                            -webkit-appearance: none; 
                            margin: 0; 
                        }
                        input[type=number] {
                            -moz-appearance: textfield;
                        }
                    `}} />

                    <button
                        onClick={onClose}
                        className="absolute top-2 right-4 text-3xl text-neutral-500 hover:text-white transition-colors z-20 font-bold"
                    >
                        ×
                    </button>

                    {/* Header */}
                    <div className="p-4 sm:p-6 bg-neutral-900 border-b-2 border-pink-500/50 relative z-10">
                        <input
                            type="text"
                            value={localData.name || ''}
                            onChange={(e) => handleLocalChange('name', null, e.target.value)}
                            placeholder="NAME YOUR SCVM"
                            className={`bg-transparent $"font-imfell" uppercase text-4xl sm:text-5xl text-white tracking-widest leading-none mb-1 w-full outline-none border-none focus:ring-0 text-center placeholder-neutral-700`}
                        />
                        <div className="h-0.5 bg-gradient-to-r from-transparent via-pink-500/50 to-transparent w-full shadow-[0_0_10px_rgba(236,72,153,0.5)]"></div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 relative z-10 scrollbar-thin scrollbar-thumb-pink-900 scrollbar-track-transparent">

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">

                            {/* Core Abilities */}
                            <div className="space-y-4">
                                <h3 className={`text-pink-500 text-xl tracking-widest uppercase border-b border-pink-500/30 pb-1 $"font-imfell"`}>Abilities</h3>

                                <div className="space-y-3 font-mono text-lg uppercase tracking-tight">
                                    <div className="flex items-center justify-between">
                                        <span className="text-neutral-300">Strength</span>
                                        <input
                                            type="text"
                                            value={localData.abilities?.strength ?? 0}
                                            onChange={(e) => handleAbilityChange('strength', e.target.value)}
                                            className="bg-neutral-800 text-center outline-none w-16 text-white appearance-none focus:ring-1 focus:ring-pink-500"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-neutral-300">Agility</span>
                                        <input
                                            type="text"
                                            value={localData.abilities?.agility ?? 0}
                                            onChange={(e) => handleAbilityChange('agility', e.target.value)}
                                            className="bg-neutral-800 text-center outline-none w-16 text-white appearance-none focus:ring-1 focus:ring-pink-500"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-neutral-300">Presence</span>
                                        <input
                                            type="text"
                                            value={localData.abilities?.presence ?? 0}
                                            onChange={(e) => handleAbilityChange('presence', e.target.value)}
                                            className="bg-neutral-800 text-center outline-none w-16 text-white appearance-none focus:ring-1 focus:ring-pink-500"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-neutral-300">Toughness</span>
                                        <input
                                            type="text"
                                            value={localData.abilities?.toughness ?? 0}
                                            onChange={(e) => handleAbilityChange('toughness', e.target.value)}
                                            className="bg-neutral-800 text-center outline-none w-16 text-white appearance-none focus:ring-1 focus:ring-pink-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Resources & Wealth */}
                            <div className="space-y-4">
                                <h3 className={`text-pink-500 text-xl tracking-widest uppercase border-b border-pink-500/30 pb-1 $"font-imfell"`}>Resources</h3>

                                <div className="space-y-3 font-mono text-lg uppercase tracking-tight">
                                    <div className="flex items-center justify-between">
                                        <span className="text-neutral-300">HP</span>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                value={localData.hp?.value ?? 0}
                                                onChange={(e) => handleLocalChange('hp', 'value', parseInt(e.target.value) || 0)}
                                                className="bg-neutral-800 text-center outline-none w-12 text-white appearance-none focus:ring-1 focus:ring-pink-500"
                                            />
                                            <span className="text-neutral-600">/</span>
                                            <input
                                                type="number"
                                                value={localData.hp?.max ?? 0}
                                                onChange={(e) => handleLocalChange('hp', 'max', parseInt(e.target.value) || 0)}
                                                className="bg-neutral-800 text-center outline-none w-12 text-white appearance-none focus:ring-1 focus:ring-pink-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-neutral-300">Omens</span>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                value={localData.omens?.value ?? 0}
                                                onChange={(e) => handleLocalChange('omens', 'value', parseInt(e.target.value) || 0)}
                                                className="bg-neutral-800 text-center outline-none w-12 text-white appearance-none focus:ring-1 focus:ring-pink-500"
                                            />
                                            <span className="text-neutral-600">/</span>
                                            <input
                                                type="number"
                                                value={localData.omens?.max ?? 0}
                                                onChange={(e) => handleLocalChange('omens', 'max', parseInt(e.target.value) || 0)}
                                                className="bg-neutral-800 text-center outline-none w-12 text-white appearance-none focus:ring-1 focus:ring-pink-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-neutral-300">Powers</span>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                value={localData.powerUses?.value ?? 0}
                                                onChange={(e) => handleLocalChange('powerUses', 'value', parseInt(e.target.value) || 0)}
                                                className="bg-neutral-800 text-center outline-none w-12 text-white appearance-none focus:ring-1 focus:ring-pink-500"
                                            />
                                            <span className="text-neutral-600">/</span>
                                            <input
                                                type="number"
                                                value={localData.powerUses?.max ?? 0}
                                                onChange={(e) => handleLocalChange('powerUses', 'max', parseInt(e.target.value) || 0)}
                                                className="bg-neutral-800 text-center outline-none w-12 text-white appearance-none focus:ring-1 focus:ring-pink-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-neutral-800">
                                        <div className="flex items-center justify-between pt-1">
                                            <span className="text-neutral-300">Silver</span>
                                            <input
                                                type="number"
                                                value={localData.silver ?? 0}
                                                onChange={(e) => handleLocalChange('silver', null, parseInt(e.target.value) || 0)}
                                                className="bg-neutral-800 text-center outline-none w-28 text-white appearance-none focus:ring-1 focus:ring-pink-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-white relative z-10 w-full">
                        <button
                            onClick={handleConfirm}
                            className="w-full bg-white hover:bg-neutral-100 text-black py-3 border-2 border-black flex items-center justify-center shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                        >
                            <span className={`$"font-imfell" text-3xl font-bold tracking-tighter uppercase`}>Confirm</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
