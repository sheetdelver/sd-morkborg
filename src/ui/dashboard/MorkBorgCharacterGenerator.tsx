'use client';
import React, { useEffect, useRef, useState } from 'react';
import { processHtmlContent } from '@sheet-delver/sdk';
import { useSDK } from '@sheet-delver/sdk/react';
import { useScopedCatalog } from '../hooks/useScopedCatalog';
import MorkBorgConfirmModal from '../components/MorkBorgConfirmModal';
import { MobileSectionNavigation } from '../components/MobileSectionNavigation';

export default function MorkBorgCharacterGenerator() {
    const sdk = useSDK();
    const catalog = useScopedCatalog<{ classes: { uuid: string; name: string; img: string; description: string }[] }>('/api/modules/morkborg/classes');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const initialized = useRef(false);
    const request = useRef(0);
    const [lastAttempt, setLastAttempt] = useState<string | null>(null);
    const scopeKey = JSON.stringify([sdk.worldId, sdk.currentUser?.id, sdk.currentUser?.role, sdk.isConnected]);
    const scopeRef = useRef(scopeKey); scopeRef.current = scopeKey;
    const [candidate, setCandidate] = useState<any>(null);
    const [outcome, setOutcome] = useState<any>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [confirm, setConfirm] = useState(false);
    const [tab, setTab] = useState('classes');
    useEffect(() => {
        request.current++; setCandidate(null); setOutcome(null); setConfirm(false); setBusy(false); setError('');
        if (!initialized.current && catalog.status === 'ready' && catalog.data) {
            initialized.current = true; setSelected(new Set(catalog.data.classes.map(c => c.uuid)));
        }
    }, [catalog.generation, catalog.status]);
    useEffect(() => { setLastAttempt(null); setOutcome(null); }, [scopeKey]);
    const current = candidate && candidate.generation === catalog.generation && catalog.status === 'ready' ? candidate : null;
    const eligible = catalog.data?.classes.filter(c => selected.has(c.uuid)) ?? [];
    const generate = async () => {
        if (catalog.status !== 'ready' || !eligible.length || busy) return;
        const token = ++request.current, generation = catalog.generation;
        setBusy(true); setCandidate(null); setOutcome(null); setError('');
        try {
            const response = await sdk.fetchWithAuth('/api/modules/morkborg/generate-character', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ classUuids: eligible.map(c => c.uuid) }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error ?? 'Generation failed');
            if (token !== request.current || !catalog.isCurrent(generation)) return;
            setCandidate({ ...data.candidate, generation }); setTab('preview');
        } catch (e) { if (token === request.current && catalog.isCurrent(generation)) setError(e instanceof Error ? e.message : 'Generation failed'); }
        finally { if (token === request.current) setBusy(false); }
    };
    const create = async () => {
        if (!current || busy) return;
        const token = ++request.current, generation = catalog.generation, creationScope = scopeKey;
        setLastAttempt(current.id);
        setConfirm(false); setBusy(true); setError('');
        try {
            const response = await sdk.fetchWithAuth('/api/modules/morkborg/create-character', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ candidateId: current.id }) });
            const data = await response.json();
            if (token !== request.current || !catalog.isCurrent(generation) || scopeRef.current !== creationScope) return;
            if (data.outcome) setOutcome(data.outcome);
            if (!response.ok) throw new Error(data.error ?? 'Creation failed');
            setCandidate(null);
        } catch (e) { if (token === request.current && scopeRef.current === creationScope) setError(e instanceof Error ? e.message : 'Creation failed. Inspect the world before retrying.'); }
        finally { if (token === request.current) setBusy(false); }
    };
    const generated = current?.generated;
    return <main className="bg-[#ffe900] text-black min-h-screen p-4 sm:p-8 pb-36">
        <header className="bg-black text-yellow-400 border-b-8 border-pink-600 p-5 mb-6">
            <h1 className="font-morkborg text-4xl">SCVM Factory</h1>
            <p className="text-neutral-300 mt-2">Choose classes, review the complete result, then create the character and companions.</p>
        </header>
        <nav className="flex gap-4 my-4" aria-label="Factory sections">
            <button className="bg-black text-pink-400 p-3" onClick={() => setTab('classes')}>Classes</button>
            <button className="bg-black text-pink-400 p-3" onClick={() => setTab('preview')}>Preview</button>
        </nav>
        {catalog.status === 'loading' && <p role="status">Loading current class catalog…</p>}
        {catalog.status === 'failed' && <div role="alert"><p>{catalog.error}</p><button onClick={catalog.retry} className="bg-black text-white p-3 my-3">Retry catalog</button></div>}
        {tab === 'classes' && catalog.status === 'ready' && <section>
            {!catalog.data?.classes.length && <p>No classes are allowed by the current world policy.</p>}
            <div className="grid sm:grid-cols-2 gap-4">
                {catalog.data?.classes.map(c => <article key={c.uuid} className="bg-black text-white border-l-8 border-pink-600 p-4">
                    <label className="font-bold text-yellow-400"><input type="checkbox" checked={selected.has(c.uuid)} onChange={e => setSelected(old => { const next = new Set(old); if (e.target.checked) next.add(c.uuid); else next.delete(c.uuid); return next; })} className="mr-3" />{c.name}</label>
                    <div className="text-sm mt-3" dangerouslySetInnerHTML={{ __html: processHtmlContent(c.description, sdk.foundryUrl) }} />
                </article>)}
            </div>
        </section>}
        {tab === 'preview' && <section>
            {!generated ? <p>Generate a current preview to review it here.</p> : <>
                <h2 className="font-morkborg text-4xl my-4">{generated.actor.name} — {generated.className}</h2>
                <div className="bg-black text-white p-4 font-mono grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(generated.actor.system.abilities).map(([key, value]: any) => <p key={key}>{key}: {value.value}</p>)}
                    <p>HP: {generated.actor.system.hp.max}</p><p>Omens: {generated.actor.system.omens.max}</p>
                    <p>Powers: {generated.actor.system.powerUses.max}</p><p>Silver: {generated.actor.system.silver}</p>
                </div>
                <div className="my-4" dangerouslySetInnerHTML={{ __html: processHtmlContent(generated.actor.system.description, sdk.foundryUrl) }} />
                <h3 className="font-bold text-2xl">Starting Items ({generated.actor.items.length})</h3>
                <ul className="list-disc pl-6 my-3">{generated.actor.items.map((i: any) => <li key={i._id}>{i.name}{i.system.quantity !== undefined ? ` ×${i.system.quantity}` : ''}</li>)}</ul>
                <h3 className="font-bold text-2xl">Companions ({generated.companions.length})</h3>
                <ul className="list-disc pl-6 my-3">{generated.companions.map((a: any, index: number) => <li key={index}>{a.name} ({a.type})</li>)}</ul>
                <button disabled={busy || lastAttempt === current.id} className="bg-pink-600 border-2 border-black p-3 font-bold" onClick={() => setConfirm(true)}>Create reviewed character and companions</button>
            </>}
        </section>}
        <button disabled={busy || catalog.status !== 'ready' || !eligible.length} onClick={generate} className="bg-black text-yellow-400 border-4 border-pink-600 p-4 my-6 font-bold disabled:opacity-40">{busy ? 'Working…' : 'Generate new preview'}</button>
        {error && <p role="alert" className="bg-black text-pink-400 p-4">{error}</p>}
        {lastAttempt && <button className="bg-black text-pink-400 p-3" onClick={async () => {
            const observedScope = scopeKey, observedGeneration = catalog.generation;
            try {
                const response = await sdk.fetchWithAuth('/api/modules/morkborg/creation-status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ candidateId: lastAttempt }) });
                const data = await response.json();
                if (observedScope !== scopeRef.current || !catalog.isCurrent(observedGeneration)) return;
                if (!response.ok) throw new Error(data.error ?? 'Status unavailable');
                setOutcome(data.outcome);
            } catch (e) { if (observedScope === scopeRef.current && catalog.isCurrent(observedGeneration)) setError(e instanceof Error ? e.message : 'Status unavailable'); }
        }}>Inspect creation status</button>}
        {outcome && <section className="bg-black text-white p-4"><h2>Creation: {outcome.status}</h2>
            {outcome.confirmedWriteCount !== undefined && <p>{outcome.confirmedWriteCount} document write(s) confirmed. Current access does not expose the saved document details.</p>}
            {(outcome.created ?? []).map((a: any) => <p key={a.id}>{a.name}: {a.id} <button onClick={() => sdk.navigate(`/actors/${a.id}`)} className="text-pink-400 underline">Open</button></p>)}
            {outcome.status !== 'complete' && <p>Inspect these documents and the world before manual recovery. The reviewed plan remains on the server; no retry or rollback ran.</p>}
        </section>}
        {confirm && current && <MorkBorgConfirmModal config={{ title: 'Create reviewed SCVM', body: `Create ${generated.actor.name} and ${generated.companions.length} companion Actor(s)? This can partially complete if a later write fails.`, confirmLabel: 'Create' }} onConfirm={create} onClose={() => setConfirm(false)} />}
        <MobileSectionNavigation sections={[{ id: 'classes', label: 'Classes' }, { id: 'preview', label: 'Preview' }]} activeId={tab} onSelect={setTab} />
    </main>;
}
