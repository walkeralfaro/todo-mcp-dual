# Spec Delta

## Purpose

Publica el documento interactivo de arquitectura del proyecto como recurso estático del sitio, de modo que cualquier visitante pueda entender cómo está construido sin acceder al repositorio, y garantiza que ese recurso siga a la fuente versionada en vez de desfasarse.

## ADDED Requirements

### Requirement: Documento de arquitectura publicado como recurso estático

El sistema SHALL servir el documento interactivo de arquitectura en la ruta pública `/arquitectura` como HTML, sin exigir sesión ni datos de ningún usuario, y SHALL mantenerlo accesible también en su ruta con extensión `/arquitectura.html`. La respuesta SHALL contener el documento de arquitectura vigente y no SHALL exponer tareas, correos ni credenciales.

#### Scenario: Visitante anónimo abre la documentación

- **WHEN** un visitante sin sesión solicita `/arquitectura`
- **THEN** recibe un `200` con `Content-Type` HTML que contiene el documento de arquitectura, sin redirección al modal de acceso y sin datos de ningún usuario

#### Scenario: Ruta con extensión sigue disponible

- **WHEN** se solicita `/arquitectura.html`
- **THEN** se sirve el mismo documento que en `/arquitectura`

#### Scenario: Documento autocontenido

- **WHEN** el documento se carga en el navegador sin red externa disponible
- **THEN** su contenido, sus diagramas y su conmutador de tema siguen funcionando porque no requiere scripts, hojas, fuentes ni imágenes de terceros

### Requirement: Publicación desde una fuente versionada y sincronizada

El sistema SHALL publicar el recurso a partir del documento de arquitectura versionado en `docs/`, mediante una copia idempotente hacia `public/` que se ejecuta antes de arrancar el entorno de desarrollo y antes de compilar. Si la fuente no está disponible, el paso de publicación SHALL NOT interrumpir el arranque ni la compilación, y SHALL dejar constancia en la salida.

#### Scenario: El recurso se publica al arrancar y al compilar

- **WHEN** se ejecuta el arranque en desarrollo o la compilación del proyecto
- **THEN** el archivo publicado en `public/` coincide con el documento versionado en `docs/`

#### Scenario: Copia idempotente

- **WHEN** el paso de publicación se ejecuta dos veces seguidas sin cambios en la fuente
- **THEN** el resultado es el mismo archivo y el paso termina correctamente

#### Scenario: Fuente ausente no rompe el build

- **WHEN** el documento versionado en `docs/` no existe
- **THEN** el arranque y la compilación continúan, la copia se omite y el paso informa de la omisión
