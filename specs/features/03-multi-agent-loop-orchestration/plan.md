# Implementation Plan: Multi-Agent Loop Orchestration
> **Feature ID:** `feat-03-multi-agent-loop-orchestration`  

---

## 1. Arquitectura de Componentes

- **Controlador de Bucle**: `src/core/agents/loop-controller.ts` (`MultiAgentLoopController`).
- **Motor de Prompts**: `src/core/agents/prompt-engine.ts` (`DynamicPromptEngine`).
- **Pizarra de Estado (Blackboard)**: Modelo de memoria compartida donde el Supervisor escribe los objetivos y los agentes especializados leen las intenciones vigentes.

---

## 2. Flujo de Auto-Corrección (Self-Healing)

```
[Inicio Turno i] -> Intenta Skill -> [Fallo de Ejecución] -> Genera Error Semántico -> [Turno i + 1: Prompt inyecta causa de fallo] -> Agente reformula plan alternativo -> Reintento
```

---

## 3. Criterios de Aceptación
- [x] Ejecución completa de ciclo `VALIDAR -> EJECUTAR -> AUDITAR` demostrada en tests unitarios.
- [x] Presupuesto de turnos respetado estrictamente al alcanzar el límite.
- [ ] Conexión en vivo con proveedores LLM (Anthropic / OpenAI / Google Gemini) mediante adapters desacoplados.
