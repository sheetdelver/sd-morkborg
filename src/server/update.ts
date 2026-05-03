/**
 * Mörk Borg Module API - Update Handler
 * Handles actor property updates
 */

import type { RouteFoundryClient } from '@server/shared/types/requestContext';
import { getErrorMessage } from '@server/shared/utils/getErrorMessage';

export async function handleUpdateActor(actorId: string, request: Request, client: RouteFoundryClient | null) {
    if (!client) {
        return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const { path, value } = await request.json();

        if (!path) {
            return Response.json({ error: 'Missing path parameter' }, { status: 400 });
        }

        // Update actor property
        await client.updateActor(actorId, { [path]: value });

        // Fetch updated actor
        const updatedActor = await client.getActor(actorId);

        return Response.json({
            success: true,
            actor: updatedActor
        });
    } catch (error: unknown) {
        return Response.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
