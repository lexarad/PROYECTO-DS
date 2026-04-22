/**
 * inspectar-pasos-nac.ts — avanza el form MJ nacimiento paso a paso y dumpea
 * todos los selectores reales para alinear forms/nacimiento.ts con el HTML real.
 *
 * Usa string-based page.evaluate (no arrow/function literals — tsx __name bug).
 */
import { chromium } from 'playwright-core'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const URL_INICIO = 'https://sede.mjusticia.gob.es/sereci/initDatosGenerales?idMateria=NAC&idtramite=102&lang=es_es&idpagina=1215197884559'

const DUMP_JS = `(function(){
  var selects = [];
  var allSel = document.querySelectorAll('select');
  for (var i=0;i<allSel.length;i++) {
    var s = allSel[i];
    var opts = [];
    for (var j=0;j<s.options.length && j<15;j++) {
      opts.push({ v: s.options[j].value, t: (s.options[j].text || '').trim() });
    }
    selects.push({ name: s.name || '', id: s.id || '', opts: opts });
  }
  var inputs = [];
  var allInp = document.querySelectorAll('input, textarea');
  for (var k=0;k<allInp.length;k++) {
    var el = allInp[k];
    var t = el.type || 'text';
    if (t === 'hidden') continue;
    inputs.push({ type: t, name: el.name || '', id: el.id || '', placeholder: el.placeholder || '', label: '' });
  }
  // Intentar asociar labels
  for (var m=0;m<inputs.length;m++) {
    var fid = inputs[m].id;
    if (fid) {
      var lbl = document.querySelector('label[for="' + fid + '"]');
      if (lbl) inputs[m].label = (lbl.textContent || '').trim().slice(0, 60);
    }
  }
  var checkboxes = [];
  var cbs = document.querySelectorAll('input[type="checkbox"]');
  for (var n=0;n<cbs.length;n++) {
    checkboxes.push({ name: cbs[n].name || '', id: cbs[n].id || '', checked: cbs[n].checked });
  }
  var buttons = [];
  var btns = document.querySelectorAll('button, input[type="submit"], input[type="button"], a.btn');
  for (var p=0;p<btns.length;p++) {
    var tx = ((btns[p].textContent || '').trim().replace(/\\s+/g, ' ')) || btns[p].value || '';
    if (tx && tx.length < 80) buttons.push(tx);
  }
  return { url: location.href, title: document.title, selects: selects, inputs: inputs, checkboxes: checkboxes, buttons: buttons };
})()`

async function dump(page: any) {
  // Retry si context destruido (navegación en progreso)
  for (let i = 0; i < 5; i++) {
    try {
      await page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {})
      return await page.evaluate(DUMP_JS) as any
    } catch (e: any) {
      if (String(e).includes('Execution context was destroyed')) {
        await new Promise(r => setTimeout(r, 2000))
        continue
      }
      throw e
    }
  }
  throw new Error('dump() falló tras 5 reintentos')
}

function printDump(label: string, d: any) {
  console.log(`\n===== ${label} =====`)
  console.log(`URL: ${d.url}`)
  console.log(`SELECTS (${d.selects.length}):`)
  for (const s of d.selects) {
    const opts = s.opts.slice(0, 4).map((o: any) => `${o.v}=${o.t}`).join(' | ')
    console.log(`  name=${s.name}  id=${s.id}  [${opts}]`)
  }
  console.log(`INPUTS (${d.inputs.length}):`)
  for (const i of d.inputs) {
    console.log(`  [${i.type}] name=${i.name}  id=${i.id}  label="${i.label}"`)
  }
  if (d.checkboxes.length) {
    console.log(`CHECKBOXES (${d.checkboxes.length}):`)
    for (const c of d.checkboxes) console.log(`  name=${c.name}  id=${c.id}  checked=${c.checked}`)
  }
  console.log(`BUTTONS: ${d.buttons.slice(0, 10).join(' | ')}`)
}

