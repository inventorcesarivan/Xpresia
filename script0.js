
const video=document.getElementById('video'),canvas=document.getElementById('canvas'),ctx=canvas.getContext('2d');
const spectrumCanvas=document.getElementById('spectrumCanvas'),spectrumCtx=spectrumCanvas.getContext('2d');
const spectrumBadge=document.getElementById('spectrumBadge');
const activation=document.getElementById('activation');
let stream=null,initPromise=null,cameraReady=false,mirror=false,menuOpen=false,paused=false,countdown=false;
let micStream=null,audioContext=null,audioSource=null,audioGain=null,audioDestination=null,micAnalyser=null,spectrumAnalyser=null,micEnabled=false,volumeLevel=.8,micNoiseFloorRms=.004;
let musicAudio=new Audio(),musicSource=null,musicGain=null,musicPlayer=new Audio(),recordMusicPlayer=new Audio(),recordAudioContext=null,recordMusicSource=null,recordMusicGain=null,recordMusicAnalyser=null,recordAudioDestination=null,selectedMusic={id:'none',name:'Sin música de fondo',url:''},pendingMusic={id:'none',name:'Sin música de fondo',url:'',objectUrl:false},pendingMusicObjectUrl=null;
musicPlayer.crossOrigin='anonymous';recordMusicPlayer.crossOrigin='anonymous';musicPlayer.loop=true;musicPlayer.preload='metadata';
const musicLibrary={
'break-dance':{name:'Break dance',url:'assets/bases-laterales/1.mp3'},
'cumbia':{name:'Cumbia',url:'assets/bases-laterales/2.mp3'},
'cuarteto':{name:'Cuarteto',url:'assets/bases-laterales/3.mp3'},
'cinematico':{name:'Cinemático',url:'assets/bases-laterales/4.mp3'},
'electronica':{name:'Electrónica',url:'assets/bases-laterales/5.mp3'},
'epica':{name:'Épica',url:'assets/bases-laterales/6.mp3'},
'funk':{name:'Funk',url:'assets/bases-laterales/7.mp3'},
'hip-hop':{name:'Hip hop',url:'assets/bases-laterales/8.mp3'},
'jazz':{name:'Jazz',url:'assets/bases-laterales/9.mp3'},
'latino':{name:'Latino',url:'assets/bases-laterales/10.mp3'},
'merengue':{name:'Merengue',url:'assets/bases-laterales/11.mp3'},
'pop':{name:'Pop',url:'assets/bases-laterales/12.mp3'},
'rap':{name:'Rap',url:'assets/bases-laterales/13.mp3'},
'reggaeton':{name:'Reggaetón',url:'assets/bases-laterales/14.mp3'},
'reggae':{name:'Reggae',url:'assets/bases-laterales/15.mp3'},
'rock':{name:'Rock',url:'assets/bases-laterales/16.mp3'},
'salsa':{name:'Salsa',url:'assets/bases-laterales/17.mp3'},
'soft':{name:'Soft',url:'assets/bases-laterales/18.mp3'},
'tango':{name:'Tango',url:'assets/bases-laterales/19.mp3'},
'trap':{name:'Trap',url:'assets/bases-laterales/20.mp3'}
};
let mediaRecorder=null,recordedChunks=[],recordedBlob=null,recordedUrl=null,recordingMime='';
let pose=null,poseReady=false,poseBusy=false,lastPose=0;
let category='dance',duration=60,userName='',userAge='',evaluationMode='camera',voiceSamplingId=null;
let guidedStep=0, guidedSkillPanel='guidedPanel';let karaokeVideoId='';let karaokeReady=false;let karaokeLibrary=[];let karaokeSelectedItem=null;let imitationType='airguitar';let categoryChosen=false;const DEFAULT_VISUAL_IMAGE='assets/imagenes/xpresia_inicio.jpg';
const profiles={
 dance:{name:'Baile / Danza',description:'Prioriza actividad, coordinación, fluidez, variedad y continuidad del movimiento.',weights:{activity:.18,coordination:.25,fluidity:.25,stability:.12,variety:.20}},
 sing:{name:'Canto — voz + expresión',description:'Evalúa afinación, estabilidad vocal, dinámica y expresividad corporal mediante el micrófono y la expresión corporal.',weights:{activity:.10,coordination:.12,fluidity:.13,stability:.10,variety:.10,voice:.45}},
 acting:{name:'Actuación',description:'Prioriza expresividad corporal, variedad gestual, control y cambios de intensidad.',weights:{activity:.12,coordination:.18,fluidity:.20,stability:.20,variety:.30}},
 aura:{name:'Farmear Aura',description:'Busca actitud, presencia escénica, constancia, amplitud corporal y capacidad de sostener una energía expresiva.',weights:{activity:.20,coordination:.15,fluidity:.20,stability:.25,variety:.20}},
 imitation:{name:'Imitación / Air Performance',description:'Desafío creativo para recrear instrumentos invisibles, personajes, sonidos, gestos o situaciones mediante movimiento y expresividad.',weights:{activity:.18,coordination:.24,fluidity:.18,stability:.15,variety:.25}},
 reading:{name:'Lectura de textos — voz + expresión',description:'Evalúa precisión de lectura, fluidez, pausas, expresión vocal y comunicación corporal.',weights:{activity:.08,coordination:.12,fluidity:.15,stability:.10,variety:.10,reading:.45}}
};
let samples=[],prev={},prevDir={},directionChanges=0,lastEnergy=0,evalRunning=false,evalPaused=false,startTime=0,elapsedBeforePause=0,evalTimerId=null,evalFinishGuardId=null,evalFinishing=false,resultImageBlob=null,resultImageUrl=null,shareTarget='image';
let voiceSamples=[],voicePitchHistory=[],voiceRmsHistory=[],voiceActivitySamples=[],voiceOnsetTimes=[],lastVoiceActive=false,lastVoiceSampleAt=0,lastVoiceAnalysisAt=0,voiceScoreCache=null,karaokeStartAt=0;
let readingRecognition=null,readingTranscript='',readingFinalText='',readingStartedAt=0,readingLastSpeechAt=0,readingPauseCount=0,readingRecognitionSupported=false;
let guideTextWords=[],guideTextType='',guideTextTimer=null,guideTextLineTimer=null,guideTextCurrent=0,guideTextPlaybackActive=false; const GUIDE_WPM=145;
let textSource='sample',customEvaluationText='';
const SAMPLE_SING_TEXT='Aquí me pongo a cantar, al compás de la vigüela, que el hombre que lo desvela una pena extraordinaria, como la ave solitaria, con el cantar se consuela.';
const SAMPLE_READING_TEXT='La expresión no está solamente en las palabras. También vive en la voz, en las pausas, en la intención y en la manera en que comunicamos una idea. Lee este texto como si quisieras que otra persona realmente sintiera lo que estás diciendo.';
const HISTORY_DB='XpresiaEvaluationsDB',HISTORY_STORE='evaluations',MAX_SAVED_EVALUATIONS=10;
function resize(){const w=Math.max(1,Math.floor(innerWidth)),h=Math.max(1,Math.floor(innerHeight));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}if(spectrumCanvas.width!==innerWidth*devicePixelRatio||spectrumCanvas.height!==innerHeight*devicePixelRatio){spectrumCanvas.width=Math.max(1,Math.floor(innerWidth*devicePixelRatio));spectrumCanvas.height=Math.max(1,Math.floor(innerHeight*devicePixelRatio));spectrumCtx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)}}
function spectrumVisible(){return document.getElementById('activation')?.style.display==='none'}
function getStageScreenRect(){
  const isMobile=innerWidth<700, margin=8;
  const topEl=document.getElementById('top'), bottomEl=document.getElementById('bottom');
  const tr=topEl?.getBoundingClientRect(), br=bottomEl?.getBoundingClientRect();
  const top=Math.max(8,(tr?.bottom||46)+margin);
  const bottom=Math.min(innerHeight-8,(br?.top||innerHeight-50)-margin);
  const side=8;
  // La cámara/imagen usa el mismo ancho útil que el panel principal de menú.
  // En móvil ocupa todo el ancho disponible; en web respeta el máximo común de 760 px.
  const maxW=Math.min(760,innerWidth-side*2);
  const finalW=Math.max(180,maxW);
  // La altura ocupa todo el espacio disponible entre cabecera y menú inferior,
  // manteniendo una geometría común para web y móvil.
  const finalH=Math.max(180,bottom-top);
  const x=Math.round((innerWidth-finalW)/2);
  const y=Math.round(top);
  return{x,y,w:finalW,h:finalH};
}
function getCameraScreenRect(){return getStageScreenRect()}
function drawSpectrum(){
  resize();
  const mini=document.getElementById('topSpectrumMini');
  if(!spectrumVisible()){if(mini)mini.style.display='none';if(spectrumBadge)spectrumBadge.style.display='none';return}
  const mc=document.getElementById('miniSpectrumCanvas');
  const guidePanel=document.getElementById('liveTextGuidePanel');
  if(!mini||!mc)return;
  const stage=getStageScreenRect();
  const miniH=innerWidth<700?22:24, miniGap=6;
  const guideWidth=Math.min(stage.w,innerWidth-16);
  guidePanel.style.left=(stage.x+stage.w/2)+'px';
  guidePanel.style.transform='translateX(-50%)';
  guidePanel.style.width=Math.max(160,guideWidth)+'px';
  guidePanel.style.maxHeight='none';
  const stageTop=stage.y;
  const textSkill=category==='sing'||category==='acting'||category==='reading';
  const shouldShowGuide=!!(evalRunning&&textSkill&&textSource!=='none');
  guidePanel.style.display=shouldShowGuide?'block':'none';
  guidePanel.style.top=Math.round(stageTop)+'px';
  const guideRect=guidePanel.getBoundingClientRect();
  // El espectro queda en la parte inferior del escenario, justo sobre el botón MENÚ.
  const miniTop=Math.max(stage.y+4, Math.round(stage.y+stage.h-miniH-4));
  const miniW=Math.min(innerWidth<700?280:Math.min(437,stage.w*.575),Math.max(160,innerWidth-24));
  mini.style.left='50%';
  mini.style.top=Math.round(miniTop)+'px';
  mini.style.width=Math.round(miniW)+'px';
  mini.style.height=miniH+'px';
  mini.style.display='block';
  const dpr=Math.max(1,devicePixelRatio||1),mw=Math.max(1,mini.clientWidth),mh=Math.max(1,mini.clientHeight);
  if(mc.width!==Math.floor(mw*dpr)||mc.height!==Math.floor(mh*dpr)){mc.width=Math.floor(mw*dpr);mc.height=Math.floor(mh*dpr)}
  const c=mc.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,mw,mh);
  const micBins=spectrumAnalyser?spectrumAnalyser.frequencyBinCount:0,musicBins=recordMusicAnalyser?recordMusicAnalyser.frequencyBinCount:0;
  const micData=micBins?new Uint8Array(micBins):null,musicData=musicBins?new Uint8Array(musicBins):null;
  if(spectrumAnalyser)spectrumAnalyser.getByteFrequencyData(micData);
  if(recordMusicAnalyser)recordMusicAnalyser.getByteFrequencyData(musicData);
  const hasMusic=!!selectedMusic.url&&!!recordMusicAnalyser,bars=Math.max(18,Math.min(60,Math.floor(mw/6))),gap=Math.max(1,mw/bars*.18),bw=Math.max(1,mw/bars-gap),maxH=mh-5,baseY=mh-2;
  for(let i=0;i<bars;i++){
    let micV=0,musicV=0;
    if(micData){const step=Math.max(1,Math.floor(micBins/bars));let sum=0,count=0;for(let j=i*step;j<Math.min(micBins,(i+1)*step);j++){sum+=micData[j];count++}micV=(sum/Math.max(1,count))/255}
    if(musicData){const step=Math.max(1,Math.floor(musicBins/bars));let sum=0,count=0;for(let j=i*step;j<Math.min(musicBins,(i+1)*step);j++){sum+=musicData[j];count++}musicV=(sum/Math.max(1,count))/255}
    const md=Math.min(1,Math.pow(Math.max(0,micV),.56)*1.5),ud=Math.min(1,Math.pow(Math.max(0,musicV),.68)*1.1),bx=i*(mw/bars)+gap/2;
    if(hasMusic){const hg=Math.max(1,(bw-1)/2),hv1=Math.max(2,md*maxH),hv2=Math.max(2,ud*maxH);c.fillStyle='#00e5ff';c.fillRect(bx,baseY-hv1,hg,hv1);c.fillStyle='#ff2bd6';c.fillRect(bx+hg+1,baseY-hv2,hg,hv2)}
    else{const hv=Math.max(2,md*maxH);c.fillStyle='#00e5ff';c.fillRect(bx,baseY-hv,bw,hv)}
  }
  if(spectrumBadge)spectrumBadge.style.display='none';
}

