// Native tag 6.0.1 / manifest 6.0.0, d850c094: config.js and copied pack IDs.
const table = (id: string) => `Compendium.morkborg.mork-borg-tables.RollTable.${id}`;
const item = (id: string) => `Compendium.morkborg.mork-borg-items.Item.${id}`;
export const native = {
    revision: 'd850c094a9452d752307221f42245a73b66bdfbb',
    // Pinned upstream result has both a nonexistent pack and stale Actor ID.
    // No name-only substitution to the differently identified Hegelian Owl.
    brokenForlornOwl: { tableUuid: table('DfILdvixuR0LyIcT'), rowId: 'RaRYtTXoANahK7PP', documentUuid: 'Compendium.morkborg.morkborg-actors.6QMkD6jeNJ5ovUmf' },
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
