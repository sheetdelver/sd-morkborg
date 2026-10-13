'use client';

import { useCallback } from 'react';
import { processHtmlContent } from '@sheet-delver/sdk';
import { useSDK, useSDKComponents, useActorSheet } from '@sheet-delver/sdk/react';
import MorkBorgSheet from '../MorkBorgSheet';

export interface MorkBorgActorPageProps {
    actorId: string;
    token?: string | null;
}

/**
 * Mörk Borg actor page (ADR-0027 conformed).
 *
 * A custom actorPage (the sanctioned escape hatch, decision 16) because morkborg's rolls
 * are a system-specific engine, not the generic platform roll. Data/read/field-update use
 * the host (`useActorSheet` → platform `/api/actors`); roll sequences + brew hit morkborg's
 * MODULE routes; item CRUD hits the platform actor-item surface. No hand-rolled fetch/realtime.
 */
export default function MorkBorgActorPage({ actorId }: MorkBorgActorPageProps) {
    const { fetchWithAuth, addNotification, foundryUrl, isDiceTrayOpen, toggleDiceTray } = useSDK();
    const { LoadingModal, SharedContentModal } = useSDKComponents();
    const { actor, loading, notFound, refresh, update } = useActorSheet<any>(actorId);

    const moduleRoll = useCallback(async (type: string, key: string, options: Record<string, unknown> = {}) => {
        if (!actor) return;
        const rollMode = (typeof window !== 'undefined' && window.localStorage.getItem('sheetdelver_roll_mode')) || 'publicroll';
        const rollOptions = {
            ...options,
            rollMode: (options as any).rollMode || rollMode,
            speaker: (options as any).speaker || { actor: actor.id, alias: actor.name },
        };
        try {
            const res = await fetchWithAuth(`/api/modules/morkborg/actors/${actor.id}/roll`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, key, options: rollOptions }),
            });
            const data = await res.json();
            if (data.success) {
                if (data.html) addNotification(processHtmlContent(data.html, foundryUrl), 'success', { html: true });
                else if (data.result?.total !== undefined) addNotification(`Rolled ${data.label || 'Result'}: ${data.result.total}`, 'success');
            } else {
                addNotification('Roll failed: ' + (data.error ?? 'Unknown error'), 'error');
            }
        } catch (e: any) {
            addNotification('Error: ' + e.message, 'error');
        }
    }, [actor, fetchWithAuth, addNotification, foundryUrl]);

    // Item CRUD goes to the PLATFORM actor-item surface (generic, no system logic).
    const itemRequest = useCallback(async (init: RequestInit, label: string, refreshAfter = true) => {
        if (!actor) return;
        try {
            const res = await fetchWithAuth(`/api/actors/${actor.id}/items`, init);
            const data = await res.json();
            if (data.success) {
                if (refreshAfter) refresh();
                if (label) addNotification(label, 'success');
            } else {
                addNotification('Failed: ' + (data.error ?? 'Unknown error'), 'error');
            }
        } catch (e: any) {
            addNotification('Error: ' + e.message, 'error');
        }
    }, [actor, fetchWithAuth, addNotification, refresh]);

    const onCreateItem = useCallback((itemData: any) =>
        itemRequest({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(itemData) },
            itemData?.name ? `Created ${itemData.name}` : 'Item created'), [itemRequest]);

    const onUpdateItem = useCallback((itemData: any) =>
        itemRequest({ method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(itemData) },
            itemData?.name ? `Updated ${itemData.name}` : 'Item updated'), [itemRequest]);

    const onDeleteItem = useCallback(async (itemId: string) => {
        if (!actor) return;
        try {
            const res = await fetchWithAuth(`/api/actors/${actor.id}/items?itemId=${itemId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) { refresh(); addNotification('Item Deleted', 'success'); }
            else addNotification('Failed to delete item: ' + (data.error ?? 'Unknown error'), 'error');
        } catch (e: any) {
            addNotification('Error: ' + e.message, 'error');
        }
    }, [actor, fetchWithAuth, addNotification, refresh]);

    if (loading && !actor) return <LoadingModal message="Loading..." />;

    if (notFound || !actor) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
                <div className="bg-neutral-900 border border-red-900/40 p-8 rounded-xl max-w-md w-full text-center shadow-2xl">
                    <div className="text-5xl mb-4">💀</div>
                    <h2 className="text-2xl font-bold text-white mb-2">Character Deleted</h2>
                    <p className="text-neutral-400 mb-8">This character has been deleted from the world.</p>
                    <a href="/" className="inline-block bg-red-900 hover:bg-neutral-800 text-white font-bold py-3 px-8 rounded shadow-lg uppercase tracking-widest transition-all w-full">
                        Return to Dashboard
                    </a>
                </div>
            </div>
        );
    }

    const className = actor.items?.find((item: any) => item.type === 'class')?.name;

    return (
        <main className="min-h-screen font-sans pb-20">
            <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-900 border-b border-neutral-800 px-4 py-3 shadow-md flex items-center justify-between backdrop-blur-sm bg-opacity-95">
                <a href="/" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors font-semibold group text-sm uppercase tracking-wide cursor-pointer">
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                    Back to Dashboard
                </a>
                <div className="text-xs text-neutral-600 font-mono hidden md:block">
                    {actor.name ? `${actor.name}${className ? ` (${className})` : ''}` : 'Loading...'}
                </div>
            </nav>

            <div className="w-full max-w-5xl mx-auto p-4 pt-20">
                <MorkBorgSheet
                    actor={actor}
                    onRoll={moduleRoll}
                    onUpdate={update}
                    onDeleteItem={onDeleteItem}
                    onCreateItem={onCreateItem}
                    onUpdateItem={onUpdateItem}
                    onToggleDiceTray={toggleDiceTray}
                    isDiceTrayOpen={isDiceTrayOpen}
                />
            </div>

            <SharedContentModal />
        </main>
    );
}
