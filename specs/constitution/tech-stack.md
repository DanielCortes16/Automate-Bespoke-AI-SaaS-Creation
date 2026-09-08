# Constitution: Tech Stack & Engineering Standards
> **Automate-Bespoke-AI-SaaS-Creation Engine**

---

## 1. Stack Tecnológico Primario

| Capa | Tecnología Seleccionada | Justificación Técnica |
| :--- | :--- | :--- |
| **Runtime de Ejecución** | **Node.js (v20+ / v26) + TypeScript 5.7+** | Tipado estricto, ESM nativo (`NodeNext`), alto rendimiento en I/O asíncrono para concurrencia multiagente. |
| **Validación de Esquemas** | **Zod v3.23+ & YAML Parser** | Validación determinista de tipos en tiempo de ejecución para esquemas y parámetros de skills. |
| **Event Streaming Bus** | **NATS JetStream (v2.28+)** | Ultraligero, latencia sub-milisegundo, persistencia JetStream nativa, aislamiento por materias (`tenants.<id>.*`). |
| **Almacenamiento Relacional** | **PostgreSQL 16+ con RLS** | Políticas inmutables de Row-Level Security activadas por conexión (`SET LOCAL app.current_tenant_id`). |
| **Caché y Estado Efímero** | **Redis 7+ / Dragonfly** | Idempotency keys, control de cuotas token-bucket, pizarras de estado temporal (Blackboard). |
| **Protocolo de Conectores** | **Model Context Protocol (MCP)** | Estándar universal abierto para conectar LLMs a herramientas legacy, ERPs y sensores (Stdio / SSE). |
| **Auditoría Criptográfica** | **HMAC-SHA256 Chained WORM Ledger** | Trazabilidad inalterable con encadenamiento de hashes resistente a manipulación. |
| **Testing & Calidad** | **Node Native Test Runner (`node:test`)** | Pruebas unitarias nativas sin dependencias pesadas adicionales, ejecución ultrarrápida. |

---

## 2. Convenciones de Código y Estándares de Ingeniería

1. **Módulos ESM Estrictos**: Todo archivo TypeScript compila a ESM nativo (`import ... from './file.js'`).
2. **Inmutabilidad y Funciones Puras**: Las skills no mutan el estado global; reciben un `TenantContext` inmutable y un payload validado, retornando un resultado determinista.
3. **Manejo de Errores Semánticos**: Los errores en bucles de agentes no arrojan excepciones no controladas; retornan objetos de error estructurados con códigos tipados para permitir la auto-corrección.
4. **Idempotencia Obligatoria**: Toda mutación en inventario, facturación o asignación requiere una `idempotency_key` única.
