// Isolated development test runner; never starts Core or contacts a native world.
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import http from 'node:http';import net from 'node:net';import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';import {spawn,spawnSync} from 'node:child_process';
const here=path.dirname(fileURLToPath(import.meta.url));
const option=name=>{const i=process.argv.indexOf(name);return i<0?undefined:process.argv[i+1]};
const core=path.resolve(option('--core')??process.cwd()),archive=option('--archive'),before=option('--before-archive');
if(!archive||!fs.existsSync(path.join(core,'src/shared/sdk/entry-react.ts')))throw Error('Usage: node tests/browser/run.mjs --core <released Core checkout> --archive <module.tgz> [--before-archive <module.tgz>]');
const output=fs.mkdtempSync(path.join(os.tmpdir(),'morkborg-browser-'));
if(fs.existsSync(path.join(core,'public/icons')))fs.cpSync(path.join(core,'public/icons'),path.join(output,'icons'),{recursive:true});
const requireCore=createRequire(path.join(core,'package.json'));
const {build}=requireCore('esbuild'),postcss=requireCore('postcss'),tailwind=requireCore('@tailwindcss/postcss');
const httpPort=Number(option('--port')??4181),cdpPort=Number(option('--cdp-port')??9418);
const available=port=>new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(port,'127.0.0.1',()=>s.close(resolve))});
await available(httpPort);await available(cdpPort);
const rewriterBuild=await build({entryPoints:[path.join(core,'src/server/routes/modules/rewriteModuleImports.ts')],bundle:true,platform:'node',format:'esm',write:false,logLevel:'warning'});
const {rewriteImportsForBrowser}=await import('data:text/javascript;base64,'+Buffer.from(rewriterBuild.outputFiles[0].text).toString('base64'));
for(const [flavor,file] of [['installed',archive],['baseline',before??archive]]){
 const target=path.join(output,flavor);fs.mkdirSync(target);
 const result=spawnSync('tar',['-xzf',path.resolve(file),'-C',target],{stdio:'inherit'});if(result.status!==0)throw Error('Archive extraction failed');
 const ui=path.join(target,'dist/ui.js');fs.writeFileSync(ui,rewriteImportsForBrowser(fs.readFileSync(ui,'utf8')));
 await build({entryPoints:[path.join(here,'harness.jsx')],outfile:path.join(output,flavor+'.js'),bundle:true,nodePaths:[path.join(core,'node_modules')],format:'esm',platform:'browser',jsx:'automatic',target:'es2022',tsconfig:path.join(core,'tsconfig.json'),
  alias:{'host-shared':path.join(core,'src/client/ui/components/SharedContentHost.tsx'),'host-confirm':path.join(core,'src/client/ui/components/ConfirmationModal.tsx'),'host-editor':path.join(core,'src/client/ui/components/RichTextEditor.tsx'),'host-ui':path.join(core,'src/client/ui/context/UIContext.tsx'),'host-hud':path.join(core,'src/client/ui/components/FloatingHUD.tsx'),
   '@client/ui/context/FoundryContext':path.join(here,'fixture-foundry.js'),'@client/ui/context/ConfigContext':path.join(here,'fixture-config.js'),'@client/ui/context/SessionContext':path.join(here,'fixture-session.js'),'@client/ui/context/ChatContext':path.join(here,'fixture-chat.js'),'next/navigation':path.join(here,'fixture-navigation.js'),'fixture-module':path.join(target,'dist/ui.js'),'fixture-logic':path.join(target,'dist/logic.js')},define:{'process.env.NODE_ENV':'"production"'},logLevel:'warning'});
}
const styles=await postcss([tailwind({base:core})]).process(`@import "tailwindcss" source(none);\n@source "${core}/src";`,{from:path.join(core,'src/app/browser-fixture.css')});
fs.writeFileSync(path.join(output,'host.css'),styles.css+fs.readFileSync(path.join(core,'src/app/globals.css'),'utf8').replace('@import "tailwindcss";',''));
fs.copyFileSync(path.join(here,'cdp.mjs'),path.join(output,'cdp.mjs'));
const testScript=option('--test-script')??'browser-tests.mjs';if(path.basename(testScript)!==testScript)throw Error('Test script must be in tests/browser');
fs.copyFileSync(path.join(here,testScript),path.join(output,'browser-tests.mjs'));
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://fixture');const flavor=url.searchParams.get('flavor')==='baseline'?'baseline':'installed';
 if(url.pathname==='/'){res.setHeader('Content-Type','text/html');res.end(`<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/host.css"><link rel="stylesheet" href="/${flavor}/assets/morkborg.tailwind.css"><body><div id="root"></div><script type="module" src="/${flavor}.js"></script></body></html>`);return}
 const requested=url.pathname.replace(/^\/api\/modules\/morkborg\/assets\//,'/installed/assets/');
 const target=path.resolve(output,'.'+requested);
 if(!target.startsWith(output+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){res.statusCode=404;res.end();return}
 res.setHeader('Content-Type',target.endsWith('.js')?'text/javascript':target.endsWith('.css')?'text/css':target.endsWith('.png')?'image/png':'application/octet-stream');fs.createReadStream(target).pipe(res);
});
await new Promise(resolve=>server.listen(httpPort,'127.0.0.1',resolve));
const chromeLog=fs.openSync(path.join(output,'chrome.log'),'w');
const chrome=spawn(option('--chrome')??process.env.CHROME??'google-chrome',['--headless=new','--no-sandbox','--disable-gpu','--disable-background-networking','--no-first-run','--no-default-browser-check','--remote-debugging-address=127.0.0.1',`--remote-debugging-port=${cdpPort}`,`--user-data-dir=${path.join(output,'chrome-profile')}`,'about:blank'],{stdio:['ignore',chromeLog,chromeLog]});
try{
 let ready=false;
 for(let n=0;n<100;n++){try{await fetch(`http://127.0.0.1:${cdpPort}/json/version`);ready=true;break}catch{await new Promise(r=>setTimeout(r,50))}}
 if(!ready)throw Error('Isolated Chrome did not start; see '+path.join(output,'chrome.log'));
 const checksum=createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
 const status=await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[path.join(output,'browser-tests.mjs')],{cwd:output,stdio:'inherit',env:{...process.env,MB_BROWSER_PORT:String(httpPort),MB_CDP_PORT:String(cdpPort),MB_BROWSER_ARCHIVE_HASH:checksum,MB_BEFORE_ARCHIVE:before??''}});
  const timer=setTimeout(()=>child.kill('SIGTERM'),90000);
  child.once('error',error=>{clearTimeout(timer);reject(error)});
  child.once('exit',code=>{clearTimeout(timer);resolve(code??1)});
 });process.exitCode=status;
}finally{
 chrome.kill('SIGTERM');await new Promise(resolve=>server.close(resolve));fs.closeSync(chromeLog);
 console.log('Browser evidence: '+output);
}