function spectrumLoop(){updateMicNoiseFloor();drawSpectrum();requestAnimationFrame(spectrumLoop)}
function draw(){resize();ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#050b18';ctx.fillRect(0,0,canvas.width,canvas.height);const g=getCameraRect();if(evaluationMode==='camera'&&video.readyState>=2&&video.videoWidth){const s=Math.min(g.w/video.videoWidth,g.h/video.videoHeight),dw=video.videoWidth*s,dh=video.videoHeight*s;const ox=g.x+(g.w-dw)/2,oy=g.y+(g.h-dh)/2;ctx.save();ctx.beginPath();ctx.rect(g.x,g.y,g.w,g.h);ctx.clip();if(mirror){ctx.translate(ox+dw,oy);ctx.scale(-1,1);ctx.drawImage(video,0,0,dw,dh)}else ctx.drawImage(video,ox,oy,dw,dh);ctx.restore()}requestAnimationFrame(draw)}
function getCameraRect(){return getStageScreenRect()}
function getRecordingMime(){const options=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];return options.find(x=>window.MediaRecorder&&MediaRecorder.isTypeSupported(x))||''}
function ensureAudioForMusicSync(){
  if(!selectedMusic.url)return false;
  try{
    if(!recordAudioContext)recordAudioContext=new (window.AudioContext||window.webkitAudioContext)();
    if(recordAudioContext.state==='suspended')recordAudioContext.resume().catch(()=>{});
    if(!recordAudioDestination)recordAudioDestination=recordAudioContext.createMediaStreamDestination();
    if(!recordMusicSource){
      recordMusicPlayer.loop=true;
      recordMusicPlayer.preload='auto';
      recordMusicSource=recordAudioContext.createMediaElementSource(recordMusicPlayer);
      recordMusicGain=recordAudioContext.createGain();
      recordMusicGain.gain.value=0;
      recordMusicAnalyser=recordAudioContext.createAnalyser();
      recordMusicAnalyser.fftSize=1024;recordMusicAnalyser.smoothingTimeConstant=.82;
      recordMusicSource.connect(recordMusicAnalyser);
      recordMusicSource.connect(recordMusicGain);
      recordMusicGain.connect(recordAudioDestination);
    }
    return true;
  }catch(e){console.warn('No se pudo preparar el audio para la grabación:',e);return false}
}
function resetMusicPlayer(item){try{musicPlayer.pause();musicPlayer.currentTime=0;musicPlayer.onended=null;musicPlayer.onerror=null;const src=item&&item.url?new URL(item.url,document.baseURI).href:'';if(musicPlayer.src!==src){musicPlayer.src=src;musicPlayer.load()}musicPlayer.loop=true;musicPlayer.volume=volumeLevel;return !!src}catch(e){console.warn('No se pudo preparar el reproductor:',e);return false}}
function prepareMusicForUserGesture(){
  if(!selectedMusic.url)return true;
  try{
    resetMusicPlayer(selectedMusic);
    ensureAudioForMusicSync();
    const src=new URL(selectedMusic.url,document.baseURI).href;
    if(recordMusicPlayer.src!==src){recordMusicPlayer.src=src;recordMusicPlayer.load()}
    recordMusicPlayer.loop=true;
    recordMusicPlayer.volume=1;
    recordMusicPlayer.currentTime=0;
    const p=recordMusicPlayer.play();
    if(p)p.catch(()=>{});
    return true;
  }catch(e){console.warn('No se pudo preparar la música para la grabación:',e);return false}
}
function setMusicAudible(){if(!selectedMusic.url)return;try{musicPlayer.volume=volumeLevel;const p=musicPlayer.play();if(p)p.catch(()=>{})}catch(e){console.warn('No se pudo reproducir la música:',e)}}
function startBackgroundMusic(){if(!selectedMusic.url)return false;try{if(!musicPlayer.src||!musicPlayer.src.includes(selectedMusic.url))resetMusicPlayer(selectedMusic);musicPlayer.volume=volumeLevel;const p=musicPlayer.play();if(p)p.catch(()=>{});return true}catch(e){console.warn('No se pudo iniciar la música:',e);return false}}
function startRecordingMusic(){if(!selectedMusic.url)return false;try{ensureAudioForMusicSync();if(!recordMusicPlayer.src||!recordMusicPlayer.src.includes(selectedMusic.url)){const src=new URL(selectedMusic.url,document.baseURI).href;recordMusicPlayer.src=src;recordMusicPlayer.load()}recordMusicPlayer.loop=true;recordMusicPlayer.currentTime=0;recordMusicGain.gain.value=volumeLevel;const p=recordMusicPlayer.play();if(p)p.catch(()=>{});return true}catch(e){console.warn('No se pudo iniciar la música de la grabación:',e);return false}}
function stopBackgroundMusic(reset=true){try{musicPlayer.pause();musicPlayer.volume=volumeLevel;if(reset)musicPlayer.currentTime=0}catch(e){}try{recordMusicPlayer.pause();if(reset)recordMusicPlayer.currentTime=0;if(recordMusicGain)recordMusicGain.gain.value=0}catch(e){}}
function startVideoRecording(){try{if(!window.MediaRecorder||!canvas.captureStream){setTop('La grabación de video no está disponible en este navegador');return false}recordedChunks=[];recordedBlob=null;if(recordedUrl){URL.revokeObjectURL(recordedUrl);recordedUrl=null}const cs=canvas.captureStream(30);let recStream=cs;if(selectedMusic.url){ensureAudioForMusicSync();if(recordAudioDestination?.stream?.getAudioTracks?.().length){recordAudioDestination.stream.getAudioTracks().forEach(t=>recStream.addTrack(t))}}recordingMime=getRecordingMime();mediaRecorder=recordingMime?new MediaRecorder(recStream,{mimeType:recordingMime,videoBitsPerSecond:2500000}):new MediaRecorder(recStream,{videoBitsPerSecond:2500000});mediaRecorder.ondataavailable=e=>{if(e.data&&e.data.size)recordedChunks.push(e.data)};mediaRecorder.onstop=()=>{recordedBlob=new Blob(recordedChunks,{type:mediaRecorder.mimeType||recordingMime||'video/webm'});recordedUrl=URL.createObjectURL(recordedBlob)};mediaRecorder.start(1000);return true}catch(e){console.error(e);setTop('No se pudo iniciar la grabación de video');return false}}
function stopVideoRecording(){return new Promise(resolve=>{if(!mediaRecorder||mediaRecorder.state==='inactive'){resolve();return}let done=false;const finish=()=>{if(done)return;done=true;resolve()};mediaRecorder.addEventListener('stop',finish,{once:true});try{mediaRecorder.stop()}catch(e){console.warn('No se pudo detener MediaRecorder:',e);finish()}setTimeout(finish,3500)})}
function prepareRecordedVideo(){const v=document.getElementById('recordedVideo');if(recordedUrl&&v){v.src=recordedUrl}else if(v){v.removeAttribute('src');v.load()}}
function getAppUrl(){return location.protocol==='file:'?'':(location.origin+location.pathname)}
function getShareText(){const score=Math.round((finalEvaluationResult?.score ?? compute()?.score ?? 0)),cat=(profiles[category]?.name||'expresión').toLowerCase(),url=getAppUrl();const base=userName?`${userName} obtuvo ${score} puntos en su evaluación de ${cat}. ¡Anímate a evaluar tus capacidades!`:`Obtuve ${score} puntos en mi evaluación de ${cat}. ¡Anímate a evaluar tus capacidades!`;return url?`${base} ${url}`:base}
function openResultPanel(kind){
  closeResultPanels();
  if(kind==='share'){
    document.getElementById('sharePanel').style.display='block';
    document.getElementById('shareImagePreview').style.display=resultImageUrl?'block':'none';
  }else if(kind==='video'){
    if(!recordedUrl){setTop('El video todavía no está disponible.');return}
    document.getElementById('videoPanel').style.display='block';
    prepareRecordedVideo();
  }
}
function closeResultPanels(){document.getElementById('sharePanel').style.display='none';document.getElementById('videoPanel').style.display='none';}
function closeSharePanel(){closeResultPanels()}
function closeVideoPanel(){closeResultPanels()}
function openSharePopup(target){shareTarget=target;document.getElementById('sharePopupTarget').textContent=target==='image'?'📸 Imagen de tu resultado':'🎥 Video de tu evaluación';document.getElementById('sharePopup').style.display='flex'}
function closeSharePopup(){document.getElementById('sharePopup').style.display='none'}
function platformShare(platform){
  const text=encodeURIComponent(getShareText()), page=encodeURIComponent(location.href); let url='';
  if(platform==='whatsapp')url=`https://wa.me/?text=${text}`;
  else if(platform==='facebook')url=`https://www.facebook.com/sharer/sharer.php?u=${page}&quote=${text}`;
  else if(platform==='telegram')url=`https://t.me/share/url?url=${page}&text=${text}`;
  else if(platform==='x')url=`https://twitter.com/intent/tweet?text=${text}&url=${page}`;
  else if(platform==='instagram')url='https://www.instagram.com/';
  else if(platform==='tiktok')url='https://www.tiktok.com/';
  if(url)window.open(url,'_blank','noopener,noreferrer');
  if(platform==='instagram'||platform==='tiktok')setTop('Guarda primero el archivo y luego adjúntalo en '+(platform==='instagram'?'Instagram':'TikTok')+'.');
}
async function nativeShare(target){
  shareTarget=target||shareTarget;
  const isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||((navigator.maxTouchPoints||0)>1&&innerWidth<1000);
  const score=Math.round(compute()?.score||0);
  let file=null;
  if(shareTarget==='image' && resultImageBlob){
    file=new File([resultImageBlob],`Xpresia_resultado_${score}.png`,{type:'image/png'});
  }
  if(shareTarget==='video' && recordedBlob){
    const ext=recordedBlob.type.includes('mp4')?'mp4':'webm';
    file=new File([recordedBlob],`Xpresia_evaluacion_${score}.${ext}`,{type:recordedBlob.type||'video/webm'});
  }
  if(!file){setTop('El archivo todavía no está disponible.');return false}

  const shareUrl=getAppUrl();
  const shareData={title:'Mi resultado en Xpresia',text:getShareText(),url:shareUrl||undefined,files:[file]};

  // En PC evitamos el panel de compartir del sistema: algunos navegadores
  // muestran una ventana que queda cargando indefinidamente al recibir un File.
  // La salida fiable es descargar la imagen y copiar el texto + enlace.
  if(!isMobile){
    if(shareTarget==='image'){
      downloadResultImage();
      if(navigator.clipboard?.writeText && getShareText()){
        try{
          await navigator.clipboard.writeText(getShareText());
          setTop('Para compartir el resultado, guarda primero la imagen y luego compártela.');
        }catch(e){
          setTop('Para compartir el resultado, guarda primero la imagen y luego compártela.');
        }
      }else{
        setTop('Para compartir el resultado, guarda primero la imagen y luego compártela.');
      }
    }else{
      downloadRecordedVideo();
      setTop('Video descargado. Puedes compartirlo desde tu PC.');
    }
    return false;
  }

  // En móviles mantenemos el compartir nativo, que permite enviar la imagen
  // junto con el texto y el enlace en dispositivos compatibles.
  if(!navigator.share){
    if(shareTarget==='image')downloadResultImage();
    else downloadRecordedVideo();
    if(shareTarget==='image' && navigator.clipboard?.writeText && getShareText()){
      try{await navigator.clipboard.writeText(getShareText());setTop('Para compartir el resultado, guarda primero la imagen y luego compártela.');}
      catch(e){setTop('Para compartir el resultado, guarda primero la imagen y luego compártela.');}
    }else setTop('Tu navegador no permite compartir archivos directamente. Se descargó el archivo para que puedas compartirlo.');
    return false;
  }

  try{
    if(navigator.canShare && !navigator.canShare({files:[file]}))throw new Error('canShare=false');
    await navigator.share(shareData);
    return true;
  }catch(e){
    if(e?.name==='AbortError')return false;
    console.warn('Compartir archivo no disponible:',e);
    if(shareTarget==='image')downloadResultImage();
    else downloadRecordedVideo();
    if(shareTarget==='image' && navigator.clipboard?.writeText && getShareText()){
      try{await navigator.clipboard.writeText(getShareText());setTop('No se pudo abrir el panel de compartir. Para compartir el resultado, guarda primero la imagen y luego compártela.');}
      catch(err){setTop('Para compartir el resultado, guarda primero la imagen y luego compártela.');}
    }else setTop(`No se pudo abrir el menú para compartir el ${shareTarget==='image'?'resultado':'video'}. Se descargó el archivo para compartirlo manualmente.`);
    return false;
  }
}
function getFinalMessage(score){return score<30?'Buen comienzo.':score<50?'Hay una base para seguir desarrollando.':score<70?'Muy buen desempeño.':score<85?'Excelente nivel de expresión.':'Impresionante presencia y expresividad.'}
function personalizedMessage(score){return userName?`${userName}, lo has hecho muy bien. Has obtenido ${Math.round(score)} puntos.`:`Lo has hecho muy bien. Has obtenido ${Math.round(score)} puntos.`}
function buildResultImage(r){
  const c=document.createElement('canvas'),w=1080,h=1350,cx=c.getContext('2d');c.width=w;c.height=h;
  const bg=cx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#050b18');bg.addColorStop(.48,'#102a55');bg.addColorStop(1,'#050b18');cx.fillStyle=bg;cx.fillRect(0,0,w,h);
  cx.strokeStyle='#00e5ff';cx.lineWidth=5;cx.strokeRect(35,35,w-70,h-70);
  cx.textAlign='center';cx.fillStyle='#e0c3ff';cx.font='900 70px Arial';cx.fillText('XPRESIA',w/2,145);
  cx.fillStyle='#dffcff';cx.font='700 34px Arial';cx.fillText('Resultado de tu evaluación',w/2,215);
  if(userName){cx.fillStyle='#e0c3ff';cx.font='900 46px Arial';cx.fillText(userName,w/2,285);if(userAge){cx.fillStyle='#bfefff';cx.font='700 20px Arial';cx.fillText(userAge+' años',w/2,315);}}
  cx.shadowColor='#00e5ff';cx.shadowBlur=28;cx.fillStyle='#ffffff';cx.font='900 210px Arial';cx.fillText(String(Math.round(r.score)),w/2,505);cx.shadowBlur=0;
  cx.fillStyle='#00e5ff';cx.font='900 42px Arial';cx.fillText('/ 100',w/2,570);
  cx.fillStyle='#e0c3ff';cx.font='800 44px Arial';cx.fillText(profiles[category].name,w/2,675);
  const rows=[['Actividad',r.activity],['Coordinación',r.coordination],['Fluidez',r.fluidity],['Estabilidad',r.stability],['Variedad',r.variety]];if(r.voice!=null)rows.push(['Voz / afinación',r.voice]);
  rows.forEach((row,i)=>{const y=770+i*76;cx.textAlign='left';cx.fillStyle='#dffcff';cx.font='700 27px Arial';cx.fillText(row[0],120,y);cx.textAlign='right';cx.fillStyle='#fff';cx.font='900 29px Arial';cx.fillText(Math.round(row[1])+'%',960,y);cx.strokeStyle='#182746';cx.lineWidth=16;cx.lineCap='round';cx.beginPath();cx.moveTo(120,y+25);cx.lineTo(960,y+25);cx.stroke();cx.strokeStyle='#00e5ff';cx.beginPath();cx.moveTo(120,y+25);cx.lineTo(120+840*Math.max(0,Math.min(100,row[1]))/100,y+25);cx.stroke();});
  cx.textAlign='center';cx.fillStyle='#ffddff';cx.font='900 40px Arial';cx.shadowColor='#ff00ff';cx.shadowBlur=18;cx.fillText('✨ '+getFinalMessage(r.score)+' ✨',w/2,1195);cx.shadowBlur=0;
  return new Promise(resolve=>c.toBlob(resolve,'image/png',1));
}
async function prepareResultImage(r){const blob=await buildResultImage(r);if(!blob)return;resultImageBlob=blob;if(resultImageUrl)URL.revokeObjectURL(resultImageUrl);resultImageUrl=URL.createObjectURL(blob);document.getElementById('resultImage').src=resultImageUrl;const saveImg=document.getElementById('saveResultImage');if(saveImg)saveImg.src=resultImageUrl}
function downloadRecordedVideo(){if(!recordedBlob||!recordedUrl){setTop('El video todavía no está disponible.');return}const ext=recordedBlob.type.includes('mp4')?'mp4':'webm';const a=document.createElement('a');a.href=recordedUrl;a.download=`Xpresia_evaluacion_${Math.round(compute()?.score||0)}.${ext}`;document.body.appendChild(a);a.click();a.remove()}
function downloadResultImage(){if(!resultImageBlob||!resultImageUrl)return;const a=document.createElement('a');a.href=resultImageUrl;a.download=`Xpresia_resultado_${Math.round(compute()?.score||0)}.png`;document.body.appendChild(a);a.click();a.remove()}
async function initCamera(){if(initPromise)return initPromise;if(stream&&stream.active)return;initPromise=(async()=>{try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});video.srcObject=stream;await video.play();resize();cameraReady=true;updateEvaluationModeUI()}catch(e){console.error(e);activation.querySelector('.startHint').textContent='No se pudo acceder a la cámara. Revisa los permisos y toca aquí para reintentar.'}finally{initPromise=null}})();return initPromise}
function stopCamera(){try{if(stream){stream.getTracks().forEach(t=>t.stop())}}catch(e){}stream=null;cameraReady=false;try{video.pause()}catch(e){}try{video.srcObject=null}catch(e){}updateEvaluationModeUI()}
async function setMicrophoneEnabled(enabled){
  if(!enabled){
    micEnabled=false;
    if(micStream)micStream.getTracks().forEach(t=>t.stop());
    micStream=null;audioSource=null;audioGain=null;micAnalyser=null;spectrumAnalyser=null;
    if(!selectedMusic.url&&audioContext){try{await audioContext.close()}catch(e){}audioContext=null;audioDestination=null;musicSource=null;musicGain=null}
    return true;
  }
  // No marcar el estado lógico como activo hasta que el permiso y la cadena de audio hayan funcionado.
  // Así el interruptor no vuelve a apagarse por una condición intermedia después del permiso del navegador.
  if(micStream&&micStream.active&&micAnalyser){
    micEnabled=true;
    return true;
  }
  let newStream=null;
  try{
    newStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
    if(!audioContext)audioContext=new (window.AudioContext||window.webkitAudioContext)();
    if(audioContext.state==='suspended')await audioContext.resume();
    const source=audioContext.createMediaStreamSource(newStream);
    const gain=audioContext.createGain();
    gain.gain.value=volumeLevel;
    if(!audioDestination)audioDestination=audioContext.createMediaStreamDestination();
    const analyser=audioContext.createAnalyser();
    analyser.fftSize=512;analyser.smoothingTimeConstant=.78;
    const spectrum=audioContext.createAnalyser();
    spectrum.fftSize=1024;spectrum.smoothingTimeConstant=.82;
    source.connect(analyser);source.connect(spectrum);source.connect(gain);gain.connect(audioDestination);
    // Guardar la cadena real del micrófono en el estado global. Sin estas
    // referencias las evaluaciones no podían consultar el analizador aunque
    // el permiso del navegador se hubiera concedido.
    micStream=newStream;
    audioSource=source;
    audioGain=gain;
    micAnalyser=analyser;
    spectrumAnalyser=spectrum;
    micEnabled=true;
    if(selectedMusic.url)ensureAudioForMusicSync();
    return true;
  }catch(e){
    console.error('Error al activar micrófono:',e);
    try{if(newStream)newStream.getTracks().forEach(t=>t.stop())}catch(_){}
    return false;
  }
}
function stopPreviewMusic(){try{musicPlayer.pause();musicPlayer.currentTime=0}catch(e){}}
function setMusicStatus(t){document.getElementById('musicPreviewStatus').textContent=t}
function previewMusic(item){stopPreviewMusic();if(!item||item.id==='none'){setMusicStatus('Sin música de fondo.');return}try{if(!resetMusicPlayer(item))throw new Error('No se pudo preparar el audio');musicPlayer.volume=volumeLevel;const p=musicPlayer.play();if(p)p.then(()=>setMusicStatus('▶ Escuchando vista previa: '+item.name)).catch(()=>setMusicStatus('Toca nuevamente la opción para reproducir la vista previa.'));}catch(e){console.warn('Vista previa:',e);setMusicStatus('No se pudo reproducir esta base.')}}
function openMusicPanel(){if(evalRunning)return;pendingMusic={...selectedMusic};pendingMusicObjectUrl=null;const sel=document.getElementById('musicSelect');sel.value=pendingMusic.id||'none';const isCustom=pendingMusic.id==='custom',isUrl=pendingMusic.id==='url';document.getElementById('musicFileWrap').style.display=isCustom?'block':'none';document.getElementById('musicUrlWrap').style.display=isUrl?'block':'none';document.getElementById('musicFile').value='';document.getElementById('musicUrl').value=isUrl?(pendingMusic.sourceUrl||pendingMusic.url||''):'';setMusicStatus(pendingMusic.id==='none'?'Sin música de fondo.':('Selección actual: '+pendingMusic.name));closePanels();document.getElementById('musicPanel').style.display='block';menuOpen=true}
function cancelMusicPanel(){stopPreviewMusic();if(pendingMusicObjectUrl){URL.revokeObjectURL(pendingMusicObjectUrl);pendingMusicObjectUrl=null}openPanel('evaluationPanel')}
function updateMusicSelectedStatus(){const e=document.getElementById('musicSelectedStatus');if(e)e.textContent=selectedMusic.url?'🎵 Música configurada: '+selectedMusic.name:'Sin música de fondo seleccionada.'}
function isYouTubeUrl(url){return /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)/i.test(url)}
function normalizeAudioUrl(url){try{return new URL(url,document.baseURI).href}catch(e){return ''}}
function prepareUrlMusic(){const input=document.getElementById('musicUrl');const raw=(input?.value||'').trim();if(!raw){setMusicStatus('Pega primero un enlace de audio.');return false}if(isYouTubeUrl(raw)){setMusicStatus('Los enlaces normales de YouTube no pueden usarse como archivo de audio directamente. Pega el enlace directo al MP3/WAV/OGG alojado en internet.');return false}const url=normalizeAudioUrl(raw);if(!/^https?:|^blob:|^data:|^file:/i.test(url)){setMusicStatus('El enlace no parece válido.');return false}pendingMusic={id:'url',name:'Base desde enlace',url,sourceUrl:raw,objectUrl:false};previewMusic(pendingMusic);return true}
async function saveMusicSelection(){if(pendingMusic.id==='custom'&&!pendingMusic.url){setMusicStatus('Selecciona primero un archivo de audio.');return}if(pendingMusic.id==='url'&&!pendingMusic.url){if(!prepareUrlMusic())return}selectedMusic={id:pendingMusic.id,name:pendingMusic.name,url:pendingMusic.url,sourceUrl:pendingMusic.sourceUrl||''};stopPreviewMusic();if(pendingMusicObjectUrl){pendingMusicObjectUrl=null}setTop(selectedMusic.url?'Música configurada: '+selectedMusic.name:'Música de fondo desactivada');updateMusicSelectedStatus();openPanel('evaluationPanel')}
function parseYouTubeId(url){try{const u=new URL(url);if(u.hostname.includes('youtu.be'))return u.pathname.split('/').filter(Boolean)[0]||'';if(u.hostname.includes('youtube.com')){if(u.pathname==='/watch')return u.searchParams.get('v')||'';if(u.pathname.startsWith('/shorts/'))return u.pathname.split('/')[2]||'';if(u.pathname.startsWith('/embed/'))return u.pathname.split('/')[2]||''}}catch(e){}return ''}
function parseDriveId(url){try{const u=new URL(url);if(!u.hostname.includes('drive.google.com'))return '';const m=u.pathname.match(/\/file\/d\/([^/]+)/i);if(m)return m[1];return u.searchParams.get('id')||''}catch(e){}return ''}
const KARAOKE_API_URL = 'https://script.google.com/macros/s/AKfycbxwCLUEeIhVcna-iYUADBjfn9Tf1C9lxvkmCU40EbVO_CiOikETJUT-b-U82HBgn9XeOA/exec';
const KARAOKE_PROXY_URL = '/.netlify/functions/karaoke';
// Biblioteca propia de Xpresia: se carga automáticamente y no se muestra al usuario.
const DEFAULT_KARAOKE_FOLDER_ID = '1bCMFbQS5FFu9Ot65MCbNDgmY2z27WpUm';
let karaokeFolderId = DEFAULT_KARAOKE_FOLDER_ID;
let karaokeFolderUrl = 'https://drive.google.com/drive/folders/' + DEFAULT_KARAOKE_FOLDER_ID;
let karaokeConnectedFolderName = '';

