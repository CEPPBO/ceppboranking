// === Datos iniciales (demo). Puedes importar un JSON propio desde Admin. ===
const DEMO_PROFES = [];

const LS_KEYS = {
  PROFES: 'rv_profes',
  VOTOS: 'rv_votos'
};

/* === Lista fija de grados/cursos === */
const GRADOS = [
  "Jardín", "Preescolar",
  "Primero", "Segundo",
  "Tercero A", "Tercero B",
  "Cuarto A", "Cuarto B",
  "Quinto A", "Quinto B",
  "Sexto A", "Sexto B",
  "Séptimo A", "Séptimo B",
  "Octavo A", "Octavo B",
  "Noveno",
  "Primer Curso", "Segundo Curso", "Tercer Curso"
];

// === Estado global ===
let profes = [];
let votos = {}; // { [profeId]: cantidad }

// === Utilidades ===
function load() {
  const p = localStorage.getItem(LS_KEYS.PROFES);
  const v = localStorage.getItem(LS_KEYS.VOTOS);
  profes = p ? JSON.parse(p) : DEMO_PROFES;
  votos = v ? JSON.parse(v) : {};
  save(); // asegura estructura
}
function save() {
  localStorage.setItem(LS_KEYS.PROFES, JSON.stringify(profes));
  localStorage.setItem(LS_KEYS.VOTOS, JSON.stringify(votos));
}
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1400);
}

// Agrupa votos por grado sumando por profe
function computeRanking() {
  const porGrado = new Map(); // grado -> total
  for (const profe of profes) {
    const c = votos[profe.id] || 0;
    porGrado.set(profe.grado, (porGrado.get(profe.grado) || 0) + c);
  }
  // ordena desc
  return [...porGrado.entries()].sort((a, b) => b[1] - a[1]);
}

function topProfes(limit = 5) {
  const arr = profes.map(p => ({ ...p, votos: votos[p.id] || 0 }));
  arr.sort((a, b) => b.votos - a.votos);
  return arr.slice(0, limit);
}

// Rellena un <select> con opciones de GRADOS (+ extras)
function fillGradoOptions(selectEl, extras = []) {
  const set = new Set(GRADOS.concat(extras.filter(Boolean)));
  selectEl.innerHTML = Array.from(set).map(g => `<option value="${g}">${g}</option>`).join('');
}

// === Render ===
let chart; // Chart.js instancia
let editingId = null;

function renderRanking() {
  // Lista por grado
  const ranking = computeRanking();
  const ul = document.getElementById('listaRankingGrados');
  ul.innerHTML = '';
  for (const [grado, total] of ranking) {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${grado}</strong> <span class="badge">${total} voto(s)</span>`;
    ul.appendChild(li);
  }
  // Top profes
  const ol = document.getElementById('listaTopProfes');
  if (ol) {
    const top = topProfes(7);
    ol.innerHTML = '';
    top.forEach((p, i) => {
      const li = document.createElement('li');
      li.innerHTML = `#${i+1} — <strong>${p.nombre}</strong> <span class="meta">(${p.grado}${p.materia ? ' · ' + p.materia : ''})</span> — <span class="badge">${p.votos}</span>`;
      ol.appendChild(li);
    });
  }

  // Chart
  const labels = ranking.map(([g]) => g);
  const data = ranking.map(([, t]) => t);
  const ctx = document.getElementById('chartGrados');
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Votos por grado', data }] },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
    }
  });
}

