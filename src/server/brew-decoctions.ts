/**
 * POST /actors/[id]/brew-decoctions
 * Runs the Occult Herbmaster's Create Decoctions sequence:
 * - Draws 2 random decoctions from the roll table
 * - Rolls 1d4 for doses
 * - Creates the items on the actor
 * - Posts a blind-roll chat card
 */

import { MorkBorgAdapter } from './MorkBorgAdapter';
import { logger } from '@shared/utils/logger';
import type { RouteFoundryClient } from '@server/shared/types/requestContext';
import { getErrorMessage } from '@server/shared/utils/getErrorMessage';

export async function handleBrewDecoctions(actorId: string, request: Request, client: RouteFoundryClient | null): Promise<Response> {
    if (!client) {
        return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const body = request.method === 'POST' ? await request.json().catch(() => ({})) : {};
        const rollMode = body.rollMode || 'blindroll';

        const actor = await client.getActor(actorId);
        if (!actor) {
            return Response.json({ error: 'Actor not found' }, { status: 404 });
        }

        const adapter = new MorkBorgAdapter();
        const result = await adapter.createDecoctions(actor, client, { rollMode });

        return Response.json({ success: true, result });
    } catch (error: unknown) {
        logger.error(`[brew-decoctions] Failed: ${getErrorMessage(error)}`);
        return Response.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
    }
}
