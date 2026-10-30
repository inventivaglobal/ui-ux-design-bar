const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('bar',Object.freeze({
 choose:()=>ipcRenderer.invoke('bar:choose'),
 run:action=>ipcRenderer.invoke('bar:run',action),
 cancel:()=>ipcRenderer.invoke('bar:cancel'),
 exportReport:()=>ipcRenderer.invoke('bar:export'),
 undo:journal=>ipcRenderer.invoke('bar:undo',journal)
}));
