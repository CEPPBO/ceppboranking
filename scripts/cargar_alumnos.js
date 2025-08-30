// Seeder y utilidades para cargar alumnos desde data/alumnos.json a Firebase
(function(){
  function slug(s){
    return String(s||"")
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase().replace(/[^a-z0-9]+/g,'-')
      .replace(/(^-|-$)/g,'');
  }

  async function leerJSONLocal(){
    try{
      const r = await fetch('data/alumnos.json', {cache:'no-cache'});
      if(!r.ok) throw new Error('No se pudo leer data/alumnos.json');
      const arr = await r.json();
      if(!Array.isArray(arr)) throw new Error('alumnos.json debe ser un array');
      return arr;
    }catch(e){
      console.warn('[Seeder] ', e);
      return null;
    }
  }

  function normalizar(arr){
    return (arr||[]).map(p=>{
      const nombre = (p.nombre||'').toString().trim();
      const grado  = (p.grado ||'').toString().trim();
      const grupo  = (p.grupo || p.seccion || '').toString().trim();
      if(!nombre || !grado) return null;
      const id = 'a_' + slug(`${nombre}|${grado}|${grupo}`);
      return { id, nombre, grado, materia: grupo };
    }).filter(Boolean);
  }

  async function mergeEnFirebase(items){
    const updates = {};
    items.forEach(p=> updates[p.id] = p);
    return new Promise((resolve,reject)=>{
      window.db.ref('profes').update(updates, err=> err?reject(err):resolve(Object.keys(updates).length));
    });
  }

  async function seedSiVacio(){
    if(!window.db) return;
    try{
      const snap = await window.db.ref('profes').once('value');
      if (snap.exists()) { console.log('[Seeder] /profes ya tiene datos, no cargo.'); return; }
      const arr = await leerJSONLocal();
      if(!arr) return;
      const norm = normalizar(arr);
      if(!norm.length){ console.warn('[Seeder] alumnos.json vacío.'); return; }
      const n = await mergeEnFirebase(norm);
      console.log('[Seeder] Cargados', n, 'alumnos desde alumnos.json');
    }catch(e){ console.warn('[Seeder] Error:', e); }
  }

  // API pública para forzar merge desde alumnos.json (sin borrar)
  window.importarAlumnosDesdeJSON = async function(){
    if(!window.db){ alert('Firebase no inicializado'); return; }
    const arr = await leerJSONLocal(); if(!arr){ alert('No se pudo leer alumnos.json'); return; }
    const norm = normalizar(arr);
    try{
      const n = await mergeEnFirebase(norm);
      alert('Importados/actualizados '+n+' alumnos desde alumnos.json');
    }catch(e){ alert('Error subiendo alumnos: '+e); }
  };

  // API pública para REINICIAR (borra y sube)
  window.reemplazarAlumnosConJSON = async function(){
    if(!window.db){ alert('Firebase no inicializado'); return; }
    if(!confirm('Esto BORRA /profes y sube lo de alumnos.json. ¿Continuar?')) return;
    const arr = await leerJSONLocal(); if(!arr){ alert('No se pudo leer alumnos.json'); return; }
    const norm = normalizar(arr);
    try{
      await new Promise((res,rej)=> window.db.ref('profes').remove(err=> err?rej(err):res()));
      const n = await mergeEnFirebase(norm);
      alert('Reemplazados '+n+' alumnos desde alumnos.json');
    }catch(e){ alert('Error: '+e); }
  };

  // Auto-seed si está vacío
  if (window.db) {
    seedSiVacio();
  } else {
    // Si db aún no está, intenta luego del load
    window.addEventListener('load', seedSiVacio);
  }
})();