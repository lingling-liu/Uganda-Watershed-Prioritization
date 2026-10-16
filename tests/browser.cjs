const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const XLSX=require('../node_modules/xlsx');
const DATA=JSON.parse(fs.readFileSync('public/data/watersheds.json','utf8'));
const IND=JSON.parse(fs.readFileSync('public/data/indicators.json','utf8'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.TEST_BROWSER,args:['--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1550,height:1050},acceptDownloads:true});const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const url=process.env.TEST_URL||'http://127.0.0.1:8090/';
 await p.goto(url);await p.getByRole('heading',{name:'Watershed rankings',exact:true}).waitFor();
 assert.equal(await p.locator('.ranking tbody tr').count(),25);assert((await p.locator('.metrics').first().innerText()).includes('2,028'));
 assert((await p.locator('.ranking tbody tr').first().innerText()).includes('#1584'));
 await p.waitForTimeout(2000);assert.equal(await p.locator('.map canvas').count(),1);assert.equal(await p.getByText('WebGL is unavailable',{exact:false}).count(),0);
 // Actual map click selects a polygon and synchronizes its table checkbox.
 const canvas=p.locator('.map canvas');const box=await canvas.boundingBox();await canvas.click({position:{x:box.width*.5,y:box.height*.5}});
 await p.locator('.detail-drawer').waitFor();const mapId=Number((await p.locator('.detail-drawer h2').innerText()).replace('Lev12 #',''));assert(DATA.some(r=>r.id===mapId));
 await p.getByRole('button',{name:'Close watershed profile'}).click();await p.getByRole('textbox',{name:'Search watershed ID'}).fill(String(mapId));assert(await p.getByRole('checkbox',{name:'Compare watershed '+mapId,exact:true}).isChecked());await p.getByRole('textbox',{name:'Search watershed ID'}).fill('');
 // Clear selection and select two known watersheds for comparison.
 await p.getByRole('button',{name:/Compare watersheds/}).first().click();await p.getByRole('button',{name:'Clear selection',exact:true}).click();await p.getByRole('button',{name:'Explore',exact:true}).click();
 for(const id of [1584,1649]){await p.getByRole('checkbox',{name:'Compare watershed '+id,exact:true}).check();await p.getByRole('button',{name:'Close watershed profile'}).click()}
 await p.getByRole('button',{name:/Compare watersheds/}).first().click();assert.equal(await p.locator('.selection-chips button').count(),2);assert.equal(await p.locator('.comparison-charts .recharts-wrapper').count(),2);
 let download=p.waitForEvent('download',d=>d.suggestedFilename()==='Uganda-selected-watersheds.geojson');await p.getByRole('button',{name:'Selected GeoJSON',exact:true}).click();let dl=await download;const gj=JSON.parse(fs.readFileSync(await dl.path(),'utf8'));assert.equal(gj.features.length,2);assert.equal(gj.metadata.joinKey,'Lev12_ID');assert(gj.features.every(f=>f.properties.Priority_Score>0.94));
 await p.screenshot({path:'reports/comparison-desktop.png',fullPage:true});
 download=p.waitForEvent('download',d=>d.suggestedFilename()==='Uganda-comparison-charts.png');await p.getByRole('button',{name:'Charts PNG',exact:true}).click();dl=await download;assert(fs.statSync(await dl.path()).size>5000);
 await p.getByRole('button',{name:'Explore',exact:true}).click();
 // Tier and ID search are display filters; score remains unchanged.
 await p.getByRole('button',{name:'Top 5%',exact:true}).first().click();assert((await p.locator('.ranking .section-title p').innerText()).includes('102 displayed'));
 await p.getByRole('textbox',{name:'Search watershed ID'}).fill('1584');assert.equal(await p.locator('.ranking tbody tr').count(),1);assert((await p.locator('.ranking tbody tr').innerText()).includes('0.9587'));
 download=p.waitForEvent('download',d=>d.suggestedFilename()==='Uganda-filtered-ranking.csv');await p.getByRole('button',{name:'Export current view',exact:true}).click();dl=await download;const csv=fs.readFileSync(await dl.path(),'utf8');assert(csv.includes('1584'));assert.equal(csv.trim().split(/\r?\n/).length,2);
 download=p.waitForEvent('download',d=>d.suggestedFilename()==='Uganda-current-priorities.xlsx');await p.getByRole('button',{name:'Filtered Excel',exact:true}).click();dl=await download;const wb=XLSX.readFile(await dl.path());assert.deepEqual(wb.SheetNames,['Current ranking','Configuration','Metadata']);const xr=XLSX.utils.sheet_to_json(wb.Sheets['Current ranking']);assert.equal(xr.length,1);assert.equal(xr[0].Lev12_ID,1584);assert(Math.abs(xr[0].Priority_Score-.9586734693877549)<1e-12);
 await p.getByRole('textbox',{name:'Search watershed ID'}).fill('');await p.getByRole('button',{name:'All',exact:true}).click();
 download=p.waitForEvent('download',d=>d.suggestedFilename()==='Uganda-priority-map.png');await p.getByRole('button',{name:'PNG',exact:true}).click();dl=await download;assert(fs.statSync(await dl.path()).size>5000);
 // Criteria and direction changes.
 await p.getByRole('button',{name:'Criteria & weights',exact:true}).click();assert.equal(await p.locator('.criteria tbody tr').count(),21);
 await p.getByRole('combobox',{name:'Direction Sediment Export Rate (t/ha)',exact:true}).selectOption('lower');
 await p.getByRole('button',{name:'Explore',exact:true}).click();assert(!(await p.locator('.ranking tbody tr').first().innerText()).includes('#1584'));
 await p.getByRole('button',{name:'Criteria & weights',exact:true}).click();await p.getByRole('button',{name:'Save in browser',exact:true}).click();await p.reload();await p.getByRole('button',{name:'Criteria & weights',exact:true}).click();assert.equal(await p.getByRole('combobox',{name:'Direction Sediment Export Rate (t/ha)',exact:true}).inputValue(),'lower');
 await p.getByRole('button',{name:'Excel defaults',exact:true}).click();assert.equal(await p.getByRole('combobox',{name:'Direction Sediment Export Rate (t/ha)',exact:true}).inputValue(),'higher');
 while(await p.locator('.criteria input[type=checkbox]:checked').count())await p.locator('.criteria input[type=checkbox]:checked').first().uncheck();assert((await p.locator('.warning').first().innerText()).includes('No positive active weight'));await p.getByRole('button',{name:'Excel defaults',exact:true}).click();
 // Future CSV import: reject unmatched and duplicate records, then accept verified values.
 const upload=p.locator('input[type=file][accept=".csv"]');
 await upload.setInputFiles({name:'invalid.csv',mimeType:'text/csv',buffer:Buffer.from('Lev12_ID,Mean Baseflow (mm/yr)\n9999999,10\n')});await p.getByRole('status').filter({hasText:'Import rejected'}).waitFor();
 await upload.setInputFiles({name:'duplicate.csv',mimeType:'text/csv',buffer:Buffer.from('Lev12_ID,Mean Baseflow (mm/yr)\n1584,10\n1584,12\n')});await p.getByRole('status').filter({hasText:'Duplicate'}).waitFor();
 await upload.setInputFiles({name:'actual-test.csv',mimeType:'text/csv',buffer:Buffer.from('Lev12_ID,Mean Baseflow (mm/yr)\n1584,10\n1649,20\n')});await p.getByRole('checkbox',{name:'Include Mean Baseflow (mm/yr)',exact:true}).waitFor();assert.equal(await p.locator('.criteria tbody tr').count(),22);assert.equal(await p.getByRole('checkbox',{name:'Include Mean Baseflow (mm/yr)',exact:true}).isChecked(),false);
 await p.getByRole('button',{name:'Save in browser',exact:true}).click();await p.reload();await p.getByRole('button',{name:'Criteria & weights',exact:true}).click();await p.getByRole('checkbox',{name:'Include Mean Baseflow (mm/yr)',exact:true}).waitFor();assert.equal(await p.locator('.criteria tbody tr').count(),22);
 await p.getByRole('button',{name:'Excel defaults',exact:true}).click();await p.getByRole('button',{name:'Save in browser',exact:true}).click();
 // Empty filters and responsive routes.
 await p.getByRole('spinbutton',{name:'Minimum area (ha)',exact:true}).fill('99999999');await p.getByRole('button',{name:'Explore',exact:true}).click();assert(await p.getByText('No watersheds match these filters.',{exact:false}).isVisible());await p.getByRole('button',{name:'Reset filters',exact:true}).click();
 for(const width of [1550,768,390]){await p.setViewportSize({width,height:950});for(const route of ['Explore','Criteria & weights','Compare watersheds','Methodology','Data & validation']){await p.getByRole('button',{name:route==='Compare watersheds'?/Compare watersheds/:route,exact:route!=='Compare watersheds'}).first().click();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow ${width} ${route}`)}}
 await p.getByRole('button',{name:'Explore',exact:true}).click();await p.screenshot({path:'reports/dashboard-mobile.png',fullPage:true});await p.setViewportSize({width:1550,height:1100});await p.waitForTimeout(1000);await p.screenshot({path:'reports/dashboard-desktop.png',fullPage:true});assert.deepEqual(errors,[]);
 await browser.close();console.log('PASS: actual map click/table synchronization; comparison; tier/search; CSV/Excel/GeoJSON/PNG exports; criteria/direction changes; saved config reload; zero weights; hydrology import rejection/acceptance; empty scope; all five sections at desktop/tablet/mobile; no JS errors.');
})().catch(e=>{console.error(e);process.exit(1)});
