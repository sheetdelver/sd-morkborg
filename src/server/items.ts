/**
 * Mörk Borg Module API - Items Handler
 * Manages actor items (categorized view)
 */

import { MorkBorgAdapter } from './MorkBorgAdapter';
import type { RouteFoundryClient } from '@server/shared/types/requestContext';
import { getErrorMessage } from '@server/shared/utils/getErrorMessage';

export async function handleGetItems(actorId: string, client: RouteFoundryClient | null) {
    if (!client) {
        return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const rawActor = await client.getActor(actorId);
        if (!rawActor) {
            return Response.json({ error: 'Actor not found' }, { status: 404 });
        }

        const adapter = new MorkBorgAdapter();
        const items = adapter.categorizeItems(rawActor);

        return Response.json({ items });
    } catch (error: unknown) {
        return Response.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}

export async function handleDeleteItem(actorId: string, itemId: string, client: RouteFoundryClient | null) {
    if (!client) {
        return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        // Delete item from actor
        await client.deleteActorItem(actorId, itemId);

        return Response.json({ success: true });
    } catch (error: unknown) {
        return Response.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