const clickBtn = (text: string) => `(function(){
  var btns = document.querySelectorAll('button, input[type="submit"], a.btn');
  for (var i=0;i<btns.length;i++) {
    var t = ((btns[i].textContent || '').trim()) || (btns[i].value || '');
    if (t === '${text}' || t.toLowerCase() === '${text.toLowerCase()}') { btns[i].click(); return true; }
  }
  return false;
})()`

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    locale: 'es-ES',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()

  const dir = join(__dirname, '..', 'evidencias', 'pasos-nac')
  mkdirSync(dir, { recursive: true })

  console.log(`→ ${URL_INICIO}`)
  await page.goto(URL_INICIO, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await new Promise(r => setTimeout(r, 1200))

  // PASO 3 (Datos generales)
  let d = await dump(page)
  printDump('PASO 3 - DATOS GENERALES', d)
  writeFileSync(join(dir, '01-paso3.json'), JSON.stringify(d, null, 2))
  await page.screenshot({ path: join(dir, '01-paso3.png'), fullPage: true })

  await page.evaluate(`(function(){
    var m = document.querySelector('select[name="materiaVO.codMateriaGe"]'); if (m) { m.value = 'NAC'; m.dispatchEvent(new Event('change', { bubbles: true })); }
    var rTipo = document.querySelector('#radioTipoSolicitud_1');  // CERTIFICACIÓN
    if (rTipo) { rTipo.checked = true; rTipo.dispatchEvent(new Event('change', { bubbles: true })); rTipo.dispatchEvent(new Event('click', { bubbles: true })); }
    var rFall = document.querySelector('#radioInscritoFallecido_1'); // No fallecido
    if (rFall) { rFall.checked = true; rFall.dispatchEvent(new Event('change', { bubbles: true })); rFall.dispatchEvent(new Event('click', { bubbles: true })); }
    var t = document.querySelector('select[name="tipoInteresadoVO.codTipoInteresado"]'); if (t) { t.value = '4'; t.dispatchEvent(new Event('change', { bubbles: true })); }
  })()`)
  await new Promise(r => setTimeout(r, 1500))
  await page.evaluate(`(function(){
    var c = document.querySelector('select[name="serDatosSolicitudVO.codCalidadTerIns"]');
    if (c) { c.value = '3'; c.dispatchEvent(new Event('change', { bubbles: true })); }
  })()`)
  await new Promise(r => setTimeout(r, 1200))
  // Para calidad=3 (Autorizado) el botón es "Continuar como Autorizado"; si no existe, Siguiente
  const btnPaso3 = await page.evaluate(`(function(){
    var btns = document.querySelectorAll('button, input[type="submit"], a.btn');
    for (var i=0;i<btns.length;i++) {
      var t = ((btns[i].textContent || '').trim()) || (btns[i].value || '');
      if (t === 'Continuar como Autorizado') { btns[i].click(); return t; }
    }
    for (var j=0;j<btns.length;j++) {
      var tx = ((btns[j].textContent || '').trim()) || (btns[j].value || '');
      if (tx === 'Siguiente') { btns[j].click(); return tx; }
    }
    return null;
  })()`)
  console.log(`  paso3 click: ${btnPaso3}`)
  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
  await new Promise(r => setTimeout(r, 3500))

  // PASO 4 (Datos del solicitante)
  d = await dump(page)
  printDump('PASO 4 - SOLICITANTE', d)
  writeFileSync(join(dir, '02-paso4.json'), JSON.stringify(d, null, 2))
  await page.screenshot({ path: join(dir, '02-paso4.png'), fullPage: true })

  // Rellenar solicitante con los IDs REALES detectados
  await page.evaluate(`(function(){
    function setSel(sel, val) { var el = document.querySelector(sel); if (el) { el.value = val; el.dispatchEvent(new Event('change', { bubbles: true })); } }
    function setInp(sel, val) { var el = document.querySelector(sel); if (el) { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); } }
    setSel('#tipoIdentificadorTer', '1');
    setInp('#numIdentificacion', '47889176W');
    setInp('#fechaCaducidadDoc', '21/04/2031');
    setSel('#paisEmisorDoc', '108');
    setSel('#sexo', '1');
    setInp('#nombre', 'VICTOR');
    setInp('#apellido1', 'HEREDIA');
    setInp('#apellido2', 'HERNANDEZ');
    setInp('#email', 'soporte@certidocs.es');
  })()`)
  await new Promise(r => setTimeout(r, 800))
  await page.evaluate(clickBtn('Siguiente'))
  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
  await new Promise(r => setTimeout(r, 2500))

  // PASO 5
  d = await dump(page)
  printDump('PASO 5', d)
  writeFileSync(join(dir, '03-paso5.json'), JSON.stringify(d, null, 2))
  await page.screenshot({ path: join(dir, '03-paso5.png'), fullPage: true })

  // Rellenar todos los inputs de texto con valores genéricos (solo para avanzar)
  // y selects con la primera opción no vacía
  await page.evaluate(`(function(){
    var inputs = document.querySelectorAll('input[type="text"], input[type="email"], input:not([type]), textarea');
    for (var i=0;i<inputs.length;i++) {
      var el = inputs[i];
      if (!el.value) {
        var n = el.name || el.id || '';
        if (/fecha/i.test(n)) el.value = '01/01/1990';
        else if (/email/i.test(n)) el.value = 'soporte@certidocs.es';
        else if (/nombre/i.test(n)) el.value = 'VICTOR';
        else if (/apellido1/i.test(n)) el.value = 'HEREDIA';
        else if (/apellido2/i.test(n)) el.value = 'HERNANDEZ';
        else if (/telefono|phone/i.test(n)) el.value = '930000000';
        else if (/cp|postal/i.test(n)) el.value = '08003';
        else if (/numero/i.test(n)) el.value = '59';
        else if (/finalidad|motivo/i.test(n)) el.value = 'Uso particular';
        else if (/lugar/i.test(n)) el.value = 'BARCELONA';
        else if (/via/i.test(n)) el.value = 'VIA LAIETANA';
        else el.value = 'X';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    var selects = document.querySelectorAll('select');
    for (var j=0;j<selects.length;j++) {
      var s = selects[j];
      if (!s.value && s.options.length > 1) {
        // preferir España si hay opción 108
        var picked = null;
        for (var k=0;k<s.options.length;k++) {
          if (s.options[k].value === '108') { picked = s.options[k]; break; }
        }
        if (!picked) picked = s.options[1];
        s.value = picked.value;
        s.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  })()`)
  await new Promise(r => setTimeout(r, 1500))
  await page.evaluate(clickBtn('Siguiente'))
  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
  await new Promise(r => setTimeout(r, 2500))

  // PASO 6
  d = await dump(page)
  printDump('PASO 6', d)
  writeFileSync(join(dir, '04-paso6.json'), JSON.stringify(d, null, 2))
  await page.screenshot({ path: join(dir, '04-paso6.png'), fullPage: true })

  await browser.close()
  console.log('\n✅ Listo. Ficheros en: evidencias/pasos-nac/')
}

main().catch(err => { console.error(err); process.exit(1) })
