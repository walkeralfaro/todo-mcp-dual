# Proposal

## Why

La landing actual presenta demasiados fragmentos visuales a la vez y varios quedan recortados o compiten con sus textos, por lo que cuesta entender el producto en una primera visita. Una composición más clara debe explicar primero que web y agentes MCP comparten las mismas tareas, y permitir comprobarlo con contenido legible en escritorio y móvil.

## What Changes

- Reorganizar la landing alrededor de una promesa clara, una demo local, una guía MCP breve, la configuración copiable y una llamada a la acción.
- Sustituir el mosaico denso de fragmentos por pruebas visuales puntuales, legibles y sin recortes accidentales.
- Eliminar estimaciones de tiempo no verificadas y textos de sección ambiguos; describir capacidades reales con pasos numerados.
- Ajustar la composición responsive y los controles del header para que sean cómodos de leer, tocar y recorrer con teclado.
- Conservar el acceso dirigido, la demo sin persistencia, la configuración copiable y la navegación para usuarios con sesión.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `landing-page`: define una jerarquía visual enfocada en la promesa del producto, pruebas legibles, una guía MCP sin cifras inventadas y composición usable en móvil.
- `user-auth-ui`: exige controles de acción del header con un área mínima de interacción adecuada para pantallas táctiles, preservando la navbar compartida.

## Impact

- Componentes de presentación en `app/page.tsx` y `components/landing/`.
- Estilos de fragmentos en `app/globals.css` y acciones compartidas en `components/site-header.tsx`.
- Sin cambios de rutas, autenticación, persistencia, herramientas MCP ni dependencias.
- Verificación visual con Playwright en 390, 768 y 1440 px, además de navegación por teclado y estados autenticados/anónimos.
