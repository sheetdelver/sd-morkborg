/**
 * Utility to generate Mörk Borg stylized chat card HTML.
 * Strictly ported from the original .hbs templates in the Mörk Borg system.
 */

export class ChatCards {
    /** Strip blank lines so the chat renderer doesn't insert paragraph gaps */
    private static compact(html: string): string {
        return html.replace(/\n(\s*\n)+/g, '\n').trim();
    }

    /**
     * Replicates the Handlebars 'xtotal' helper.
     * Formats a Roll as either the total or x + y + z = total if the roll has multiple terms.
     */
    static xtotal(roll: any): string {
        if (!roll) return '';

        const formula = roll.formula || '';
        const total = roll.total?.toString() || '0';

        if (formula === total) return total;

        const result = (roll.result || formula).replace("+  -", "-").replace("+ -", "-");

        if (result !== total) {
            return `${result} = ${total}`;
        }
        return result;
    }

    /**
     * Attack Roll Card
     * Port of attack-roll-card.hbs
     */
    static attack(data: {
        weaponTypeLabel: string;
        items: any[];
        attackFormula: string;
        attackDR: number;
        attackRoll: any;
        attackOutcome: string;
        damageRoll?: any;
        targetArmorRoll?: any;
        takeDamage?: string;
    }): string {
        const itemRows = (data.items || []).map(item => `
            <div class="item-row">
                <img src="${item.img}" title="${item.name}" width="24" height="24" />
                <span class="item-name">${item.name}</span>
            </div>
        `).join('');

        const damageSection = data.damageRoll ? `
            <div class="roll-result">
                <div class="roll-title">
                    <span>Damage: ${data.damageRoll.formula || data.damageRoll._formula}</span>
                </div>
                <div class="roll-row">
                    <span>${this.xtotal(data.damageRoll)}</span>
                </div>
            </div>
        ` : '';

        const armorSection = data.targetArmorRoll ? `
            <div class="roll-result">
                <div class="roll-title">
                    <span>Target Armor: ${data.targetArmorRoll.formula}</span>
                </div>
                <div class="roll-row">
                    <span>${this.xtotal(data.targetArmorRoll)}</span>
                </div>
            </div>
        ` : '';

        const takeDamageSection = data.takeDamage ? `
            <div class="outcome-row">
                <span>${data.takeDamage}</span>
            </div>
        ` : '';

        return this.compact(`
<form class="roll-card attack-roll-card">
  <div class="card-title">${data.weaponTypeLabel} Attack</div>
  ${itemRows}
  <div class="roll-result">
    <div class="roll-title">
      <span>Attack: ${data.attackFormula} Vs DR ${data.attackDR}</span>
    </div>
    <div class="roll-row">
      <span>${this.xtotal(data.attackRoll)}</span>
    </div>
  </div>
  <div class="outcome-row">
    <span>${data.attackOutcome}</span>
  </div>
  ${damageSection}
  ${armorSection}
  ${takeDamageSection}
</form>`);
    }

    /**
     * Defense Roll Card
     * Port of defend-roll-card.hbs
     */
    static defend(data: {
        items: any[];
        defendFormula: string;
        defendDR: number;
        defendRoll: any;
        defendOutcome: string;
        attackRoll?: any;
        armorRoll?: any;
        takeDamage?: string;
    }): string {
        const itemRows = (data.items || []).map(item => `
            <div class="item-row">
                <img src="${item.img}" title="${item.name}" width="24" height="24" />
                <span class="item-name">${item.name}</span>
            </div>
        `).join('');

        const attackSection = data.attackRoll ? `
            <div class="roll-result">
                <div class="roll-title">
                    <span>Incoming Attack: ${data.attackRoll.formula}</span>
                </div>
                <div class="roll-row">
                    <span>${this.xtotal(data.attackRoll)}</span>
                </div>
            </div>
        ` : '';

        const armorSection = data.armorRoll ? `
            <div class="roll-result">
                <div class="roll-title">
                    <span>Armor DR: ${data.armorRoll.formula}</span>
                </div>
                <div class="roll-row">
                    <span>${this.xtotal(data.armorRoll)}</span>
                </div>
            </div>
        ` : '';

        const takeDamageSection = data.takeDamage ? `
            <div class="outcome-row">
                <span>${data.takeDamage}</span>
            </div>
        ` : '';

        return this.compact(`
<form class="roll-card defend-roll-card">
  <div class="card-title">Defense</div>
  ${itemRows}
  <div class="roll-result">
    <div class="roll-title">
      <span>Defense: ${data.defendFormula} Vs DR ${data.defendDR}</span>
    </div>
    <div class="roll-row">
      <span>${this.xtotal(data.defendRoll)}</span>
    </div>
  </div>
  <div class="outcome-row">
    <span>${data.defendOutcome}</span>
  </div>
  ${attackSection}
  ${armorSection}
  ${takeDamageSection}
</form>`);
    }