function renderProfes() {
  // llenar filtro grados
  const selectGrado = document.getElementById('filtrarGrado');
  const prevSel = selectGrado ? selectGrado.value : '';
  const extras = [...new Set(profes.map(p => p.grado))];
  selectGrado.innerHTML = '<option value="">Todos</option>';
  const tmp = document.createElement('select'); fillGradoOptions(tmp, extras);
  selectGrado.insertAdjacentHTML('beforeend', tmp.innerHTML);

  // restaurar selección previa si existe
  if (prevSel && [...selectGrado.options].some(o => o.value === prevSel)) {
    selectGrado.value = prevSel;
  }

  const grid = document.getElementById('profesoresGrid');
  const q = document.getElementById('buscar').value.trim().toLowerCase();
  const gradoSel = selectGrado.value;
  const ordenarPor = document.getElementById('ordenarPor').value;

  let lista = profes
    .filter(p => !q || p.nombre.toLowerCase().includes(q) || p.materia.toLowerCase().includes(q))
    .filter(p => !gradoSel || p.grado === gradoSel)
    .map(p => ({ ...p, votos: votos[p.id] || 0 }));

  if (ordenarPor === 'nombre') lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
  if (ordenarPor === 'grado') lista.sort((a, b) => a.grado.localeCompare(b.grado) || a.nombre.localeCompare(b.nombre));
  if (ordenarPor === 'votos') lista.sort((a, b) => b.votos - a.votos);

  grid.innerHTML = '';
  for (const p of lista) {
    const card = document.createElement('div');
    card.className = 'profe-card';
    card.innerHTML = `
      <div class="row">
        <div>
          <div><strong>${p.nombre}</strong></div>
          <div class="meta">${p.grado}${p.materia ? ' · ' + p.materia : ''}</div>
        </div>
        <div class="counter ${p.votos<0?'neg':'pos'}">⭐ ${p.votos}</div>
      </div>
      <div class="row">
        <button class="btn small" data-id="${p.id}" data-action="up">+1</button>
        <button class="btn small danger" data-id="${p.id}" data-action="down">-1</button>
        <button class="btn small secondary" data-id="${p.id}" data-edit="1">Editar</button>
        <button class="btn tiny danger icon" title="Eliminar" data-id="${p.id}" data-del="1">🗑️</button>
        <button class="btn small secondary" data-id="${p.id}" data-ver="1">Ver aportes del grado</button>
      </div>
    `;
    grid.appendChild(card);
  }
}

// === Votar ===
function votar(profeId, delta = 1) {
  votos[profeId] = (votos[profeId] || 0) + delta;
  save();
  renderProfes();
  renderRanking();
  toast(delta > 0 ? '¡Voto positivo!' : 'Voto negativo aplicado');
}

// === Importar/Exportar/Reset ===
function exportarVotos() {
  const payload = {
    version: 1,
    fecha: new Date().toISOString(),
    profes,
    votos
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ranking-votos-export.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function reiniciarVotos() {
  if (!confirm('¿Seguro que querés reiniciar todos los votos?')) return;
  votos = {};
  save();
  renderProfes();
  renderRanking();
  toast('Votos reiniciados.');
}

function importarProfes(archivo) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) throw new Error('El JSON debe ser un array');
      // normaliza y asigna id si falta
      profes = data.map(p => ({
        id: p.id || crypto.randomUUID(),
        nombre: p.nombre?.trim() || 'Sin nombre',
        grado: p.grado?.trim() || 'S/G',
        materia: (p.materia ?? p.seccion ?? p.grupo ?? '').toString().trim() || ''
      }));
      save();
      renderProfes();
      renderRanking();
      toast('Profes importados con éxito.');
    } catch (err) {
      alert('Error al importar: ' + err.message);
    }
  };
  reader.readAsText(archivo);
}

// === Navegación por pestañas ===
function setupTabs() {
  const btns = document.querySelectorAll('.tab-btn');
  const sections = document.querySelectorAll('.tab-section');
  btns.forEach(b => b.addEventListener('click', () => {
    btns.forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    sections.forEach(s => s.classList.remove('active'));
    document.getElementById(b.dataset.target).classList.add('active');
  }));
}

