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
| **2** | Vista de colaborador: sección MOVILIDAD | **Hecha** |
| **3** | Agente de movilidad | **Hecha** |
| **4** | Vista de formador: módulo "Movilidad interna" | **Hecha** |

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

**Honesteles es la plataforma de actas administrativas** (aclarado después de la Fase 4, ya
implementado). Criterio de visibilidad: **el estatus lo ven los dos roles, el detalle de las actas
solo el formador**, igual que el historial de puestos. El **estatus no se guarda, se deriva** de
`actas` + `enRevision` con `estatusHonesteles()`; un estatus almacenado podría decir "sin actas"
teniendo dos.

**El desempeño solo lo ve el formador.** Es la evaluación que hace el jefe sobre el colaborador, así
que no aparece en la ficha que el colaborador ve de sí mismo. La prop `vistaFormador` de
`FichaTalento` gobierna las tres cosas: historial, desempeño y detalle de actas.

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

## Fase 2 — hecha

**Backend**

- `src/data/seed.ts` — **dos vacantes abiertas nuevas** (V-1053 Ejecutivo de Ventas Digitales,
  V-1054 Coordinador de Call Center). Era un hueco de la Fase 1: con una sola vacante abierta el
  ranking salía casi vacío y **"Transferir" no se podía disparar nunca**, porque exige una vacante
  por encima del 70% de afinidad. **Cuidado al tocarlas:** "Promover" exige justo lo contrario
  —ninguna por encima del 70%—, así que una vacante nueva afín a Diego (6) o Renata (15) les
  cambiaría la acción recomendada.

**Front**

- `src/utils/movilidad.ts` — **todas las reglas en un solo sitio**: semáforo, antigüedad,
  `haceCuanto`, `perfilInactivo`, `avancePlan`, `rankingVacantes`, `estatusMovilidad` y
  `accionRecomendada`. La Fase 4 solo tiene que pintarlas.
- `src/utils/format.ts` — se expone `parseFechaMx` (antes privada como `parseCreada`) y se añade
  `diasDesde`. **`fechaVal` no sirve para esto**: devuelve un número ordenable, no una fecha real.
- `src/components/movilidad/FichaTalento.tsx` — la usan las dos vistas; `verHistorial` controla que
  el historial de puestos solo se vea desde la del formador.
- `src/components/movilidad/PlanDesarrolloPanel.tsx` — puesto objetivo, índice de avance y
  palomitas interactivas.
- `src/pages/candidato/MovilidadPage.tsx` — las 3 secciones. La de ranking reusa
  `DetalleVacanteModal` + `AplicarModal` y el guardia `procesoActivoEnOtra`, para que el botón de
  aplicar haga algo de verdad.
- `src/components/layout/Sidebar.tsx` — `navPorRol` sigue siendo constante; se añadió `navDe(rol,
  cand)` que le inserta MOVILIDAD **solo a los internos**.
- `src/components/candidato/PerfilModal.tsx` — pestañas Perfil / Ficha de talento, solo para internos.
- `src/routes/AppRoutes.tsx` — `/candidato/movilidad`.

**Decisiones de esta fase**

- **No hizo falta crear `SubNav`**: `base.css:194-197` ya trae `.tabs` / `.tab` / `.tab.on`, que es
  justo el navegador superior que pedía el documento. Lo usan ya `PerfilEditor` y `VacanteForm`.
- El manual del agente va en `InfoTip`, que **abre al pulsar, no al pasar por encima**. El documento
  pedía hover, pero en móvil no existe y ese componente se arregló en su día justamente para que no
  hiciera falta pulsar dos veces.
- Las palomitas mandan el candidato **completo** a `guardarCandidato`. Es obligatorio: reemplaza el
  objeto entero, así que enviar solo el plan borraría el resto de la ficha.

**Verificado:** `typecheck` en los dos repos y `build` del front; el backend arrancado en un puerto
aparte sirve las 3 vacantes abiertas y la ficha completa por HTTP; y **alternar una palomita con
`PUT /api/candidatos/2` la persiste (3→4) sin perder cursos, historial ni semáforo**.

Reparto que producen las reglas sobre la semilla — los seis casos se disparan:

| id | Estatus | Acción | Plan | Mejor afinidad |
|---|---|---|---|---|
| 2 | En búsqueda | **Transferir** | 3/5 | 98% |
| 6 | En búsqueda | **Promover** | 3/4 | 37% |
| 11 | En búsqueda | **Formar** | 1/4 | 79% |
| 15 | Actualizado | Promover | — | 42% |
| 18 | En búsqueda | Formar | 2/4 | 46% |
| 21 | Actualizado | **Agradecer** | — | 32% |
| 24 | **Inactivo** | **Desvincular** | — | 61% |
| 27 | En búsqueda | Transferir | 3/4 | 98% |
| 32 | Actualizado | **Sin acción** | — | 45% |

