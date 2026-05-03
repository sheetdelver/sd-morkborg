import React, { useState } from 'react';
import { type MorkBorgRollType, type MorkBorgRollOptions } from './types';
import { Swords, Shield, Heart, User, Skull, Info } from 'lucide-react';
import ItemInfoModal from './components/ItemInfoModal';

interface ViolenceTabProps {
    actor: any;
    onRoll: (type: MorkBorgRollType, key: string, options?: MorkBorgRollOptions) => void;
    onUpdate: (path: string, value: any) => void;
}

function getArmor(actor: any) {
    return [...actor.items.armor.filter((a: any) => a.equipped || a.system?.equipped),
    ...actor.items.shields.filter((s: any) => s.equipped || s.system?.equipped)];
}

function hasArmor(actor: any) {
    return getArmor(actor).length > 0;
}

function getArmorTier(item: any) {
    return item.system?.tier?.value ?? item.tier?.value ?? 0;
}

function getArmorDR(item: any) {
    const tier = getArmorTier(item);
    return tier === 0 ? '-0' : tier === 1 ? '-d2' : tier === 2 ? '-d4' : '-d6';
}

function createArmorTierDiv(item: any, onUpdate: (path: string, value: any) => void) {
    return (
        <div className="flex items-center gap-4">
            <span className="font-morkborg text-xl text-neutral-400">Tier:</span>
            <div className="flex gap-3">
                {[0, 1, 2, 3].map((tierVal) => {
                    const drText = getArmorDR(item);
                    const itemTier = getArmorTier(item);
                    const isSelected = itemTier === tierVal;

                    return (
                        <button
                            key={tierVal}
                            onClick={() => onUpdate(`items.${item._id || item.id}.system.tier.value`, tierVal)}
                            className={`w-10 h-10 flex items-center justify-center font-morkborg text-lg font-bold rounded-lg transition-all duration-200 border-2 ${isSelected
                                ? 'bg-pink-600 border-pink-400 text-black shadow-[0_0_10px_rgba(255,0,0,0.4)]'
                                : 'bg-neutral-800 border-neutral-600 text-neutral-200 hover:bg-neutral-700 hover:border-pink-600 hover:text-pink-400'
                                }`}
                            title={`Armor Tier ${tierVal} (${drText})`}
                        >
                            {tierVal}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function ViolenceTab({ actor, onRoll, onUpdate }: ViolenceTabProps) {
    const [infoModalConfig, setInfoModalConfig] = useState<{ isOpen: boolean; item: any }>({
        isOpen: false,
        item: null
    });

    const openInfoModal = (item: any) => {
        setInfoModalConfig({
            isOpen: true,
            item
        });
    };

    return (
        <div className="p-1 flex flex-col gap-6">
            {/* Initiative Header */}
            <div className="bg-black text-white p-4 flex flex-col sm:flex-row justify-between sm:items-center border-l-4 border-pink-500 shadow-md gap-4 sm:gap-0 transform -rotate-1">
                <div>
                    <h3 className="font-morkborg text-2xl uppercase tracking-wider">Initiative</h3>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => onRoll('initiative', 'party')}
                        className="flex-1 sm:flex-none bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-4 py-2 sm:py-1 font-bold border border-neutral-600 transition-colors uppercase tracking-widest text-xs"
                    >
                        PARTY
                    </button>
                    <button
                        onClick={() => onRoll('initiative', 'individual')}
                        className="flex-1 sm:flex-none bg-pink-600 hover:bg-pink-500 text-black px-4 py-2 sm:py-1 font-bold border border-pink-800 transition-colors uppercase tracking-widest text-xs"
                    >
                        INDIVIDUAL
                    </button>
                </div>
            </div>

            {/* Weapons */}
            <div>
                <h3 className="font-morkborg text-3xl mb-4 border-b-4 border-pink-500 text-pink-500 inline-block pr-6 transform -rotate-1">Weapons</h3>
                <div className="grid grid-cols-1 gap-4 my-2">
                    {actor.items.weapons.filter((w: any) => w.equipped || w.system?.equipped).map((w: any, index: number) => (
                        <div key={w._id + (index ? index : w.name)} className={`bg-neutral-900/80 p-3 border-l-8 border-red-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}>
                            <div className="flex items-center gap-4 flex-1">
                                <img src={w.img} alt={w.name} className="w-10 h-10 sm:w-12 sm:h-12 border border-neutral-600 flex-shrink-0" />
                                <div className="min-w-0">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openInfoModal(w); }}
                                        className="font-bold text-lg sm:text-xl text-neutral-200 truncate hover:text-pink-500 transition-colors cursor-pointer text-left focus:outline-none uppercase tracking-widest font-morkborg"
                                    >
                                        {w.name}
                                    </button>
                                    <div className="text-xs sm:text-sm text-slate-400 font-mono tracking-tighter whitespace-nowrap overflow-hidden">
                                        Damage: {w.damageDie || '1d4'} | Fumble: {w.fumbleOn} | Critical: {w.critOn}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => onRoll('item', w._id || w.id, { rollType: 'attack' })}
                                className="w-full sm:w-auto bg-red-900/50 hover:bg-red-600 text-red-100 px-6 py-2 font-morkborg text-xl uppercase tracking-widest transition-all border border-red-800 hover:border-red-400 shadow-[0_0_10px_rgba(255,0,0,0.1)] hover:shadow-[0_0_15px_rgba(255,0,0,0.4)]"
                            >
                                Attack
                            </button>
                        </div>
                    ))}
                    {!actor.items.weapons.filter((w: any) => w.equipped || w.system?.equipped).length && (
                        <div className="text-neutral-500 italic p-4 border border-dashed border-neutral-700">No weapons equipped. Equip one in the Equipment tab.</div>
                    )}

                    {actor.derived?.weaponCriticalHelpText && (
                        <div className="bg-black p-2 text-lg text-pink-500 font-mono mt-0.5 leading-none rotate-1">
                            {actor.derived.weaponCriticalHelpText}
                        </div>
                    )}
                </div>
            </div>

            {/* Armor */}
            <div className="mt-4">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-4 mb-4 border-b-4 border-pink-500 pb-2 transform rotate-1">
                    <h3 className="font-morkborg text-3xl text-pink-500 inline-block pr-6">Armor</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 my-2">
                    {getArmor(actor).map((a: any, index: number) => (
                        <div key={(a._id || a.id) + index} className={`bg-neutral-900/80 p-3 border-l-8 border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${((index + actor.items.weapons.length) % 2 === 0) ? '-rotate-1' : 'rotate-1'}`}>
                            <div className="flex items-center gap-4 flex-1">
                                <img src={a.img} alt={a.name} className="w-10 h-10 sm:w-12 sm:h-12 border border-neutral-600 grayscale flex-shrink-0" />
                                <div className="min-w-0">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openInfoModal(a); }}
                                        className="font-bold text-lg sm:text-xl text-neutral-200 truncate hover:text-pink-500 transition-colors cursor-pointer text-left focus:outline-none uppercase tracking-widest font-morkborg"
                                    >
                                        {a.name}
                                    </button>
                                    {(a.type === 'armor') && (
                                        <div className="text-xs sm:text-sm text-slate-400 font-mono whitespace-nowrap overflow-hidden">
                                            Tier: {getArmorTier(a)} DR: {getArmorDR(a)}
                                        </div>
                                    )}
                                    {(a.type === 'shield') && (
                                        <div className="text-xs sm:text-sm text-slate-400 font-mono whitespace-nowrap overflow-hidden">
                                            {actor.derived.shieldHelpText}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-2 sm:mt-0 items-start sm:items-center">
                                {/* Tier Selector UI */}
                                {(a.type === 'armor') && createArmorTierDiv(a, onUpdate)}
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button
                                        onClick={() => onUpdate(`items.${a._id || a.id}.system.equipped`, !(a.equipped || a.system?.equipped))}
                                        className={`w-full sm:w-auto px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all border ${a.equipped || a.system?.equipped
                                            ? 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white hover:border-neutral-500'
                                            : 'bg-slate-700 text-white border-slate-500 hover:bg-slate-600'
                                            }`}
                                    >
                                        {a.equipped || a.system?.equipped ? 'Unequip' : 'Equip'}
                                    </button>
                                    <button
                                        onClick={() => onRoll('item', a._id || a.id, { rollType: 'defend' })}
                                        className="w-full sm:w-auto bg-slate-800 hover:bg-slate-600 text-slate-200 px-6 py-2 font-morkborg text-xl uppercase tracking-widest transition-all border border-slate-600"
                                    >
                                        Defend
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!hasArmor(actor) && (
                        <div className="text-neutral-500 italic p-4 border border-dashed border-neutral-700 font-mono text-sm leading-relaxed">
                            No armor or shield equipped. Equip armor or shield in the Equipment tab to use the Tier selector.
                        </div>
                    )}

                    {actor.derived?.armorCriticalHelpText && (
                        <div className="bg-black p-2 text-lg text-pink-500 font-mono mt-0.5 leading-none rotate-1">
                            {actor.derived.armorCriticalHelpText}
                        </div>
                    )}
                </div>
            </div>

            <div className="text-center mt-8 text-neutral-600 text-sm font-serif italic">
                &quot;Violence is not the answer. It is the question. The answer is yes.&quot;
            </div>

            {infoModalConfig.isOpen && (
                <ItemInfoModal
                    isOpen={infoModalConfig.isOpen}
                    onClose={() => setInfoModalConfig({ ...infoModalConfig, isOpen: false })}
                    item={infoModalConfig.item}
                />
            )}
        </div>
    );
}
