# Ranking & Votación Escolar

App web estática para **votar alumnos** y ver el **ranking de mejores grados** (por votos acumulados de los alumnos que pertenecen a cada grado). Todo se guarda en `localStorage`, así que funciona perfecto en **GitHub Pages** sin backend.

> Sin vueltas: votás, y el ranking se actualiza al instante. 🎯

## Demo rápida
- Pestaña **Votar**: buscá por nombre o materia, filtrá por grado y votá con un clic.
- Pestaña **Ranking**: ves el gráfico por grado y el Top de alumnos.
- **Admin**: agregá alumnos, importá un JSON o reiniciá votos. También podés **exportar** el estado.

## Estructura
```
ranking-votacion/
├─ index.html
├─ assets/
│  ├─ css/style.css
│  └─ js/app.js
└─ data/
   └─ (vacío, opcional)
```

## Importar alumnosores (JSON)
Formato esperado (array de objetos):
```json
[
  { "nombre": "María Pérez", "grado": "7º A", "seccion": "Grupo A" },
  { "nombre": "Juan Romero", "grado": "7º B", "materia": "Equipo Azul" }
]
```

## Cómo publicar en GitHub Pages
1. Creá un repositorio nuevo en GitHub (por ejemplo `ranking-votacion`).  
2. Subí estos archivos (o subí el ZIP que te doy).  
3. En **Settings → Pages**, elegí **Deploy from a branch** y seleccioná `main` y la carpeta raíz (`/`).  
4. Guardá. En unos minutos, tu sitio quedará disponible en una URL del estilo:  
   `https://tu-usuario.github.io/ranking-votacion/`

## Personalización
- Cambiá el estilo en `assets/css/style.css`.
- Ajustá textos, logo o colores a tu gusto.
- Si querés un backend real (votos centralizados para toda la escuela), te puedo preparar una versión con API (Firebase o Supabase).

## Licencia
MIT — Hacé y deshacé libremente. 😉

---
_Última actualización: 2025-08-29_


## Cambios recientes
- La app inicia **sin alumnos** por defecto: agregá/importá los tuyos.
- El **ranking muestra solo grados/cursos** (no lista de alumnos).
- Cada alumno admite **voto positivo (+1)** y **voto negativo (-1)**. El ranking por grado suma ambos (puede haber neto negativo o positivo).


## Eliminar alumnos
- Botón **Eliminar** en cada tarjeta.
- En **Admin → Acciones avanzadas**: **Vaciar lista de alumnos** o **Borrar todo (alumnos + votos)**.
- Manual (opcional): en la consola del navegador, ejecutá:
```js
localStorage.removeItem('rv_profes'); 
localStorage.removeItem('rv_votos');
```
y recargá.
