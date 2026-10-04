(()=>{"use strict";
const STYLE_ID="rff-v95-device-lock-style",GATE_ID="rffDeviceLock",STORE="rff_device_credential_v1";
if(document.getElementById(GATE_ID))return;
const style=document.createElement("style");style.id=STYLE_ID;style.textContent=`
#rffDeviceLock{position:fixed;inset:0;z-index:2147483647;background:rgba(244,247,251,.98);display:flex;align-items:center;justify-content:center;padding:22px}
#rffDeviceLock[hidden]{display:none!important}.rffDeviceLockCard{width:min(430px,100%);background:#fff;border:1px solid #d7dee8;border-radius:22px;padding:24px;box-shadow:0 18px 55px #0f172a2b;text-align:center}
.rffDeviceLockIcon{font-size:54px;line-height:1;margin-bottom:10px}.rffDeviceLockCard h2{margin:0 0 8px;color:#123274;font-size:24px}.rffDeviceLockCard p{margin:0 0 16px;color:#64748b;line-height:1.4}
#rffDeviceUnlockBtn,#rffDeviceFallbackBtn{width:100%;min-height:52px;border-radius:14px;font-size:16px;font-weight:900}#rffDeviceUnlockBtn{background:#0b4f8a;color:#fff;border-color:#0b4f8a}
#rffDeviceFallbackBtn{margin-top:9px;background:#fff;color:#475569}#rffDeviceLockStatus{min-height:21px;margin-top:12px;font-size:13px;font-weight:750;color:#475569}`;
document.head.appendChild(style);
const gate=document.createElement("div");gate.id=GATE_ID;gate.setAttribute("role","dialog");gate.setAttribute("aria-modal","true");
gate.innerHTML=`<div class="rffDeviceLockCard"><div class="rffDeviceLockIcon">🔐</div><h2>Sblocca Registro Finanziario</h2><p>Conferma con l’impronta digitale oppure con il blocco schermo già impostato sul telefono.</p><button id="rffDeviceUnlockBtn" type="button">Sblocca con il telefono</button><button id="rffDeviceFallbackBtn" type="button" hidden>Continua senza sblocco dispositivo</button><div id="rffDeviceLockStatus" aria-live="polite"></div></div>`;
document.body.appendChild(gate);
const btn=document.getElementById("rffDeviceUnlockBtn"),fallback=document.getElementById("rffDeviceFallbackBtn"),status=document.getElementById("rffDeviceLockStatus");
let busy=false,unlocked=false,relockOnVisible=false;
const b64u=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const fromB64u=s=>{s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";const raw=atob(s),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out};
const random=n=>crypto.getRandomValues(new Uint8Array(n));
function show(msg=""){gate.hidden=false;document.body.style.overflow="hidden";if(msg)status.textContent=msg}
function hide(){gate.hidden=true;document.body.style.overflow="";status.textContent="";fallback.hidden=true}
async function platformAvailable(){if(!window.isSecureContext||!window.PublicKeyCredential||!navigator.credentials)return false;if(typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable!=="function")return true;try{return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()}catch(_){return false}}
async function registerCredential(){const userId=random(32);const cred=await navigator.credentials.create({publicKey:{challenge:random(32),rp:{name:"Registro Finanziario Familiare",id:location.hostname},user:{id:userId,name:"registro-"+b64u(userId).slice(0,16),displayName:"Registro Finanziario Familiare"},pubKeyCredParams:[{type:"public-key",alg:-7},{type:"public-key",alg:-257}],authenticatorSelection:{authenticatorAttachment:"platform",residentKey:"discouraged",userVerification:"required"},timeout:60000,attestation:"none"}});if(!cred)throw new Error("Credenziale non creata");localStorage.setItem(STORE,b64u(new Uint8Array(cred.rawId)))}
async function verifyCredential(){const saved=localStorage.getItem(STORE);if(!saved){await registerCredential();return}try{const cred=await navigator.credentials.get({publicKey:{challenge:random(32),allowCredentials:[{type:"public-key",id:fromB64u(saved),transports:["internal"]}],userVerification:"required",timeout:60000}});if(!cred)throw new Error("Verifica non completata")}catch(e){if(e&&e.name==="NotAllowedError")throw e;localStorage.removeItem(STORE);await registerCredential()}}
async function unlock(){if(busy||unlocked)return;busy=true;show("Richiesta di sblocco in corso…");btn.disabled=true;fallback.hidden=true;try{if(!await platformAvailable()){status.textContent="Lo sblocco del telefono non è disponibile in questa versione. Puoi continuare e riprovare dopo un aggiornamento dell’app.";fallback.hidden=false;return}await verifyCredential();unlocked=true;hide()}catch(e){status.textContent=e&&e.name==="NotAllowedError"?"Sblocco annullato. Premi il pulsante per riprovare.":"Impossibile usare lo sblocco del telefono. Premi il pulsante per riprovare."}finally{busy=false;btn.disabled=false}}
function relock(){if(busy)return;unlocked=false;show("Conferma l’accesso per continuare.")}
btn.addEventListener("click",unlock);fallback.addEventListener("click",()=>{unlocked=true;hide()});
document.addEventListener("visibilitychange",()=>{if(document.hidden){if(!busy){relockOnVisible=true;relock()}}else if(relockOnVisible){relockOnVisible=false;setTimeout(unlock,120)}});
window.addEventListener("pageshow",()=>{if(!unlocked)setTimeout(unlock,80)});show("Conferma l’accesso per continuare.");setTimeout(unlock,120);
})();