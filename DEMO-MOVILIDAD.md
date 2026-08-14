# Guía de la demo · Movilidad interna

Con qué perfil entrar para ver cada cosa. Generado a partir de `back/src/data/seed.ts`; si cambias
la semilla, vuelve a comprobarlo corriendo las reglas de `front/src/utils/movilidad.ts`.

> Todo esto se restaura con **"Regresar a la seed"** (menú lateral, perfil Administrador).

---

## Por dónde empezar

**Entra como formador y elige a Laura Mendoza (F1).** Su equipo es el único que tiene los **seis
estatus y las cuatro acciones** a la vez, así que el módulo se ve completo sin cambiar de perfil.

| Quiero ver… | Perfil | Dónde |
|---|---|---|
| El módulo completo | Formador · **Laura Mendoza (F1)** | Movilidad interna |
| El botón **Agradecer** | Formador · **Laura Mendoza (F1)** | Fila de Mariel Ochoa (contratada) |
| Un colaborador **bloqueado** por haber pasado la IA | Colaborador interno · **Brenda Alcántara** | Buscar vacantes |
| La **ficha de talento** y el agente de movilidad | Colaborador interno · **Jorge Luis Peña** | MOVILIDAD |
| Un expediente con **actas** en Honesteles | Formador · **Adriana Peralta (F5)** | Ficha de Marcos Ibáñez |
| Un candidato **sin** ficha de talento | Candidato externo · **Valeria Ortiz** | No aparece MOVILIDAD |

---

## Equipos por formador

### F1 · Laura Mendoza Prieto — Gerente de Ventas Digitales

**Es el equipo de demostración: aquí están todos los casos.**

| Colaborador | Puesto | Estatus | Acción | Semáforo | Actas | Afines |
|---|---|---|---|---|---|---|
| Jorge Luis Peña Ríos (2) | Asesor comercial | En búsqueda | Transferir | alta | 0 | 1 |
| Pablo Serna Cantú (32) | Promotor financiero | Actualizado | Formar | media | 1 | 0 |
| Ana Karen Domínguez Ruiz (33) | Ejecutiva de cuentas clave | Actualizado | Promover | alta | 0 | 0 |
| Luis Ángel Moreno Tapia (34) | Asesor comercial | Actualizado | Formar | media | 0 | 0 |
| Gerardo Ponce Villalobos (35) | Auxiliar de cobranza | **Inactivo** | **Desvincular** | baja | 1 | 0 |
| Brenda Alcántara Ruvalcaba (36) | Ejecutiva de ventas retail | **En proceso** | Transferir | alta | 0 | 1 |
| Emiliano Vázquez Cordero (37) | Coordinador de piso | **Seleccionado** | Formar | alta | 0 | 1 |
| Mariel Ochoa Zepeda (38) | Asesora comercial senior | **Contratado** | Formar | media | 0 | 1 |

### F2 · Arturo Castillo Vega — Director de Datos

| Colaborador | Puesto | Estatus | Acción | Semáforo |
|---|---|---|---|---|
| Diego Ramírez Cline (6) | Analista de BI | En búsqueda | Promover | alta |

### F3 · Mónica Herrera Lazcano — Gerente de Tecnología

| Colaborador | Puesto | Estatus | Acción | Semáforo |
|---|---|---|---|---|
| Paola Reyes Ibarra (11) | Desarrolladora Frontend Jr | En búsqueda | Formar | media |
| Renata Villaseñor Ochoa (15) | Analista de CRM | Actualizado | Promover | alta |

### F4 · Ricardo Fuentes Manzo — Gerente de Sucursales

| Colaborador | Puesto | Estatus | Acción | Semáforo |
|---|---|---|---|---|
| Ximena Rosales Vidal (21) | Generalista de RRHH | Actualizado | Formar | baja |
| Regina Salas Montaño (27) | Agente senior | En búsqueda | Transferir | alta |

### F5 · Adriana Peralta Nieto — Gerente de Operaciones

| Colaborador | Puesto | Estatus | Acción | Semáforo | Actas |
|---|---|---|---|---|---|
| Óscar Beltrán Nava (18) | Auxiliar contable | En búsqueda | Formar | media | **en revisión** |
| Marcos Ibáñez Cruz (24) | Jefe de piso | **Inactivo** | **Desvincular** | baja | **2** |

---

## Vacantes y quién está en cada una

| ID | Título | Formador | Estado | En pipeline |
|---|---|---|---|---|
| V-1042 | Cajero Supervisor | F1 | asignada | — |
| V-1035 | Desarrollador Frontend | F2 | abierta | — |
| V-1050 | Ingeniero de Datos | F3 | asignada | — |
| V-1051 | Ejecutivo de Atención a Clientes | F4 | asignada | — |
| V-1052 | Supervisor de Operaciones | F5 | asignada | — |
| V-1053 | Ejecutivo de Ventas Digitales | F1 | abierta | Brenda Alcántara (**evaluado**) |
| V-1054 | Coordinador de Call Center | F4 | abierta | Emiliano Vázquez (**seleccionado**) |
| V-1055 | Ejecutivo de Ventas Digitales · Turno vespertino | F1 | **cerrada** | Mariel Ochoa (**contratado**) |

Las vacantes `asignada` todavía no tienen Marketplace: hay que aprobarlas para que se construya.

---

## Cosas que conviene saber al probar

**El bloqueo empieza tarde a propósito.** Un colaborador puede postularse a varias vacantes; solo
queda bloqueado **al pasar la entrevista con IA**. Brenda (36) ya está en ese punto, así que si
entras con ella e intentas postularte a otra vacante, te lo impide. Un **externo**, en cambio, se
bloquea desde su primer proceso.

**Quién ve qué.** Tres cosas del colaborador **solo las ve su formador**, nunca él mismo:

- el **desempeño**,
- el **detalle de las actas** de Honesteles (el estatus sí lo ve),
- el **resumen** que el formador escribe al agradecerle.

**"Inactivo" son 6 meses** sin tocar la ficha, y se avisa al formador cuando abre el módulo: es el
único estatus al que se llega sin que nadie haga nada.

**Sin `DATABASE_URL` no hay memoria de chat.** El agente de movilidad funciona y guarda lo que
escribe en la ficha, pero cada mensaje arranca sin recordar el anterior. No es un fallo del agente.

**Los dos botones del menú (perfil Administrador) no hacen lo mismo:**

- **Regresar a la seed** — repuebla todo con estos datos.
- **Borrar todo** — deja formadores, candidatos y vacantes, pero sin ningún proceso, notificación ni
  conversación. Como si nadie hubiera trabajado con ellos.

Ninguno pide token.
