## Objetivo

Rediseñar la Página 3 del `/BDVbrochure` ("02 · La Oportunidad") para que **todos los cuadros vivan dentro del fondo dinámico** (aurora + rejilla + skyline + haz de escaneo), organizados como un **mosaico bento** compacto, moderno y legible, sin cajas alargadas ni espacios vacíos.

## Situación actual

Hoy la lámina tiene 3 bloques separados y desconectados:
1. Un panel "hero" oscuro con el fondo animado (ecuación de alianza + manifiesto).
2. Una fila de 3 "Pilares" con fondo claro, **fuera** del fondo dinámico.
3. Una fila de 3 "Action Items" oscuros de 150px, también fuera.

Resultado: cajas anchas y bajas, con mucho aire interno, y una estética partida entre claro y oscuro.

## Nueva estructura

Un solo contenedor a página completa con el fondo dinámico, y encima una **rejilla bento de 6 columnas** con celdas de distinto tamaño:

```text
+--------------------------------------------------------------+
| HEADER: Caracas 10.48°N · 66.90°O        [ALIANZA · EN VIVO]  |
+----------------------+----------------------+----------------+
| BDV (2col)      +    | SFH (2col)      =    | RESULTADO      |
|                      |                      | Caracas Hub    |
+----------------------+----------------------+ (2col x 2fil)  |
| MANIFIESTO (4 col x 1 fila)                 |                |
+--------+--------+--------+------------------+----------------+
| P·01   | P·02   | P·03   | 01 El momento es ahora            |
| Corred.| AI     | Talento| 02 Talento venezolano             |
| (mini) | (mini) | (mini) | 03 Caracas del futuro             |
+--------+--------+--------+-----------------------------------+
```

Detalles del mosaico:
- **Nodos de alianza (BDV / SFH / Resultado):** vidrio translúcido sobre el fondo, con los operadores `+` y `=` como *tiles* cuadrados pequeños de color (no como texto suelto), llenando huecos.
- **Manifiesto:** tile ancho pero de altura contenida; texto a 17–18px para que no quede aire sobrante.
- **Pilares:** pasan de tarjetas claras anchas a **3 tiles compactos** (icono + título + una línea), en cristal oscuro con acento de color — coherentes con el fondo.
- **Acciones:** de 3 cajas de 150px a una **columna de 3 filas** apiladas a la derecha, cada una con número fantasma, icono y una línea de texto; densas, sin espacio muerto.
- **Tiles de relleno de color:** pequeños cuadros de acento (cian / magenta / lima) con micro-datos (ej. `5M+ hab.`, `50/50`, `T1 2026`) para cerrar los huecos de la rejilla en lugar de dejar vacíos.

## Reglas de diseño

- Todo dentro del panel del fondo dinámico: se elimina la sección clara separada.
- Densidad: `gap` de 10px, padding interno de tiles 12–14px, sin `justify-between` que estire el contenido.
- Legibilidad: texto blanco con sombra sobre velo oscuro en cada tile (`rgba(6,12,22,0.62)` + `backdrop-blur`).
- Se conservan las animaciones existentes (`bdv-aurora`, `bdv-grid`, `bdv-scan`, `bdv-stars`, `bdv-sweep`, `bdv-edge`) y se añade un hover/entrada escalonada por tile.
- Ajuste A4: la rejilla usa filas proporcionales (`grid-template-rows`) para que ocupe exactamente el alto disponible, sin desbordes ni recortes; verificación en escritorio y en la vista móvil de una sola página.

## Alcance técnico

- Único archivo: `src/pages/BDVBrochure.tsx`, bloque de la Página 3 (aprox. líneas 1134–1307).
- Solo cambios de presentación: mismo contenido en español, mismos tokens `NEON`, mismos iconos Lucide. Sin cambios de datos ni de rutas.
