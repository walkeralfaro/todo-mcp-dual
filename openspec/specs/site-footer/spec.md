# site-footer Specification

## Purpose

Define el pie de página global de la aplicación: su crédito, su presencia en
todas las páginas del layout raíz y su anclaje al fondo sin usar
`position: fixed` ni tapar contenido.

## Requirements

### Requirement: Pie de página global con crédito al fondo

El sistema SHALL mostrar en todas las páginas del layout raíz (`/`, `/tareas`
y `/mcp`) un pie con el texto "developed with ❤️ by walker alfaro". El pie SHALL
participar del flujo normal dentro de la columna del layout, sin
`position: fixed`, de modo que quede anclado al borde inferior del viewport
cuando el contenido sea más corto que la pantalla y, cuando haya scroll,
aparezca al final del documento. El pie SHALL NOT superponerse al contenido ni
al elemento con foco.

#### Scenario: Pie al fondo con contenido corto

- **WHEN** se abre una página cuyo contenido es más corto que el viewport
- **THEN** el pie queda en el borde inferior del viewport, totalmente visible y sin superponerse al contenido

#### Scenario: Pie al final del documento con contenido largo

- **WHEN** el contenido de la página supera la altura del viewport y el usuario hace scroll hasta el final
- **THEN** el pie aparece después de todo el contenido, al final del documento, y nunca cubre contenido mientras se desplaza

#### Scenario: Crédito presente en las tres páginas

- **WHEN** el usuario visita `/`, `/tareas` o `/mcp`
- **THEN** ve el texto "developed with ❤️ by walker alfaro" como único pie de la página
