# Spec Delta: todo-tasks

## MODIFIED Requirements

### Requirement: Flujos y selectores de test estables
El sistema SHALL conservar todos los flujos (crear, filtrar, buscar, editar, cambiar estado, eliminar con confirmación) y todos los `data-testid` existentes de la UI de tareas, que pasa a vivir en la ruta protegida `/tareas`. Los specs E2E SHALL actualizarse para entrar por esa ruta tras iniciar sesión y la suite `npx playwright test` SHALL quedar en verde.

#### Scenario: E2E sin cambios
- **WHEN** se ejecuta `npx playwright test` sobre los flujos de tareas
- **THEN** el flujo completo (registro/login, crear, filtrar, buscar, editar, completar, borrar) termina en verde conservando sus `data-testid` sin cambios

#### Scenario: E2E en verde con la nueva entrada
- **WHEN** se ejecuta `npx playwright test` con los specs actualizados (`todo.spec.ts`, `todo-auth.spec.ts`)
- **THEN** los flujos completos entran por `/tareas` tras iniciar sesión y terminan en verde conservando sus `data-testid`

#### Scenario: Mismos selectores tras el cambio de ruta
- **WHEN** el usuario autenticado opera la app en `/tareas`
- **THEN** los controles conservan los `data-testid` existentes (`new-title`, `create-btn`, `filter-*`, `edit-btn`, `save-btn`, `delete-btn`, `status-select`, entre otros)

## ADDED Requirements

### Requirement: La UI de tareas vive en /tareas
La interfaz de gestión de tareas (titular del día, formulario de creación, filtros, listado y footer) SHALL servirse en la ruta `/tareas`, protegida por sesión, sin cambios de comportamiento ni de layout respecto a la implementación actual.

#### Scenario: App completa en la ruta nueva
- **WHEN** un usuario autenticado abre `/tareas`
- **THEN** ve titular, formulario, filtros y listado operando igual que antes del cambio de ruta

#### Scenario: La raíz no sirve la app
- **WHEN** se solicita `/`
- **THEN** el sistema sirve la landing pública y no la interfaz de tareas
