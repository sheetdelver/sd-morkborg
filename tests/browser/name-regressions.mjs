import assert from 'node:assert/strict';
import fs from 'node:fs';
import {go,evaluate,send,wait,pause,errors,ws} from './cdp.mjs';
const results=[];
try{
 for(const width of [320,360,375,378,379,384,390,414,640,767,768,810,820,834,885,900,1023,1024,1280]){
  try{
   await go('installed',width);await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:2,mobile:width<640});await wait('window.__setName');await evaluate("window.__scene('page')");await wait('document.querySelector("main nav")');
   await evaluate("window.__setName('Shpeelg','/portrait.svg')");await evaluate('document.fonts.ready');assert.equal(await evaluate("[...document.fonts].some(f=>f.family==='ObservedIMFell'&&f.status==='loaded')"),true,'Set MB_TEST_FONT to the real IM Fell font; fallback font is not layout evidence');await evaluate("document.querySelector('img[alt=\"Character Portrait\"]').style.display=''");await pause(150);assert.equal(await evaluate("document.querySelector('img[alt=\"Character Portrait\"]').naturalWidth"),96,'portrait must render');
   const rect=await evaluate(`(()=>{const h=document.querySelector('h1');const r=document.createRange();r.selectNodeContents(h);return{boxWidth:h.getBoundingClientRect().width,height:r.getBoundingClientRect().height,font:parseFloat(getComputedStyle(h).fontSize),overflow:document.documentElement.scrollWidth>innerWidth+1}})()`);
   fs.writeFileSync(`name-${width}.png`,Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
   assert.ok(rect.height<rect.font*1.6,'short name split across lines: '+JSON.stringify(rect));assert.equal(rect.overflow,false);
   await evaluate("window.__setName('A very long character name with many words')");await pause(80);
   assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth+1'),false,'long name overflow');
   await evaluate("window.__setName('Anexceptionallylongunbrokencharactername')");await pause(80);
   assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth+1'),false,'unbroken name overflow');
   results.push({width,dpr:2,passed:true,...rect});
  }catch(e){results.push({width,passed:false,error:String(e)});}
 }
 assert.deepEqual(errors,[]);
}finally{fs.writeFileSync('results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));ws.close();}
if(results.some(r=>!r.passed))process.exitCode=1;
