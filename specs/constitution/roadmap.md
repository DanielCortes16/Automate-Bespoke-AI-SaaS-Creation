# Constitution: Platform Roadmap & Milestones
> **Automate-Bespoke-AI-SaaS-Creation Engine**

---

## Fases de Evolución del Motor

```mermaid
gantt
    title Roadmap de Implementación de la Plataforma
    dateFormat  YYYY-MM
    section Fase 1
    Fundamentos Core & TypeScript Runtime      :done,    des1, 2026-08, 2026-09
    Safety Harness & Circuit Breaker HITL      :done,    des2, 2026-09, 2026-09
    WORM Ledger & NATS JetStream Bus           :done,    des3, 2026-09, 2026-09
    Catálogo de 18 Skills Modulares + Saga     :done,    des4, 2026-09, 2026-09
    section Fase 2
    Compilador YAML & Validador de Spec Zod    :active,  des5, 2026-09, 2026-10
    Gestor de Estado Blackboard (Redis Cache)  :         des6, 2026-10, 2026-10
    section Fase 3
    Host MCP & Conectores IoT/ERP              :         des7, 2026-10, 2026-11
    Runtime de Aprobación Dual HITL            :         des8, 2026-11, 2026-11
    section Fase 4
    Renderer Headless de UI Bespoke            :         des9, 2026-11, 2026-12
    Telemetría OpenTelemetry & Prometheus      :         des10, 2026-12, 2027-01
```

---

## Hitos Clave

- **Hito 1 (Completado)**: Arquitectura base desacoplada, 18 skills implementadas con Zod y tests unitarios automatizados pasando en Node.js v26.
- **Hito 2 (En Curso)**: Estructuración formal de especificaciones y gobernanza por características (`specs/features/`).
- **Hito 3**: Integración completa con servidores MCP locales y remotos para IoT y facturación fiscal.
- **Hito 4**: Compilador de UI token-driven que genera vistas interactivas (plano de mesas, tableros Kanban, tablas de inventario) a partir del YAML.
- **Hito 5**: Autoservicio de aprovisionamiento de inquilinos con métricas de costo y consumo de tokens por cliente.
