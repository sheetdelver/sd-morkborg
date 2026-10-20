import React, { useState } from 'react';
import { useSDK, useSDKComponents } from '@sheet-delver/sdk/react';
import { morkborgTheme } from '../themes/morkborg';

import { BufferedInput } from './BufferedInput';
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
                            <BufferedInput
                                aria-label="Price"
                                type="number"
                                value={system.price ?? 0}
                                onCommit={(e) => {
                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                    handleChange('system.price', isNaN(val) ? 0 : val);
                                }}
                                className="bg-transparent text-right outline-none w-20 font-mono text-white"
                            />
                        </div>
                        <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                            <span className="text-yellow-500">Carry Weight:</span>
                            <BufferedInput
                                aria-label="Carry Weight"
                                type="number"
                                step="0.1"
                                value={system.carryWeight ?? 0}
                                onCommit={(e) => {
                                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                    handleChange('system.carryWeight', isNaN(val) ? 0 : val);
                                }}
                                className="bg-transparent text-right outline-none w-20 font-mono text-white"
                            />
                        </div>
                        {type !== 'container' && (
                            <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                                <span className="text-yellow-500">Container Space:</span>
                                <BufferedInput
                                aria-label="Container Space"
                                    type="number"
                                    step="0.1"
                                    value={system.containerSpace ?? 1}
                                    onCommit={(e) => handleChange('system.containerSpace', parseFloat(e.target.value))}
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
                                aria-label="Weapon Type"
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
                                aria-label="Handed"
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
                                aria-label="Uses Ammo"
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
                            <BufferedInput
                                aria-label="Damage Die"
                                type="text"
                                value={system.damageDie ?? ''}
                                onCommit={(e) => handleChange('system.damageDie', e.target.value)}
                                className="bg-transparent text-right outline-none w-32 font-mono text-white"
                            />
                        </div>
                        <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                            <span className="text-yellow-500">Crit On:</span>
                            <BufferedInput
                                aria-label="Crit On"
                                type="number"
                                value={system.critOn ?? 20}
                                onCommit={(e) => {
                                    const val = e.target.value === '' ? 20 : parseInt(e.target.value);
                                    handleChange('system.critOn', isNaN(val) ? 20 : val);
                                }}
                                className="bg-transparent text-right outline-none w-20 font-mono text-white"
                            />
                        </div>
                        <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                            <span className="text-yellow-500">Fumble On:</span>
                            <BufferedInput
                                aria-label="Fumble On"
                                type="number"
                                value={system.fumbleOn ?? 1}
                                onCommit={(e) => {
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
                                aria-label="Current Tier"
                                value={item.tier?.value ?? ''}
                                onChange={(e) => handleChange('system.tier.value', parseInt(e.target.value))}
                                className="bg-neutral-800 text-right outline-none w-32 font-mono text-white border-none"
                            >
                                {[0, 1, 2, 3].filter(tier => tier <= Number(item.tier?.max)).map(tier => <option key={tier} value={tier}>{tier} ({['None', 'Light', 'Medium', 'Heavy'][tier]})</option>)}
                            </select>
                        </div>
                        <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                            <span className="text-yellow-500">Max Tier:</span>
                            <select
                                aria-label="Max Tier"
                                value={item.tier?.max ?? ''}
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
                        <BufferedInput
                                aria-label="Capacity"
                            type="number"
                            value={system.capacity ?? 7}
                            onCommit={(e) => {
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
                        <BufferedInput
                                aria-label="Quantity"
                            type="number"
                            value={system.quantity ?? 1}
                            onCommit={(e) => {
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
                            <BufferedInput
                                aria-label="Roll Label"
                                type="text"
                                value={system.rollLabel || ''}
                                onCommit={(e) => handleChange('system.rollLabel', e.target.value)}
                                className="bg-transparent text-right outline-none w-48 font-mono text-white"
                            />
                        </div>
                        <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                            <span className="text-yellow-500">Roll Formula:</span>
                            <BufferedInput
                                aria-label="Roll Formula"
                                type="text"
                                value={system.rollFormula || ''}
                                onCommit={(e) => handleChange('system.rollFormula', e.target.value)}
                                className="bg-transparent text-right outline-none w-48 font-mono text-white"
                            />
                        </div>
                        <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                            <span className="text-yellow-500">Roll Macro:</span>
                            <BufferedInput
                                aria-label="Roll Macro"
                                type="text"
                                value={system.rollMacro || ''}
                                onCommit={(e) => handleChange('system.rollMacro', e.target.value)}
                                className="bg-transparent text-right outline-none w-48 font-mono text-white"
                            />
                        </div>
                    </>
                )}

                {type === 'scroll' && (
                    <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                        <span className="text-yellow-500">Scroll Type:</span>
                        <select
                                aria-label="Scroll Type"
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
        <label className="block text-pink-400">Item name<BufferedInput aria-label="Item name" value={item.name} onCommit={e => handleChange('name', e.target.value)} className="block bg-black border border-pink-700 p-2 w-full my-2 text-white" /></label>
        <div className="mb-form-tabs my-4"><button aria-pressed={activeTab === 'description'} onClick={() => setActiveTab('description')}>Description</button><button aria-pressed={activeTab === 'details'} onClick={() => setActiveTab('details')}>Details</button></div>
        {activeTab === 'description' ? <RichTextEditor content={item.system?.description ?? ''} onSave={(html: string) => handleChange('system.description', html)} editButtonText="Edit Item Description" theme={morkborgTheme.richText} /> : renderDetails()}
        <p className="text-neutral-400 text-sm my-4">Fields save when focus leaves them. Descriptions use Save.</p>
        <button onClick={onClose} className="mb-action-button w-full mt-4">Done</button>
    </MorkBorgRollFrame>;
}
