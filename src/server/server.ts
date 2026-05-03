/**
 * Mörk Borg Module - Server Routes
 * API endpoints for the Mörk Borg system module
 */

import type { ModuleRouteParams } from '@server/shared/types/moduleProxy';
import { getModuleFoundryClient } from '@server/shared/utils/getModuleFoundryClient';
import { handleIndex } from './index';
import { handleGetActorData } from './actor-data';
import { handleGetItems, handleDeleteItem } from './items';
import { handleUpdateActor } from './update';
import { handleBrewDecoctions } from './brew-decoctions';
import { logger } from '@shared/utils/logger';

export const apiRoutes = {
    'index': handleIndex,

    'actors/[id]': async (request: Request, { params }: ModuleRouteParams) => {
        const { route } = await params;
        const actorId = route[1];
        const client = getModuleFoundryClient(request);
        return handleGetActorData(actorId, client);
    },

    'actors/[id]/data': async (request: Request, { params }: ModuleRouteParams) => {
        const { route } = await params;
        const actorId = route[1];
        const client = getModuleFoundryClient(request);
        return handleGetActorData(actorId, client);
    },

    'actors/[id]/items': async (request: Request, { params }: ModuleRouteParams) => {
        const { route } = await params;
        const actorId = route[1];
        const client = getModuleFoundryClient(request);
        return handleGetItems(actorId, client);
    },

    'actors/[id]/update': async (request: Request, { params }: ModuleRouteParams) => {
        const { route } = await params;
        const actorId = route[1];
        const client = getModuleFoundryClient(request);
        return handleUpdateActor(actorId, request, client);
    },

    'actors/[id]/items/[itemId]': async (request: Request, { params }: ModuleRouteParams) => {
        const { route } = await params;
        const actorId = route[1];
        const itemId = route[3];
        const client = getModuleFoundryClient(request);

        if (request.method === 'DELETE') {
            return handleDeleteItem(actorId, itemId, client);
        }

        return Response.json({ error: 'Method not allowed' }, { status: 405 });
    },

    'actors/[id]/brew-decoctions': async (request: Request, { params }: ModuleRouteParams) => {
        const { route } = await params;
        const actorId = route[1];
        const client = getModuleFoundryClient(request);
        return handleBrewDecoctions(actorId, request, client);
    }
};

logger.info(`[DEBUG] morkborg/server.ts loaded. keys: ${Object.keys(apiRoutes || {}).join(', ')}`);
