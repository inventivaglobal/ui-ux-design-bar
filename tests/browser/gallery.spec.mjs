import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {settleVisuals} from './settle.mjs';
test('curated gallery supports labelled controls, keyboard tabs, modal dismissal and responsive axe checks',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?demo=gallery');
 await expect(page.getByRole('heading',{level:1})).toHaveText('B.A.R component gallery');
 await page.getByRole('textbox',{name:'Record name'}).fill('Example');
 await settleVisuals(page);const filled=await new AxeBuilder({page}).analyze();
 await testInfo.attach('gallery-filled-axe',{body:JSON.stringify(filled,null,2),contentType:'application/json'});expect(filled.violations).toEqual([]);
 await page.getByRole('button',{name:'Clear record name'}).click();
 await expect(page.getByRole('textbox',{name:'Record name'})).toHaveValue('');
 await page.getByRole('combobox',{name:'Record status'}).click();await page.getByRole('option',{name:'Ready',exact:true}).click();
 await expect(page.getByRole('cell',{name:'ready',exact:true})).toBeVisible();
 await page.getByRole('tab',{name:'Overview',exact:true}).focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');
 await expect(page.getByRole('tabpanel')).toHaveText('Details content');
 const open=page.getByRole('button',{name:'Review record',exact:true});await open.click();
 await expect(page.getByRole('dialog',{name:'Review record'})).toBeVisible();
 await expect(page.locator('.MuiDialog-container')).toHaveCSS('opacity','1');
 await testInfo.attach('gallery-dialog',{body:await page.screenshot({fullPage:true,animations:'disabled'}),contentType:'image/png'});
 await settleVisuals(page);expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
 const close=page.getByRole('button',{name:'Close review'});await close.focus();await page.keyboard.press('Tab');await expect(close).toBeFocused();await page.keyboard.press('Shift+Tab');await expect(close).toBeFocused();
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toBeHidden();await expect(open).toBeFocused();
 await open.click();await page.getByRole('button',{name:'Close review'}).click();await expect(page.getByRole('dialog')).toBeHidden();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await settleVisuals(page);expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);expect(errors).toEqual([]);
 for(const button of await page.getByRole('button').all()){ const box=await button.boundingBox();expect(box.height).toBeGreaterThanOrEqual(44);expect(box.width).toBeGreaterThanOrEqual(44); }
 await testInfo.attach('gallery-complete',{body:await page.screenshot({fullPage:true,animations:'disabled'}),contentType:'image/png'});
});
