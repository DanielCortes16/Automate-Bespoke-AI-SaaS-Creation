# Implementation Plan: Model Context Protocol (MCP) Integrations
> **Feature ID:** `feat-07-mcp-integrations`  

---

## 1. Arquitectura de Componentes

```
Agente Autónomo -> Safety Harness -> [MCP Host Adapter] -> (stdio / sse) -> Servidor MCP Remoto (SAP / Balanza / IoT)
```

- **Módulo**: `src/core/mcp/mcp-client.ts`.
- **SDK Base**: `@modelcontextprotocol/sdk`.

---

## 2. Flujo de Inicialización de Servidores MCP por Inquilino

1. El provisionador lee `spec.mcp_servers`.
2. Para cada servidor configurado, resuelve el token en el proveedor de secretos.
3. Establece el canal de transporte (`StdioClientTransport` o `SSEClientTransport`).
4. Invoca `listTools()` y registra las herramientas como skills dinámicas en el `SkillRuntime` del inquilino.

---

## 3. Criterios de Aceptación
- [x] Tipado de configuración MCP integrado en `src/types/spec.ts`.
- [ ] Implementar cliente MCP con soporte para Stdio y SSE.
- [ ] Mock de servidor MCP de telemetría IoT para tests de integración.
