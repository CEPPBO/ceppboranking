import fs from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = 'data';
const OUT_FILE = path.join(DATA_DIR, 'alumnos_todos.json');

function normalize(s = '') {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim().replace(/\s+/g, ' ');
}
function mapRecord(r = {}) {
  const nombre = (r.nombre ?? r.NOMBRE ?? r.alumno ?? '').toString().trim();
  const grado  = (r.grado  ?? r.GRADO  ?? r.curso  ?? '').toString().trim();
  const grupo  = (r.grupo  ?? r.seccion ?? r['sección'] ?? '').toString().trim();
  const rec = { nombre, grado };
  if (grupo) rec.grupo = grupo;
  return rec;
}
function keyOf(rec) {
  return [normalize(rec.nombre), normalize(rec.grado), normalize(rec.grupo || '')].join('|');
}
async function listJson(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await listJson(p));
    else if (entry.isFile() && entry.name.endsWith('.json') && !p.endsWith('alumnos_todos.json')) out.push(p);
  }
  return out;
}
async function readJson(p) {
  try {
    const txt = await fs.readFile(p, 'utf8');
    const data = JSON.parse(txt);
    if (Array.isArray(data)) return data.map(mapRecord);
    if (data && Array.isArray(data.profes)) return data.profes.map(mapRecord);
    return [];
  } catch (e) {
    console.error('Error leyendo', p, e.message);
    return [];
  }
}

async function main() {
  try { await fs.mkdir(DATA_DIR, { recursive: true }); } catch {}
  const files = await listJson(DATA_DIR);
  const map = new Map();
  for (const f of files) {
    const arr = await readJson(f);
    for (const rec of arr) {
      const k = keyOf(rec);
      if (!map.has(k)) map.set(k, rec);
    }
  }
  const out = Array.from(map.values()).sort((a, b) =>
    (a.grado || '').localeCompare(b.grado || '') || (a.nombre || '').localeCompare(b.nombre || '')
  );
  await fs.writeFile(OUT_FILE, JSON.stringify(out, null, 2));
  console.log('Escrito', OUT_FILE, 'con', out.length, 'alumnos.');
}
main().catch(err => { console.error(err); process.exit(1); });

async function cargarAlumnos() {
  // cache-busting para que el celu no use versión vieja
  const url = './data/alumnos_todos.json?v=' + Date.now();

  const resp = await fetch(url);
  if (!resp.ok) throw new Error('No se pudo leer alumnos.json');
  const alumnos = await resp.json();

  // TODO: acá llamas a tu render con "alumnos"
  renderAlumnos(alumnos); // o el nombre de tu función
}

cargarAlumnos().catch(err => {
  console.error(err);
  alert('No se pudieron cargar los alumnos. Revisa la consola.');
});
