// Wait for finite UI transitions/ripples; infinite animations remain explicit review scope.
export async function settleVisuals(page) {
 await page.evaluate(async()=>{
  await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 });
}

// Supplement axe's outlined-field overlap uncertainty with scoped computed-color evidence.
// This is not a general pixel/gradient contrast auditor; unsupported effects fail the fixture check.
export async function textContrast(locator, testInfo, name) {
 const evidence=await locator.evaluate(element=>{
  const rgb=value=>{const nums=value.match(/[\d.]+/g)?.map(Number);if(!nums||nums.length<3)throw new Error('Unsupported fixture color');return [...nums.slice(0,3),nums[3]??1];};
  const layers=[];
  for(let e=element;e;e=e.parentElement){const s=getComputedStyle(e);if(Number(s.opacity)!==1||s.backgroundImage!=='none')throw new Error('Unsupported fixture opacity/background');layers.push(rgb(s.backgroundColor));}
  let background=[255,255,255];for(const layer of layers.reverse())background=background.map((v,i)=>layer[i]*layer[3]+v*(1-layer[3]));
  const color=rgb(getComputedStyle(element).color), foreground=background.map((v,i)=>color[i]*color[3]+v*(1-color[3]));
  const lum=c=>c.map(n=>{n/=255;return n<=0.04045?n/12.92:((n+0.055)/1.055)**2.4;}).reduce((n,v,i)=>n+v*[0.2126,0.7152,0.0722][i],0);
  const a=lum(foreground),b=lum(background);return {foreground,background,ratio:(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05),method:'computed solid-color compositing; not pixel certification'};
 });
 await testInfo.attach(`contrast-${name}`,{body:JSON.stringify(evidence,null,2),contentType:'application/json'});
 if(evidence.ratio<4.5)throw new Error(`${name} text contrast ${evidence.ratio} below4.5`);
}