function parseDriveFolderId(url){
  try{
    const u=new URL(String(url||'').trim());
    if(!u.hostname.includes('drive.google.com'))return '';
    const m=u.pathname.match(/\/folders\/([^/]+)/i);
    if(m)return m[1];
    return u.searchParams.get('id')||'';
  }catch(e){return ''}
}
function updateKaraokeFolderStatus(message){
  // El estado de la biblioteca se muestra en la nota general, sin exponer la URL de la carpeta.
  const note=document.querySelector('.karaokeNote');
  if(note && message) note.textContent=message;
}

function loadKaraokeLibraryViaBridge(){
  return new Promise((resolve,reject)=>{
    const api=String(KARAOKE_API_URL||'').trim();
    const folderId=String(karaokeFolderId||'').trim();
    if(!api){reject(new Error('KARAOKE_API_URL no configurada'));return}
    if(!folderId){reject(new Error('No hay carpeta configurada'));return}

    const iframe=document.createElement('iframe');
    iframe.style.position='fixed';
    iframe.style.left='-10000px';
    iframe.style.top='-10000px';
    iframe.style.width='1px';
    iframe.style.height='1px';
    iframe.style.border='0';
    iframe.setAttribute('aria-hidden','true');
    let finished=false;
    const cleanup=()=>{
      window.removeEventListener('message',onMessage);
      clearTimeout(timer);
      try{iframe.remove()}catch(e){if(iframe.parentNode)iframe.parentNode.removeChild(iframe)}
    };
    const finish=(ok,value)=>{
      if(finished)return;
      finished=true;
      cleanup();
      ok?resolve(value):reject(value instanceof Error?value:new Error(String(value||'Error desconocido')));
    };
    const onMessage=(event)=>{
      if(finished||event.source!==iframe.contentWindow)return;
      const data=event.data;
      if(!data||data.type!=='xpresia-karaoke-bridge')return;
      if(data && data.type==='xpresia-karaoke-bridge' && data.ok){
        const returnedFolderId=String(data.folderId||'').trim();
        if(returnedFolderId && returnedFolderId!==folderId){ finish(false,new Error('El puente devolvió otra carpeta de Drive. Solicitada: '+folderId+' · Recibida: '+returnedFolderId)); return; }
        if(Array.isArray(data.songs)){
          karaokeConnectedFolderName=String(data.folderName||'');
          finish(true,data.songs);
          return;
        }
      }
      finish(false,new Error(data && data.error ? data.error : 'El puente de Apps Script no devolvió una biblioteca válida'));
    };
    const timer=setTimeout(()=>finish(false,new Error('Tiempo de espera agotado al consultar Apps Script mediante puente móvil')),30000);
    window.addEventListener('message',onMessage);
    const sep=api.includes('?')?'&':'?';
    iframe.src=api+sep+'mode=bridge&folderId='+encodeURIComponent(folderId)+'&_='+Date.now();
    (document.body||document.documentElement).appendChild(iframe);
  });
}

function loadKaraokeLibraryFromAppsScriptJsonp(){
  return new Promise((resolve,reject)=>{
    const api=String(KARAOKE_API_URL||'').trim();
    if(!api){reject(new Error('KARAOKE_API_URL no configurada'));return}
    if(!karaokeFolderId){reject(new Error('No hay carpeta configurada'));return}
    const maxAttempts=2;
    let attempt=0;
    let settled=false;
    let lastError=null;
    const tryRequest=()=>{
      if(settled)return;
      attempt++;
      const callback='xpresiaKaraokeCallback_'+Date.now()+'_'+Math.floor(Math.random()*1000000);
      let timer=null;
      const script=document.createElement('script');
      script.async=true;
      script.type='text/javascript';
      const cleanup=()=>{
        if(timer)clearTimeout(timer);
        try{delete window[callback]}catch(e){window[callback]=undefined}
        try{script.remove()}catch(e){if(script.parentNode)script.parentNode.removeChild(script)}
      };
      window[callback]=(data)=>{
        if(settled)return;
        settled=true;
        cleanup();
        if(data&&data.ok&&Array.isArray(data.songs)){ if(data.folderId && String(data.folderId)!==String(karaokeFolderId)) reject(new Error('Apps Script devolvió otra carpeta de Drive')); else resolve(data.songs); }
        else reject(new Error(data?.error||'Apps Script no devolvió una biblioteca válida'));
      };
      script.onerror=()=>{
        lastError=new Error('No se pudo contactar con Apps Script (JSONP, intento '+attempt+')');
        cleanup();
        if(attempt<maxAttempts){setTimeout(tryRequest,700);return}
        if(!settled){settled=true;reject(lastError)}
      };
      timer=setTimeout(()=>{
        lastError=new Error('Tiempo de espera agotado al consultar Apps Script (JSONP, intento '+attempt+')');
        cleanup();
        if(attempt<maxAttempts){setTimeout(tryRequest,700);return}
        if(!settled){settled=true;reject(lastError)}
      },30000);
      const sep=api.includes('?')?'&':'?';
      script.src=api+sep+'callback='+encodeURIComponent(callback)+'&folderId='+encodeURIComponent(karaokeFolderId)+'&compact=1&_='+Date.now()+'_'+attempt;
      (document.body||document.head||document.documentElement).appendChild(script);
    };
    tryRequest();
  });
}

async function loadKaraokeLibraryFromNetlify(){
  // En Netlify, esta llamada es same-origin: Netlify consulta Apps Script
  // desde el servidor y el navegador móvil nunca necesita hablar con Google.
  const origin=String(window.location?.origin||'');
  if(!origin || origin==='null' || origin.startsWith('file:')) throw new Error('Proxy Netlify no disponible en archivo local');
  const folderId=String(karaokeFolderId||'').trim();
  if(!folderId) throw new Error('No hay carpeta configurada');
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),30000);
  try{
    const url=KARAOKE_PROXY_URL+'?folderId='+encodeURIComponent(folderId)+'&_='+Date.now();
    const res=await fetch(url,{cache:'no-store',headers:{'Accept':'application/json'},signal:controller.signal});
    if(!res.ok)throw new Error('Proxy Netlify HTTP '+res.status);
    const data=await res.json();
    if(!data||!data.ok||!Array.isArray(data.songs))throw new Error(data?.error||'Proxy Netlify no devolvió una biblioteca válida');
    if(String(data.folderId||'')!==folderId) throw new Error('La biblioteca recibida corresponde a otra carpeta de Drive. Solicitada: '+folderId+' · Recibida: '+String(data.folderId||'sin ID'));
    karaokeConnectedFolderName=String(data.folderName||'');
    return data.songs;
  }finally{clearTimeout(timer)}
}

async function loadKaraokeLibraryFromAppsScript(){
  // 1) Netlify same-origin: es la vía principal y evita CORS/JSONP en móviles.
  try{
    const songs=await loadKaraokeLibraryFromNetlify();
    return songs;
  }catch(proxyErr){
    console.warn('Proxy Netlify no disponible:',proxyErr);
  }
  // 2) Puente HTML de Apps Script.
  try{
    return await loadKaraokeLibraryViaBridge();
  }catch(bridgeErr){
    console.warn('Puente Apps Script no disponible:',bridgeErr);
    // 3) JSONP como último respaldo.
    return await loadKaraokeLibraryFromAppsScriptJsonp();
  }
}
async function loadKaraokeLibrary(){
  const box=document.getElementById('karaokeResults');
  if(box)box.innerHTML='<div class="karaokeEmpty">🔄 Cargando biblioteca de Google Drive...</div>';
  try{
    const data=await loadKaraokeLibraryFromAppsScript();
    karaokeLibrary=Array.isArray(data)?data:[];
    renderKaraokeLibrary(document.getElementById('karaokeSearch')?.value||'');
    updateKaraokeFolderStatus('✓ Biblioteca disponible: '+karaokeLibrary.length+' vídeos. Puedes cargar otra biblioteca o un karaoke individual mediante enlace.');
  }catch(err){
    console.warn('Biblioteca Karaoke de Google Drive no disponible:',err);
    // Si el usuario conectó una carpeta personalizada, NO usar la biblioteca
    // local de prueba porque podría hacer parecer que se cargó la carpeta correcta.
    const isDefaultFolder=String(karaokeFolderId||'')===String(DEFAULT_KARAOKE_FOLDER_ID||'');
    if(!isDefaultFolder){
      karaokeLibrary=[];
      renderKaraokeLibrary(document.getElementById('karaokeSearch')?.value||'');
      const detail=(err&&err.message)?String(err.message):'Error desconocido';
      updateKaraokeFolderStatus('⚠️ No se pudo acceder a la biblioteca de Google Drive. '+detail);
      if(box)box.innerHTML='<div class="karaokeEmpty">No se pudo cargar esta biblioteca. Revisa el acceso de la cuenta de Apps Script y pulsa ↻ Actualizar.</div>';
      return;
    }
    // La biblioteca local es SOLO un respaldo para la carpeta predeterminada.
    try{
      const res=await fetch('karaoke-library.json?v='+Date.now(),{cache:'no-store'});
      if(!res.ok)throw new Error('HTTP '+res.status);
      const local=await res.json();
      karaokeLibrary=Array.isArray(local)?local:(Array.isArray(local.songs)?local.songs:[]);
      renderKaraokeLibrary(document.getElementById('karaokeSearch')?.value||'');
      updateKaraokeFolderStatus('⚠️ No se pudo conectar con la biblioteca propia de Drive. Mostrando la biblioteca local de respaldo.');
      const detail=(err&&err.message)?String(err.message):'Error desconocido';
      console.warn('Detalle Apps Script:',detail);

      return;
    }catch(localErr){
      console.error('Tampoco se pudo cargar la biblioteca propia:',localErr);
      karaokeLibrary=[];
      updateKaraokeFolderStatus('⚠️ No se pudo cargar la biblioteca propia de Xpresia.');
      if(box)box.innerHTML='<div class="karaokeEmpty">No se pudo cargar la biblioteca. Pulsa ↻ Actualizar para volver a intentarlo.</div>';
    }
  }
}

function normalizeKaraokeSearch(v){
  return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
}
function renderKaraokeLibrary(query=''){
  const box=document.getElementById('karaokeResults');if(!box)return;
  const q=normalizeKaraokeSearch(query);
  const terms=q.split(/\s+/).filter(Boolean);
  const list=karaokeLibrary.filter(x=>{
    const hay=normalizeKaraokeSearch([x.title,x.artist,x.genre,x.name].filter(Boolean).join(' '));
    return !terms.length || terms.every(term=>hay.includes(term));
  });
  if(!list.length){box.innerHTML='<div class="karaokeEmpty">No hay canciones que coincidan con tu búsqueda.</div>';return}
  box.innerHTML=list.map(x=>{const selectedId=karaokeSelectedItem?.id&&x.id===karaokeSelectedItem.id;return `<button type="button" class="karaokeResult${selectedId?' selected':''}" data-kidx="${karaokeLibrary.indexOf(x)}" aria-pressed="${selectedId?'true':'false'}"><strong>🎵 ${escapeHtml(x.title||x.name||'Sin título')}</strong><small>${escapeHtml(x.artist||'Artista no indicado')}${x.genre?' · '+escapeHtml(x.genre):''}</small></button>`}).join('');
  box.querySelectorAll('.karaokeResult').forEach(btn=>btn.onclick=()=>selectKaraokeLibraryItem(karaokeLibrary[+btn.dataset.kidx]));
}
function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function selectKaraokeLibraryItem(item){
  if(!item)return;
  karaokeSelectedItem=item;
  const input=document.getElementById('karaokeUrl');if(input)input.value=item.url||item.driveUrl||'';
  const selected=document.getElementById('karaokeSelected');
  if(selected){selected.style.display='block';selected.innerHTML='🎵 Canción seleccionada: <strong>'+escapeHtml(item.title||item.name||'Karaoke')+'</strong>'+(item.artist?' · '+escapeHtml(item.artist):'');}
  renderKaraokeLibrary(document.getElementById('karaokeSearch')?.value||'');
  if(item.url||item.driveUrl){loadKaraokeVideo(item.url||item.driveUrl,false);}
}
function clearKaraokeSourceState(message='', clearLibrary=true){
  karaokeVideoId='';karaokeReady=false;karaokeSelectedItem=null;karaokeFolderId=DEFAULT_KARAOKE_FOLDER_ID;karaokeFolderUrl='https://drive.google.com/drive/folders/'+DEFAULT_KARAOKE_FOLDER_ID;karaokeConnectedFolderName='';
  const frame=document.getElementById('karaokeFrame');if(frame)frame.src='';
  const input=document.getElementById('karaokeUrl');if(input)input.value='';
  const selected=document.getElementById('karaokeSelected');if(selected){selected.style.display='none';selected.innerHTML='';}
  const search=document.getElementById('karaokeSearch');if(search)search.value='';
  if(clearLibrary){karaokeLibrary=[];renderKaraokeLibrary('');}
  if(message){const status=document.getElementById('karaokeStatus');if(status)status.textContent=message;}
  evaluationMode='camera';updateEvaluationModeUI();
}

function loadKaraokeVideo(rawInput, replaceLibrary=true){
  const input=document.getElementById('karaokeUrl'),status=document.getElementById('karaokeStatus'),frame=document.getElementById('karaokeFrame');
  const raw=String(rawInput??input?.value??'').trim();
  if(!raw){if(status)status.textContent='No se indicó ningún enlace.';return false}
  // Cada nueva carga reemplaza completamente la fuente anterior.
  clearKaraokeSourceState('', replaceLibrary);
  if(input)input.value=raw;
  const folderId=parseDriveFolderId(raw);
  if(folderId){
    karaokeFolderId=folderId;
    karaokeFolderUrl=raw;
    karaokeConnectedFolderName='';
    if(status)status.textContent='📁 Cargando carpeta…';
    return loadKaraokeLibrary().then(()=>{
      if(status)status.textContent='📁 Carpeta cargada. Se encontraron '+karaokeLibrary.length+' vídeos.';
      if(input)input.value='';
      return true;
    }).catch((e)=>{
      if(status)status.textContent='⚠️ No se pudo cargar la carpeta indicada.';
      console.error('Carga de carpeta:',e);
      return false;
    });
  }
  const ytId=parseYouTubeId(raw);
  const driveId=parseDriveId(raw);
  if(!ytId&&!driveId){
    if(status)status.textContent='⚠️ No pude reconocer el enlace. Usa YouTube o un archivo de Google Drive.';
    return false;
  }
  karaokeVideoId=ytId||driveId;karaokeReady=true;
  if(frame){
    if(ytId){
      const origin=(location.protocol==='http:'||location.protocol==='https:')?location.origin:'';
      const params=new URLSearchParams({enablejsapi:'1',playsinline:'1',rel:'0'});
      if(origin)params.set('origin',origin);
      frame.src='https://www.youtube.com/embed/'+encodeURIComponent(ytId)+'?'+params.toString();
    }else{
      frame.src='https://drive.google.com/file/d/'+encodeURIComponent(driveId)+'/preview?autoplay=1&rm=minimal';
    }
  }
  if(status){
    if(ytId)status.textContent=location.protocol==='file:'?'🎬 Video individual cargado. Para probar YouTube correctamente, abre Xpresia desde Netlify.':'🎬 Video individual cargado. Puedes comenzar la evaluación.';
    else status.textContent='🎬 Video individual de Google Drive cargado. Asegúrate de que el archivo esté compartido como “Cualquier persona con el enlace · Lector”.';
  }
  evaluationMode='karaoke';stopCamera();updateEvaluationModeUI();return true;
}

function loadOfficialKaraokeLibrary(){
  clearKaraokeSourceState('🏠 Cargando biblioteca oficial de Xpresia…');
  loadKaraokeLibrary().then(()=>{
    const status=document.getElementById('karaokeStatus');
    if(status)status.textContent='🏠 Biblioteca oficial de Xpresia cargada. '+karaokeLibrary.length+' vídeos disponibles.';
  });
}

function promptKaraokeFolder(){
  clearKaraokeSourceState('📁 Esperando el enlace de tu carpeta…');
  const raw=window.prompt('Pega el enlace de tu carpeta de Google Drive:','');
  if(raw&&raw.trim())loadKaraokeVideo(raw.trim());
  else {const status=document.getElementById('karaokeStatus');if(status)status.textContent='Biblioteca oficial de Xpresia cargada. No se cambió la biblioteca.';loadKaraokeLibrary();}
}

function promptKaraokeVideo(){
  clearKaraokeSourceState('🎬 Esperando el enlace del video…');
  const raw=window.prompt('Pega el enlace del karaoke individual (YouTube o Google Drive):','');
  if(raw&&raw.trim())loadKaraokeVideo(raw.trim());
  else {const status=document.getElementById('karaokeStatus');if(status)status.textContent='Biblioteca oficial de Xpresia cargada. No se cambió la biblioteca.';loadKaraokeLibrary();}
}

