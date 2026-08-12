# Movilidad interna — plan y estado

Documento vivo del proceso de movilidad interna. **Cubre los dos repos** (front y backend) aunque
viva en el del front, porque la carpeta raíz del monorepo no es un repo git y un archivo ahí no se
commitearía. Está pensado para que otra persona —o otro LLM— retome el trabajo sin más contexto que
este archivo y `CLAUDE.md`.

Origen: `prompt.md` ("Implementación del proceso de movilidad interna"), agosto 2026.

---

## Estado

| Fase | Qué incluye | Estado |
|---|---|---|
| **1** | Modelo de datos, semilla y semáforo | **Hecha** |
| **2** | Vista de colaborador: sección MOVILIDAD | Pendiente |
| **3** | Agente de movilidad | Pendiente |
| **4** | Vista de formador: módulo "Movilidad interna" | Pendiente |

---

## De qué va

Se añade un recorrido propio para un usuario que **ya existía en los datos pero no tenía proceso**:
el candidato interno. Antes `tipo: "interno"` solo cambiaba tres campos y un par de mensajes.

No se crean tablas: la persistencia es **JSONB por agregado**, así que los campos nuevos van colgados
del propio `Candidato` y no necesitan migración de SQL. **9 de los 32 candidatos de la semilla son
internos** (ids 2, 6, 11, 15, 18, 21, 24, 27, 32) y `seed.ts` ya les asignaba `formadorId` por área,
de modo que "el equipo del formador" ya era una consulta posible.

---

## Decisiones tomadas (y por qué)

**El semáforo de elegibilidad es un dato guardado, no un cálculo.** El documento original lo pedía de
las dos formas: editable por el administrador en un punto, y derivado de la completitud de
habilidades en otro. Se resolvió separando las dos cosas: `movilidad` es un campo que edita el
administrador, y el "% de avance del plan de desarrollo" es un cálculo aparte que **no lo toca**.

**El agente de movilidad va en su propio módulo, separado del agente actual.** Decisión del dueño del
repo. Tendrá su ruta, sus sesiones y sus tools; lo único que comparte con `src/agent/` es
`deepseek.ts`, que es el cliente HTTP del proveedor y no lógica de agente. **Coste asumido:** el SSE
y la persistencia de memoria quedan duplicados en dos sitios.

**El estatus del colaborador y la acción recomendada se derivan, nunca se guardan.** Misma decisión
que se tomó con la checklist del pipeline (`services/flujoService.ts` en el backend) y por la misma
razón: el proceso avanza también fuera de la pantalla donde se muestra, así que un valor guardado se
desincroniza en cuanto alguien actúa por otro camino.

**"Honesteles" quedó fuera.** El documento pedía "Estatus del perfil en Honesteles" en la ficha de
talento; no existe nada parecido en el código y no se pudo aclarar qué es. **Si se retoma, va en la
ficha de talento** (Fase 2).

**Terminología corregida.** El documento decía "Pull de talento"; `CLAUDE.md` obliga a **"Marketplace
de talento"**, nunca "pool". También "Quote de movilidad" → **"Cuota de movilidad"**.

**Interpretaciones del documento.** La segunda "ETAPA 4" (vacía) se ignora. La marca `[P]`, que se usa
pero no está en la leyenda (`[C]` colaborador, `[F]` formador), se lee como formador.

### Huecos del documento que se rellenaron

El documento dejaba varias columnas enunciadas sin definir. **Revisar si encajan:**

| Punto | Qué se implementa |
|---|---|
| Columna "Habilidades" | Tags de `hard` + contador del plan ("5 de 8 del plan") |
| Columna "Semáforo" | El tag de color de `movilidad`, igual que en el Marketplace |
| Acción "Agradecer" | Desempeño **alto** + movilidad **baja**: rinde pero no quiere moverse — reconocer y retener |
| Columna "Última actualización" | Fecha de `perfilActualizado` con "hace N días" |
| "Puestos emergentes" | Panel de 3 puestos sugeridos con su motivo (rotación, habilidades, temporalidad) |

Las cuatro reglas de "Acción recomendada" del documento **no cubren todos los casos**. Se evalúan en
orden —Transferir, Promover, Formar, Desvincular, Agradecer— y lo que no encaje cae en
**"Sin acción"**. En la semilla, el candidato 32 es justo ese caso.

