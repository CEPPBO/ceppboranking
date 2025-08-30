(function(){
  if (!window.db) return;
  window.db.ref('profes').once('value').then(function(snap){
    if (snap.exists()) return; // ya hay alumnos
    fetch('data/alumnos.json')
      .then(r => r.json())
      .then(arr => {
        if (!Array.isArray(arr) || !arr.length) return;
        const updates = {};
        arr.forEach(p => { if (p && p.id) updates[p.id] = p; });
        window.db.ref('profes').update(updates, function(err){
          if (err) console.warn('Seeder error:', err);
          else console.log('Alumnos precargados:', Object.keys(updates).length);
        });
      })
      .catch(e => console.warn('No se pudo cargar data/alumnos.json', e));
  });
})();