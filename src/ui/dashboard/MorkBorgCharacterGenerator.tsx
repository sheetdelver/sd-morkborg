'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { processHtmlContent } from '@sheet-delver/sdk';
import { useSDK } from '@sheet-delver/sdk/react';
import { useScopedCatalog } from '../hooks/useScopedCatalog';
import MorkBorgConfirmModal from '../components/MorkBorgConfirmModal';

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
    const [presentation, setPresentation] = useState({
        palette: 'classic',
        tilts: [-1, 2, -1, 2, -1, 1, 2, -1, -1],
    });
    const automaticGeneration = useRef<string | null>(null);
    useEffect(() => {
        request.current++; setCandidate(null); setOutcome(null); setConfirm(false); setBusy(false); setError('');
        if (!initialized.current && catalog.status === 'ready' && catalog.data) {
            initialized.current = true; setSelected(new Set(catalog.data.classes.map(c => c.uuid)));
        }
    }, [catalog.generation, catalog.status]);
    useEffect(() => { setLastAttempt(null); setOutcome(null); }, [scopeKey]);
    const current = candidate && candidate.generation === catalog.generation && catalog.status === 'ready' ? candidate : null;
    const eligible = useMemo(() => catalog.data?.classes.filter(c => selected.has(c.uuid)) ?? [], [catalog.data, selected]);
    const generate = useCallback(async () => {
        if (catalog.status !== 'ready' || !eligible.length || busy) return;
        const token = ++request.current, generation = catalog.generation;
        setBusy(true); setCandidate(null); setOutcome(null); setError('');
        try {
            const response = await sdk.fetchWithAuth('/api/modules/morkborg/generate-character', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ classUuids: eligible.map(c => c.uuid) }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error ?? 'Generation failed');
            if (token !== request.current || !catalog.isCurrent(generation)) return;
            setCandidate({ ...data.candidate, generation });
            // Cosmetic only: reshuffle for a new result, then stay still while
            // editing class selection, confirming creation or inspecting recovery.
            setPresentation(previous => {
                const palettes = ['classic', 'doom', 'flesh', 'pig', 'gold', 'ink', 'sarkash'].filter(value => value !== previous.palette);
                return {
                    palette: palettes[Math.floor(Math.random() * palettes.length)],
                    tilts: previous.tilts.map(previousTilt =>
                        (previousTilt < 0 ? 1 : -1) * (1 + Math.floor(Math.random() * 2))),
                };
            });
        } catch (e) { if (token === request.current && catalog.isCurrent(generation)) setError(e instanceof Error ? e.message : 'Generation failed'); }
        finally { if (token === request.current) setBusy(false); }
    }, [catalog.status, catalog.generation, catalog.isCurrent, eligible, busy, sdk.fetchWithAuth]);
    useEffect(() => {
        if (catalog.status !== 'ready' || !eligible.length || busy || automaticGeneration.current === scopeKey) return;
        automaticGeneration.current = scopeKey;
        void generate();
    }, [catalog.status, eligible.length, busy, generate, scopeKey]);
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
    const canGenerate = !busy && catalog.status === 'ready' && eligible.length > 0;
    const tilt = (index: number) => ({ '--mb-tilt': `${presentation.tilts[index]}deg` } as React.CSSProperties);
    const stat = (name: string, value: React.ReactNode, index: number) => <div className="mb-factory-stat" style={tilt(index)} key={name}><dt>{name}</dt><dd>{value}</dd></div>;
    const features = generated?.actor.items.filter((item: any) => ['feat', 'power'].includes(item.type)) ?? [];
    const equipment = generated?.actor.items.filter((item: any) => !['class', 'feat', 'power'].includes(item.type)) ?? [];
    return <main className="mb-factory" data-palette={presentation.palette} aria-label="SCVM Factory">
        <nav className="mb-factory-bar" aria-label="Dashboard">
            <button type="button" onClick={() => sdk.navigate('/')}>← Back to Dashboard</button>
            <span>Generating New Character</span>
        </nav>
        <header className="mb-factory-header">
            <div className="mb-factory-heading">
                <div className="mb-factory-avatar" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5.25 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM2.25 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM18.75 7.5a.75.75 0 00-1.5 0v2.25H15a.75.75 0 000 1.5h2.25v2.25a.75.75 0 001.5 0v-2.25H21a.75.75 0 000-1.5h-2.25V7.5z" />
                </svg></div>
                <div><h1>Create Character</h1><p>MÖRK BORG</p></div>
            </div>
            <button type="button" disabled={!canGenerate} onClick={generate} className="mb-factory-roll" aria-label="Randomize All" title="Randomize All">
                <img src="/icons/dice-d20.svg" alt="" />
            </button>
        </header>
        <div className="mb-factory-content">
        {catalog.status === 'loading' && <p role="status" className="mb-factory-notice">Loading current class catalog…</p>}
        {catalog.status === 'failed' && <div role="alert" className="mb-factory-notice"><p>{catalog.error}</p><button onClick={catalog.retry} className="mb-factory-button">Retry catalog</button></div>}
        {catalog.status === 'ready' && <section className="mb-factory-classes" aria-labelledby="mb-included-classes">
            <h2 id="mb-included-classes">Included Classes</h2>
            {!catalog.data?.classes.length && <p>No classes are allowed by the current world policy.</p>}
            <div className="mb-factory-class-options">
                {catalog.data?.classes.map(c => <label key={c.uuid} title={c.name}>
                    <input type="checkbox" checked={selected.has(c.uuid)} onChange={e => setSelected(old => { const next = new Set(old); if (e.target.checked) next.add(c.uuid); else next.delete(c.uuid); return next; })} />
                    <span>{c.name}</span>
                </label>)}
            </div>
            <div className="mb-factory-actions">
                <button type="button" className="mb-factory-button" onClick={() => setSelected(new Set())}>Clear All</button>
                <button type="button" className="mb-factory-button" onClick={() => setSelected(new Set(catalog.data?.classes.map(c => c.uuid)))}>Select All</button>
            </div>
        </section>}
        {busy && <p role="status" className="mb-factory-notice">Working…</p>}
        {!generated && !busy && catalog.status === 'ready' && <div className="mb-factory-actions">
            {!error && automaticGeneration.current === scopeKey && <p role="status">The world or available content changed. Roll another SCVM to continue.</p>}
            <button disabled={!canGenerate} onClick={generate} className="mb-factory-button">Roll another SCVM</button>
        </div>}
        {generated && <section className="mb-factory-preview" aria-label="Generated character">
            <dl className="mb-factory-stats">
                {stat('Name', generated.actor.name, 0)}{stat('Class', generated.className, 1)}
                {stat('HP', generated.actor.system.hp.max, 2)}{stat('Omens', generated.actor.system.omens.max, 3)}
            </dl>
            <div className="mb-factory-grid">
                <section className="mb-factory-panel" style={tilt(4)} data-panel="background"><h2>{generated.actor.name}</h2>
                    <p className="mb-factory-class-name">{generated.className}</p>
                    <div className="mb-factory-description" dangerouslySetInnerHTML={{ __html: processHtmlContent(generated.actor.system.description, sdk.foundryUrl) }} />
                </section>
                <section className="mb-factory-panel" style={tilt(5)} data-panel="class"><h2>Class</h2>
                    {features.map((item: any) => <article className="mb-factory-feature" key={item._id}>
                        <h3>{item.name}</h3><div className="mb-factory-description" dangerouslySetInnerHTML={{ __html: processHtmlContent(item.system?.description ?? '', sdk.foundryUrl) }} />
                    </article>)}
                    {!features.length && <p className="mb-factory-description">None</p>}
                </section>
                <section className="mb-factory-panel" style={tilt(6)} data-panel="abilities"><h2>Abilities</h2>
                    <dl className="mb-factory-abilities">{Object.entries(generated.actor.system.abilities).map(([name, ability]: any) => <div key={name}><dt>{name}</dt><dd>{ability.value > 0 ? '+' : ''}{ability.value}</dd></div>)}</dl>
                    <p className="mb-factory-powers">Powers per day: {generated.actor.system.powerUses.max}</p>
                </section>
                <section className="mb-factory-panel" style={tilt(7)} data-panel="equipment"><h2>Equipment</h2>
                    <p className="mb-factory-silver">{generated.actor.system.silver} Silver Pieces</p>
                    <ul className="mb-factory-list">{equipment.map((item: any) => <li key={item._id}>
                        {item.system?.description ? <details><summary>{item.name}{item.system.quantity !== undefined ? ` ×${item.system.quantity}` : ''}</summary>
                            <div className="mb-factory-description" dangerouslySetInnerHTML={{ __html: processHtmlContent(item.system.description, sdk.foundryUrl) }} />
                        </details> : <span>{item.name}{item.system?.quantity !== undefined ? ` ×${item.system.quantity}` : ''}</span>}
                    </li>)}</ul>
                    {!!generated.companions.length && <div className="mb-factory-companions"><h3>Companions</h3><ul>{generated.companions.map((companion: any, index: number) => <li key={index}>{companion.name} ({companion.type})</li>)}</ul></div>}
                </section>
            </div>
            <button type="button" disabled={busy || lastAttempt === current.id} className="mb-factory-save" style={tilt(8)} onClick={() => setConfirm(true)}>💀 SAVE THIS ONE 💀</button>
        </section>}
        {error && <p role="alert" className="mb-factory-notice">{error}</p>}
        {lastAttempt && <button className="mb-factory-button" onClick={async () => {
            const observedScope = scopeKey, observedGeneration = catalog.generation;
            try {
                const response = await sdk.fetchWithAuth('/api/modules/morkborg/creation-status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ candidateId: lastAttempt }) });
                const data = await response.json();
                if (observedScope !== scopeRef.current || !catalog.isCurrent(observedGeneration)) return;
                if (!response.ok) throw new Error(data.error ?? 'Status unavailable');
                setOutcome(data.outcome);
            } catch (e) { if (observedScope === scopeRef.current && catalog.isCurrent(observedGeneration)) setError(e instanceof Error ? e.message : 'Status unavailable'); }
        }}>Inspect creation status</button>}
        {outcome && <section className="mb-factory-notice"><h2>Creation: {outcome.status}</h2>
            {outcome.confirmedWriteCount !== undefined && <p>{outcome.confirmedWriteCount} document write(s) confirmed. Current access does not expose the saved document details.</p>}
            {(outcome.created ?? []).map((a: any) => <p key={a.id}>{a.name}: {a.id} <button onClick={() => sdk.navigate(`/actors/${a.id}`)} className="mb-factory-button">Open</button></p>)}
            {outcome.status !== 'complete' && <p>Inspect these documents and the world before manual recovery. The reviewed plan remains on the server; no retry or rollback ran.</p>}
        </section>}
        </div>
        {confirm && current && <MorkBorgConfirmModal config={{ title: 'Create reviewed SCVM', body: `Create ${generated.actor.name} and ${generated.companions.length} companion Actor(s)? This can partially complete if a later write fails.`, confirmLabel: 'Create' }} onConfirm={create} onClose={() => setConfirm(false)} />}
    </main>;
}
