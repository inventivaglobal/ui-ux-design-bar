import { parentPort, workerData } from 'node:worker_threads';
import { auditFolder, previewFolder, applyPlan, undoPlan } from '../engine/workspace.mjs';
import { auditCssFolder } from '../engine/css-audit.mjs';
try {
 const {action,root,plan,journal}=workerData;
 const result=action==='audit'?{source:auditFolder(root),css:auditCssFolder(root)}:action==='preview'?previewFolder(root):action==='apply'?applyPlan(root,plan):action==='undo'?undoPlan(root,journal):null;
 if(!result) throw new Error('Unsupported operation');
 parentPort.postMessage({result});
} catch(error) {parentPort.postMessage({error:error.message});}
