
(function(){
  const overlay=document.getElementById('xpresiaInstallOverlay');
  const installBtn=document.getElementById('xpresiaInstallNow');
  const continueBtn=document.getElementById('xpresiaContinue');
  const text=document.getElementById('xpresiaInstallText');
  const status=document.getElementById('xpresiaInstallStatus');
  let deferredPrompt=null;
  function standalone(){return !!((window.matchMedia && (window.matchMedia('(display-mode: fullscreen)').matches || window.matchMedia('(display-mode: standalone)').matches)) || window.navigator.standalone===true);}
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  function close(){if(overlay)overlay.classList.remove('show');}
  function show(){if(!standalone()&&overlay)setTimeout(()=>overlay.classList.add('show'),500);}
  window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferredPrompt=e;if(installBtn)installBtn.disabled=false;if(status)status.textContent='';});
  if(installBtn)installBtn.addEventListener('click',async function(){
    if(standalone()){close();return;}
    if(deferredPrompt){try{deferredPrompt.prompt();const choice=await deferredPrompt.userChoice;if(choice&&choice.outcome==='accepted')close();else if(status)status.textContent='Puedes instalarla más adelante desde el navegador.';}catch(e){if(status)status.textContent='El navegador no pudo abrir la instalación en este momento.';}deferredPrompt=null;return;}
    if(ios){if(text)text.innerHTML='En Safari: pulsa <b>Compartir</b> y luego <b>Agregar a pantalla de inicio</b>.';if(status)status.textContent='Esta es la forma de instalar Xpresia en iPhone/iPad.';return;}
    if(text)text.innerHTML='El navegador todavía no habilitó la instalación automática. Recarga Xpresia desde una dirección <b>HTTPS</b> y vuelve a intentarlo.';if(status)status.textContent='También puedes revisar el menú del navegador.';
  });
  if(continueBtn)continueBtn.addEventListener('click',close);
  window.addEventListener('appinstalled',function(){deferredPrompt=null;close();});
  if(!standalone())show();
  if('serviceWorker' in navigator)window.addEventListener('load',function(){navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(e=>console.warn('Xpresia PWA:',e));});
})();
