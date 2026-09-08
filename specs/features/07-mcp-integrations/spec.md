# Feature Specification: Model Context Protocol (MCP) Integrations
> **Feature ID:** `feat-07-mcp-integrations`  
> **Status:** Planned / Architecture Ready  

---

## 1. Resumen Ejecutivo
El componente **MCP Integrations** conecta el motor multiagente a fuentes de datos externas, sistemas ERP legacy (SAP, Oracle, Odoo), balanzas de pesaje industrial y sensores IoT a través del estándar abierto **Model Context Protocol (MCP)** desarrollado para agentes de IA.

---

## 2. Requerimientos Funcionales

1. **Soporte de Transportes**:
   - `stdio`: Para procesos locales, CLIs fiscales o utilidades de sistema operativo en contenedores.
   - `sse` (Server-Sent Events) y `http`: Para servidores MCP remotos en la intranet del cliente.
2. **Descubrimiento Dinámico de Herramientas**:
   - Listado automático de herramientas y esquemas expuestos por el servidor MCP en tiempo de inicio.
3. **Resolución Segura de Secretos**:
   - Inyección de credenciales mediante referencias a vaults (`vault://tenants/<id>/...`) sin almacenar claves en texto claro en la spec.

---

## 3. Requerimientos No Funcionales
- **Mapeo a Contratos de Skills**: Toda llamada a un servidor MCP debe pasar por el arnés de seguridad con validación de tipos antes de invocar la herramienta remota.
