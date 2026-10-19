import React, { useState } from 'react';
import { useSDK, useSDKComponents } from '@sheet-delver/sdk/react';
import { morkborgTheme } from '../themes/morkborg';

import { buildModuleAssetUrl } from '@sheet-delver/sdk';
import MorkBorgRollFrame from './MorkBorgRollFrame';



interface ItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (path: string, value: any) => void;
    item: any;
    actor: any;
}

export default function ItemModal({ isOpen, onClose, onUpdate, item, actor }: ItemModalProps) {
    const { resolveImageUrl } = useSDK();
    const { RichTextEditor } = useSDKComponents();
    const [activeTab, setActiveTab] = useState<'description' | 'details'>('description');

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
                                value={item.handed ?? ''}
                                onChange={(e) => handleChange('system.handed', Number(e.target.value))}
                                className="bg-neutral-800 text-right outline-none w-32 font-mono text-white border-none"
                            >
                                <option value="">Unavailable</option>
                                <option value="1">1-Handed</option>
                                <option value="2">2-Handed</option>
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
                        {system.usesAmmo && <label className="block text-yellow-500">Ammunition
                            <select aria-label="Ammunition" value={system.ammoId ?? ''} onChange={e => handleChange('system.ammoId', e.target.value)} className="bg-neutral-800 text-white w-full">
                                <option value="">None selected</option>
                                {(actor.items?.ammo ?? []).map((ammo: any) => <option key={ammo.id} value={ammo.id}>{ammo.name}</option>)}
                            </select>
                        </label>}
                        <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                            <span className="text-yellow-500">Damage Die:</span>
                            <input
                                type="text"
                                value={system.damageDie ?? ''}
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

    return <MorkBorgRollFrame title={`Edit ${item.name}`} subtitle={item.type} onClose={onClose} wide>
        <label className="block text-pink-400">Item name<input aria-label="Item name" value={item.name} onChange={e => handleChange('name', e.target.value)} className="block bg-black border border-pink-700 p-2 w-full my-2 text-white" /></label>
        <div className="flex gap-3 my-4"><button onClick={() => setActiveTab('description')}>Description</button><button onClick={() => setActiveTab('details')}>Details</button></div>
        {activeTab === 'description' ? <RichTextEditor content={item.system?.description ?? ''} onSave={(html: string) => handleChange('system.description', html)} editButtonText="Edit Item Description" theme={morkborgTheme.richText} /> : renderDetails()}
        <p className="text-neutral-400 text-sm my-4">Edits save when changed.</p>
        <button onClick={onClose} className="bg-pink-700 p-3 text-white w-full mt-4">Done</button>
    </MorkBorgRollFrame>;
}
