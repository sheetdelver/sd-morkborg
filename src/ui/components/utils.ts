/* Common utilities for MorkBorg UI */

export function randomRotation() {
    const flip = Math.floor(Math.random() * 2) === 0 ? '' : '-';
    return `${flip}rotate-${Math.floor(Math.random() * 2) + 1}`;
}