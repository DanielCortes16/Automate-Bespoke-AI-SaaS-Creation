# Task Breakdown: Spec-Driven Declarative Engine
> **Feature ID:** `feat-01-spec-engine`  

---

## Lista de Tareas de Ingeniería

- [x] **TASK-01.1**: Definir interfaces formales TypeScript en `src/types/spec.ts`.
- [x] **TASK-01.2**: Implementar esquema de validación Zod canónico `SaaSSpecSchema` en `src/core/spec/spec-validator.ts`.
- [x] **TASK-01.3**: Implementar clase `SpecLoader` capaz de cargar y parsear archivos `.yaml` y `.json`.
- [x] **TASK-01.4**: Añadir verificador de integridad semántica (comprobar que cada skill asignada a un agente exista en el catálogo).
- [x] **TASK-01.5**: Desarrollar suite de tests en `test/spec-engine.test.ts` con casos de éxito y casos de fallo de validación controlados.
