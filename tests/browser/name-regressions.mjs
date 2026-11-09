import assert from 'node:assert/strict';
import fs from 'node:fs';
import {go,evaluate,send,wait,pause,errors,ws} from './cdp.mjs';
const results=[];
try{
 for(const width of [390,414,820,1280]){
  try{
   await go('installed',width);await wait('window.__setName');
   await evaluate("window.__setName('Shpeelg','/portrait.svg')");await evaluate('document.fonts.ready');await evaluate("document.querySelector('img[alt=\"Character Portrait\"]').style.display=''");await pause(150);assert.equal(await evaluate("document.querySelector('img[alt=\"Character Portrait\"]').naturalWidth"),96,'portrait must render');
   const rect=await evaluate(`(()=>{const h=document.querySelector('h1');const r=document.createRange();r.selectNodeContents(h);return{height:r.getBoundingClientRect().height,font:parseFloat(getComputedStyle(h).fontSize),overflow:document.documentElement.scrollWidth>innerWidth+1}})()`);
   fs.writeFileSync(`name-${width}.png`,Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
   assert.ok(rect.height<rect.font*1.6,'short name split across lines: '+JSON.stringify(rect));assert.equal(rect.overflow,false);
   await evaluate("window.__setName('A very long character name with many words')");await pause(80);
   assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth+1'),false,'long name overflow');
   results.push({width,passed:true});
  }catch(e){results.push({width,passed:false,error:String(e)});}
 }
 assert.deepEqual(errors,[]);
}finally{fs.writeFileSync('results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));ws.close();}
if(results.some(r=>!r.passed))process.exitCode=1;
