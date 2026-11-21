/* Fieldnote — no tracking, no external requests. Day/dusk reading mode, mobile menu escape, copy link. */
(()=>{'use strict';
const root=document.documentElement;
try{const saved=localStorage.getItem('gonk-fieldnote-mode');if(['day','dusk'].includes(saved))root.dataset.fieldnoteMode=saved;}catch{}
for(const button of document.querySelectorAll('[data-fieldnote-toggle]')){
 button.hidden=false;
 const update=()=>{const dusk=root.dataset.fieldnoteMode==='dusk';button.setAttribute('aria-pressed',String(dusk));button.setAttribute('aria-label',dusk?'Switch to day reading mode':'Switch to dusk reading mode');};
 update();
 button.addEventListener('click',()=>{root.dataset.fieldnoteMode=root.dataset.fieldnoteMode==='dusk'?'day':'dusk';try{localStorage.setItem('gonk-fieldnote-mode',root.dataset.fieldnoteMode);}catch{}update();});
}
// Season label from the reader's own clock. Add data-fieldnote-hemisphere="south" to <html> to flip it.
const names=['Winter','Winter','Spring','Spring','Spring','Summer','Summer','Summer','Autumn','Autumn','Autumn','Winter'];
const flip={Winter:'Summer',Summer:'Winter',Spring:'Autumn',Autumn:'Spring'};
let season=names[new Date().getMonth()];if(root.dataset.fieldnoteHemisphere==='south')season=flip[season];
for(const el of document.querySelectorAll('[data-fieldnote-season]'))el.textContent=season+' · '+new Date().toLocaleDateString(undefined,{day:'numeric',month:'long'});
const menu=document.querySelector('.fn-mobile');
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.open){menu.open=false;menu.querySelector('summary')?.focus();}});
for(const button of document.querySelectorAll('[data-fieldnote-copy]')){
 button.hidden=false;
 button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);button.textContent='Link copied';}catch{button.textContent='Copy the address from your browser';}});
}
})();
