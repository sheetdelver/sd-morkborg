/** Conservative presentation gate. Caller-bound Core services still authorize every write. */
export function canEditActor(actor: { ownership?: Record<string, number> } | null, user: { id: string; isGM: boolean } | null, hostOwner: boolean): boolean {
    if (!hostOwner || !actor || !user) return false;
    if (user.isGM) return true;
    // Released Core's hook defaults an absent isOwner projection to true.
    // Native explicit user ownership overrides the default (including level 0).
    const level = actor.ownership?.[user.id] ?? actor.ownership?.default;
    return typeof level === 'number' && level >= 3;
}
