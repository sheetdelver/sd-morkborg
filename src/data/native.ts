// Native tag 6.0.1 / manifest 6.0.0, d850c094: config.js and copied pack IDs.
const table = (id: string) => `Compendium.morkborg.mork-borg-tables.RollTable.${id}`;
const item = (id: string) => `Compendium.morkborg.mork-borg-items.Item.${id}`;
export const native = {
    revision: 'd850c094a9452d752307221f42245a73b66bdfbb',
    // ADR-0001 operator decision: temporary equal choice between these exact
    // source IDs, only for Pale One's declared starting-item reference.
    intuitivePower: { classUuid: item('wLJV0VJT5I234obT'), reference: 'morkborg.mork-borg-items,Intuitive Power', options: [item('BtoSeh36zY8IqOQJ'), item('YcKA0JHLezBYt3fz')] },
    // ADR-0001 operator-approved override for this exact broken upstream row.
    // This does not repair the source table or introduce name-based Actor lookup.
    brokenForlornOwl: { tableUuid: table('DfILdvixuR0LyIcT'), rowId: 'RaRYtTXoANahK7PP', documentUuid: 'Compendium.morkborg.morkborg-actors.6QMkD6jeNJ5ovUmf', targetUuid: 'Compendium.morkborg.mork-borg-actors.Actor.HLu7lgwoNPlhfx3W' },
    classless: item('p693pMIVYXMSRl8S'),
    food: item('4kuVcY67MIDA6Imc'), water: item('Zrs4ubq4fDBNPmnN'),
    names: table('tBHfdSGFvfmrLreR'),
    equipment: [table('ByN7RI3Vc88ScBCj'), table('o6wjXShp2CLQEr7X'), table('rq8zq4VHY3px5hpF')],
    weapon: table('qYznag89iDMdPH6A'), armor: table('Cyg5IvubZiDmCCUk'),
    trait: table('NVvpbvPl6tgxUWRF'), body: table('X0NEcY9HqocgpLlF'), habit: table('PA5ttbXKQwPmO52P'),
    broken: table('ncXwgtRMqoiREban'), arcaneCatastrophes: table('Zxq0ndUQsBDdc2HW'),
    occultHerbmasterDecoctions: table('9HXT5mQtNkSQB8lY'),
    uncleanScrolls: table('Bpv8mPTS0jDIAJ6B'), sacredScrolls: table('55cNRqtWTVNb7Trw'),
    decoctionMacro: 'Compendium.morkborg.mork-borg-macros.Macro.l6vx8Dy5iSzh7OEh',
} as const;
