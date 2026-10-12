import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';

const source=fs.readFileSync(new URL('../apps-script-backend/Admins.html',import.meta.url),'utf8');
const dom=new JSDOM('<body><div id="toasts"></div><button id="action">Simpan</button></body>',{runScripts:'outside-only'});
const w=dom.window;
let clock=0,next=1;
const timers=new Map();
w.setTimeout=(fn,delay)=>{const id=next++;timers.set(id,{fn,due:clock+delay});return id};
w.clearTimeout=id=>timers.delete(id);
Object.defineProperty(w.performance,'now',{value:()=>clock});
function advance(ms){clock+=ms;for(const [id,timer] of [...timers])if(timer.due<=clock){timers.delete(id);timer.fn()}}
vm.runInContext("const $=s=>document.querySelector(s);const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));const icon=()=>'<svg></svg>';",dom.getInternalVMContext());
vm.runInContext(source.slice(source.indexOf('    function toast('),source.indexOf('    function setOperation(')),dom.getInternalVMContext());
vm.runInContext(source.slice(source.indexOf('    function setBusy('),source.indexOf('    function status(')),dom.getInternalVMContext());

w.toast('<img src=x onerror=bad()>','success',1000);
let toast=w.document.querySelector('.toast');
assert.equal(toast.querySelector('img'),null,'Messages must remain escaped.');
advance(200);toast.dispatchEvent(new w.MouseEvent('mouseenter'));
advance(2000);assert.ok(toast.isConnected,'Hover must pause expiry.');
toast.dispatchEvent(new w.FocusEvent('focusin',{bubbles:true}));
toast.dispatchEvent(new w.MouseEvent('mouseleave'));
advance(2000);assert.ok(toast.isConnected,'Leaving hover must not resume while keyboard focus remains.');
toast.dispatchEvent(new w.FocusEvent('focusout',{bubbles:true,relatedTarget:w.document.body}));
advance(799);assert.ok(toast.isConnected,'Only unconsumed display time should resume.');
advance(1);assert.equal(toast.isConnected,false);
assert.equal(timers.size,0);

let undos=0;w.toast('Suppression exemple',()=>undos++,1000);
toast=w.document.querySelector('.toast');toast.querySelector('.toast-undo').click();
assert.equal(undos,1);assert.equal(timers.size,0,'Undo removes its expiry timer.');
w.toast('Gangguan','error',1000);toast=w.document.querySelector('.toast');
assert.equal(toast.getAttribute('role'),'alert');toast.querySelector('.toast-dismiss').click();
assert.equal(timers.size,0,'Dismiss removes its expiry timer.');

const action=w.document.querySelector('#action');
w.setBusy(action,true,'Menyimpan…');w.setBusy(action,true,'Mengirim…');
assert.equal(action.getAttribute('aria-busy'),'true');assert.equal(action.disabled,true);
assert.ok(action.querySelector('.busy-spinner'));
w.setBusy(action,false);assert.equal(action.textContent,'Simpan','Repeated busy updates must preserve the original button.');
assert.equal(action.hasAttribute('aria-busy'),false);assert.equal(action.disabled,false);
console.log('Admin interactions PASS: escaped feedback, hover/focus overlap, remaining toast lifetime, undo/dismiss cleanup and accessible busy state.');
dom.window.close();
