'use client';

import { useEffect, useState } from 'react';

import { Dices, Pencil } from 'lucide-react';



import { type MorkBorgRollConfig, type MorkBorgConfirmConfig } from '../types';

const ROLL_MODES = [
    { value: 'publicroll', label: 'Public' },
    { value: 'gmroll', label: 'GM Only' },
    { value: 'blindroll', label: 'Blind GM' },
    { value: 'selfroll', label: 'Self Only' },
];

/** Parse "1d20+4" → { die: "d20", modifier: 4 } */
export function parseFormula(formula: string): { die: string; modifier: number } {
    const match = formula.trim().match(/^(\d*d\d+)\s*([+-]\s*[-+]?\d+)?$/i);
    if (!match) return { die: formula, modifier: 0 };
    const die = match[1];
    const modStr = match[2]?.replace(/\s/g, '') ?? '0';
    return { die, modifier: parseInt(modStr || '0', 10) };
}

interface MorkBorgRollModalProps {
    config: MorkBorgRollConfig;
    rollMode: string;
    onRollModeChange: (mode: string) => void;
    onConfirm: () => void;
    onConfirmWithOptions: (opts: any) => void;
    onManualConfirm: (result: any) => void;
    onClose: () => void;
}

const FormLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="text-neutral-500 text-[10px] uppercase tracking-widest mb-1">{children}</div>
);

