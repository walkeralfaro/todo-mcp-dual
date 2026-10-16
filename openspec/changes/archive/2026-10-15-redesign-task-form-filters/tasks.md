# Tasks

## 1. Base shadcn mínima

- [x] 1.1 Inicializar shadcn (`npx shadcn@latest init` + `add button input label field toggle-group spinner` con `--dry-run`) y verificar que `components.json` y `components/ui/*` existen sin errores de alias `@/`
- [x] 1.2 Mapear tokens existentes (`ground/surface/ink/muted/accent`) a variables shadcn en `app/globals.css` (Tailwind v4) y verificar con `npm run build` que no hay colores crudos ni regresión visual de fondo/tinta

## 2. Rediseño TaskForm accesible

- [x] 2.1 Reescribir `components/task-form.tsx` con `FieldGroup` + `Field` + `FieldLabel` + `Input` + `Button`/`Spinner` (etiquetas visibles, `aria-invalid` + `aria-describedby`, `autocomplete="off"`) conservando `data-testid="new-title|new-desc|create-btn"` y verificar con `npm test` que el render expone ambas etiquetas asociadas
- [x] 2.2 Añadir manejo de error accesible (mensaje Server Action en `FieldError` con `role="alert"`, foco al primer campo inválido, `aria-busy` + `Spinner` durante `useTransition`) y verificar provocando título vacío que el error se anuncia y el foco cae en el título

## 3. Rediseño TaskFilters accesible

- [x] 3.1 Migrar filtro de estado a `ToggleGroup type="single"` (4 items con `data-testid="filter-*"`, sincronía con `?estado=` y navegación por teclado) y verificar por teclado que solo un valor queda activo y la URL refleja el cambio
- [x] 3.2 Reescribir buscador con `role="search"` + `InputGroup` (icono `aria-hidden`, botón limpiar con `aria-label`, debounce ~300 ms, `aria-live="polite"` en conteo) conservando `data-testid="search"` y verificar escribiendo rápido que solo hay una navegación tras 300 ms y que limpiar vacía `?q=` y devuelve el foco al campo

## 4. Jerarquía, foco e integración

- [x] 4.1 Aplicar jerarquía y foco (título sección 18–20px semibold `text-balance`, etiquetas 14px medium, ayuda/error 13–14px, `focus-visible:ring-2 ring-accent` sin `outline-none`, `…` en placeholders, `tabular-nums` en conteo) y verificar por tabulación que todo control muestra anillo de 2px y la inspección confirma verde solo en primario/COMPLETADA
- [x] 4.2 Ejecutar verificación integral (`npm test` + `npx playwright test e2e/todo.spec.ts` sin modificar el spec) y revisión contra web-interface-guidelines (labels, foco, `aria-live`, sin `transition:all` ni `div onClick`) y verificar que todo pasa en verde
