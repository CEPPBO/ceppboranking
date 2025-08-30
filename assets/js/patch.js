// assets/js/patch.js
(function () {
  window.VOTOS_PATH = window.VOTOS_PATH || 'votos';
  window.AUTH_READY = false;
  window.AUTH_UID = null;

  function log(){ try{ console.log.apply(console, arguments); }catch(_){} }
  function toastSafe(msg){ try{ toast ? toast(msg) : alert(msg); }catch(_){ alert(msg); } }

  try {
    firebase.auth().onAuthStateChanged(function (user) {
      window.AUTH_READY = true;
      window.AUTH_UID = user && user.uid;
      log('[AUTH] ready:', !!user, window.AUTH_UID || null);
      if (!user) {
        firebase.auth().signInAnonymously().catch(function(e){
          console.warn('[AUTH] anon error', e);
        });
      }
    });
    firebase.auth().signInAnonymously().catch(function(){});
  } catch (e) { console.warn('[AUTH] init failed', e); }

  const votarOriginal = window.votar;
  window.votar = function (profeId, delta) {
    if (!profeId) { console.warn('Sin ID de alumno'); return; }
    if (typeof HAS_DB !== 'undefined' && !HAS_DB) { toastSafe('⛔ Sin conexión a Firebase'); return; }
    if (!window.AUTH_READY || !window.AUTH_UID) {
      toastSafe('Conectando a Firebase... volvé a intentar');
      try { firebase.auth().signInAnonymously(); } catch (_){}
      return;
    }
    const path = (window.VOTOS_PATH || 'votos') + '/' + profeId;
    try {
      return window.db.ref(path).transaction(function (cur) {
        const next = (cur || 0) + (Number(delta) || 0);
        return next < 0 ? 0 : next;
      }, function (err, committed) {
        if (err || !committed) {
          console.warn('[VOTO][ERR]', { err, committed, path });
          toastSafe('⚠️ No se pudo registrar el voto (permisos / conexión).');
        }
      });
    } catch (e) {
      console.warn('[VOTO][EXC]', e);
      toastSafe('⚠️ Error votando.');
    }
  };

  window.diagFirebase = function () {
    console.log('HAS_DB=', typeof HAS_DB==='undefined'?'?':HAS_DB, 'VOTOS_PATH=', (window.VOTOS_PATH||'votos'));
    console.log('AUTH_READY=', window.AUTH_READY, 'AUTH_UID=', window.AUTH_UID);
    try {
      return Promise.all([
        db.ref('profes').limitToFirst(1).once('value'),
        db.ref((window.VOTOS_PATH||'votos')).limitToFirst(1).once('value')
      ]).then(([p,v])=>{
        console.log('/profes sample:', p.val());
        console.log('/'+(window.VOTOS_PATH||'votos')+' sample:', v.val());
        return {profes: p.val(), votos: v.val()};
      });
    } catch(e){ console.warn(e); }
  };

  try {
    if (window.db) {
      db.ref(window.VOTOS_PATH || 'votos').on('value', s => {
        const val = s.val() || {};
        console.log('[VOTOS] keys:', Object.keys(val).length);
      });
    }
  } catch (_){}
})();