export default function MorkBorgRollModal({
    config,
    rollMode,
    onRollModeChange,
    onConfirm,
    onConfirmWithOptions,
    onManualConfirm,
    onClose,
}: MorkBorgRollModalProps) {
    const isAttackDefend = config.rollType === 'attack' || config.rollType === 'defend';
    const encumbranceMod = config.encumbered ? 2 : 0;

    // Shared state
    const [manual, setManual] = useState(false);

    // Attack/Defend auto state
    const [baseDR, setBaseDR] = useState(config.dr ?? 12);
    const [targetArmor, setTargetArmor] = useState('0');
    const [incomingAttack, setIncomingAttack] = useState(config.incomingAttackDefault || '1d4');
    const [rollAdvantageMode, setRollAdvantageMode] = useState<'normal' | 'adv' | 'dis'>('normal');
    const modifiedDR = baseDR + encumbranceMod;

    // Simple roll manual state
    const [dieInput, setDieInput] = useState('');

    // Attack manual state
    const [attackDieInput, setAttackDieInput] = useState('');
    const [damageDieInput, setDamageDieInput] = useState('');

    // Defend manual state
    const [defendDieInput, setDefendDieInput] = useState('');
    const [defendDamageInput, setDefendDamageInput] = useState('');

    const { die, modifier } = parseFormula(config.formula);
    const modifierLabel = modifier === 0 ? 'No modifier' : modifier > 0 ? `+ ${modifier}` : `− ${Math.abs(modifier)}`;

    const attackDieVal = parseInt(attackDieInput, 10);
    const attackTotal = !isNaN(attackDieVal) ? attackDieVal + modifier : null;
    const attackHit = attackTotal !== null ? attackTotal >= modifiedDR : null;

    const damageDieVal = parseInt(damageDieInput, 10);

    const defendDieVal = parseInt(defendDieInput, 10);
    const defendTotal = !isNaN(defendDieVal) ? defendDieVal + modifier : null;
    const defendPassed = defendTotal !== null ? defendTotal >= modifiedDR : null;

    const simpleDieVal = parseInt(dieInput, 10);
    const simpleTotal = !isNaN(simpleDieVal) ? simpleDieVal + modifier : null;

    const getDieFaces = (dieStr: string) => parseInt(dieStr.match(/d(\d+)/)?.[1] || '20', 10);
    const mainDieFaces = getDieFaces(die);
    const damageDieFaces = getDieFaces(config.damageDie || '1d4');

    const handleBoundedInput = (val: string, setter: (v: string) => void, max: number, min: number = 1) => {
        if (val === '') {
            setter('');
            return;
        }
        const num = parseInt(val, 10);
        if (isNaN(num)) return;
        if (num > max) setter(max.toString());
        else if (num < min) setter(min.toString());
        else setter(num.toString());
    };

    const handleModeSwitch = (toManual: boolean) => {
        setAttackDieInput(''); setDamageDieInput('');
        setDefendDieInput(''); setDefendDamageInput('');
        setDieInput('');
        setManual(toManual);
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    // ── SUBMIT HANDLERS ──
    const handleSimpleManualSubmit = () => {
        if (simpleTotal === null) return;
        onManualConfirm(simpleDieVal);
    };

    const handleAttackManualSubmit = () => {
        if (attackHit === null) return;
        if (attackHit && isNaN(damageDieVal)) return; // need damage if hit
        onManualConfirm({
            type: 'attack',
            attackDie: attackDieVal,
            attackTotal: attackTotal!,
            damageDie: attackHit ? damageDieVal : 0,
            damageTotal: attackHit ? damageDieVal : 0, // raw die = total (server strips armor separately)
            hit: attackHit,
            modifiedDR,
            targetArmor,
        });
    };

    const handleDefendManualSubmit = () => {
        if (defendPassed === null) return;
        if (!defendPassed && isNaN(parseInt(defendDamageInput, 10))) return;
        onManualConfirm({
            type: 'defend',
            defendDie: defendDieVal,
            defendTotal: defendTotal!,
            damageDie: !defendPassed ? parseInt(defendDamageInput, 10) : 0,
            damageTotal: !defendPassed ? parseInt(defendDamageInput, 10) : 0,
            hit: defendPassed!,
            modifiedDR,
            incomingAttack,
        });
    };

    const handleAutoAttackDefendRoll = () => {
        onConfirmWithOptions({ baseDR, modifiedDR, targetArmor, incomingAttack, rollAdvantageMode });
    };

    const renderDRSection = () => (
        <div className="bg-black border border-pink-900/40 p-3 mb-4 font-mono rotate-[0.5deg] space-y-2">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <FormLabel>Formula</FormLabel>
                    <div className="text-white text-base">{config.humanFormula}</div>
                </div>
                <div className="text-right">
                    <FormLabel>DR</FormLabel>
                    <input
                        type="number"
                        value={baseDR}
                        onChange={e => setBaseDR(parseInt(e.target.value) || 12)}
                        className="bg-neutral-900 border border-neutral-700 text-white text-xl font-bold w-16 text-center py-1 focus:outline-none focus:border-pink-500"
                    />
                </div>
            </div>
            {config.encumbered && (
                <div className="text-yellow-500 text-xs italic">Encumbered: DR +2 → Modified DR <strong>{modifiedDR}</strong></div>
            )}
            {!config.encumbered && encumbranceMod === 0 && <div className="text-neutral-600 text-xs">Modified DR: <strong className="text-neutral-400">{modifiedDR}</strong></div>}
        </div>
    );

    const renderRollModeSelector = () => (
        <div className="mb-5">
            <FormLabel>Roll Mode</FormLabel>
            <div className="grid grid-cols-4 gap-1">
                {ROLL_MODES.map(m => (
                    <button
                        key={m.value}
                        onClick={() => onRollModeChange(m.value)}
                        className={`text-[10px] uppercase tracking-wider py-1 px-1 border transition-all font-mono cursor-pointer ${rollMode === m.value
                            ? 'bg-pink-900 border-pink-500 text-white'
                            : 'bg-black border-neutral-800 text-neutral-500 hover:border-pink-900 hover:text-neutral-300'
                            }`}
                    >
                        {m.label}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div
            className="fixed inset-0 z-[200] overflow-y-auto"
            onClick={onClose}
        >
            <div className="flex min-h-full items-center justify-center p-4 text-center">
                {/* Backdrop Layer */}
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />

                {/* Modal Container */}
                <div
                    className="bg-neutral-950 border-2 border-pink-900 shadow-[8px_8px_0_0_#831843] max-w-sm w-full p-6 relative -rotate-1 text-left inline-block transform transition-all"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="absolute -top-3 -right-3 text-2xl select-none">💀</div>

                    {/* Title */}
                    <h2 className={`$"font-imfell" text-2xl text-yellow-400 uppercase tracking-wide mb-1 leading-tight`}>
                        {config.title}
                    </h2>
                    <div className="text-pink-500 font-mono text-xs uppercase tracking-widest mb-4">
                        {config.rollLabel}
                    </div>

                    {/* Auto / Manual toggle */}
                    <div className="flex border border-neutral-800 mb-4">
                        {(['auto', 'manual'] as const).map(m => (
                            <button
                                key={m}
                                onClick={() => handleModeSwitch(m === 'manual')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs uppercase tracking-widest font-mono transition-all cursor-pointer ${(m === 'manual') === manual ? 'bg-pink-900 text-white' : 'bg-black text-neutral-500 hover:text-neutral-300'}`}
                            >
                                {m === 'auto' ? <><Dices className="w-3.5 h-3.5" /> Auto</> : <><Pencil className="w-3.5 h-3.5" /> Manual</>}
                            </button>
                        ))}
                    </div>

                    {/* ── AUTO MODE ── */}
                    {!manual && (
                        <>
                            {/* Advantage / Disadvantage / Normal selection */}
                            <div className="mb-5">
                                <FormLabel>Roll Advantage</FormLabel>
                                <div className="flex gap-2">
                                    {(['normal', 'adv', 'dis'] as const).map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => setRollAdvantageMode(m)}
                                            className="flex-1 py-1.5 text-[10px] uppercase font-bold border-2 border-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none font-serif tracking-wider rounded-none cursor-pointer"
                                            style={{
                                                backgroundColor: rollAdvantageMode === m ? (m === 'normal' ? 'black' : m === 'adv' ? '#16a34a' : '#dc2626') : 'white',
                                                color: rollAdvantageMode === m ? 'white' : 'black'
                                            }}
                                        >
                                            {m === 'normal' ? 'Normal' : m === 'adv' ? 'Advantage' : 'Disadvantage'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {isAttackDefend ? (
                                <>
                                    {renderDRSection()}
                                    <div className="mb-4 space-y-3">
                                        <div>
                                            <FormLabel>{config.rollType === 'attack' ? 'Target Armor (formula or number)' : 'Incoming Attack (formula)'}</FormLabel>
                                            <input
                                                type="text"
                                                value={config.rollType === 'attack' ? targetArmor : incomingAttack}
                                                onChange={e => config.rollType === 'attack' ? setTargetArmor(e.target.value) : setIncomingAttack(e.target.value)}
                                                className="w-full bg-neutral-900 border border-neutral-700 text-white px-2 py-1.5 font-mono text-base focus:outline-none focus:border-pink-500"
                                            />
                                            <div className="text-neutral-600 text-[10px] mt-1">
                                                {config.rollType === 'attack' ? 'Reduces damage (e.g. d2, d4, 1, 0)' : 'Rolled against you on fail (e.g. 1d4+2)'}
                                            </div>
                                        </div>
                                    </div>
                                    {renderRollModeSelector()}
                                    <div className="flex gap-3">
                                        <button onClick={handleAutoAttackDefendRoll}
                                            className={`$"font-imfell" flex-1 bg-pink-900 hover:bg-pink-700 text-white text-xl py-2 px-4 border border-pink-500 tracking-widest uppercase transition-colors shadow-[4px_4px_0_0_#000] cursor-pointer`}>
                                            Roll
                                        </button>
                                        <button onClick={onClose}
                                            className={`$"font-imfell" bg-black hover:bg-neutral-900 text-neutral-400 text-xl py-2 px-4 border border-neutral-700 tracking-widest uppercase cursor-pointer`}>
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-black border border-pink-900/40 p-3 mb-4 font-mono rotate-[0.5deg]">
                                        <FormLabel>Formula</FormLabel>
                                        <div className="text-white text-lg">{config.humanFormula}</div>
                                        {config.dr !== undefined && (
                                            <div className="text-neutral-400 text-xs mt-1">vs <span className="text-yellow-400 font-bold">DR {config.dr}</span></div>
                                        )}
                                    </div>
                                    {renderRollModeSelector()}
                                    <div className="flex gap-3">
                                        <button onClick={() => onConfirmWithOptions({ rollAdvantageMode })}
                                            className={`$"font-imfell" flex-1 bg-pink-900 hover:bg-pink-700 text-white text-xl py-2 px-4 border border-pink-500 tracking-widest uppercase transition-colors shadow-[4px_4px_0_0_#000] cursor-pointer`}>
                                            Roll
                                        </button>
                                        <button onClick={onClose}
                                            className={`$"font-imfell" bg-black hover:bg-neutral-900 text-neutral-400 text-xl py-2 px-4 border border-neutral-700 tracking-widest uppercase cursor-pointer`}>
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* ── MANUAL MODE ── */}
                    {manual && (
                        <>
                            {isAttackDefend ? (
                                /* Attack or Defend multi-step */
                                <div className="space-y-4">
                                    {renderDRSection()}

                                    {/* Step 1: Attack/Defend die */}
                                    <div className="mt-4">
                                        <FormLabel>Step 1 — Roll <strong className="text-yellow-400">{die}</strong></FormLabel>
                                        <input
                                            autoFocus
                                            type="number"
                                            min={1}
                                            max={mainDieFaces}
                                            value={config.rollType === 'attack' ? attackDieInput : defendDieInput}
                                            onChange={e => config.rollType === 'attack'
                                                ? handleBoundedInput(e.target.value, setAttackDieInput, mainDieFaces)
                                                : handleBoundedInput(e.target.value, setDefendDieInput, mainDieFaces)}
                                            placeholder="Your roll…"
                                            className="w-full bg-neutral-900 border border-pink-900/60 focus:border-pink-500 text-white text-2xl font-mono text-center py-2 focus:outline-none placeholder:text-neutral-700"
                                        />
                                        <div className="text-neutral-500 text-[10px] font-mono mt-1">
                                            Modifier: <span className={`font-bold ${modifier > 0 ? 'text-green-400' : modifier < 0 ? 'text-red-400' : 'text-neutral-400'}`}>{modifierLabel}</span>
                                            {' '}<span className="text-neutral-600">· DR {modifiedDR}</span>
                                        </div>
                                    </div>

                                    {/* Attack result & Step 2 */}
                                    {config.rollType === 'attack' && attackTotal !== null && (
                                        <div className={`border p-2 text-center ${attackHit ? 'border-green-700 bg-green-900/20' : 'border-red-800 bg-red-900/20'}`}>
                                            <span className={`font-bold text-lg ${attackHit ? 'text-green-400' : 'text-red-400'}`}>
                                                {attackHit ? `HIT! (${attackTotal} ≥ DR ${modifiedDR})` : `MISS (${attackTotal} < DR ${modifiedDR})`}
                                            </span>
                                        </div>
                                    )}

                                    {/* Damage step (attack hit) */}
                                    {config.rollType === 'attack' && attackHit === true && (
                                        <div>
                                            <FormLabel>Step 2 — Roll <strong className="text-yellow-400">{config.damageDie || '1d4'}</strong> for Damage</FormLabel>
                                            <input
                                                type="number"
                                                min={1}
                                                max={damageDieFaces}
                                                value={damageDieInput}
                                                onChange={e => handleBoundedInput(e.target.value, setDamageDieInput, damageDieFaces)}
                                                placeholder="Damage roll…"
                                                className="w-full bg-neutral-900 border border-pink-900/60 focus:border-pink-500 text-white text-2xl font-mono text-center py-2 focus:outline-none placeholder:text-neutral-700"
                                            />
                                            <div className="text-neutral-600 text-[10px] mt-1 font-mono">Target armor auto-rolled by server</div>
                                        </div>
                                    )}

                                    {/* Defend result & Step 2 */}
                                    {config.rollType === 'defend' && defendTotal !== null && (
                                        <div className={`border p-2 text-center ${defendPassed ? 'border-green-700 bg-green-900/20' : 'border-red-800 bg-red-900/20'}`}>
                                            <span className={`font-bold text-lg ${defendPassed ? 'text-green-400' : 'text-red-400'}`}>
                                                {defendPassed ? `SUCCESS! (${defendTotal} ≥ DR ${modifiedDR})` : `FAILED (${defendTotal} < DR ${modifiedDR})`}
                                            </span>
                                        </div>
                                    )}

                                    {/* Incoming damage step (defend failed) */}
                                    {config.rollType === 'defend' && defendPassed === false && (
                                        <div>
                                            <FormLabel>Step 2 — Roll Incoming Damage (<strong className="text-yellow-400">{incomingAttack}</strong>)</FormLabel>
                                            <input
                                                type="number"
                                                min={0}
                                                max={999}
                                                value={defendDamageInput}
                                                onChange={e => handleBoundedInput(e.target.value, setDefendDamageInput, 999, 0)}
                                                placeholder="Damage taken…"
                                                className="w-full bg-neutral-900 border border-pink-900/60 focus:border-pink-500 text-white text-2xl font-mono text-center py-2 focus:outline-none placeholder:text-neutral-700"
                                            />
                                        </div>
                                    )}

                                    {/* Submit */}
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={config.rollType === 'attack' ? handleAttackManualSubmit : handleDefendManualSubmit}
                                            disabled={
                                                config.rollType === 'attack'
                                                    ? (attackHit === null || (attackHit === true && isNaN(damageDieVal)))
                                                    : (defendPassed === null || (!defendPassed && isNaN(parseInt(defendDamageInput, 10))))
                                            }
                                            className={`$"font-imfell" flex-1 text-white text-xl py-2 px-4 border tracking-widest uppercase transition-colors shadow-[4px_4px_0_0_#000] cursor-pointer ${(config.rollType === 'attack' ? attackHit !== null && (!attackHit || !isNaN(damageDieVal)) : defendPassed !== null && (defendPassed || !isNaN(parseInt(defendDamageInput, 10))))
                                                ? 'bg-pink-900 hover:bg-pink-700 border-pink-500'
                                                : 'bg-neutral-800 border-neutral-700 text-neutral-600 cursor-not-allowed'
                                                }`}
                                        >
                                            Submit
                                        </button>
                                        <button onClick={onClose}
                                            className={`$"font-imfell" bg-black hover:bg-neutral-900 text-neutral-400 text-xl py-2 px-4 border border-neutral-700 tracking-widest uppercase cursor-pointer`}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Simple roll manual */
                                <>
                                    <div className="bg-black border border-pink-900/40 p-3 mb-4 rotate-[0.5deg]">
                                        <FormLabel>Roll Physically</FormLabel>
                                        <div className="flex items-baseline gap-3">
                                            <span className="font-mono text-yellow-400 text-2xl font-bold">{die}</span>
                                            <span className="text-neutral-400 text-sm">then enter your result below</span>
                                        </div>
                                        <div className="mt-1 text-neutral-500 text-xs font-mono">
                                            Modifier: <span className={`font-bold ${modifier > 0 ? 'text-green-400' : modifier < 0 ? 'text-red-400' : 'text-neutral-400'}`}>{modifierLabel}</span>
                                            <span className="text-neutral-600 ml-2">applied automatically</span>
                                        </div>
                                        {config.dr !== undefined && (
                                            <div className="mt-1 text-neutral-400 text-xs font-mono">Target: <span className="text-yellow-400 font-bold">DR {config.dr}</span></div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <FormLabel>Your Die Result</FormLabel>
                                        <input
                                            autoFocus
                                            type="number"
                                            min={1}
                                            max={mainDieFaces}
                                            value={dieInput}
                                            onChange={e => handleBoundedInput(e.target.value, setDieInput, mainDieFaces)}
                                            placeholder={`1 – ${mainDieFaces}`}
                                            className="w-full bg-neutral-900 border border-pink-900/60 focus:border-pink-500 text-white text-2xl font-mono text-center py-3 focus:outline-none placeholder:text-neutral-700"
                                        />
                                    </div>

                                    {simpleTotal !== null && (
                                        <div className="bg-neutral-900 border border-neutral-700 p-2 mb-4 text-center font-mono">
                                            <span className="text-neutral-500 text-[10px] uppercase tracking-widest block mb-0.5">Total</span>
                                            <span className="text-white text-3xl font-bold">{simpleTotal}</span>
                                            {config.dr !== undefined && (
                                                <span className={`text-sm ml-3 font-bold ${simpleTotal >= config.dr ? 'text-green-400' : 'text-red-400'}`}>
                                                    {simpleTotal >= config.dr ? '✓ Pass' : '✗ Fail'}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleSimpleManualSubmit}
                                            disabled={simpleTotal === null}
                                            className={`$"font-imfell" flex-1 text-white text-xl py-2 px-4 border tracking-widest uppercase transition-colors shadow-[4px_4px_0_0_#000] cursor-pointer ${simpleTotal !== null
                                                ? 'bg-pink-900 hover:bg-pink-700 border-pink-500'
                                                : 'bg-neutral-800 border-neutral-700 text-neutral-600 cursor-not-allowed'
                                                }`}
                                        >
                                            Submit
                                        </button>
                                        <button onClick={onClose}
                                            className={`$"font-imfell" bg-black hover:bg-neutral-900 text-neutral-400 text-xl py-2 px-4 border border-neutral-700 tracking-widest uppercase cursor-pointer`}>
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
