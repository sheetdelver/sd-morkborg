import React, { useState } from 'react';
import RichTextEditor from '@client/ui/components/RichTextEditor';
import { morkborgTheme } from '../themes/morkborg';

import grunge from '../assets/grunge.png';
import { randomRotation } from './utils';
import { useConfig } from '@client/ui/context/ConfigContext';



interface ItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (path: string, value: any) => void;
    item: any;
    actor: any;
}

export default function ItemModal({ isOpen, onClose, onUpdate, item }: ItemModalProps) {
    const { resolveImageUrl } = useConfig();
    const [activeTab, setActiveTab] = useState<'description' | 'details'>('description');

    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const memoizedRotation = React.useMemo(() => randomRotation(), []);

    if (!isOpen || !item) return null;

    const handleChange = (path: string, value: any) => {
        onUpdate(path, value);
    };

    const renderDetails = () => {
        const type = item.type;
        const system = item.system || {};

        return (
            <div className="space-y-4 font-morkborg text-xl uppercase tracking-tight">
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

                {/* Base Fields - Only for non-special items */}
                {type !== 'feat' && type !== 'scroll' && (
                    <>
                        <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                            <span className="text-yellow-500">Price:</span>
                            <input
                                type="number"
                                value={system.price ?? 0}
                                onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                    handleChange('system.price', isNaN(val) ? 0 : val);
                                }}
                                className="bg-transparent text-right outline-none w-20 font-mono text-white"
                            />
                        </div>
                        <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                            <span className="text-yellow-500">Carry Weight:</span>
                            <input
                                type="number"
                                step="0.1"
                                value={system.carryWeight ?? 0}
                                onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                    handleChange('system.carryWeight', isNaN(val) ? 0 : val);
                                }}
                                className="bg-transparent text-right outline-none w-20 font-mono text-white"
                            />
                        </div>
                        {type !== 'container' && (
                            <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                                <span className="text-yellow-500">Container Space:</span>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={system.containerSpace ?? 1}
                                    onChange={(e) => handleChange('system.containerSpace', parseFloat(e.target.value))}
                                    className="bg-transparent text-right outline-none w-20 font-mono text-white"
                                />
                            </div>
                        )}
                    </>
                )}

                {/* Specific Fields */}
                {type === 'weapon' && (
                    <>
                        <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                            <span className="text-yellow-500">Weapon Type:</span>
                            <select
                                value={system.weaponType || 'melee'}
                                onChange={(e) => handleChange('system.weaponType', e.target.value)}
                                className="bg-neutral-800 text-right outline-none w-32 font-mono text-white border-none"
                            >
                                <option value="melee">Melee</option>
                                <option value="ranged">Ranged</option>
                            </select>
                        </div>
                        <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                            <span className="text-yellow-500">Handed:</span>
                            <select
                                value={system.handed || '1h'}
                                onChange={(e) => handleChange('system.handed', e.target.value)}
                                className="bg-neutral-800 text-right outline-none w-32 font-mono text-white border-none"
                            >
                                <option value="1h">1-Handed</option>
                                <option value="2h">2-Handed</option>
                            </select>
                        </div>
                        <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                            <span className="text-yellow-500">Uses Ammo:</span>
                            <input
                                type="checkbox"
                                checked={system.usesAmmo ?? false}
                                onChange={(e) => handleChange('system.usesAmmo', e.target.checked)}
                                className="w-5 h-5 accent-yellow-500"
                            />
                        </div>
                        <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                            <span className="text-yellow-500">Damage Die:</span>
                            <input
                                type="text"
                                value={system.damageDie || '1d4'}
                                onChange={(e) => handleChange('system.damageDie', e.target.value)}
                                className="bg-transparent text-right outline-none w-32 font-mono text-white"
                            />
                        </div>
                        <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                            <span className="text-yellow-500">Crit On:</span>
                            <input
                                type="number"
                                value={system.critOn ?? 20}
                                onChange={(e) => {
                                    const val = e.target.value === '' ? 20 : parseInt(e.target.value);
                                    handleChange('system.critOn', isNaN(val) ? 20 : val);
                                }}
                                className="bg-transparent text-right outline-none w-20 font-mono text-white"
                            />
                        </div>
                        <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                            <span className="text-yellow-500">Fumble On:</span>
                            <input
                                type="number"
                                value={system.fumbleOn ?? 1}
                                onChange={(e) => {
                                    const val = e.target.value === '' ? 1 : parseInt(e.target.value);
                                    handleChange('system.fumbleOn', isNaN(val) ? 1 : val);
                                }}
                                className="bg-transparent text-right outline-none w-20 font-mono text-white"
                            />
                        </div>
                    </>
                )}

                {type === 'armor' && (
                    <>
                        <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                            <span className="text-yellow-500">Current Tier:</span>
                            <select
                                value={system.tier?.value ?? 1}
                                onChange={(e) => handleChange('system.tier.value', parseInt(e.target.value))}
                                className="bg-neutral-800 text-right outline-none w-32 font-mono text-white border-none"
                            >
                                <option value="0">0 (None)</option>
                                <option value="1">1 (Light)</option>
                                <option value="2">2 (Medium)</option>
                                <option value="3">3 (Heavy)</option>
                            </select>
                        </div>
                        <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                            <span className="text-yellow-500">Max Tier:</span>
                            <select
                                value={system.tier?.max ?? 1}
                                onChange={(e) => handleChange('system.tier.max', parseInt(e.target.value))}
                                className="bg-neutral-800 text-right outline-none w-32 font-mono text-white border-none"
                            >
                                <option value="1">1 (Light)</option>
                                <option value="2">2 (Medium)</option>
                                <option value="3">3 (Heavy)</option>
                            </select>
                        </div>
                    </>
                )}

                {type === 'container' && (
                    <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                        <span className="text-yellow-500">Capacity:</span>
                        <input
                            type="number"
                            value={system.capacity ?? 7}
                            onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                handleChange('system.capacity', isNaN(val) ? 0 : val);
                            }}
                            className="bg-transparent text-right outline-none w-20 font-mono text-white"
                        />
                    </div>
                )}

                {(type === 'misc' || type === 'ammo') && (
                    <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                        <span className="text-yellow-500">Quantity:</span>
                        <input
                            type="number"
                            value={system.quantity ?? 1}
                            onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                handleChange('system.quantity', isNaN(val) ? 0 : val);
                            }}
                            className="bg-transparent text-right outline-none w-20 font-mono text-white"
                        />
                    </div>
                )}

                {type === 'feat' && (
                    <>
                        <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                            <span className="text-yellow-500">Roll Label:</span>
                            <input
                                type="text"
                                value={system.rollLabel || ''}
                                onChange={(e) => handleChange('system.rollLabel', e.target.value)}
                                className="bg-transparent text-right outline-none w-48 font-mono text-white"
                            />
                        </div>
                        <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                            <span className="text-yellow-500">Roll Formula:</span>
                            <input
                                type="text"
                                value={system.rollFormula || ''}
                                onChange={(e) => handleChange('system.rollFormula', e.target.value)}
                                className="bg-transparent text-right outline-none w-48 font-mono text-white"
                            />
                        </div>
                        <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                            <span className="text-yellow-500">Roll Macro:</span>
                            <input
                                type="text"
                                value={system.rollMacro || ''}
                                onChange={(e) => handleChange('system.rollMacro', e.target.value)}
                                className="bg-transparent text-right outline-none w-48 font-mono text-white"
                            />
                        </div>
                    </>
                )}

                {type === 'scroll' && (
                    <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                        <span className="text-yellow-500">Scroll Type:</span>
                        <select
                            value={system.scrollType || 'unclean'}
                            onChange={(e) => handleChange('system.scrollType', e.target.value)}
                            className="bg-neutral-800 text-right outline-none w-32 font-mono text-white border-none"
                        >
                            <option value="sacred">Sacred</option>
                            <option value="unclean">Unclean</option>
                        </select>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div
            className="fixed inset-0 z-[100] overflow-y-auto animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className="fixed inset-0 bg-black/90 backdrop-blur-sm"
                    aria-hidden="true"
                />
                <div
                    className={`relative w-full max-w-2xl bg-black border-[4px] border-black shadow-[15px_15px_0_0_rgba(255,20,147,0.2)] overflow-hidden transform ${memoizedRotation} flex flex-col max-h-[90vh] my-8`}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Grunge Texture Overlay */}
                    <div
                        className="absolute inset-0 opacity-40 pointer-events-none mix-blend-overlay"
                        style={{ backgroundImage: `url(${grunge.src})`, backgroundSize: 'cover' }}
                    />

                    <button
                        onClick={onClose}
                        className="absolute top-2 right-4 text-3xl text-neutral-500 hover:text-white transition-colors z-20 font-bold"
                    >
                        ×
                    </button>

                    {/* Header */}
                    <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-center border-b-2 border-pink-500/50 bg-neutral-900 relative z-10">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                            <img src={resolveImageUrl(item.img || 'icons/svg/item-bag.svg')} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 w-full text-center sm:text-left">
                            <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className={`bg-transparent $"font-imfell" uppercase text-3xl sm:text-4xl text-white tracking-widest leading-none mb-1 w-full outline-none border-none focus:ring-0 text-center sm:text-left`}
                            />
                            <div className="h-0.5 bg-gradient-to-r from-transparent via-pink-500/50 to-transparent sm:from-pink-500/50 sm:to-transparent w-full mb-2 shadow-[0_0_10px_rgba(236,72,153,0.5)]"></div>
                            <div className="font-morkborg text-xl sm:text-2xl text-pink-500 tracking-tighter uppercase opacity-90">
                                {item.type}
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex font-morkborg text-xl sm:text-2xl px-4 sm:px-6 relative z-10 bg-black/40 border-b border-pink-500/20 overflow-x-auto scrollbar-hide">
                        <button
                            onClick={() => setActiveTab('description')}
                            className={`flex-1 sm:flex-none px-4 sm:px-8 py-2 relative transition-all whitespace-nowrap uppercase tracking-widest ${activeTab === 'description' ? 'text-pink-400 bg-black/60 shadow-[inset_0_-2px_0_0_#f472b6]' : 'text-neutral-500 hover:text-white'}`}
                        >
                            Description
                        </button>
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`flex-1 sm:flex-none px-4 sm:px-8 py-2 relative transition-all whitespace-nowrap uppercase tracking-widest ${activeTab === 'details' ? 'text-pink-400 bg-black/60 shadow-[inset_0_-2px_0_0_#f472b6]' : 'text-neutral-500 hover:text-white'}`}
                        >
                            Details
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-black/60 relative z-10 scrollbar-thin scrollbar-thumb-pink-900 scrollbar-track-transparent">
                        {activeTab === 'description' ? (
                            <div className="font-serif text-base sm:text-lg leading-relaxed text-neutral-300">
                                <RichTextEditor
                                    content={item.system?.description || ''}
                                    onSave={(html) => handleChange('system.description', html)}
                                    editButtonText="Edit Item Description"
                                    theme={morkborgTheme.richText}
                                />
                            </div>
                        ) : (
                            renderDetails()
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-white relative z-10 w-full">
                        <button
                            onClick={onClose}
                            className="w-full bg-white hover:bg-neutral-100 text-black py-4 border-2 border-black flex items-center justify-center gap-3 shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all group"
                        >
                            <span className={`$"font-imfell" text-4xl font-bold tracking-tighter uppercase`}>Confirm</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
