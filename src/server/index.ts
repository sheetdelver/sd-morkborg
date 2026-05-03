/**
 * Mörk Borg Module API - Index Handler
 * Returns module information and capabilities
 */

export async function handleIndex() {
    return Response.json({
        module: 'morkborg',
        title: 'Mörk Borg',
        version: '1.0.0',
        capabilities: {
            actorData: true,
            itemManagement: true,
            updates: true
        },
        endpoints: [
            'GET /api/modules/morkborg/index',
            'GET /api/modules/morkborg/actors/[id]/data',
            'GET /api/modules/morkborg/actors/[id]/items',
            'POST /api/modules/morkborg/actors/[id]/update',
            'DELETE /api/modules/morkborg/actors/[id]/items/[itemId]'
        ]
    });
}
