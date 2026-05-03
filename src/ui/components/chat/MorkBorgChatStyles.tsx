'use client';

import { useEffect } from 'react';

const MB_CHAT_CSS = `
  .roll-card {
    font-family: 'IM Fell Double Pica', Georgia, serif;
    background: #111;
    border: 2px solid #1a1a1a;
    color: #e8e0d0;
    font-size: 0;
    line-height: 0;
    margin: 0;
    padding: 0;
    width: 100%;
    box-sizing: border-box;
    display: block;
  }
  .roll-card * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-size: 13px;
    line-height: 1.3;
  }
  .roll-card .card-title {
    display: block;
    background: #ffe900;
    color: #000;
    font-size: 15px;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 3px 8px;
    border-bottom: 2px solid #000;
  }
  .roll-card .item-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 8px;
    border-bottom: 1px solid #333;
  }
  .roll-card .item-name {
    font-size: 13px;
    color: #ccc;
  }
  .roll-card .roll-result {
    display: block;
  }
  .roll-card .roll-title {
    display: block;
    background: #1a1a1a;
    padding: 2px 8px;
    font-size: 11px;
    color: #aaa;
    text-align: center;
    font-style: italic;
    border-top: 1px solid #222;
  }
  .roll-card .roll-row {
    display: block;
    background: #0d0d0d;
    padding: 2px 8px;
    text-align: center;
    font-size: 13px;
    color: #fff;
    border-top: 1px solid #222;
    font-family: monospace;
    letter-spacing: 0.05em;
  }
  .roll-card .outcome-row {
    display: block;
    background: #ffe900;
    color: #000;
    padding: 3px 8px;
    text-align: center;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 12px;
    letter-spacing: 0.04em;
    border-top: 1px solid #d4b800;
  }
  .roll-card .dr-modifiers {
    display: block;
    padding: 2px 8px;
    background: #1a1a1a;
  }
  .roll-card .dr-modifier {
    display: block;
    color: #f5a623;
    font-size: 11px;
    text-align: center;
    font-style: italic;
  }
  .roll-card .roll-button-row {
    display: block;
    padding: 4px 8px;
    text-align: center;
    border-top: 1px solid #222;
  }
  .roll-card .roll-card-button {
    background: #ffe900;
    color: #000;
    border: 2px solid #000;
    padding: 2px 12px;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 12px;
    cursor: pointer;
  }
  .roll-card .roll-card-button:hover {
    background: #fff;
  }
`;

const STYLE_ID = 'morkborg-chat-styles';

/**
 * Injects Mörk Borg chat card CSS into the document <head> once.
 * Targets the existing .roll-card class — nothing extra is sent to Foundry.
 * Scoped entirely within the morkborg module — no core changes required.
 */
export default function MorkBorgChatStyles() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = MB_CHAT_CSS;
    document.head.appendChild(el);
    return () => {
      document.getElementById(STYLE_ID)?.remove();
    };
  }, []);

  return null;
}