---

## Trampas (leer antes de tocar nada)

**1 · Un campo nuevo en `Candidato` hay que declararlo en TRES sitios o se pierde.**

`back/src/validators/crudSchemas.ts` → `candidatoFieldsSchema` es `.partial()` **sin
`.passthrough()`**: un campo no declarado **no da error, se descarta en silencio**. Y como
`guardarCandidato` **reemplaza el objeto completo en vez de hacer merge**, el dato se borraría en cada
guardado sin que nada fallara. Los tres sitios:

1. `back/src/types/domain.ts` y `front/src/types/models/domain.ts` (el espejo es manual)
2. `back/src/validators/crudSchemas.ts`
3. `back/src/data/seed.ts`

**2 · El backend se despliega siempre primero**, por lo anterior.

**3 · `desempeno` va sin `ñ`.** Ningún identificador del dominio la usa; el texto visible sí dice
"Desempeño".

**4 · Las fechas de la semilla son fijas, no `hoy()`.** El proyecto prohíbe la aleatoriedad y exige
reproducibilidad; además así el colaborador que sale "Inactivo" lo sigue estando mañana.

---

## Modelo de datos

Campos nuevos en `Candidato`, todos opcionales y solo con sentido en internos:

```ts
movilidad?: "alta" | "media" | "baja";   // semáforo; lo edita el admin
desempeno?: "alto" | "medio" | "bajo";
cursos?: CursoItem[];                    // { nombre, tipo, fecha, institucion? }
puestosInteres?: string[];
antiguedadDesde?: string;                // "01 mar 2023" (es-MX)
perfilActualizado?: string;              // decide el estatus "Inactivo" (> 30 días)
planDesarrollo?: PlanDesarrollo;         // { puestoObjetivo, habilidades[], necesidades[], cursosSugeridos[], generado }
historialPuestos?: HistorialPuesto[];    // { puesto, desde, hasta, motivo }
movilidadActivaVacId?: string;           // bloqueo de la ETAPA 3
```

Catálogos nuevos, duplicados en los dos repos: `MOVILIDAD`, `DESEMPENO`, `TIPOS_CURSO`,
`ESTADOS_MOVILIDAD`, `ACCIONES_RECOMENDADAS`, `UMBRAL_AFINIDAD` (70), `DIAS_PERFIL_INACTIVO` (30).

### Reparto de la semilla

Elegido para que se disparen las cinco acciones recomendadas más el caso sin regla:

| id | Nombre | Movilidad | Desempeño | Caso que ejercita |
|---|---|---|---|---|
| 2 | Jorge Luis Peña Ríos | alta | medio | Transferir |
| 6 | Diego Ramírez Cline | alta | alto | Promover |
| 11 | Paola Reyes Ibarra | media | medio | Formar |
| 15 | Renata Villaseñor Ochoa | alta | alto | Promover |
| 18 | Óscar Beltrán Nava | media | medio | Formar |
| 21 | Ximena Rosales Vidal | baja | alto | **Agradecer** |
| 24 | Marcos Ibáñez Cruz | baja | bajo | **Desvincular** (ficha abandonada: "12 abr 2026") |
| 27 | Regina Salas Montaño | alta | medio | Transferir |
| 32 | Pablo Serna Cantú | media | bajo | **Sin acción** (ninguna regla lo cubre) |

Cinco de ellos (2, 6, 11, 18, 27) traen `planDesarrollo` con palomitas ya marcadas.

---

## Fase 1 — hecha

**Backend**

- `src/types/domain.ts` — tipos `NivelMovilidad`, `NivelDesempeno`, `CursoItem`, `HabilidadPlan`,
  `PlanDesarrollo`, `HistorialPuesto` + los 9 campos en `Candidato`.
- `src/validators/crudSchemas.ts` — sub-esquemas y los campos en `candidatoFieldsSchema`.
- `src/constants/catalogs.ts` — los 7 catálogos nuevos.
- `src/data/seed.ts` — helper `ficha()` y la ficha de talento de los 9 internos.

**Front**