function clearKaraokeVideo(){
  clearKaraokeSourceState('Biblioteca oficial de Xpresia cargada. Selecciona una canción para comenzar.');
  loadKaraokeLibrary();
}

function getKaraokePreviewSrc(){
  const raw=(document.getElementById('karaokeUrl')?.value||'').trim();
  const ytId=parseYouTubeId(raw);
  const driveId=parseDriveId(raw)||karaokeVideoId;
  if(ytId){
    const origin=(location.protocol==='http:'||location.protocol==='https:')?location.origin:'';
    const params=new URLSearchParams({enablejsapi:'1',playsinline:'1',rel:'0',autoplay:'1'});
    if(origin)params.set('origin',origin);
    return 'https://www.youtube.com/embed/'+encodeURIComponent(ytId)+'?'+params.toString();
  }
  if(driveId)return 'https://drive.google.com/file/d/'+encodeURIComponent(driveId)+'/preview?autoplay=1&rm=minimal';
  return '';
}
function stopKaraokePreview(){const frame=document.getElementById('karaokeFrame');if(!frame)return;try{frame.src='about:blank'}catch(e){try{frame.removeAttribute('src')}catch(_){} }}
function startKaraokePlayback(){const frame=document.getElementById('karaokeFrame');const src=getKaraokePreviewSrc();if(!frame||!src)return;try{frame.src=src}catch(e){}}
function playKaraoke(){const frame=document.getElementById('karaokeFrame');if(!frame||!karaokeVideoId)return;try{frame.contentWindow?.postMessage(JSON.stringify({event:'command',func:'playVideo',args:[]}), '*')}catch(e){} }
function pauseKaraoke(){const frame=document.getElementById('karaokeFrame');if(!frame)return;try{frame.contentWindow?.postMessage(JSON.stringify({event:'command',func:'pauseVideo',args:[]}), '*')}catch(e){}}

const cameraModeBtn=document.getElementById('cameraModeBtn');if(cameraModeBtn)cameraModeBtn.onclick=()=>setEvaluationMode('camera');const voiceModeBtn=document.getElementById('voiceModeBtn');if(voiceModeBtn)voiceModeBtn.onclick=()=>setEvaluationMode('voice');const karaokeModeBtn=document.getElementById('karaokeModeBtn');if(karaokeModeBtn)karaokeModeBtn.onclick=()=>setEvaluationMode('karaoke');document.getElementById("karaokeFolderBtn").onclick=promptKaraokeFolder;document.getElementById("karaokeVideoBtn").onclick=promptKaraokeVideo;document.getElementById("karaokeOfficialBtn").onclick=loadOfficialKaraokeLibrary;document.getElementById('karaokeSearch').oninput=e=>renderKaraokeLibrary(e.target.value);document.getElementById('karaokeRefreshBtn').onclick=loadOfficialKaraokeLibrary;loadKaraokeLibrary();document.getElementById('cancelMusic').onclick=()=>{cancelMusicPanel();if(document.getElementById('guidedPanel')?.style.display==='none')openPanel('guidedPanel')};document.getElementById('saveMusic').onclick=()=>{saveMusicSelection();setTimeout(()=>{if(categoryChosen) {updateGuidedPanel();openPanel('guidedPanel')}},50)};document.getElementById('musicLinkTest').onclick=prepareUrlMusic;document.getElementById('musicSelect').onchange=e=>{const id=e.target.value;document.getElementById('musicFileWrap').style.display=id==='custom'?'block':'none';document.getElementById('musicUrlWrap').style.display=id==='url'?'block':'none';if(id==='none'){pendingMusic={id:'none',name:'Sin música de fondo',url:'',objectUrl:false};previewMusic(pendingMusic);return}if(id==='custom'){pendingMusic={id:'custom',name:'Mi música',url:'',objectUrl:true};setMusicStatus('Selecciona un archivo de audio para escucharlo.');return}if(id==='url'){pendingMusic={id:'url',name:'Base desde enlace',url:'',sourceUrl:'',objectUrl:false};setMusicStatus('Pega un enlace directo a un archivo de audio y pulsa “Probar enlace”.');return}const item=musicLibrary[id];pendingMusic={id,name:item.name,url:item.url,objectUrl:false};previewMusic(pendingMusic)};updateMusicSelectedStatus();document.getElementById('musicFile').onchange=e=>{const file=e.target.files?.[0];if(!file)return;if(pendingMusicObjectUrl)URL.revokeObjectURL(pendingMusicObjectUrl);pendingMusicObjectUrl=URL.createObjectURL(file);pendingMusic={id:'custom',name:file.name,url:pendingMusicObjectUrl,objectUrl:true};previewMusic(pendingMusic)};document.getElementById('musicUrl').onchange=()=>{if(document.getElementById('musicUrl').value.trim())prepareUrlMusic()};

let activationOpening=false;
function enterXpresia(e){
  if(e){e.preventDefault();e.stopPropagation()}
  if(activationOpening)return;
  const nameEl=document.getElementById('startUserName'), ageEl=document.getElementById('startUserAge'), err=document.getElementById('activationError');
  const n=(nameEl?.value||'').trim(), a=(ageEl?.value||'').trim();
  if(!n||!a||+a<1||+a>120){if(err)err.textContent='Completa tu nombre y una edad válida para continuar.';if(!n)nameEl?.focus();else ageEl?.focus();return}
  userName=n; userAge=a;
  const hiddenName=document.getElementById('userName'); if(hiddenName)hiddenName.value=userName;
  const hiddenAge=document.getElementById('userAge'); if(hiddenAge)hiddenAge.value=userAge;
  activationOpening=true;
  activation.style.display='none';
  categoryChosen=false;
  category='dance';
  evaluationMode='camera';
  const cat=document.getElementById('category');if(cat)cat.value='dance';
  hideGuideText();
  updateDescription();
  updateTextConfigUI();
  updateEvaluationModeUI();
  openPanel('mainMenu');
  setTop('Bienvenidos a Xpresia');
  setTimeout(()=>{activationOpening=false},350);
}
// Importante en móviles: usar SOLO click. Si se usa pointerup + click, el click
// sintetizado puede caer sobre el elemento que queda debajo al ocultar la portada
// y abrir accidentalmente una sección/configuración.
activation.style.touchAction='manipulation';
document.getElementById('activationEnter')?.addEventListener('click',enterXpresia,{passive:false});
document.getElementById('startUserAge')?.addEventListener('keydown',e=>{if(e.key==='Enter')enterXpresia(e)});
document.getElementById('startUserName')?.addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('startUserAge')?.focus()});
const panels=['mainMenu','dancePanel','singPanel','readingCategoryPanel','actingPanel','auraPanel','imitationPanel','guidedPanel','durationPanel','modePanel','evaluationPanel','learningPanel','contactPanel','collabPanel','competitionPanel','musicPanel'];
function closePanels(){panels.forEach(id=>document.getElementById(id).style.display='none');hideGuideText();menuOpen=false}
function openPanel(id){closePanels();const el=document.getElementById(id);if(el)el.style.display='block';menuOpen=true;if(id==='evaluationPanel'){updateEvaluationPanelContext();updateGuidePanel()}}
function returnToMain(){openPanel('mainMenu')}
function setTop(t){document.getElementById('topMessage').textContent=t}
function setTopScore(v){const e=document.getElementById('topScore');e.textContent='Puntuación: '+Math.round(v);e.style.display='inline'}
function formatTime(s){s=Math.max(0,Math.floor(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function updateImitationUI(){const box=document.getElementById('imitationChallenge');if(box)box.classList.toggle('show',category==='imitation');const sel=document.getElementById('imitationType');if(sel){sel.value=imitationType;sel.onchange=e=>{imitationType=e.target.value}}}
function updateDescription(){const p=profiles[category];const d=document.getElementById('description');if(d)d.textContent=p.description;updateImitationUI()}
function updateEvaluationPanelContext(){
  const p=profiles[category]||profiles.dance;
  const title=document.getElementById('evaluationTitle'),sub=document.getElementById('evaluationSubtitle'),ctx=document.getElementById('configContext');
  if(title)title.textContent='Configuración · '+p.name;
  if(sub)sub.textContent=evaluationMode==='karaoke'?'Configura tu experiencia de karaoke.':'Configura únicamente esta experiencia antes de comenzar.';
  if(ctx)ctx.textContent=(evaluationMode==='karaoke'?'🎵 Karaoke':evaluationMode==='voice'?'🎙️ Solo voz':'📷 '+p.name)+' · configuración independiente';
}
function updateEvaluationModeUI(){
  const chooser=document.getElementById('evalModeChooser'); if(chooser)chooser.style.display='none';
  const karaokeActive=category==='sing'&&evaluationMode==='karaoke';
  const textPanel=document.getElementById('readingPanel');
  if(textPanel)textPanel.style.display=(!karaokeActive&&(category==='sing'||category==='reading'||category==='acting'))?'block':'none';
  const kp=document.getElementById('karaokeConfigPanel');if(kp)kp.style.display=karaokeActive?'block':'none';
  const cam=document.getElementById('cameraModeBtn'),voice=document.getElementById('voiceModeBtn'),karaoke=document.getElementById('karaokeModeBtn');
  if(cam)cam.style.display='none';if(voice)voice.style.display='none';if(karaoke)karaoke.style.display='none';
  const solo=document.getElementById('soloVisual'),kv=document.getElementById('karaokeVisual');
  const img=document.getElementById('soloVisualImage'),label=document.getElementById('soloVisualLabel');
  const cameraShowing=!!(evaluationMode==='camera'&&cameraReady&&video.readyState>=2&&video.videoWidth);
  const showKaraoke=evalRunning&&evaluationMode==='karaoke'&&!!karaokeVideoId;
  const shouldShowVisual=(evaluationMode==='voice')||(!cameraShowing&&!showKaraoke);
  if(solo){solo.style.display=shouldShowVisual?'block':'none';solo.setAttribute('aria-hidden',shouldShowVisual?'false':'true')}
  if(kv){kv.style.display=showKaraoke?'block':'none';kv.setAttribute('aria-hidden',showKaraoke?'false':'true')}
  if(img){const src=!categoryChosen?DEFAULT_VISUAL_IMAGE:(category==='reading'?'assets/imagenes/eval_lectura.jpg':category==='sing'?'assets/imagenes/eval_canto.jpg':category==='acting'?'assets/imagenes/eval_actuacion.jpg':category==='aura'?'assets/imagenes/eval_presencia.jpg':category==='imitation'?'assets/imagenes/eval_imitacion.jpg':'assets/imagenes/eval_movimiento.jpg');img.src=src;img.alt=!categoryChosen?'Xpresia — Arte y expresión en movimiento':(profiles[category]?.name||'Evaluación Xpresia')}
  if(label){if(!categoryChosen)label.innerHTML='✨ Xpresia<small>Arte y expresión en movimiento</small>';else if(evaluationMode==='karaoke')label.innerHTML='🎵 Modo Karaoke<small>Canta siguiendo el video y las letras</small>';else if(category==='reading')label.innerHTML='📖 Modo solo micrófono<small>Lee con tu voz y deja que tu narración sea la protagonista</small>';else if(category==='sing')label.innerHTML='🎙️ Modo solo micrófono<small>Tu voz es la protagonista</small>';else label.innerHTML='✨ '+(profiles[category]?.name||'Xpresia')+'<small>Descubre y expresa tus habilidades</small>'}
  positionVisualStage();updateLiveGuideVisibility();updateEvaluationPanelContext();
}
function positionVisualStage(){
  const solo=document.getElementById('soloVisual');
  const kv=document.getElementById('karaokeVisual');
  const r=getStageScreenRect();
  if(solo){
    solo.style.left=(r.x+r.w/2)+'px';
    solo.style.top=r.y+'px';
    solo.style.width=r.w+'px';
    solo.style.height=r.h+'px';
  }
  if(kv){
    // El karaoke debe ocupar exactamente el mismo rectángulo visual que la cámara/imagen.
    // Así ambos modos mantienen la misma composición y no invade el menú inferior.
    kv.style.left=(r.x+r.w/2)+'px';
    kv.style.top=r.y+'px';
    kv.style.width=r.w+'px';
    kv.style.height=r.h+'px';
  }
}
function updateLiveGuideVisibility(){
  const guide=document.getElementById('liveTextGuidePanel');
  if(!guide)return;
  const textSkill=category==='sing'||category==='acting'||category==='reading';
  const shouldShow=!!(evalRunning&&textSkill&&textSource!=='none'&&evaluationMode!=='karaoke');
  if(shouldShow){
    if(!guideTextType)renderGuideText(category,duration||60);
    guide.classList.add('liveTextGuide');guide.style.setProperty('display','block','important');
  }else{
    guide.style.display='none';
  }
}

function setEvaluationMode(mode){if(evalRunning)return;if((category!=='sing'&&category!=='reading')&&(mode==='voice'||mode==='karaoke'))return;if(category!=='sing'&&mode==='karaoke')return;if(mode==='karaoke'&&!karaokeVideoId){const st=document.getElementById('karaokeStatus');if(st)st.textContent='Pega y carga primero un enlace de YouTube.'}evaluationMode=mode;if(mode==='voice'||mode==='karaoke')stopCamera();updateEvaluationModeUI();resetScore();}
function updateGuidePanel(){const show=category==='sing'||category==='acting'||category==='reading';const p=document.getElementById('textGuidePanel');if(!show||!evalRunning||textSource==='none'){hideGuideText();return}renderGuideText(category,duration||60)}
function updateTextConfigUI(){
  const panel=document.getElementById('readingPanel');
  const selector=document.getElementById('textSourceSelect');
  const wrap=document.getElementById('customTextWrap');
  const area=document.getElementById('customText');
  const count=document.getElementById('customTextCount');
  const show=category==='sing'||category==='reading'||category==='acting';
  if(panel)panel.style.display=(show&&evaluationMode!=='karaoke')?'block':'none';
  if(selector)selector.value=textSource;
  if(wrap)wrap.classList.toggle('show',show&&textSource==='custom');
  if(area&&area.value!==customEvaluationText)area.value=customEvaluationText;
  if(count)count.textContent=(customEvaluationText.length)+' / 3000';
  const header=document.getElementById('textConfigHeader');
  if(header)header.textContent='📝 Texto en pantalla';
  const kp=document.getElementById('karaokeConfigPanel');if(kp)kp.style.display=category==='sing'?'block':'none';
}
const textSourceSelect=document.getElementById('textSourceSelect');
if(textSourceSelect)textSourceSelect.onchange=e=>{textSource=e.target.value;updateTextConfigUI();};
const customTextInput=document.getElementById('customText');
if(customTextInput)customTextInput.oninput=e=>{customEvaluationText=e.target.value;const c=document.getElementById('customTextCount');if(c)c.textContent=customEvaluationText.length+' / 3000';};
const categorySelect=document.getElementById('category');if(categorySelect)categorySelect.style.display='none';updateDescription();updateTextConfigUI();updateEvaluationModeUI();hideGuideText();
function loadPose(){if(poseReady||pose)return;if(typeof Pose==='undefined'){setTop('Cargando detector corporal…');if(window.poseLoading)return;window.poseLoading=true;const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';s.onload=()=>{window.poseLoading=false;loadPose()};s.onerror=()=>{window.poseLoading=false;setTop('No se pudo cargar el detector corporal')};document.head.appendChild(s);return}pose=new Pose({locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`});pose.setOptions({modelComplexity:0,smoothLandmarks:true,enableSegmentation:false,minDetectionConfidence:.35,minTrackingConfidence:.35});pose.onResults(onPose);poseReady=true;setTop('Detector corporal listo')}
function waitForPoseReady(timeout=8000){return new Promise(resolve=>{const started=performance.now();const check=()=>{if(poseReady){resolve(true);return}if(performance.now()-started>=timeout){resolve(false);return}setTimeout(check,100)};check()})}
function onPose(res){poseBusy=false;if(!evalRunning||evalPaused||!res.poseLandmarks)return;sample(res.poseLandmarks)}
function runPose(){if(evalRunning&&!evalPaused&&poseReady&&!poseBusy&&video.readyState>=2){const now=performance.now();if(now-lastPose>125){lastPose=now;poseBusy=true;pose.send({image:video}).catch(()=>{poseBusy=false})}}requestAnimationFrame(runPose)}
requestAnimationFrame(runPose);requestAnimationFrame(draw);window.addEventListener('resize',()=>{positionVisualStage();drawSpectrum()});
function sample(lm){
  const now=performance.now();
  const ids=[0,11,12,13,14,15,16,23,24,25,26,27,28];
  const visible={}; let active=0;
  for(const id of ids){const p=lm[id]; if(p&&p.visibility>=.25){visible[id]=p;active++;}}
  if(active<6)return;

  const shL=visible[11],shR=visible[12],hipL=visible[23],hipR=visible[24];
  const centers=[];
  if(shL&&shR)centers.push({x:(shL.x+shR.x)/2,y:(shL.y+shR.y)/2});
  if(hipL&&hipR)centers.push({x:(hipL.x+hipR.x)/2,y:(hipL.y+hipR.y)/2});
  const center=centers.length?{x:centers.reduce((a,p)=>a+p.x,0)/centers.length,y:centers.reduce((a,p)=>a+p.y,0)/centers.length}:null;
  const shoulderScale=shL&&shR?Math.hypot(shL.x-shR.x,shL.y-shR.y):0;
  const hipScale=hipL&&hipR?Math.hypot(hipL.x-hipR.x,hipL.y-hipR.y):0;
  const bodyScale=Math.max(.08,shoulderScale||hipScale||.18);

  let speeds=[], leftSpeed=[], rightSpeed=[], motionCount=0;
  for(const id of ids){
    const q=visible[id], old=prev[id];
    if(q&&old){
      const dt=Math.max(.016,(now-old.t)/1000);
      const v=Math.hypot(q.x-old.x,q.y-old.y)/dt/bodyScale;
      speeds.push(v); motionCount++;
      if([13,15,23,25,27].includes(id))leftSpeed.push(v);
      if([14,16,24,26,28].includes(id))rightSpeed.push(v);
    }
    if(q)prev[id]={x:q.x,y:q.y,t:now};
  }
  if(!speeds.length)return;

  const avgSpeed=speeds.reduce((a,b)=>a+b,0)/speeds.length;
  const energy=Math.min(1,avgSpeed/4.5);
  const delta=Math.abs(energy-lastEnergy);
  const continuity=1-Math.min(1,delta/.22);
  lastEnergy=energy;

  // Bilateral coordination: similar movement on both sides is rewarded,
  // while simultaneous but very different amplitudes reduce the score.
  const meanL=leftSpeed.length?leftSpeed.reduce((a,b)=>a+b,0)/leftSpeed.length:0;
  const meanR=rightSpeed.length?rightSpeed.reduce((a,b)=>a+b,0)/rightSpeed.length:0;
  const bilateral=1-Math.min(1,Math.abs(meanL-meanR)/Math.max(.25,meanL+meanR));

  // Direction changes use the wrists and ankles, with a noise threshold.
  for(const id of [15,16,27,28]){
    const p=visible[id],o=prevDir[id];
    if(p&&o){
      const dx=p.x-o.x,dy=p.y-o.y,mag=Math.hypot(dx,dy);
      if(mag>.012){
        const d=Math.atan2(dy,dx);
        if(o.dir!=null&&Math.abs(Math.atan2(Math.sin(d-o.dir),Math.cos(d-o.dir)))>1.15)directionChanges++;
        prevDir[id]={x:p.x,y:p.y,dir:d};
      }
    }else if(p)prevDir[id]={x:p.x,y:p.y,dir:null};
  }

  const centerMotion=center&&prev.center?Math.hypot(center.x-prev.center.x,center.y-prev.center.y)/bodyScale:0;
  const amplitude=Math.min(1,avgSpeed/3.2);
  sampleVoice();
  samples.push({t:now,energy,continuity,active, bilateral,centerMotion,amplitude});
  if(center)prev.center={x:center.x,y:center.y,t:now};
  if(samples.length>900)samples.shift();
  updateScore();
}
function openHistoryDB(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window)){reject(new Error('IndexedDB no disponible'));return}const req=indexedDB.open(HISTORY_DB,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(HISTORY_STORE)){const store=db.createObjectStore(HISTORY_STORE,{keyPath:'id',autoIncrement:true});store.createIndex('createdAt','createdAt',{unique:false})}};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('No se pudo abrir el almacenamiento'))})}
async function saveEvaluationToHistory(r){
  if(!resultImageBlob)return false;
  let db;
  try{
    db=await openHistoryDB();
    const item={createdAt:Date.now(),name:userName||'Usuario',category:profiles[category]?.name||category,score:Math.round(r.score),duration:duration>0?duration:r.duration,imageBlob:resultImageBlob};
    await new Promise((resolve,reject)=>{const tx=db.transaction(HISTORY_STORE,'readwrite');tx.objectStore(HISTORY_STORE).add(item);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('No se pudo guardar la evaluación'))});
    const ids=await new Promise((resolve,reject)=>{const tx=db.transaction(HISTORY_STORE,'readonly');const req=tx.objectStore(HISTORY_STORE).index('createdAt').getAllKeys();req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
    if(ids.length>MAX_SAVED_EVALUATIONS){const oldIds=ids.slice(0,ids.length-MAX_SAVED_EVALUATIONS);await new Promise((resolve,reject)=>{const tx=db.transaction(HISTORY_STORE,'readwrite');const store=tx.objectStore(HISTORY_STORE);oldIds.forEach(id=>store.delete(id));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('No se pudieron eliminar evaluaciones antiguas'))})}
    db.close();return true;
  }catch(e){console.warn('No se pudo guardar la imagen automáticamente:',e);try{db?.close()}catch(_){}return false}
}

