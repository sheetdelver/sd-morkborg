import fs from 'node:fs';
import assert from 'node:assert/strict';
import {go,click,evaluate,wait,ws,errors} from './cdp.mjs';
const results=[];
try {
    await go();
    await click(`document.querySelector('[aria-label="Test Strength"]')`);
    await wait('document.querySelector("[role=dialog]")');
    assert.ok(await evaluate(`document.querySelector('[role=dialog]').textContent.includes('1d20-3')`));
    results.push({name:'raw form opens through actual released installed import rewriting',status:'passed'});
} catch (e) {
    results.push({name:'raw form opens through actual released installed import rewriting',status:'failed',error:e.message});
    process.exitCode=1;
} finally {
    fs.writeFileSync('browser-results.json',JSON.stringify({package:process.env.MB_BROWSER_ARCHIVE_HASH,scope:'Actual Core installed import rewriter plus packaged UI; composed requests remain fixtures',results,errors},null,2));
    console.log(JSON.stringify({results,errors},null,2));ws.close();
}