- `src/types/models/domain.ts` — espejo exacto de los tipos.
- `src/constants/catalogos.ts` — espejo exacto de los catálogos.
- `src/pages/admin/PoolPage.tsx` — columna **MOVILIDAD** con el tag de color (los externos muestran "—").
- `src/components/admin/CandidatoForm.tsx` — campos de semáforo, desempeño y antigüedad, visibles
  solo al marcar el tipo "interno".

**Verificado:** `typecheck` en los dos repos y `build` del front; los 9 internos pasan por
`candidatoBodySchema` sin perder ningún campo; las 13 declaraciones del espejo (6 tipos + 7
catálogos) son idénticas entre repos ignorando comentarios.

---

## Lo que queda

### Fase 2 · Vista de colaborador

- Ruta `/candidato/movilidad` y entrada **MOVILIDAD** en `Sidebar.tsx`, **solo si el candidato activo
  es interno**. Hoy `navPorRol` es una constante; hay que volverla función del candidato.
- Navegador superior de 3 secciones (no existe ningún componente de tabs reutilizable; hay que
  crear `SubNav`).
- **Ficha de talento**: nombre, puesto, antigüedad y semáforo arriba a la derecha; habilidades,
  cursos y puestos de interés. El **historial solo se pinta en la vista del formador**. Se añade
  también como pestaña en `components/candidato/PerfilModal.tsx`.
- **Ranking de vacantes**: tarjetas por afinidad reusando `matchScore` (`src/utils/match.ts`) con el
  formato del Marketplace, y debajo el historial separado en activas y cerradas.

### Fase 3 · Agente de movilidad

- Backend `src/agent-movilidad/`: runner, tools, prompt, sesiones y ruta SSE propios.
- **Replicar la persistencia por tool** de `src/agent/runner.ts` (`snapshotStore` → `hayCambios` →
  `persistChanged` alrededor de cada tool) y excluir la ruta nueva del middleware de escritura de
  `app.ts`. Sin eso, este agente repetirá el fallo de las notificaciones que se perdían.
- El plan generado **se persiste en `planDesarrollo`**: si no, las palomitas se pierden al recargar y
  el formador no puede leer el avance.
- Front: marco del puesto objetivo, índice de completitud, lista de checkboxes y el chat debajo.
  Manual del agente en un icono de interrogación reusando `components/common/InfoTip.tsx`.

### Fase 4 · Vista de formador

- `/formador/movilidad` con la tabla del equipo (internos con su `formadorId`), 11 columnas.
- Estatus derivado apoyándose en `PIPE_IDX` / `flujoService`: **"En proceso" = el candidato llegó a
  `evaluado`**, que es exactamente "terminó su primera entrevista con IA".
- **Estatus de equipo**: cuota de movilidad, avisos, puestos emergentes, postulaciones y estado de
  actualización de las fichas.
- **Etapas 1-4**: notificación de nuevo proceso con su ventana de fichas afines
  (`notificacionService.emitir`); bloqueo con `movilidadActivaVacId` siguiendo el patrón de
  `tieneProcesoActivo()` (`pipelineService.ts`); distintivo de perfil interno en el Marketplace;
  redirección al Marketplace al lanzar la vacante.

---

## Verificación por fase

```bash
npm --prefix reclutalia-backend-2-node-express run typecheck
npm --prefix reclutalia-front-2-react run typecheck && npm --prefix reclutalia-front-2-react run build
```

- **Fase 1** — guardar un interno desde el editor del admin y **releerlo**: prueba de que el campo
  sobrevivió al validador. Si desaparece sin error, falta declararlo en `candidatoFieldsSchema`.
- **Fase 2** — con un candidato **externo** en el selector demo, MOVILIDAD **no** debe aparecer; con
  uno interno, sí y con sus datos. El historial no se ve en la ficha propia y sí en la del formador.
- **Fase 3** — pedir un plan, marcar una habilidad, **recargar** y comprobar que sigue marcada; que el
  % de avance no altera el semáforo.
- **Fase 4** — un interno en `evaluado` debe salir como "En proceso"; forzar los cuatro cruces de
  acción recomendada y comprobar que el que no encaja cae en "Sin acción".
- **Cierre** — recorrer un proceso completo y comprobar que el bloqueo impide abrir un segundo.
