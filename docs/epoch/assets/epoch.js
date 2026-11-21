/* No tracking, external requests or wallet access. */
(()=>{'use strict';
const root=document.documentElement;
try{const saved=localStorage.getItem('gonk-epoch-mode');if(['paper','dark'].includes(saved))root.dataset.epochMode=saved;}catch{}
for(const button of document.querySelectorAll('[data-epoch-toggle]')){
 button.hidden=false;
 const update=()=>{const paper=root.dataset.epochMode==='paper';button.setAttribute('aria-pressed',String(paper));button.setAttribute('aria-label',paper?'Switch to dark theme':'Switch to paper theme');};
 update();button.addEventListener('click',()=>{root.dataset.epochMode=root.dataset.epochMode==='paper'?'dark':'paper';try{localStorage.setItem('gonk-epoch-mode',root.dataset.epochMode);}catch{}update();});
}
const menu=document.querySelector('.ep-mobile');
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.open){menu.open=false;menu.querySelector('summary')?.focus();}});
for(const button of document.querySelectorAll('[data-epoch-copy]')){button.hidden=false;button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);button.textContent='Link copied';}catch{button.textContent='Copy the address from your browser';}});}
})();
