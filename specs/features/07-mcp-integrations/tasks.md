# Task Breakdown: Model Context Protocol (MCP) Integrations
> **Feature ID:** `feat-07-mcp-integrations`  

---

## Lista de Tareas de Ingeniería

- [x] **TASK-07.1**: Definir interfaz `MCPServerConfig` en `src/types/spec.ts`.
- [ ] **TASK-07.2**: Integrar dependencia `@modelcontextprotocol/sdk` en `package.json`.
- [ ] **TASK-07.3**: Implementar gestor `MCPClientManager` capaz de iniciar procesos secundarios (stdio) y suscripciones SSE.
- [ ] **TASK-07.4**: Implementar adaptador puente que convierta herramientas MCP en `SkillRegistration` utilizables por los agentes y el loop controller.
- [ ] **TASK-07.5**: Crear suite de tests con servidor MCP simulado (mock) para comprobar latencia y recuperación ante desconexión de red.
