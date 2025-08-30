(function(){
  function slug(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');}
  async function readLocal(){
    try{const r=await fetch('data/alumnos.json',{cache:'no-cache'}); if(!r.ok) throw 0; const a=await r.json(); if(!Array.isArray(a)) throw 0; return a;}catch(e){console.warn('[Seeder] no alumnos.json'); return null;}
  }
  function norm(arr){
    return (arr||[]).map(p=>{
      const nombre=(p.nombre||'').toString().trim();
      const grado=(p.grado||'').toString().trim();
      const grupo=(p.grupo||p.seccion||p.materia||'').toString().trim();
      if(!nombre||!grado) return null;
      const id=p.id || ('a_'+slug(`${nombre}|${grado}|${grupo}`));
      return {id, nombre, grado, materia: grupo};
    }).filter(Boolean);
  }
  async function merge(items){
    const up={}; items.forEach(p=> up[p.id]=p);
    return new Promise((res,rej)=> window.db.ref('profes').update(up, e=> e?rej(e):res(Object.keys(up).length)));
  }
  async function seedIfEmpty(){
    if(!window.db) return;
    try{
      const s = await window.db.ref('profes').once('value');
      if (s.exists()) return;
      const arr = await readLocal(); if(!arr) return;
      const n = await merge(norm(arr));
      console.log('[Seeder] Cargados', n, 'alumnos desde alumnos.json');
    }catch(e){ console.warn('[Seeder]', e); }
  }
  window.importarAlumnosDesdeJSON = async function(){
    if(!window.db){ alert('Firebase no inicializado'); return; }
    const arr = await readLocal(); if(!arr){ alert('No se pudo leer alumnos.json'); return; }
    try{ const n = await merge(norm(arr)); alert('Importados/actualizados '+n+' alumnos desde alumnos.json'); }
    catch(e){ alert('Error subiendo alumnos: '+e); }
  };
  window.reemplazarAlumnosConJSON = async function(){
    if(!window.db){ alert('Firebase no inicializado'); return; }
    if(!confirm('Esto BORRA /profes y sube lo de alumnos.json. ¿Continuar?')) return;
    const arr = await readLocal(); if(!arr){ alert('No se pudo leer alumnos.json'); return; }
    try{
      await new Promise((res,rej)=> window.db.ref('profes').remove(e=> e?rej(e):res()));
      const n = await merge(norm(arr)); alert('Reemplazados '+n+' alumnos desde alumnos.json');
    }catch(e){ alert('Error: '+e); }
  };
  if (window.db) seedIfEmpty(); else window.addEventListener('load', seedIfEmpty);
})();