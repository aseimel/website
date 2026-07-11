(function () {
  'use strict';
  var KEY='seimel-theme', root=document.documentElement;
  function saved(){ try { var v=localStorage.getItem(KEY); return v==='light'||v==='dark'?v:null; } catch(e){ return null; } }
  function systemMode(){ return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  function current(){ return saved() || systemMode(); }
  function controls(mode){ document.querySelectorAll('[data-theme-toggle]').forEach(function(b){ var next=mode==='dark'?'Light':'Dark'; b.setAttribute('aria-label','Theme: '+mode.charAt(0).toUpperCase()+mode.slice(1)+'. Activate for '+next+'.'); b.title='Switch to '+next; var t=b.querySelector('[data-theme-label]'); if(t)t.textContent=mode.charAt(0).toUpperCase()+mode.slice(1); }); }
  function explicit(mode,persist){ mode=mode==='dark'?'dark':'light'; root.setAttribute('data-theme',mode); root.style.colorScheme=mode; if(persist)try{localStorage.setItem(KEY,mode);}catch(e){} controls(mode); window.dispatchEvent(new CustomEvent('site-theme-change',{detail:{mode:mode}})); }
  function followSystem(){ var mode=systemMode(); root.removeAttribute('data-theme'); root.style.colorScheme=mode; controls(mode); window.dispatchEvent(new CustomEvent('site-theme-change',{detail:{mode:mode}})); }
  if(saved()) explicit(saved(),false); else followSystem();
  document.addEventListener('DOMContentLoaded',function(){ controls(current()); document.querySelectorAll('[data-theme-toggle]').forEach(function(b){ b.addEventListener('click',function(){ explicit(current()==='dark'?'light':'dark',true); }); }); });
  if(window.matchMedia){ var media=window.matchMedia('(prefers-color-scheme: dark)'), listener=function(){ if(!saved())followSystem(); }; if(media.addEventListener)media.addEventListener('change',listener);else media.addListener(listener); }
  window.SeimelTheme={apply:explicit,mode:current};
}());
