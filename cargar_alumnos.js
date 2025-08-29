
// Carga alumnos desde data/alumnos.json y llama a renderAlumnos(alumnos)
// Para evitar caché en móviles, se agrega un parámetro ?v=timestamp

async function cargarAlumnos() {
  try {
    const url = './data/alumnos.json?v=' + Date.now();
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) throw new Error('No se pudo leer alumnos.json');
    const alumnos = await resp.json();

    if (typeof renderAlumnos === 'function') {
      renderAlumnos(alumnos);
    } else {
      // Render básico de respaldo si no existe renderAlumnos
      const cont = document.getElementById('lista-alumnos') || document.body;
      cont.innerHTML += '<div style="margin:1rem 0;font-weight:600">Render de respaldo</div>';
      const ul = document.createElement('ul');
      alumnos.forEach(a => {
        const li = document.createElement('li');
        li.textContent = `${a.nombre} — ${a.grado}`;
        ul.appendChild(li);
      });
      cont.appendChild(ul);
    }
  } catch (err) {
    console.error(err);
    alert('No se pudieron cargar los alumnos (revisa la consola y la ruta de data/alumnos.json).');
  }
}

document.addEventListener('DOMContentLoaded', cargarAlumnos);