---

## Fase 3 — hecha

**Backend**

- `src/services/movilidadService.ts` — toda la lógica: `ficha`, `vacantesAfines`,
  `definirPuestosInteres`, `agregarCurso`, `guardarPlan`, `marcarHabilidad`, `iniciar`, `cerrar`,
  `equipoDe`. **Cualquier escritura toca `perfilActualizado`**, que es lo que decide el estatus
  "Inactivo": si no se moviera solo, la tabla del formador mentiría.
- `src/agent-movilidad/` — `tools.ts` (9 tools), `systemPrompt.ts`, `runner.ts`, `sessions.ts`.
- `src/controllers/movilidadAgentController.ts` + rutas `POST /api/movilidad/chat`,
  `GET /api/movilidad/:cid/ficha`, `GET /api/movilidad/:cid/vacantes`.
- `src/app.ts` — `/api/movilidad/chat` **excluida del middleware de escritura**, como
  `/api/agente/*`. El runner replica la persistencia por tool; sin las dos cosas este agente habría
  repetido el fallo de las notificaciones perdidas.

**Front**

- `src/services/sse.ts` — el parser de SSE extraído. Lo comparten los dos agentes: es transporte
  (bytes y separadores), no lógica de agente.
- `src/services/movilidadAgenteService.ts` — sesión con prefijo `mov-` por colaborador.
- `src/components/agente/AgentChat.tsx` — props nuevas `enviar` y `placeholder`. **`AgentChat` sigue
  siendo el único chat**: `CLAUDE.md` prohíbe duplicar su lógica de streaming, así que lo que cambia
  entre agentes es a dónde va el mensaje, no cómo se pinta.
- `src/pages/candidato/MovilidadPage.tsx` — el chat montado en la sección del agente, con `reload()`
  al terminar cada turno para ver lo que el agente acaba de escribir en la ficha.

**Qué comparte con el agente general** (decisión, no descuido): `agent/deepseek.ts` (cliente HTTP del
proveedor), `services/sse.ts` (parser de bytes), `db/chatRepository` y sus tablas, y `AgentChat`.
Todo lo que define al agente —prompt, tools, runner, ruta, sesiones— es propio.

**Trampa encontrada:** el prompt decía "confirma antes de guardar un plan" y el modelo **describía el
plan en prosa sin llamar a `proponer_plan`**, así que no quedaba nada guardado. Corregido: se guarda
en el mismo turno (el plan es reversible) y la confirmación se reserva para `iniciar_movilidad`, que
sí postula de verdad y bloquea los demás procesos.

**Verificado** contra el backend levantado en un puerto aparte, con conversaciones reales:

| Escenario | Resultado |
|---|---|
| "Ármame un plan hacia Gerente de lealtad" | `mi_ficha → catalogos_habilidades → vacantes_afines → proponer_plan`; plan guardado, **avance 4 de 9** porque marcó como hechas las que su ficha ya demuestra |
| "Ya terminé Liderazgo, márcalo" | `marcar_habilidad`; avance 4→5, y de paso añadió el curso |
| Regina inicia movilidad en V-1054 | `movilidadActivaVacId = V-1054`, pipeline `27: postulado`, y **notificación a su formador F4** (ETAPA 1) |
| Regina intenta un segundo proceso | El agente lee la ficha, ve el proceso en curso y **lo rechaza sin intentarlo** (ETAPA 3) |
| Ficha de un externo | `ValidationError`: "La movilidad interna es solo para colaboradores del grupo." |

**Ojo al probar en local:** sin `DATABASE_URL` **no hay memoria de chat** (lo documenta `CLAUDE.md`),
así que cada turno arranca en blanco y una conversación de varios turnos parece que "olvida". No es
un fallo del agente.

---

## Fase 4 — hecha

Todo en el front: las reglas ya estaban en `utils/movilidad.ts` desde la Fase 2, así que esta fase
fue casi solo pintarlas.

- `src/pages/formador/MovilidadInternaPage.tsx` — ruta `/formador/movilidad`, dos secciones y el
  aviso de procesos de movilidad abiertos.
- `src/components/movilidad/TablaEquipo.tsx` — las 11 columnas del documento. **Estatus y acción
  recomendada se calculan al pintar**, nunca se leen de un campo guardado.
- `src/components/movilidad/EstatusEquipo.tsx` — cuota de movilidad, movimientos posibles, puestos
  emergentes, fichas sin actualizar y postulaciones de la plantilla.