function updateMicNoiseFloor(){
  if(!micAnalyser||evalRunning)return;
  const n=256,buf=new Float32Array(n);micAnalyser.getFloatTimeDomainData(buf);
  let sum=0;for(let i=0;i<n;i++)sum+=buf[i]*buf[i];
  const rms=Math.sqrt(sum/n);
  if(Number.isFinite(rms)) micNoiseFloorRms=micNoiseFloorRms*.92+rms*.08;
}
function detectVoicePitch(){if(!micAnalyser||!audioContext)return null;const n=256,buf=new Float32Array(n);micAnalyser.getFloatTimeDomainData(buf);let sum=0;for(let i=0;i<n;i++)sum+=buf[i]*buf[i];const rms=Math.sqrt(sum/n);voiceRmsHistory.push(rms);if(voiceRmsHistory.length>600)voiceRmsHistory.shift();const recent=voiceRmsHistory.slice(-40);const sortedR=[...recent].sort((a,b)=>a-b);const floor=sortedR[Math.floor(sortedR.length*.2)]||0.003;const adaptiveFloor=Math.max(micNoiseFloorRms,floor);const threshold=Math.max(.014,adaptiveFloor*2.8);if(rms<threshold)return null;let bestTau=-1,bestCorr=0;const minTau=Math.max(2,Math.floor(audioContext.sampleRate/1000)),maxTau=Math.min(n-2,Math.floor(audioContext.sampleRate/75));for(let tau=minTau;tau<=maxTau;tau+=2){let corr=0,e1=0,e2=0;for(let i=0;i<n-tau;i+=2){const a=buf[i],b=buf[i+tau];corr+=a*b;e1+=a*a;e2+=b*b}const norm=corr/Math.sqrt((e1*e2)||1);if(norm>bestCorr){bestCorr=norm;bestTau=tau}}if(bestTau<0||bestCorr<.55)return null;const pitch=audioContext.sampleRate/bestTau;if(pitch<75||pitch>1000)return null;return{pitch,rms,confidence:bestCorr}}
function sampleVoice(){if(!micEnabled||!micAnalyser)return;const now=performance.now();if(now-lastVoiceSampleAt<100)return;lastVoiceSampleAt=now;
  // Registramos también la envolvente de la voz aunque el detector de tono no encuentre
  // una nota. Esto permite medir presencia, entradas y regularidad rítmica.
  const n=256,buf=new Float32Array(n);micAnalyser.getFloatTimeDomainData(buf);let sum=0;for(let i=0;i<n;i++)sum+=buf[i]*buf[i];const rms=Math.sqrt(sum/n);
  const recent=voiceRmsHistory.slice(-40),sorted=[...recent].sort((a,b)=>a-b);const floor=sorted[Math.floor(sorted.length*.2)]||0.003;const threshold=Math.max(.014,Math.max(micNoiseFloorRms,floor)*2.8);const active=rms>=threshold;
  voiceActivitySamples.push({t:now,rms,active});if(voiceActivitySamples.length>900)voiceActivitySamples.shift();
  if(active&&!lastVoiceActive)voiceOnsetTimes.push(now);if(voiceOnsetTimes.length>120)voiceOnsetTimes.shift();lastVoiceActive=active;
  const v=detectVoicePitch();if(v){voicePitchHistory.push(v.pitch);if(voicePitchHistory.length>600)voicePitchHistory.shift();voiceSamples.push({t:now,pitch:v.pitch,rms:v.rms,confidence:v.confidence});if(voiceSamples.length>600)voiceSamples.shift()}
  if(now-lastVoiceAnalysisAt>=180){lastVoiceAnalysisAt=now;voiceScoreCache=updateVoiceScore()}}
function updateVoiceScore(){
  if(!voiceSamples.length)return null;
  const freqs=voiceSamples.map(v=>v.pitch).filter(Number.isFinite);if(!freqs.length)return null;
  const cents=freqs.map(v=>1200*Math.log2(v/440));
  const sorted=[...cents].sort((a,b)=>a-b),median=sorted[Math.floor(sorted.length/2)];
  const deviations=cents.map(c=>Math.abs(c-median));
  const mad=[...deviations].sort((a,b)=>a-b)[Math.floor(deviations.length/2)]||0;
  const pitchStability=Math.max(0,1-Math.min(1,mad/110));
  let nearestErr=0;for(const c of cents)nearestErr+=Math.abs(c-Math.round(c/100)*100);nearestErr/=cents.length;
  const pitchAccuracy=Math.max(0,1-Math.min(1,nearestErr/55));
  const rms=voiceSamples.map(v=>v.rms),mean=rms.reduce((a,b)=>a+b,0)/rms.length||1e-6;
  const sd=Math.sqrt(rms.reduce((a,b)=>a+(b-mean)**2,0)/rms.length);
  const dynamics=Math.max(0,Math.min(1,sd/(mean*.70+.004)));
  const range=Math.max(...cents)-Math.min(...cents);const pitchRange=Math.max(0,Math.min(1,range/900));
  const elapsed=Math.max(1,currentElapsed());
  const activityCount=voiceActivitySamples.filter(x=>x.active).length;
  const presence=Math.min(1,activityCount/Math.max(10,elapsed*8));
  const activeRatio=Math.min(1,activityCount/Math.max(12,elapsed*8));
  // Regularidad de las entradas vocales: útil como indicador rítmico cuando no
  // disponemos de acceso al audio del karaoke.
  const onsets=voiceOnsetTimes.filter(t=>t>=(karaokeStartAt||0));
  const intervals=[];for(let i=1;i<onsets.length;i++){const d=(onsets[i]-onsets[i-1])/1000;if(d>=.12&&d<=3.5)intervals.push(d)}
  let rhythmicConsistency=.45;if(intervals.length>=3){const im=intervals.reduce((a,b)=>a+b,0)/intervals.length;const isd=Math.sqrt(intervals.reduce((a,b)=>a+(b-im)**2,0)/intervals.length);rhythmicConsistency=clamp01(1-Math.min(1,isd/Math.max(.12,im*.65)))}
  let syncToMusic=null;
  if(evaluationMode==='karaoke'){
    const item=karaokeSelectedItem||{};const bpm=Number(item.bpm||item.tempo);
    if(Number.isFinite(bpm)&&bpm>=50&&bpm<=220&&onsets.length>=3){
      const beat=60/bpm,offset=onsets[0]-(karaokeStartAt||onsets[0]);let sum=0,count=0;
      for(const t of onsets){const rel=Math.max(0,(t-(karaokeStartAt||onsets[0])-offset)/1000);const phase=Math.abs((rel/beat)-Math.round(rel/beat));sum+=1-Math.min(1,phase*2);count++}
      syncToMusic=count?clamp01(sum/count):0;
    }
  }
  const rhythmMetric=syncToMusic==null?rhythmicConsistency:syncToMusic;
  const score=clamp01(.38*pitchAccuracy+.24*pitchStability+.12*dynamics+.10*pitchRange+.10*presence+.06*rhythmMetric);
  setVoiceMetric('Pitch',pitchAccuracy*100);setVoiceMetric('PitchStability',pitchStability*100);setVoiceMetric('Dynamics',dynamics*100);setVoiceMetric('VoicePresence',presence*100);
  return{pitchAccuracy,pitchStability,dynamics,pitchRange,presence,activeRatio,rhythmicConsistency,syncToMusic,score};
}

function voiceCompute(){const v=voiceScoreCache||(voiceSamples.length?updateVoiceScore():null);if(!v)return null;const rhythm=v.syncToMusic!=null?v.syncToMusic:v.rhythmicConsistency;const score=clamp01(.38*v.pitchAccuracy+.25*v.pitchStability+.13*v.dynamics+.09*v.pitchRange+.09*v.presence+.06*rhythm);return{...v,score}}
function clamp01(v){return Math.max(0,Math.min(1,Number.isFinite(v)?v:0))}
function scoreCurve(v,mid=.5,sharp=1.8){
  v=clamp01(v); const z=(v-mid)*sharp; return 1/(1+Math.exp(-z*4));
}
function normalizeReadingText(t){return (t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim()}
function startReadingRecognition(){
  readingTranscript='';readingFinalText='';readingStartedAt=performance.now();readingLastSpeechAt=readingStartedAt;readingPauseCount=0;
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){readingRecognitionSupported=false;const st=document.getElementById('readingStatus');if(st)st.textContent='🎙️ El navegador no ofrece reconocimiento de voz. Se evaluarán igualmente voz, fluidez y expresión, pero sin comparar palabras.';return false}
  try{
    readingRecognitionSupported=true;readingRecognition=new SR();readingRecognition.lang='es-AR';readingRecognition.continuous=true;readingRecognition.interimResults=true;readingRecognition.maxAlternatives=1;
    readingRecognition.onresult=e=>{let finalPart='';let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const text=e.results[i][0]?.transcript||'';if(e.results[i].isFinal)finalPart+=' '+text;else interim+=' '+text}if(finalPart)readingFinalText+=' '+finalPart;readingTranscript=(readingFinalText+' '+interim).trim();highlightReadingFromTranscript(readingTranscript);const now=performance.now();if(readingLastSpeechAt&&now-readingLastSpeechAt>900)readingPauseCount++;readingLastSpeechAt=now;const st=document.getElementById('readingStatus');if(st)st.textContent='🎙️ Lectura detectada… sigue leyendo con naturalidad.'};
    readingRecognition.onerror=e=>{const st=document.getElementById('readingStatus');if(st)st.textContent=e.error==='not-allowed'?'🎙️ Permiso de micrófono no disponible para reconocimiento. Se continuará con el análisis vocal.':'🎙️ Reconocimiento de voz interrumpido; se continuará con el análisis disponible.'};
    readingRecognition.onend=()=>{if(evalRunning&&!evalPaused){try{readingRecognition.start()}catch(e){}}};
    readingRecognition.start();
    return true;
  }catch(e){readingRecognitionSupported=false;return false}
}
function stopReadingRecognition(){try{if(readingRecognition){readingRecognition.onend=null;readingRecognition.stop()}}catch(e){}readingRecognition=null}
function getReadingPassageForDuration(sec){
  const passages={
    10:'Cuando una historia comienza, todo parece pequeño: una voz, una idea y un instante para descubrir qué puede suceder.',
    20:'La lectura también es una forma de viajar. Una frase puede llevarnos a otro lugar, despertar un recuerdo y cambiar por unos segundos la manera en que miramos el mundo.',
    30:'Cada persona tiene una manera distinta de contar lo que vive. Algunas voces hablan con calma, otras con energía, pero todas pueden transmitir una emoción cuando encuentran el ritmo adecuado y dejan que las palabras respiren.',
    40:'En una tarde tranquila, una ventana abierta dejaba entrar el sonido de la ciudad. Alguien caminaba sin prisa, observando las luces, los árboles y las pequeñas escenas que normalmente pasan desapercibidas. A veces, detenerse unos segundos alcanza para descubrir una historia donde antes parecía no haber nada.',
    60:'Hay momentos en los que avanzar no significa correr. Significa escuchar, mirar con atención y elegir el siguiente paso. Una persona puede comenzar con una duda y terminar con una nueva idea. Puede equivocarse, volver a intentar y descubrir que aquello que parecía difícil solo necesitaba tiempo, práctica y confianza. Cada palabra que pronunciamos también tiene un ritmo, una intención y una emoción que puede transformar la manera en que los demás reciben nuestro mensaje.',
    120:'La voz tiene una fuerza especial porque no solo comunica palabras: también revela intención. Cuando alguien cuenta una historia, puede hacernos imaginar una plaza, una casa, una montaña o un recuerdo que nunca vivimos. El secreto está en prestar atención a las pausas, a la velocidad y a la energía con la que cada frase llega al oyente.\n\nImaginemos ahora una persona que decide aprender algo nuevo. Al principio observa a otros y piensa que nunca podrá hacerlo igual. Sin embargo, comienza con un pequeño ejercicio, después repite el movimiento y finalmente encuentra su propia manera de expresarse. El progreso no aparece de golpe. Se construye con pequeños intentos que, juntos, terminan formando una habilidad. Leer en voz alta también es practicar: respirar, comprender, interpretar y convertir un texto escrito en una experiencia viva.',
    180:'Una ciudad despierta lentamente mientras el cielo cambia de color. En una calle todavía tranquila, alguien abre una puerta y escucha los primeros sonidos de la mañana. Un vehículo pasa a lo lejos, una persiana se levanta y una conversación comienza en una esquina. Nada extraordinario parece estar ocurriendo, pero cada detalle forma parte de una escena que podría convertirse en una historia.\n\nEn otro lugar, una persona prepara una presentación. Ha practicado varias veces, aunque todavía siente algunos nervios. Respira, mira al frente y recuerda que no necesita ser perfecta: necesita estar presente. Empieza a hablar y descubre que, cuando comprende lo que quiere transmitir, las palabras encuentran su propio camino. La seguridad aparece poco a poco, acompañada por la práctica.\n\nAsí ocurre con muchas habilidades. Primero existe la curiosidad, luego el intento, después el error y finalmente la mejora. La expresión personal no consiste en copiar una única forma de hacerlo. Consiste en encontrar una voz propia y aprender a utilizarla con intención, claridad y emoción.',
    300:'Una historia puede comenzar en cualquier lugar. Puede nacer en una habitación silenciosa, en medio de una conversación o mientras alguien observa el movimiento de una plaza. Lo importante no siempre es lo que sucede, sino la manera en que decidimos contarlo. Una misma escena puede parecer alegre, misteriosa o emocionante dependiendo de la voz, las pausas y las palabras que elegimos.\n\nPensemos en una persona que quiere descubrir una nueva capacidad. Durante los primeros días todo parece extraño. Hay movimientos que no salen como esperaba, palabras que se olvidan y momentos en los que aparece la duda. Sin embargo, cada intento deja una pequeña enseñanza. Con el tiempo, aquello que parecía complicado comienza a resultar familiar. La memoria reconoce los pasos, la respiración encuentra su ritmo y la atención se vuelve más precisa.\n\nTambién aprendemos observando. Mirar a otra persona puede mostrar una posibilidad que todavía no habíamos imaginado. Pero observar no significa perder nuestra identidad. Cada cuerpo, cada voz y cada experiencia tiene características diferentes. Por eso practicar consiste también en descubrir qué nos resulta natural y qué podemos mejorar.\n\nCuando comunicamos una idea, el mensaje no depende únicamente de las palabras. La postura, la mirada, el volumen y el silencio participan de la expresión. Incluso una pausa breve puede cambiar completamente el sentido de una frase. Leer, actuar, cantar o hablar frente a otras personas son maneras distintas de entrenar una misma capacidad: estar presentes y transmitir algo que pueda ser comprendido y sentido.\n\nAl final, el aprendizaje se parece a un camino. No existe una única velocidad y tampoco todos recorremos la misma distancia. Algunas personas avanzan rápidamente y otras necesitan más tiempo. Lo importante es continuar explorando, aceptar los errores como parte del proceso y descubrir qué sucede cuando una intención se convierte en una acción concreta. Cada nueva práctica abre una oportunidad para expresarnos de una manera diferente.'
  };
  if(sec<=10)return passages[10];
  if(sec<=20)return passages[20];
  if(sec<=30)return passages[30];
  if(sec<=40)return passages[40];
  if(sec<=60)return passages[60];
  if(sec<=120)return passages[120];
  if(sec<=180)return passages[180];
  return passages[300];
}