    /**
     * Result Card
     * Port of roll-result-card.hbs
     */
    static result(data: {
        cardTitle: string;
        items?: any[];
        drModifiers?: string[];
        rollResults: Array<{
            rollTitle?: string;
            roll?: any;
            outcomeLines?: string[];
        }>;
    }): string {
        const itemRows = (data.items || []).map(item => `
            <div class="item-row">
                <img src="${item.img}" title="${item.name}" width="24" height="24" />
                <span class="item-name">${item.name}</span>
            </div>
        `).join('');

        const drModifiers = data.drModifiers && data.drModifiers.length > 0 ? `
            <div class="dr-modifiers">
                ${data.drModifiers.map(mod => `<div class="dr-modifier">${mod}</div>`).join('')}
            </div>
        ` : '';

        const results = (data.rollResults || []).map(res => `
            <div class="roll-result">
                ${res.rollTitle ? `<div class="roll-title"><span>${res.rollTitle}</span></div>` : ''}
                ${res.roll ? `<div class="roll-row"><span>${this.xtotal(res.roll)}</span></div>` : ''}
                ${(res.outcomeLines || []).filter(Boolean).map(line => `
                    <div class="outcome-row"><span>${line}</span></div>
                `).join('')}
            </div>
        `).join('');

        return this.compact(`
<form class="roll-card">
  <div class="card-title">${data.cardTitle}</div>
  ${itemRows}
  ${drModifiers}
  ${results}
</form>`);
    }

    /**
     * Unautomated Attack Card
     * Port of unautomated-attack-roll-card.hbs
     */
    static unautomatedAttack(data: {
        cardTitle: string;
        item: any;
        attackFormula: string;
        attackRoll: any;
        actor: any;
    }): string {
        return this.compact(`
<form class="roll-card attack-roll-card">
  <div class="card-title">${data.cardTitle}</div>
  <div class="item-row">
    <img src="${data.item.img}" title="${data.item.name}" width="24" height="24" />
    <span class="item-name">${data.item.name}</span>
  </div>
  <div class="attack-roll">
    <div class="roll-title">
      <span>${data.attackFormula}</span>
    </div>
    <div class="roll-row">
      <span>${this.xtotal(data.attackRoll)}</span>
    </div>
  </div>
  <div class="roll-button-row">
    <button type="button" class="roll-card-button damage-button" data-actor-id="${data.actor.id}" data-item-id="${data.item.id}">Roll Damage</button>
  </div>
</form>`);
    }

    /**
     * Get Better Card
     * Port of get-better-roll-card.hbs
     */
    static getBetter(data: {
        hpOutcome: string;
        strOutcome: string;
        agiOutcome: string;
        preOutcome: string;
        touOutcome: string;
        debrisOutcome: string;
    }): string {
        return this.compact(`
<form class="roll-card">
  <div class="card-title">Get Better</div>
  <div class="roll-result">
    <div class="outcome-row"><span>${data.hpOutcome}</span></div>
    <div class="outcome-row"><span>${data.strOutcome}</span></div>
    <div class="outcome-row"><span>${data.agiOutcome}</span></div>
    <div class="outcome-row"><span>${data.preOutcome}</span></div>
    <div class="outcome-row"><span>${data.touOutcome}</span></div>
    <div class="roll-title">
      <span>Left in the debris you find:</span>
    </div>
    <div class="outcome-row"><span>${data.debrisOutcome}</span></div>
  </div>
</form>`);
    }
}
