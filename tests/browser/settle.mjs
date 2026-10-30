// Wait for finite UI transitions/ripples; infinite animations remain explicit review scope.
export async function settleVisuals(page) {
 await page.evaluate(async()=>{
  await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 });
}