function getSingTextForDuration(sec){
  const passages={
    10:'Sube la voz, respira lento, deja que el ritmo encuentre tu corazón y canta este instante con libertad.',
    20:'Hoy quiero cantar sin miedo, dejar que mi voz recorra el aire y convertir cada palabra en una pequeña chispa de alegría.',
    30:'Cuando comienza la música, cierro los ojos un momento. Respiro profundo, escucho el pulso y dejo que mi voz encuentre su camino. Cada nota nace diferente, pero todas cuentan lo que siento.',
    40:'Quiero cantar esta historia despacio, escuchar cómo cambia mi voz y dejar que cada frase tenga su propio color. Si una nota se escapa, vuelvo a respirar y continúo, porque cantar también es aprender a confiar en el momento.',
    60:'Hay una canción dentro de cada recuerdo. A veces aparece suave, como una luz al amanecer; otras veces llega con fuerza y nos invita a movernos. Hoy dejo que mi voz la descubra, sin buscar perfección, solo presencia, emoción y ganas de cantar. Cada frase tiene un comienzo, una pausa y un destino. Cuando escucho mi respiración, encuentro el ritmo que necesito para seguir.',
    120:'Esta noche quiero cantar una historia que todavía no termina. Habla de caminos abiertos, de encuentros inesperados y de esa sensación de comenzar otra vez. La melodía sube, baja y vuelve a empezar, como una persona que aprende a caminar con confianza.\n\nNo necesito esconder mi voz. Puedo hacerla suave cuando la historia lo pide y darle fuerza cuando llega el momento de decir algo importante. Puedo detenerme, respirar y volver a entrar en el ritmo. Cada palabra puede llevar una intención distinta, y cada nota puede convertirse en una emoción.\n\nCantar es escuchar y responder. Es reconocer el silencio entre una frase y otra, sentir el pulso y permitir que el cuerpo acompañe lo que la voz quiere expresar.',
    180:'La música comienza lejos, casi como un recuerdo. Poco a poco se acerca y encuentra un lugar dentro de la voz. Hay una historia de caminos, de noches largas y de mañanas nuevas. Una persona camina sin saber exactamente dónde terminará, pero continúa porque cada paso trae una posibilidad.\n\nCuando la melodía crece, también crece la confianza. La voz deja de pedir permiso y empieza a ocupar el espacio. Algunas frases necesitan suavidad; otras necesitan decisión. El cantante escucha cada respiración y descubre que incluso una pausa puede formar parte de la música.\n\nDespués llega un momento de calma. Todo parece detenerse durante un segundo. Entonces aparece una nueva frase, más clara que la anterior, y la canción vuelve a avanzar. No se trata solamente de llegar a una nota final. Se trata de contar algo con la voz y permitir que quien escucha pueda imaginarlo.',
    300:'Cantar es convertir una emoción en sonido. A veces la primera nota aparece con timidez, casi como si preguntara si puede entrar. Después llega la segunda, y poco a poco la voz encuentra un espacio propio. El ritmo ayuda, pero la intención también. Una misma melodía puede sentirse completamente diferente cuando cambia la manera de pronunciar una palabra.\n\nImaginemos una canción que habla de comenzar de nuevo. Al principio hay incertidumbre: no sabemos qué habrá al otro lado del camino. Luego aparece una pequeña esperanza, como una luz entre las nubes. La música avanza y la voz gana confianza. Ya no importa tanto el miedo inicial, porque cada frase confirma que podemos continuar.\n\nHay momentos para cantar con fuerza y momentos para cantar casi en secreto. Hay frases que piden una respiración larga y otras que necesitan un impulso breve. Escuchar el propio cuerpo ayuda a encontrar esas diferencias. La voz no trabaja sola: la respiración, la postura, la articulación y la emoción participan de cada sonido.\n\nUna buena interpretación no tiene que parecerse a otra persona. Puede tomar inspiración, pero necesita encontrar una identidad. Por eso practicar también significa probar diferentes intensidades, pausas y formas de decir. A veces descubrimos que una pequeña modificación cambia completamente la sensación de una frase.\n\nY cuando la canción termina, queda algo más que el último sonido. Queda la historia que logramos transmitir, la energía que pusimos en cada palabra y la experiencia de haber ocupado ese momento con nuestra propia voz. Esa es una de las posibilidades más interesantes de cantar: transformar unos minutos en una expresión que puede sentirse única.'
  };
  if(sec<=10)return passages[10]; if(sec<=20)return passages[20]; if(sec<=30)return passages[30]; if(sec<=40)return passages[40]; if(sec<=60)return passages[60]; if(sec<=120)return passages[120]; if(sec<=180)return passages[180]; return passages[300];
}

function getActingTextForDuration(sec){
  const passages={
    10:'No voy a retroceder. Puede que tenga miedo, pero esta vez voy a dar el primer paso.',
    20:'Escúchame un momento. No vine hasta aquí para rendirme ahora. Si todo cambia después de esta decisión, entonces que cambie; pero quiero saber que al menos lo intenté.',
    30:'Mírame. Sé que esperabas otra respuesta, pero ya no puedo fingir que nada ocurrió. Durante mucho tiempo guardé silencio. Hoy decidí hablar, aunque todavía no sepa qué sucederá después.',
    40:'Pensé que volver sería sencillo. Imaginé que todo estaría exactamente en su lugar, como si el tiempo no hubiera pasado. Pero esta casa parece diferente y yo también soy diferente. Quizás regresar no significa encontrar lo que dejamos, sino descubrir qué hacemos con lo que queda.',
    60:'¿Sabes qué es lo más extraño? Durante años creí que necesitaba tener todas las respuestas. Pensaba que una persona segura nunca dudaba. Ahora entiendo que también hace falta valor para decir no sé, para respirar y seguir adelante.\n\nHoy estoy frente a una decisión. Puedo elegir el camino conocido o puedo abrir esa puerta y descubrir qué hay detrás. No prometo que será fácil. Solo prometo que esta vez voy a hacerlo con honestidad.',
    120:'No cierres la puerta todavía. Necesito decirte algo antes de que te vayas. Tal vez llegué tarde, tal vez debí hablar mucho antes, pero durante demasiado tiempo confundí el silencio con tranquilidad. Pensaba que si nadie decía nada, todo estaría bien. No era cierto.\n\nCada día fui guardando una pequeña parte de lo que sentía, hasta que ya no quedó espacio. Y ahora estoy aquí, intentando explicar algo que ni siquiera yo sabía cómo nombrar. No quiero que me perdones por obligación. Tampoco quiero que olvides lo ocurrido. Solo quiero que escuches hasta el final.\n\nDespués podrás decidir. Quizás tomes otro camino, quizás cierres esa puerta. Pero al menos sabrás que esta vez tuve el valor de decir la verdad.',
    180:'Cuando llegué, la plaza estaba vacía. Pensé que había perdido mi oportunidad, pero entonces escuché tus pasos detrás de mí. No sabía si quería que aparecieras o si había venido precisamente para despedirme.\n\nDurante mucho tiempo imaginé esta conversación. En mis pensamientos todo era sencillo: yo hablaba, tú escuchabas y finalmente ambos comprendíamos lo ocurrido. La realidad nunca funciona de esa manera. Hay palabras que llegan tarde, silencios que pesan demasiado y recuerdos que cambian según quién los cuenta.\n\nPero hoy no quiero discutir sobre el pasado. Quiero hablar del momento que tenemos delante. Todavía podemos elegir. Tal vez no podamos cambiar lo que sucedió, pero sí podemos decidir qué hacemos a partir de ahora.\n\nMírame y dime que no tienes miedo. No necesito que seas valiente por mí. Necesito saber si estás dispuesto a dar un paso conmigo, aunque ninguno de los dos conozca todavía el camino.',
    300:'La habitación estaba en silencio cuando entré. Sobre la mesa había una carta que llevaba varios días esperando ser abierta. La miré durante un largo rato. Podía imaginar lo que decía, pero imaginar no era lo mismo que saberlo. Finalmente extendí la mano y tomé el sobre.\n\nDurante años pensé que algunas decisiones podían evitarse simplemente esperando. Si uno espera lo suficiente, creía, el problema desaparece o alguien encuentra una solución. Pero el tiempo no siempre resuelve las cosas. A veces solamente las hace más grandes.\n\nPor eso estoy aquí. No para cambiar lo que pasó, porque eso ya no es posible. Estoy aquí para decidir qué voy a hacer con lo que aprendí. Quizás sea tarde para algunas cosas, pero no para todas.\n\nEscucho pasos en el pasillo. Alguien se acerca. Podría guardar la carta otra vez y fingir que no la encontré. Sería sencillo. Nadie tendría que escucharme explicar nada. Pero también sé que volvería a pensar en este momento cada noche.\n\nAsí que abro el sobre. Leo la primera línea y siento que todo se detiene. Hay una verdad que no esperaba, una verdad que cambia la historia que me había contado durante años. Respiro y continúo leyendo.\n\nCuando termino, ya no siento la misma incertidumbre. Todavía hay preguntas, muchas preguntas, pero ahora puedo enfrentarlas. Salgo de la habitación y abro la puerta. Afuera está la persona que esperaba.\n\nNo sé qué ocurrirá después. Tal vez discutiremos, tal vez nos entenderemos, tal vez cada uno seguirá su propio camino. Pero esta vez no voy a esconderme detrás del silencio. Voy a hablar, escuchar y aceptar las consecuencias. Porque algunas historias no terminan cuando descubrimos la verdad; comienzan justamente en ese momento.'
  };
  if(sec<=10)return passages[10]; if(sec<=20)return passages[20]; if(sec<=30)return passages[30]; if(sec<=40)return passages[40]; if(sec<=60)return passages[60]; if(sec<=120)return passages[120]; if(sec<=180)return passages[180]; return passages[300];
}
function guideSourceFor(type){
  if(type==='reading')return 'José Hernández · Martín Fierro';
  if(type==='acting')return 'Pedro Calderón de la Barca · La vida es sueño';
  if(type==='sing')return 'José Hernández · Martín Fierro';
  return '';
}
function guideTextFor(type,sec){
  if(['reading','sing','acting'].includes(type))return getConfiguredText(type,sec);
  return '';
}
function clearGuideTimers(){if(guideTextTimer){clearInterval(guideTextTimer);guideTextTimer=null}if(guideTextLineTimer){clearInterval(guideTextLineTimer);guideTextLineTimer=null}guideTextCurrent=0;guideTextPlaybackActive=false}
function renderGuideText(type,sec){
  if(!evalRunning||textSource==='none'||!['reading','sing','acting'].includes(type)){hideGuideText();return}
  const content=guideTextFor(type,sec).trim();
  if(!content){hideGuideText();return}
  const live=document.getElementById('liveTextGuidePanel');
  if(!live)return;
  guideTextType=type;
  guideTextForCurrent=content;
  guideTextWords=[];
  live.className='textGuidePanel liveTextGuide '+type;
  live.style.setProperty('display','block','important');
  const text=live.querySelector('#liveTextGuideText');
  if(!text)return;
  text.innerHTML='';
  const chunks=splitGuideIntoChunks(content);
  chunks.forEach((chunk,idx)=>{
    const span=document.createElement('span');
    span.className='guideChunk'+(idx===0?' active':'');
    span.dataset.index=String(idx);
    span.textContent=chunk;
    span.style.display=idx===0?'block':'none';
    span.style.opacity=idx===0?'1':'0';
    span.style.visibility=idx===0?'visible':'hidden';
    text.appendChild(span);
  });
}

function hideGuideText(){clearGuideTimers();const p=document.getElementById('textGuidePanel');if(p){p.style.setProperty('display','none','important');p.classList.remove('liveTextGuide')}const live=document.getElementById('liveTextGuidePanel');if(live){live.classList.remove('liveTextGuide');live.style.setProperty('display','none','important')}guideTextWords=[];guideTextType='';}
function highlightReadingFromTranscript(){
  // El avance visual de los subtítulos es temporal y no depende de la transcripción.
}
function splitGuideIntoChunks(content){
  // Primero respetamos oraciones completas. Si una oración es demasiado larga,
  // solo entonces la dividimos por pausas naturales; nunca mostramos el texto entero.
  const raw=String(content||'').replace(/\r/g,' ').replace(/\n+/g,' ').replace(/\s+/g,' ').trim();
  if(!raw)return [];
  const sentences=raw.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[raw];
  const chunks=[];
  sentences.forEach(sentence=>{
    const clean=sentence.trim();
    if(!clean)return;
    const words=clean.split(/\s+/).filter(Boolean);
    // Una oración normal queda completa. Para oraciones excepcionalmente largas,
    // usamos pausas/comas antes de recurrir a bloques de seguridad.
    if(words.length<=24){chunks.push(clean);return;}
    let current=[];
    words.forEach(word=>{
      current.push(word);
      const pause=/[,;:]$/.test(word);
      if((pause&&current.length>=5)||current.length>=14){
        chunks.push(current.join(' '));
        current=[];
      }
    });
    if(current.length)chunks.push(current.join(' '));
  });
  return chunks.filter(Boolean);
}

function scheduleGuideSubtitlePlayback(){
  if(!evalRunning||guideTextType===''||textSource==='none')return;
  clearGuideTimers();
  const els=[...document.querySelectorAll('#liveTextGuideText .guideChunk')];
  if(!els.length)return;
  guideTextPlaybackActive=true;
  const wpm=GUIDE_WPM;
  const rawDelays=els.map(el=>{
    const words=el.textContent.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1200,(words/wpm)*60000);
  });
  const naturalTotal=rawDelays.reduce((a,b)=>a+b,0);
  let delays=rawDelays.slice();
  if(duration>0 && naturalTotal>duration*1000){
    const scale=(duration*1000)/naturalTotal;
    delays=delays.map(d=>Math.max(650,d*scale));
  }
  const mark=()=>{
    els.forEach((el,idx)=>{
      const active=idx===guideTextCurrent;
      el.classList.toggle('active',active);
      el.style.display=active?'block':'none';
      el.style.opacity=active?'1':'0';
      el.style.visibility=active?'visible':'hidden';
    });
    if(guideTextCurrent<els.length){
      const delay=delays[guideTextCurrent]||1600;
      guideTextCurrent++;
      guideTextTimer=setTimeout(mark,delay);
    }else{
      const last=els[els.length-1];
      if(last){last.classList.add('active');last.style.display='block';last.style.opacity='1';last.style.visibility='visible';}
      guideTextPlaybackActive=false;
      guideTextTimer=null;
    }
  };
  guideTextCurrent=0;
  mark();
}
function startGuidePlayback(){
  clearGuideTimers();
  if(!evalRunning||textSource==='none'||!['reading','sing','acting'].includes(guideTextType))return;
  scheduleGuideSubtitlePlayback();
}
function getConfiguredText(type,sec){
  // El texto personalizado tiene prioridad en las tres habilidades
  // que admiten texto: Lectura, Canto y Actuación.
  if(textSource==='custom'&&customEvaluationText.trim())return customEvaluationText.trim();
  if(type==='reading')return getReadingPassageForDuration(sec);
  if(type==='sing')return getSingTextForDuration(sec);
  if(type==='acting')return getActingTextForDuration(sec);
  return '';
}
function setReadingPassageForDuration(sec){
  const el=document.getElementById('readingText');
  const passage=getConfiguredText('reading',sec);
  if(el)el.textContent=passage;
  if(guideTextType==='reading')renderGuideText('reading',sec);
}
function readingCompute(voice){
  const expected=normalizeReadingText(document.getElementById('readingText')?.textContent||'');
  const spoken=normalizeReadingText(readingFinalText||readingTranscript);
  const elapsed=Math.max(1,currentElapsed(),duration>0?duration:0);
  const words=spoken?spoken.split(' ').filter(Boolean).length:0;
  const targetWpm=145;
  const wpm=words/elapsed*60;
  let accuracy=.5;
  if(readingRecognitionSupported&&expected&&spoken){
    const a=expected.split(' '),b=spoken.split(' ');
    // Compare the portion the user had enough time to read, rather than
    // penalizing unfinished text simply because the selected duration was short.
    const expectedWindow=Math.max(1,Math.min(a.length,Math.round((elapsed/60)*targetWpm*1.15)));
    const target=a.slice(0,expectedWindow);
    const dp=Array.from({length:target.length+1},()=>new Array(b.length+1).fill(0));
    for(let i=1;i<=target.length;i++)dp[i][0]=i;
    for(let j=1;j<=b.length;j++)dp[0][j]=j;
    for(let i=1;i<=target.length;i++)for(let j=1;j<=b.length;j++)dp[i][j]=target[i-1]===b[j-1]?dp[i-1][j-1]:Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+1);
    accuracy=Math.max(0,1-dp[target.length][b.length]/Math.max(target.length,b.length));
  }else if(words>0){
    accuracy=.62;
  }
  const speedError=Math.abs(wpm-targetWpm)/targetWpm;
  const fluencySpeed=words?Math.max(0,1-Math.min(1,speedError/.72)):.05;
  const expectedPauseRate=elapsed<15?.8:elapsed<40?1.5:2.5;
  const pauseRate=readingPauseCount/Math.max(.25,elapsed/60);
  const pauseQuality=words?Math.max(0,1-Math.min(1,Math.abs(pauseRate-expectedPauseRate)/Math.max(2.5,expectedPauseRate*1.8))):.05;
  const voiceQuality=voice?voice.score:.05;
  const spokenCoverage=expected?Math.min(1,words/Math.max(1,Math.min(expected.split(' ').length,Math.round((elapsed/60)*targetWpm)))):0;
  const dataConfidence=clamp01(.55*spokenCoverage+.45*Math.min(1,elapsed/30));
  const score=clamp01(.34*accuracy+.24*fluencySpeed+.14*pauseQuality+.18*voiceQuality+.10*dataConfidence);
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=Math.round(clamp01(v)*100)};
  set('mReadAccuracy',accuracy);set('mReadFluency',fluencySpeed);set('mReadPauses',pauseQuality);set('mReadVoice',voiceQuality);
  const st=document.getElementById('readingStatus');
  if(st)st.textContent=readingRecognitionSupported?`Lectura detectada · ${words} palabras · ${Math.round(wpm)} palabras/min · ${Math.round(dataConfidence*100)}% de datos útiles.`:'Lectura en modo vocal · el navegador no permitió comparar el texto.';
  return{accuracy,fluency:fluencySpeed,pauses:pauseQuality,voice:voiceQuality,coverage:spokenCoverage,confidence:dataConfidence,score};
}

