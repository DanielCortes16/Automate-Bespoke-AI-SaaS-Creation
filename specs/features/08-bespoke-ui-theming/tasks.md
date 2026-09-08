# Task Breakdown: Bespoke Headless UI & Theming
> **Feature ID:** `feat-08-bespoke-ui-theming`  

---

## Lista de Tareas de Ingeniería

- [x] **TASK-08.1**: Definir esquema `BrandingConfig` en `src/types/spec.ts`.
- [ ] **TASK-08.2**: Implementar función utilitaria `generateCssVariables(tokens: BrandingTokens): string` que serialice los tokens en variables CSS.
- [ ] **TASK-08.3**: Construir componente reactivo `DynamicModelForm` que lea un `DataModel` y genere campos de formulario accesibles y validados.
- [ ] **TASK-08.4**: Implementar componente `FloorPlanRenderer` para renderizado interactivo SVG de mesas o activos espaciales con coordenadas `(posicion_x, posicion_y)`.
- [ ] **TASK-08.5**: Implementar hook `useTenantRealtimeEvent()` para conectar el frontend con NATS JetStream vía SSE.
