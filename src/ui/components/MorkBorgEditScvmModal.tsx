import React from 'react';
import { BufferedInput } from './BufferedInput';
import MorkBorgRollFrame from './MorkBorgRollFrame';
export default function MorkBorgEditScvmModal({ isOpen, onClose, onUpdate, actor }: { isOpen: boolean; onClose: () => void; onUpdate: (path: string, value: any) => void; actor: any }) {
    if (!isOpen || !actor) return null;
    const numberField = (label: string, path: string, value: unknown) => <label key={path} className="block text-neutral-200 my-3">{label}<BufferedInput aria-label={label} type="number" value={typeof value === 'number' ? value : ''} placeholder="Unavailable" onCommit={e => { if (e.target.value !== '') onUpdate(path, Number(e.target.value)); }} className="block bg-black border border-pink-700 p-2 mt-1 w-full text-white" /></label>;
    return <MorkBorgRollFrame title="Edit SCVM" onClose={onClose} wide>
        <p className="text-neutral-300">Fields save when focus leaves them.</p>
        <label className="block my-4">Name<BufferedInput aria-label="Character name" value={actor.name} onCommit={e => onUpdate('name', e.target.value)} className="block bg-black border border-pink-700 p-2 mt-1 w-full" /></label>
        <div className="grid sm:grid-cols-2 gap-x-5">
            {['strength', 'agility', 'presence', 'toughness'].map(key => numberField(key, `system.abilities.${key}.value`, actor.system.abilities?.[key]?.value))}
            {['hp', 'omens', 'powerUses'].flatMap(key => ['value', 'max'].map(field => numberField(`${key} ${field}`, `system.${key}.${field}`, actor.system[key]?.[field])))}
            {numberField('Silver', 'system.silver', actor.system.silver)}
        </div>
        <button onClick={onClose} className="w-full bg-pink-700 text-white p-3 mt-5">Done</button>
    </MorkBorgRollFrame>;
}