function durationReliability(elapsed,sampleCount){
  const expected=Math.max(1,Math.round(elapsed*7));
  return clamp01(sampleCount/expected);
}
function weightedBodyScore(r,profile){
  const w=profile?.weights||{activity:.2,coordination:.2,fluidity:.2,stability:.2,variety:.2};
  return clamp01(r.activity*w.activity+r.coordination*w.coordination+r.fluidity*w.fluidity+r.stability*w.stability+r.variety*w.variety);
}
function compute(){
  const soloVoice=(category==='sing'||category==='reading')&&(evaluationMode==='voice'||evaluationMode==='karaoke');
  const elapsed=Math.max(.5,currentElapsed());
  if(soloVoice){
    const voice=(micEnabled?voiceCompute():null);
    const reading=category==='reading'&&micEnabled?readingCompute(voice):null;
    if(category==='sing'){
      const q=voice?.score??0;
      const confidence=clamp01((voice?.activeRatio??0)*.7+Math.min(1,elapsed/12)*.3);
      return{score:q*100,activity:0,coordination:0,fluidity:0,stability:0,variety:0,voice:q*100,duration:elapsed,sampleCount:voiceSamples.length,confidence,soloVoice:true};
    }
    const q=reading?.score??0;
    return{score:q*100,activity:0,coordination:0,fluidity:0,stability:0,variety:0,voice:voice?voice.score*100:null,reading:q*100,duration:elapsed,sampleCount:voiceSamples.length,confidence:reading?.confidence??0,soloVoice:true};
  }
  if(!samples.length)return null;
  const n=samples.length;
  const vals=(key)=>samples.map(s=>Number.isFinite(s[key])?s[key]:0);
  const mean=(key)=>{const a=vals(key);return a.reduce((x,y)=>x+y,0)/Math.max(1,a.length)};
  const std=(key)=>{const a=vals(key),m=a.reduce((x,y)=>x+y,0)/Math.max(1,a.length);return Math.sqrt(a.reduce((x,y)=>x+(y-m)*(y-m),0)/Math.max(1,a.length))};
  const activityRaw=clamp01(mean('energy'));
  const activeRaw=clamp01(mean('active')/13);
  const bilateralRaw=clamp01(mean('bilateral'));
  const continuityRaw=clamp01(mean('continuity'));
  const centerMotion=mean('centerMotion');
  const amplitudeRaw=clamp01(mean('amplitude'));
  const energyVariation=clamp01(std('energy')*4.0);
  const changeRate=clamp01(directionChanges/Math.max(3,elapsed*.85));
  const activity=clamp01(.58*scoreCurve(activityRaw,.22,2.0)+.27*activeRaw+.15*energyVariation);
  const coordination=clamp01(.42*activeRaw+.38*bilateralRaw+.20*continuityRaw);
  const smooth=clamp01(1-Math.min(1,std('continuity')*2.4));
  const fluidity=clamp01(.52*continuityRaw+.28*smooth+.20*activeRaw);
  const controlledMotion=clamp01(1-Math.min(1,Math.abs(centerMotion-.22)/.75));
  const stability=clamp01(.52*controlledMotion+.28*bilateralRaw+.20*continuityRaw);
  const ampVar=clamp01(std('amplitude')*4.5);
  const variety=clamp01(.48*changeRate+.30*ampVar+.22*energyVariation);
  const body={activity,coordination,fluidity,stability,variety};
  const bodyRaw=weightedBodyScore(body,profiles[category]);
  const voice=(category==='sing'||category==='reading')&&micEnabled?voiceCompute():null;
  const reading=category==='reading'&&micEnabled?readingCompute(voice):null;
  let raw=bodyRaw;
  if(category==='sing'&&voice)raw=clamp01(bodyRaw*.55+voice.score*.45);
  else if(category==='reading'&&reading)raw=clamp01(bodyRaw*.55+reading.score*.45);
  // Duration changes reliability, not the maximum. A 10-second test can still
  // earn 100, while longer tests provide more evidence and consistency.
  const reliability=durationReliability(elapsed,n);
  const contrast=1.75;
  const centered=clamp01(.5+(raw-.5)*contrast);
  const score=clamp01(.70*centered+.30*(.5+(centered-.5)*Math.min(1.25,1+reliability*.25)))*100;
  return{score,activity:activity*100,coordination:coordination*100,fluidity:fluidity*100,stability:stability*100,variety:variety*100,voice:voice?voice.score*100:null,reading:reading?reading.score*100:null,duration:elapsed,sampleCount:n,confidence:clamp01(.65*reliability+.35*Math.min(1,elapsed/20))};
}

function setMetric(name,v){const m=document.getElementById('m'+name),f=document.getElementById('f'+name);if(m)m.textContent=Math.round(v);if(f)f.style.width=Math.max(0,Math.min(100,v))+'%'}
function setVoiceMetric(name,v){const e=document.getElementById('m'+name);if(e)e.textContent=Math.round(v)}
function updateScore(){const r=compute();if(!r)return;const scoreEl=document.getElementById('score');if(scoreEl)scoreEl.textContent=Math.round(r.score);setMetric('Activity',r.activity);setMetric('Coordination',r.coordination);setMetric('Fluidity',r.fluidity);setMetric('Stability',r.stability);setMetric('Variety',r.variety);setTopScore(r.score);if(evalRunning)document.getElementById('topTimer').textContent=duration>0?formatTime(Math.max(0,duration-currentElapsed())):formatTime(currentElapsed());document.getElementById('topTimer').style.display='inline'}
function resetReading(){readingTranscript='';readingFinalText='';readingStartedAt=0;readingLastSpeechAt=0;readingPauseCount=0;try{readingRecognition?.stop()}catch(e){}readingRecognition=null;const st=document.getElementById('readingStatus');if(st)st.textContent='Para esta habilidad se necesita el micrófono. Si el navegador lo permite, Xpresia comparará tu lectura con el texto.';['ReadAccuracy','ReadFluency','ReadPauses','ReadVoice'].forEach(x=>{const e=document.getElementById('m'+x);if(e)e.textContent='--'})}
function resetScore(){finalEvaluationResult=null;resetReading();if(!evalRunning)hideGuideText();if(resultImageUrl){URL.revokeObjectURL(resultImageUrl);resultImageUrl=null}resultImageBlob=null;document.getElementById('sharePanel').style.display='none';samples=[];prev={};prevDir={};directionChanges=0;lastEnergy=0;voiceSamples=[];voicePitchHistory=[];voiceRmsHistory=[];voiceActivitySamples=[];voiceOnsetTimes=[];lastVoiceActive=false;lastVoiceSampleAt=0;lastVoiceAnalysisAt=0;voiceScoreCache=null;karaokeStartAt=0;['Pitch','PitchStability','Dynamics','VoicePresence'].forEach(x=>setVoiceMetric(x,0));const scoreEl=document.getElementById('score');if(scoreEl)scoreEl.textContent='--';['Activity','Coordination','Fluidity','Stability','Variety'].forEach(x=>setMetric(x,0));document.getElementById('topScore').style.display='none';document.getElementById('topTimer').style.display='none'}
function currentElapsed(){if(!evalRunning)return elapsedBeforePause;return elapsedBeforePause+(performance.now()-startTime)/1000}
function startEvaluationTimer(){if(evalTimerId)clearInterval(evalTimerId);if(evalFinishGuardId)clearTimeout(evalFinishGuardId);if(duration<=0)return;const tick=()=>{if(!evalRunning||evalPaused)return;const elapsed=currentElapsed();document.getElementById('topTimer').textContent=formatTime(Math.max(0,duration-elapsed));if(elapsed>=duration){if(evalTimerId){clearInterval(evalTimerId);evalTimerId=null}finishEvaluation(true)}};evalTimerId=setInterval(tick,200);evalFinishGuardId=setTimeout(()=>{if(evalRunning&&!evalPaused&&currentElapsed()>=duration)finishEvaluation(true)},Math.max(500,duration*1000+500))}
async function countdownStart(){if(countdown||evalRunning)return;if(!userName){setTop('Primero completa tus datos de inicio.');return}
  if((category==='sing'||category==='reading'||category==='acting')&&textSource==='custom'&&!customEvaluationText.trim()){const area=document.getElementById('customText');if(area)area.focus();setTop('Escribe o pega un texto para continuar.');return}
  prepareMusicForUserGesture();
  const soloVoice=(category==='sing'||category==='reading')&&(evaluationMode==='voice'||evaluationMode==='karaoke');
  if(!soloVoice){await initCamera();if(!cameraReady){setTop('Necesitamos acceso a la cámara para evaluar');return}}
  activation.style.display='none';
  // El micrófono es parte estructural de Xpresia: todas las evaluaciones lo usan.
  // La solicitud ocurre aquí, tras una acción del usuario, para respetar las políticas del navegador.
  const micOk=await setMicrophoneEnabled(true);
  if(!micOk){setTop('No se pudo activar el micrófono. Concede el permiso del navegador para continuar.');return}
  if(!soloVoice){loadPose();setTop('Preparando el detector corporal…');const poseOk=await waitForPoseReady(8000);if(!poseOk){setTop('No se pudo preparar el detector corporal. Revisa tu conexión e inténtalo nuevamente.');return}}
  countdown=true;if(evaluationMode==='karaoke'&&karaokeVideoId)stopKaraokePreview();closePanels();const box=document.getElementById('countdown'),title=document.getElementById('countdownTitle'),text=document.getElementById('countdownText');box.style.display='flex';title.textContent=evaluationMode==='karaoke'?'Prepárate para cantar con el karaoke.':(soloVoice?'Prepárate para usar tu voz.':'Prepárate, ahora evaluaremos tu desempeño.');text.textContent='';await new Promise(r=>setTimeout(r,1800));title.textContent='Evaluando en';for(const n of [3,2,1]){text.textContent=n;await new Promise(r=>setTimeout(r,700))}title.textContent='¡Comenzamos!';text.textContent='';await new Promise(r=>setTimeout(r,450));box.style.display='none';countdown=false;startEvaluation()}
async function startEvaluation(){const soloVoice=(category==='sing'||category==='reading')&&(evaluationMode==='voice'||evaluationMode==='karaoke');if(!soloVoice&&!poseReady){setTop('El detector corporal todavía no está listo.');return}resetScore();duration=+document.getElementById('duration').value;evalRunning=true;karaokeStartAt=evaluationMode==='karaoke'?performance.now():0;if(evaluationMode==='karaoke'&&karaokeVideoId){startKaraokePlayback()}if(category==='reading'&&textSource!=='none')setReadingPassageForDuration(duration>0?duration:30);if((category==='sing'||category==='acting'||category==='reading')&&textSource!=='none'&&evaluationMode!=='karaoke')renderGuideText(category,duration>0?duration:60);if(!soloVoice)startVideoRecording();const liveGuide=document.getElementById('liveTextGuidePanel');if(liveGuide){liveGuide.classList.add('liveTextGuide');liveGuide.style.display=(category==='sing'||category==='acting'||category==='reading')&&textSource!=='none'&&evaluationMode!=='karaoke'?'block':'none'}updateEvaluationModeUI();startGuidePlayback();if(soloVoice){if(voiceSamplingId)clearInterval(voiceSamplingId);voiceSamplingId=setInterval(()=>{if(evalRunning&&!evalPaused)sampleVoice()},100)}if(category==='reading'&&micEnabled)startReadingRecognition();if(selectedMusic.url&&evaluationMode!=='karaoke'){startBackgroundMusic();startRecordingMusic()}evalPaused=false;startTime=performance.now();elapsedBeforePause=0;setTop('Evaluando: '+profiles[category].name+(category==='imitation'?' · '+(document.getElementById('imitationType')?.selectedOptions?.[0]?.textContent||'Desafío') :''));document.getElementById('start').textContent='Evaluación en curso';document.getElementById('start').disabled=true;document.getElementById('pause').style.display='block';document.getElementById('finish').style.display='block';document.getElementById('topEvalControls').style.display='flex';document.getElementById('pauseTopBtn').textContent='⏸';document.getElementById('topTimer').style.display='inline';document.getElementById('topTimer').textContent=duration>0?formatTime(duration):'00:00';updateLiveMusicControls();startEvaluationTimer();if(poseReady===false)loadPose()}
function stopKaraokePlayback(clearFrame=true){
  try{pauseKaraoke()}catch(e){}
  if(clearFrame)stopKaraokePreview();
}
function pauseEvaluation(){if(!evalRunning)return;if(!evalPaused){elapsedBeforePause=currentElapsed();evalPaused=true;if(mediaRecorder&&mediaRecorder.state==='recording'&&mediaRecorder.pause)mediaRecorder.pause();if(selectedMusic.url&&evaluationMode!=='karaoke'){musicPlayer.pause();recordMusicPlayer.pause();if(recordMusicGain)recordMusicGain.gain.value=0}if(evaluationMode==='karaoke')pauseKaraoke();setTop('Evaluación pausada')}else{startTime=performance.now();evalPaused=false;if(duration>0){if(evalFinishGuardId)clearTimeout(evalFinishGuardId);evalFinishGuardId=setTimeout(()=>{if(evalRunning&&!evalPaused&&currentElapsed()>=duration)finishEvaluation(true)},Math.max(250,duration*1000-currentElapsed()*1000+500))}if(mediaRecorder&&mediaRecorder.state==='paused'&&mediaRecorder.resume)mediaRecorder.resume();if(selectedMusic.url&&evaluationMode!=='karaoke'){startBackgroundMusic();if(recordMusicGain)recordMusicGain.gain.value=volumeLevel;const p=recordMusicPlayer.play();if(p)p.catch(()=>{})}if(evaluationMode==='karaoke')playKaraoke();setTop('Evaluando: '+profiles[category].name)}document.getElementById('pause').textContent=evalPaused?'Continuar evaluación':'Pausar evaluación';document.getElementById('pauseTopBtn').textContent=evalPaused?'▶':'⏸';updateLiveMusicControls();}
function resetAppAfterEvaluation(){
  // Limpieza total de una evaluación terminada: evita que cámara, habilidad o texto
  // de la sesión anterior queden activos al comenzar la siguiente.
  stopCamera();
  stopReadingRecognition();
  hideGuideText();
  evalRunning=false; evalPaused=false; countdown=false; evaluationMode='camera'; karaokeVideoId=''; karaokeReady=false; const kf=document.getElementById('karaokeFrame'); if(kf)kf.src=''; const ku=document.getElementById('karaokeUrl'); if(ku)ku.value=''; karaokeSelectedItem=null; const ks=document.getElementById('karaokeSelected'); if(ks)ks.style.display='none';
  category='dance'; categoryChosen=false; textSource='sample'; customEvaluationText=''; imitationType='airguitar';
  selectedMusic={id:'none',name:'Sin música de fondo',url:'',objectUrl:false};
  pendingMusic={...selectedMusic};
  const name=document.getElementById('userName'); if(name)name.value='';
  const cat=document.getElementById('category'); if(cat)cat.value='dance';
  const dur=document.getElementById('duration'); if(dur)dur.value='60';
  const textSel=document.getElementById('textSourceSelect'); if(textSel)textSel.value='sample';
  const custom=document.getElementById('customText'); if(custom)custom.value='';
  const count=document.getElementById('customTextCount'); if(count)count.textContent='0 / 3000';
  const modeChooser=document.getElementById('evalModeChooser'); if(modeChooser)modeChooser.classList.remove('visible');
  // No usamos resetScore() aquí porque ese método libera la imagen de resultado que
  // puede seguir visible mientras el usuario la comparte/guarda. Limpiamos solo el
  // estado de la próxima evaluación y conservamos el resultado actual.
  resetReading();
  samples=[]; prev={}; prevDir={}; directionChanges=0; lastEnergy=0;
  voiceSamples=[]; voicePitchHistory=[]; voiceRmsHistory=[]; voiceActivitySamples=[]; voiceOnsetTimes=[]; lastVoiceActive=false; lastVoiceSampleAt=0; lastVoiceAnalysisAt=0; voiceScoreCache=null; karaokeStartAt=0;
  ['Pitch','PitchStability','Dynamics','VoicePresence'].forEach(x=>setVoiceMetric(x,0));
  const scoreEl=document.getElementById('score');if(scoreEl)scoreEl.textContent='--';
  ['Activity','Coordination','Fluidity','Stability','Variety'].forEach(x=>setMetric(x,0));
  document.getElementById('topScore').style.display='none';
  document.getElementById('topTimer').style.display='none';
  updateDescription(); updateTextConfigUI(); updateEvaluationModeUI();
  closePanels();
  setTop('Bienvenidos a Xpresia');
}