- `src/components/movilidad/ProcesoMovilidadModal.tsx` — la ventana de la ETAPA 1: quién se mueve,
  el puesto que quedaría por cubrir y las fichas que podrían cubrirlo.
- `src/utils/movilidad.ts` — se añadieron `afinidadEntre`, `candidatosParaCubrir` y `enMovilidad`.
- `src/components/layout/Sidebar.tsx` — entrada "Movilidad interna" para el formador.

**Por qué `afinidadEntre` y no `matchScore`:** `matchScore` compara un candidato contra un
`Requisito`, y el puesto que deja quien se mueve **no es una vacante todavía** —prever eso es
justamente el punto—. `afinidadEntre` mide el solapamiento de perfiles con el mismo reparto de pesos
(especialidades por encima de todo) y es determinista.

**Etapas del documento que YA estaban hechas** y no hizo falta tocar:

| Etapa | Dónde estaba |
|---|---|
| [F] Distinguir internos en el Marketplace | `VacanteDetailPage.tsx:154,377` (tag) y `:286` (filtro Ambos/Internos/Externos) |
| [F] Redirigir al Marketplace al lanzar la vacante | Los **tres** caminos de aprobación ya navegan a `?tab=1`: `RevisarVacantePage`, `PlantillaCards` y `VacanteDetailPage` |
| [C] Bloqueo del segundo proceso | `movilidadService.iniciar()` (Fase 3) |
| [F] Notificación de nuevo proceso | `movilidadService.iniciar()` (Fase 3) |

**Verificado** con las reglas corridas sobre la semilla: los 5 formadores tienen plantilla, las seis
acciones se reparten entre ellos, y la sucesión de la ETAPA 1 solo propone perfiles de semáforo
verde (para Regina: Jorge 48%, Renata 21%, Diego 12%). La afinidad es simétrica y da el mismo valor
al repetirla.

---

## Ajustes posteriores (13 ago 2026) — hechos

Cinco cambios pedidos tras revisar las cuatro fases:

- **Honesteles implementado.** Tipos `ActaAdministrativa` y `Honesteles` en los dos `domain.ts`,
  declarados en `candidatoFieldsSchema`, y los 9 internos sembrados: Marcos (24) con dos actas,
  Pablo (32) con una leve, Óscar (18) con una en revisión y el resto con expediente limpio.
  Sección nueva en `FichaTalento` y helper `estatusHonesteles()` en `utils/movilidad.ts`.
- **Desempeño oculto al colaborador.** `verHistorial` pasó a llamarse **`vistaFormador`** en
  `FichaTalento` y ahora gobierna historial, desempeño y detalle de actas.
- **Semáforo en el Marketplace y al invitar.** Chip de movilidad en la columna de acciones de
  `poolCard` (`VacanteDetailPage`) y en `InvitarModal`. Solo internos.
- **Columna ACTAS** en `TablaEquipo`, entre Semáforo y Estatus.
- **El agente tiene en cuenta las actas.** `movilidadService.ficha()` devuelve **cuántas actas hay y
  si alguna está en revisión, nunca los motivos**: el agente habla con el colaborador, que tampoco
  los ve. Regla añadida al prompt para que lo mencione de forma factual y no invente motivos.
- **CURP igualado al resto.** Se quitó la exclusión `k !== "curp"` de `MisProcesosPage`; era el único
  documento sin "Actualizar / Ver / Usar actual" para internos.

**Verificado:** espejo de los tipos nuevos idéntico entre repos; los tres estatus derivados correctos
sobre la semilla (con concordancia singular/plural); guardado real por `PUT /api/candidatos/24` que
conserva el expediente entero; y `GET /api/movilidad/24/ficha` devuelve `{actas: 2, ...}` **sin
ningún motivo**.

---

## Lo que queda

**Una sola cosa del documento original:**

**"[F] Agente traduce el descriptivo de vacante, el formador confirma o edita"** (ETAPA 3) — la frase
es ambigua y no se implementó. Ya existen `clasificar_vacante`, `perfilIA` y `tituloIA`, que hacen
algo parecido; conviene aclarar qué se esperaba antes de construir nada.

### Ideas anotadas, no pedidas

- El semáforo no se recalcula nunca. Si algún día se quiere una **sugerencia** calculada al lado del
  campo del administrador, la fórmula natural es la completitud del plan más la antigüedad.
- El agente de movilidad **no tiene handler de desconexión** en su SSE, igual que el agente general:
  si el colaborador cierra la pestaña a mitad de turno, el bucle sigue gastando llamadas al modelo.
  Los datos están a salvo gracias a la persistencia por tool; el gasto no.

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
