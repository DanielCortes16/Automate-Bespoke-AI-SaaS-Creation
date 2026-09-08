# Implementation Plan: Modular Skills & Saga Orchestration
> **Feature ID:** `feat-04-modular-skills-saga`  

---

## 1. Arquitectura de Componentes

- **Runtime de Ejecución**: `src/core/skills/skill-runtime.ts` (`SkillRuntime`).
- **Módulos de Dominio**: `src/skills/accounting/`, `src/skills/inventory/`, `src/skills/maintenance/`, `src/skills/hospitality/`, `src/skills/service/`, `src/skills/compliance/`.
- **Cargador Central**: `src/skills/index.ts` (`registerAllStandardSkills`).

---

## 2. Flujo de Transacción Saga

```
[Skill 1: Crear Factura OK] -> [Skill 2: Dispersar Pago FALLA] -> [Disparador Saga: Ejecutar Compensación de Skill 1 (Nota de Crédito)]
```

---

## 3. Criterios de Aceptación
- [x] 18 skills implementadas con esquemas Zod en `src/skills/`.
- [x] Compensaciones Saga implementadas y testeadas en `test/skills.test.ts`.
- [ ] Conexión de los handlers a los esquemas dinámicos de base de datos PostgreSQL con RLS.