async function finishEvaluation(auto=false){
  if(!evalRunning||evalFinishing)return;
  if(!auto){openStopConfirm();return}
  evalFinishing=true;
  hideGuideText();
  // Cierre del estado de evaluación ANTES de cualquier cálculo. Esto evita que
  // un error de una habilidad, del micrófono o del render impida finalizar.
  evalRunning=false;
  if(evaluationMode==='karaoke')stopKaraokePlayback(true);
  clearGuideTimers();
  evalPaused=false;
  if(evalTimerId){clearInterval(evalTimerId);evalTimerId=null}
  if(evalFinishGuardId){clearTimeout(evalFinishGuardId);evalFinishGuardId=null}
  document.getElementById('topTimer').textContent=duration>0?'00:00':formatTime(elapsedBeforePause);
  document.getElementById('start').disabled=false;
  document.getElementById('start').textContent='Comenzar evaluación';
  document.getElementById('pause').style.display='none';
  document.getElementById('finish').style.display='none';
  document.getElementById('topEvalControls').style.display='none';
  updateLiveMusicControls();

  let r=null;
  try{r=compute()}catch(e){console.error('Error calculando evaluación:',e)}
  // Si una habilidad no produjo suficientes muestras, generar igualmente un
  // resultado válido a partir de las métricas disponibles, en lugar de dejar
  // la evaluación "activa" indefinidamente.
  if(!r){
    const elapsed=Math.max(1,duration>0?duration:(samples.length?((samples[samples.length-1].t-samples[0].t)/1000):0));
    if(samples.length){
      const n=samples.length;
      const a=samples.reduce((x,s)=>x+(s.energy||0),0)/n;
      const b=samples.reduce((x,s)=>x+(s.bilateral||0),0)/n;
      const c=samples.reduce((x,s)=>x+(s.continuity||0),0)/n;
      const raw=Math.max(0,Math.min(1,.45*a+.30*b+.25*c));
      r={score:(.5+(raw-.5)*1.5)*100,activity:a*100,coordination:b*100,fluidity:c*100,stability:b*100,variety:a*100,voice:null,duration:elapsed,sampleCount:n,confidence:Math.min(1,n/80)};
      setTop('Evaluación completada. Resultado calculado con los datos corporales disponibles.');
    }else{
      r={score:0,activity:0,coordination:0,fluidity:0,stability:0,variety:0,voice:null,duration:elapsed,sampleCount:0,confidence:0};
      setTop('Evaluación completada, pero no se recibieron datos corporales.');
    }
  }
  finalEvaluationResult={...r};
  stopBackgroundMusic();
  try{await showFinal(r,auto)}catch(e){console.error('Error mostrando resultado:',e);setTop('Evaluación completada.');}
  try{if(mediaRecorder&&mediaRecorder.state!=='inactive')await stopVideoRecording()}catch(e){console.warn('Error al cerrar la grabación:',e)}
  try{if(micStream||micEnabled)await setMicrophoneEnabled(false)}catch(e){console.warn('Error al cerrar el micrófono:',e)}
  // La evaluación queda cerrada y los recursos de cámara liberados. La pantalla de
  // resultado puede seguir visible, pero la próxima evaluación parte de una configuración limpia.
  resetAppAfterEvaluation();
  evalFinishing=false;
}
function openStopConfirm(){document.getElementById('stopConfirm').style.display='flex'}
function closeStopConfirm(){document.getElementById('stopConfirm').style.display='none'}
async function abortEvaluation(){closeStopConfirm();hideGuideText();if(evaluationMode==='karaoke')stopKaraokePlayback(true);stopBackgroundMusic();stopReadingRecognition();if(evalTimerId){clearInterval(evalTimerId);evalTimerId=null}evalRunning=false;evalPaused=false;stopReadingRecognition();const mr=mediaRecorder;if(mr&&mr.state!=='inactive'){try{mr.ondataavailable=null;mr.onstop=null;mr.stop()}catch(e){}}mediaRecorder=null;recordedChunks=[];recordedBlob=null;if(recordedUrl){URL.revokeObjectURL(recordedUrl);recordedUrl=null}document.getElementById('start').disabled=false;document.getElementById('start').textContent='Comenzar evaluación';document.getElementById('pause').style.display='none';document.getElementById('finish').style.display='none';document.getElementById('topEvalControls').style.display='none';updateLiveMusicControls();resetScore();setTop('Evaluación detenida. No se generó resultado final.')}
async function showFinal(r,auto=false){
  // Mostrar el resultado primero: ninguna operación de imagen, video o almacenamiento puede retrasarlo.
  document.getElementById('finalScore').textContent='0';
  document.getElementById('finalName').textContent=userName||'';
  document.getElementById('finalMessage').textContent=personalizedMessage(r.score)+' '+getFinalMessage(r.score);
  document.getElementById('topTimer').textContent=formatTime(duration>0?0:r.duration);
  document.getElementById('sharePanel').style.display='none';
  document.getElementById('final').style.display='flex';
  celebrate();
  animateScore(Math.round(r.score));
  // Procesos secundarios después de entregar el resultado.
  setTimeout(async()=>{
    try{await prepareResultImage(r);}catch(e){console.error('Error preparando la imagen de resultado:',e);}
    try{prepareRecordedVideo();}catch(e){console.warn('No se pudo preparar el video:',e);}
    saveEvaluationToHistory(r).then(saved=>{if(!saved)setTop('Resultado listo. El almacenamiento automático no estuvo disponible en este navegador.');}).catch(e=>console.warn('Guardado automático fallido:',e));
  },0);
}
function updateLiveMusicControls(){const box=document.getElementById('liveMusicControls');if(box)box.style.display=evalRunning&&selectedMusic.url&&evaluationMode!=='karaoke'?'flex':'none';const b=document.getElementById('liveMusicPause');if(b)b.textContent=musicPlayer.paused?'▶ Música':'⏸ Música';}
function toggleLiveMusic(){if(!evalRunning||!selectedMusic.url)return;if(musicPlayer.paused){startBackgroundMusic()}else{musicPlayer.pause()}updateLiveMusicControls()}
document.getElementById('start').onclick=()=>countdownStart();document.getElementById('pause').onclick=pauseEvaluation;document.getElementById('finish').onclick=()=>finishEvaluation();
document.getElementById('finalShareChoice').onclick=()=>openResultPanel('share');
document.getElementById('shareImageBtn').onclick=()=>nativeShare('image');document.getElementById('viewVideoBtn').onclick=()=>openResultPanel('video');document.getElementById('saveVideoBtn').onclick=downloadRecordedVideo;
document.getElementById('nativeShare').onclick=nativeShare;document.getElementById('closeShare').onclick=closeSharePanel;document.getElementById('closeVideo').onclick=closeVideoPanel;document.getElementById('closeSharePopup').onclick=closeSharePopup;
document.querySelectorAll('[data-share]').forEach(b=>b.onclick=()=>platformShare(b.dataset.share));
document.getElementById('finalClose').onclick=()=>{closeResultPanels();document.getElementById('final').style.display='none';openPanel('mainMenu');};
function animateScore(target){const el=document.getElementById('finalScore');const start=performance.now();const dur=1100;function tick(now){const t=Math.min(1,(now-start)/dur);const eased=1-Math.pow(1-t,3);el.textContent=Math.round(target*eased);if(t<1)requestAnimationFrame(tick)}requestAnimationFrame(tick)}
function celebrate(){const box=document.getElementById('celebration');box.innerHTML='<div class="celebrationBurst">🎉</div>';box.style.display='block';const pieces=['#ff3b81','#00e5ff','#ffd166','#7cff6b','#b36bff','#ff8c42','#ffffff'];for(let i=0;i<72;i++){const c=document.createElement('div');c.className='confetti';const angle=Math.random()*Math.PI*2,distance=18+Math.random()*58;c.style.left='50vw';c.style.top='42vh';c.style.background=pieces[Math.floor(Math.random()*pieces.length)];c.style.width=(6+Math.random()*7)+'px';c.style.height=(9+Math.random()*12)+'px';c.style.setProperty('--dx',Math.cos(angle)*distance+'vw');c.style.setProperty('--dy',Math.sin(angle)*distance+'vh');c.style.animationDuration=(1.8+Math.random()*1.8)+'s';c.style.animationDelay=(Math.random()*.15)+'s';c.style.transform='rotate('+Math.random()*360+'deg)';box.appendChild(c)}setTimeout(()=>{box.style.display='none';box.innerHTML=''},3900)}
function skillTitle(cat){return profiles[cat]?.name||({dance:'Baile / Danza',sing:'Canto',reading:'Lectura',acting:'Actuación',aura:'Farmear Aura',imitation:'Imitación'}[cat]||'Xpresia')}
function openGuidedPanel(cat){
  category=cat; categoryChosen=true; evaluationMode='camera'; guidedStep=0;
  const panel=document.getElementById('guidedPanel'); if(!panel)return;
  const isVoice=cat==='sing'||cat==='reading';
  const isImitation=cat==='imitation';
  const steps=[];
  steps.push({n:1,icon:'⏱️',title:'Selecciona el tiempo de tu evaluación',value:durationLabel(),key:'duration'});
  steps.push({n:2,icon:'🎯',title:'Selecciona el modo de evaluación',value:modeLabel(),key:'mode'});
  if(!isVoice || cat==='sing') steps.push({n:3,icon:'🎵',title:'Selecciona la música',value:selectedMusic.name||'Sin música de fondo',key:'music'});
  if(cat==='reading') steps.push({n:3,icon:'📖',title:'Selecciona el texto de apoyo',value:textSource==='none'?'Sin texto':'Texto de ejemplo',key:'text'});
  if(isImitation) steps.push({n:3,icon:'🎭',title:'Elige tu desafío',value:document.getElementById('imitationType')?.selectedOptions?.[0]?.textContent||'Guitarra invisible',key:'imitation'});
  panel.innerHTML='<button class="returnMainButton" id="guidedBack"><span>↩</span> VOLVER AL MENÚ PRINCIPAL</button><h2>🎯 '+skillTitle(cat)+'</h2><p class="guidedIntro">Para evaluar tu habilidad primero debes elegir algunas opciones.</p><div class="guidedSteps">'+steps.map(st=>'<button class="guidedStep" type="button" data-step-key="'+st.key+'"><span class="stepNum">'+st.n+'</span><span class="stepText"><strong>'+st.icon+' PASO '+st.n+' · '+st.title+'</strong><small id="guidedValue-'+st.key+'">'+st.value+'</small></span></button>').join('')+'</div><button class="primary guidedStart" id="guidedStart" disabled>▶ COMENZAR EVALUACIÓN</button>';
  panel.querySelector('#guidedBack').onclick=returnToMain;
  panel.querySelectorAll('.guidedStep').forEach(b=>b.onclick=()=>guidedStepAction(b.dataset.stepKey));
  panel.querySelector('#guidedStart').onclick=()=>openEvaluationForGuided();
  updateGuidedPanel(); openPanel('guidedPanel');
}
function durationLabel(){return duration===0?'Libre':duration<60?duration+' segundos':(duration/60)+' minuto'+(duration===60?'':'s')}
function modeLabel(){return evaluationMode==='voice'?'Solo voz':evaluationMode==='karaoke'?'Karaoke':'Cámara'}
function guidedStepAction(key){
  if(key==='duration')openDurationPanel();
  else if(key==='mode')openModePanel();
  else if(key==='music')openMusicPanel();
  else if(key==='text'){openPanel('evaluationPanel'); updateEvaluationPanelContext(); document.getElementById('textSourceSelect')?.focus();}
  else if(key==='imitation'){openPanel('evaluationPanel'); updateEvaluationPanelContext(); document.getElementById('imitationType')?.focus();}
}
function openDurationPanel(){const box=document.getElementById('durationChoices'); if(!box)return; const opts=[[10,'10 segundos'],[20,'20 segundos'],[30,'30 segundos'],[40,'40 segundos'],[60,'1 minuto'],[120,'2 minutos'],[180,'3 minutos'],[300,'5 minutos'],[0,'Libre']]; box.innerHTML=opts.map(([v,t])=>'<button class="choiceButton" data-v="'+v+'">⏱️ '+t+'</button>').join(''); box.querySelectorAll('button').forEach(b=>b.onclick=()=>{duration=+b.dataset.v;document.getElementById('duration').value=String(duration);updateGuidedPanel();openPanel('guidedPanel')}); document.getElementById('durationBack').onclick=()=>openPanel('guidedPanel');openPanel('durationPanel')}
function openModePanel(){const box=document.getElementById('modeChoices');if(!box)return;let opts=[];if(category==='sing')opts=[['camera','📷 Cámara','Evalúa voz + expresión corporal.'],['voice','🎙️ Solo voz','Evalúa principalmente tu voz.'],['karaoke','🎵 Karaoke','Canta siguiendo el video.']];else if(category==='reading')opts=[['voice','🎙️ Solo voz','Lee y trabaja voz, fluidez y expresión.']];else opts=[['camera','📷 Cámara','Evalúa movimiento y expresividad.']];box.innerHTML=opts.map(o=>'<button class="choiceButton" data-v="'+o[0]+'">'+o[1]+'<small>'+o[2]+'</small></button>').join('');box.querySelectorAll('button').forEach(b=>b.onclick=()=>{evaluationMode=b.dataset.v;updateGuidedPanel();if(evaluationMode==='karaoke'){openPanel('evaluationPanel');updateEvaluationPanelContext();return}openPanel('guidedPanel')});document.getElementById('modeBack').onclick=()=>openPanel('guidedPanel');openPanel('modePanel')}
function updateGuidedPanel(){const p=document.getElementById('guidedPanel');if(!p)return;const values=p.querySelectorAll('[id^="guidedValue-"]');values.forEach(v=>{const key=v.id.replace('guidedValue-','');if(key==='duration')v.textContent=durationLabel();if(key==='mode')v.textContent=modeLabel();if(key==='music')v.textContent=selectedMusic.name||'Sin música de fondo';if(key==='text')v.textContent=textSource==='none'?'Sin texto':textSource==='custom'?'Texto propio':'Texto de ejemplo';if(key==='imitation')v.textContent=document.getElementById('imitationType')?.selectedOptions?.[0]?.textContent||'Guitarra invisible'});const start=p.querySelector('#guidedStart');if(start){const needsMusic=Array.from(p.querySelectorAll('[data-step-key]')).some(x=>x.dataset.stepKey==='music');const ok=duration!==null&&duration!==undefined&&(!needsMusic||true)&&evaluationMode!=='karaoke';start.disabled=false;start.textContent='▶ COMENZAR EVALUACIÓN';}p.querySelectorAll('.guidedStep').forEach((b,i)=>{const key=b.dataset.stepKey;let done=false;if(key==='duration')done=true;if(key==='mode')done=true;if(key==='music')done=!!selectedMusic.name;if(key==='text')done=true;if(key==='imitation')done=true;b.classList.toggle('done',done)})}
function openEvaluationForGuided(){updateDescription();updateTextConfigUI();updateEvaluationModeUI();openPanel('evaluationPanel');hideGuideText();setMicrophoneEnabled(true).catch(e=>console.warn('Micrófono:',e))}

document.querySelectorAll('.skillCard,.secondarySkills button[data-category]').forEach(btn=>btn.onclick=()=>{if(evalRunning)return;const cat=btn.dataset.category;category=cat;categoryChosen=true;evaluationMode='camera';guidedStep=0;resetScore();updateDescription();updateTextConfigUI();updateEvaluationModeUI();openGuidedPanel(cat);hideGuideText();});
document.querySelectorAll('[data-skill-return]').forEach(btn=>btn.onclick=returnToMain);
document.getElementById('learnAccess').onclick=()=>openPanel('learningPanel');document.getElementById('contactAccess').onclick=()=>openPanel('contactPanel');document.getElementById('collabAccess').onclick=()=>openPanel('collabPanel');document.getElementById('competitionAccess').onclick=()=>openPanel('competitionPanel');
document.getElementById('mainClose').onclick=closePanels;document.getElementById('evaluationClose').onclick=returnToMain;document.getElementById('learningClose').onclick=returnToMain;document.getElementById('contactClose').onclick=returnToMain;document.getElementById('collabClose').onclick=returnToMain;document.getElementById('competitionClose').onclick=returnToMain;
document.getElementById('menuBtn').onclick=()=>{if(menuOpen)closePanels();else openPanel('mainMenu')};document.getElementById('liveMusicPause').onclick=toggleLiveMusic;document.getElementById('liveMusicVolume').oninput=e=>{volumeLevel=parseFloat(e.target.value);if(musicGain)musicGain.gain.value=volumeLevel;if(recordMusicGain)recordMusicGain.gain.value=volumeLevel;musicPlayer.volume=volumeLevel;musicAudio.volume=volumeLevel;const vs=document.getElementById('volumeSlider');if(vs)vs.value=volumeLevel};document.getElementById('pauseTopBtn').onclick=()=>{if(evalRunning)pauseEvaluation()};document.getElementById('stopTopBtn').onclick=()=>{if(evalRunning)openStopConfirm()};document.getElementById('cancelStop').onclick=closeStopConfirm;document.getElementById('confirmStop').onclick=abortEvaluation;document.getElementById('orientationClose').onclick=()=>document.getElementById('orientationOverlay').style.display='none';
const initialVolumeValue=document.getElementById('volumeValue');if(initialVolumeValue)initialVolumeValue.textContent=Math.round(volumeLevel*100)+'%';
window.addEventListener('resize',resize);window.addEventListener('orientationchange',()=>setTimeout(resize,150));
// Algunos navegadores móviles restauran la última vista desde bfcache.
// Xpresia debe arrancar siempre en su menú principal, nunca dentro de Configuración.
function forceMainMenuOnResume(){
  if(evalRunning)return;
  try{
    closePanels();
    activation.style.display='flex';
    categoryChosen=false;
    userName=''; userAge='';
    const sn=document.getElementById('startUserName');if(sn)sn.value=''; const sa=document.getElementById('startUserAge');if(sa)sa.value='';
    category='dance';
    evaluationMode='camera';
    const cat=document.getElementById('category');if(cat)cat.value='dance';
    updateDescription();updateTextConfigUI();updateEvaluationModeUI();
    setTop('Bienvenidos a Xpresia');
  }catch(e){console.warn('Restablecimiento de inicio:',e)}
}
window.addEventListener('pageshow',function(event){
  // Solo corregimos restauraciones reales desde bfcache/historial.
  // En una carga normal NO debemos volver a mostrar la portada después de que
  // el navegador ya haya terminado de iniciar la página, porque eso produce
  // un rebote visible en PC al pulsar la portada.
  if(event && event.persisted && !evalRunning){
    setTimeout(forceMainMenuOnResume,40);
  }
});
try{
  const nav=performance.getEntriesByType('navigation')[0];
  if(nav?.type==='back_forward' && !evalRunning) setTimeout(forceMainMenuOnResume,40);
}catch(e){}
spectrumLoop();
