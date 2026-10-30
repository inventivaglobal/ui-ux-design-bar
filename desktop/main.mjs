import {app,BrowserWindow,ipcMain,dialog,session} from 'electron';
import {Worker} from 'node:worker_threads';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const page=new URL('./index.html',import.meta.url).href;
const assets=new Set(['index.html','style.css','renderer.js'].map(file=>new URL(file,import.meta.url).href));
const test=process.env.BAR_DESKTOP_TEST==='1'&&process.argv.includes('--bar-desktop-test');
let window,root=null,plan=null,report=null,job=null,requestActive=false;
const journals=()=>{
 if(!root)return [];
 try {const dir=path.join(root,'.bar');if(fs.realpathSync(dir)!==dir)return [];
 return fs.readdirSync(dir).filter(x=>/^[0-9a-f-]{36}\.json$/.test(x)).slice(-100).map(x=>x.slice(0,-5));}catch{return [];}
};
function idle(){if(job)throw new Error('Another operation is running. Wait or cancel the scan first.');}
function selected(){if(!root)throw new Error('Choose a project folder first.');if(fs.realpathSync(root)!==root||!fs.lstatSync(root).isDirectory())throw new Error('Selected folder changed. Choose it again.');}
async function confirm(message){return test?process.env.BAR_TEST_CONFIRM==='1':(await dialog.showMessageBox(window,{type:'warning',title:'Confirm project changes',message,detail:'Only the previewed, supported source repairs are allowed. Keep your project under version control and run its tests afterwards.',buttons:['Cancel','Continue'],defaultId:0,cancelId:0,noLink:true})).response===1;}
function run(action){
 selected();idle();
 return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./worker.mjs',import.meta.url),{workerData:{action,root,plan:action==='apply'?plan:null,journal:action==='undo'?run.journal:null}});
  job={worker,action,reject};
  let settled=false;
  const finish=(error,result)=>{if(settled)return;settled=true;job=null;error?reject(error):resolve(result);};
  worker.once('message',m=>finish(m.error?new Error(m.error):null,m.result));
  worker.once('error',e=>finish(e));
  worker.once('exit',code=>{if(!settled)finish(new Error(code?'Operation stopped.':'Operation ended without a result.'));});
 });
}
function handle(channel,fn){ipcMain.handle(channel,async(event,...args)=>{
 if(event.sender!==window.webContents||event.senderFrame!==window.webContents.mainFrame||event.senderFrame.url!==page)throw new Error('Untrusted request');
 const exclusive=channel!=='bar:cancel';
 if(exclusive&&requestActive)return {ok:false,error:'Another operation is running.'};
 if(exclusive)requestActive=true;
 try{return {ok:true,value:await fn(...args)};}catch(error){return {ok:false,error:error.message,journals:journals()};}finally{if(exclusive)requestActive=false;}
});}
// Do not top-level await readiness: Electron waits for ESM evaluation before ready.
app.whenReady().then(async()=>{
session.defaultSession.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
session.defaultSession.setPermissionCheckHandler(()=>false);
session.defaultSession.webRequest.onBeforeRequest((details,callback)=>callback({cancel:!assets.has(details.url)}));
window=new BrowserWindow({width:1180,height:850,minWidth:760,minHeight:600,title:'B.A.R — Build · Audit · Repair',backgroundColor:'#f4f6f9',webPreferences:{preload:path.join(here,'preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false,webSecurity:true}});
window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
window.webContents.on('will-navigate',event=>event.preventDefault());
window.on('close',event=>{if(job&&['apply','undo'].includes(job.action)){event.preventDefault();dialog.showMessageBox(window,{message:'A repair is being written. Please wait until it finishes before closing B.A.R.'});}else job?.worker.terminate();});
handle('bar:choose',async()=>{idle();const chosen=test?process.env.BAR_TEST_PROJECT:(await dialog.showOpenDialog(window,{title:'Choose your project source folder',properties:['openDirectory']})).filePaths[0];if(!chosen)return null;const candidate=path.resolve(chosen);if(fs.realpathSync(candidate)!==candidate||!fs.lstatSync(candidate).isDirectory())throw new Error('Choose a real folder without symlink ancestors.');root=candidate;plan=null;report=null;return {root,journals:journals()};});
handle('bar:run',async action=>{
 if(!['audit','preview','apply'].includes(action))throw new Error('Unsupported action');
 selected();idle();
 if(action==='apply') {if(!plan?.changes.length)throw new Error('Preview repairs first.');if(!await confirm(`Apply ${plan.changes.length} previewed file change(s)?`))return {cancelled:true};}
 if(action!=='apply')plan=null;
 if(action==='audit')report=null;
 const pending=run(action);
 if(action==='apply')plan=null;
 const result=await pending;
 if(action==='audit'){report=result;plan=null;return {report,journals:journals()};}
 if(action==='preview'){plan=result;return {preview:{changes:result.changes.map(({file,diff})=>({file,diff})),summary:result.report.summary},journals:journals()};}
 plan=null;return {result,journals:journals()};
});
handle('bar:undo',async journal=>{selected();idle();if(typeof journal!=='string'||!journals().includes(journal))throw new Error('Choose an existing recovery journal.');if(!await confirm('Restore original source bytes from this recovery journal? Later edits will not be overwritten.'))return {cancelled:true};plan=null;run.journal=journal;const result=await run('undo');plan=null;return {result,journals:journals()};});
handle('bar:cancel',async()=>{if(!job)return false;if(['apply','undo'].includes(job.action))throw new Error('Writes cannot be cancelled. Wait for the operation to finish.');await job.worker.terminate();return true;});
handle('bar:export',async()=>{idle();if(!report)throw new Error('Run an audit first.');const target=test?process.env.BAR_TEST_EXPORT_PATH:(await dialog.showSaveDialog(window,{title:'Export audit report',defaultPath:'bar-report.json',filters:[{name:'JSON report',extensions:['json']}]})).filePath;if(!target)return null;if(path.extname(target).toLowerCase()!=='.json')throw new Error('Reports must use the .json extension.');fs.writeFileSync(target,JSON.stringify(report,null,2),{encoding:'utf8',mode:0o600});return target;});
await window.loadURL(page);
}).catch(error=>{
 console.error('B.A.R startup failed:',error);
 if(!test)dialog.showErrorBox('B.A.R could not start',String(error.message||error));
 app.exit(1);
});
app.on('window-all-closed',()=>app.quit());