// === Eventos ===
function setupEvents() {
  document.getElementById('profesoresGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.edit) { openEditModal(id); return; }
    if (btn.dataset.del) { eliminarAlumno(id); return; }
    if (btn.dataset.ver) {
      // Mostrar contribución del grado del profe seleccionado
      const profe = profes.find(p => p.id === id);
      if (!profe) return;
      const ranking = computeRanking();
      const item = ranking.find(([g]) => g === profe.grado);
      const total = item ? item[1] : 0;
      alert(`El grado ${profe.grado} acumula ${total} voto(s).`);
      return;
    }
    if (btn.dataset.action === 'up') { votar(id, +1); return; }
    if (btn.dataset.action === 'down') { votar(id, -1); return; }
    votar(id);
  });

  document.getElementById('buscar').addEventListener('input', renderProfes);
  document.getElementById('filtrarGrado').addEventListener('change', renderProfes);
  document.getElementById('ordenarPor').addEventListener('change', renderProfes);
  document.getElementById('btn-exportar').addEventListener('click', exportarVotos);
  document.getElementById('btn-reiniciar').addEventListener('click', reiniciarVotos);

  document.getElementById('formAgregar').addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = document.getElementById('addNombre').value.trim();
    const grado = document.getElementById('addGradoSel').value.trim();
    const materia = document.getElementById('addSeccion').value.trim();
    if (!nombre || !grado) return;
    profes.push({ id: crypto.randomUUID(), nombre, grado, materia });
    save();
    renderProfes();
    renderRanking();
    e.target.reset();
    toast('Profe agregado.');
  });

  document.getElementById('inputImportar').addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) importarProfes(file);
  });

  document.getElementById('btnDescargarEjemplo').addEventListener('click', () => {
    const ejemplo = [
      { "nombre": "María Pérez", "grado": "7º A", "seccion": "Grupo A" },
      { "nombre": "Juan Romero", "grado": "7º B", "seccion": "Equipo Azul" },
      { "nombre": "Lucía Viera", "grado": "8º A", "seccion": "Club de Ciencia" }
    ];
    const blob = new Blob([JSON.stringify(ejemplo, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ejemplo-profes.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
}

// === Inicio ===
window.addEventListener('DOMContentLoaded', () => {
  load();
  setupTabs();
  setupEvents();
  setupEditModal();
  setupAddGradoSelect();
  setupBulkActions();
  renderProfes();
  renderRanking();
});

// === Editar alumno ===
function openEditModal(id) {
  const p = profes.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  document.getElementById('editNombre').value = p.nombre || '';
  fillGradoOptions(document.getElementById('editGrado'), profes.map(x => x.grado));
  document.getElementById('editGrado').value = p.grado;
  document.getElementById('editSeccion').value = p.materia || '';
  document.getElementById('modalEditar').classList.remove('hidden');
}
function closeEditModal() {
  editingId = null;
  document.getElementById('modalEditar').classList.add('hidden');
}

function setupEditModal() {
  document.getElementById('btnCancelarEdit').addEventListener('click', closeEditModal);
  document.getElementById('btnGuardarEdit').addEventListener('click', () => {
    const id = editingId; if (!id) return;
    const p = profes.find(x => x.id === id); if (!p) return;
    p.nombre = document.getElementById('editNombre').value.trim() || p.nombre;
    p.grado  = document.getElementById('editGrado').value.trim() || p.grado;
    p.materia= document.getElementById('editSeccion').value.trim();
    save(); renderProfes(); renderRanking(); closeEditModal(); toast('Alumno actualizado.');
  });
}
function setupAddGradoSelect() {
  const extras = profes.map(p => p.grado);
  fillGradoOptions(document.getElementById('addGradoSel'), extras);
}

// === Eliminar alumno ===
function eliminarAlumno(id) {
  const p = profes.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`¿Eliminar a "${p.nombre}" del listado?`)) return;
  profes = profes.filter(x => x.id !== id);
  delete votos[id];
  save(); renderProfes(); renderRanking();
  toast('Alumno eliminado.');
}

function setupBulkActions() {
  const btnVaciar = document.getElementById('btnVaciarAlumnos');
  const btnTodo   = document.getElementById('btnLimpiarTodo');
  if (btnVaciar) btnVaciar.addEventListener('click', () => {
    if (!profes.length) { toast('No hay alumnos.'); return; }
    if (!confirm('¿Vaciar toda la lista de alumnos? (no afecta los votos)')) return;
    // Eliminamos alumnos y votos asociados
    const ids = profes.map(p => p.id);
    profes = [];
    ids.forEach(id => delete votos[id]);
    save(); renderProfes(); renderRanking();
    toast('Lista vaciada.');
  });
  if (btnTodo) btnTodo.addEventListener('click', () => {
    if (!confirm('¿Borrar TODO? (alumnos + votos)')) return;
    profes = []; votos = {};
    localStorage.removeItem(LS_KEYS.PROFES);
    localStorage.removeItem(LS_KEYS.VOTOS);
    renderProfes(); renderRanking();
    toast('Datos borrados en este navegador.');
  });
}
