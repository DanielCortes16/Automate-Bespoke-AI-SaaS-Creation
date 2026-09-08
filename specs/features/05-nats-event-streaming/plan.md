# Implementation Plan: NATS JetStream Event Streaming
> **Feature ID:** `feat-05-nats-event-streaming`  

---

## 1. Arquitectura de Componentes

- **Clase Core**: `src/core/events/nats-stream.ts` (`TenantEventBus`).
- **Formato de Mensajería**: Interfaz `SaaSCloudEvent<T>`.

---

## 2. Topología de Streams en NATS

- Stream Principal: `TENANT_EVENTS`
  - Subjects: `tenants.>`
  - Storage: File o Memory con retención basada en límites de cuota por inquilino.
  - Consumer Durable: `audit-consumer` (para escritura a WORM ledger y data lake).
  - Consumer Ephemeral: `realtime-ui-gateway` (para propagación vía Server-Sent Events hacia el cliente web).

---

## 3. Criterios de Aceptación
- [x] Construcción normalizada de subjects probada en `test/engine.test.ts`.
- [x] Generación de sobres CloudEvents con `correlationId` y `tenantId`.
- [ ] Conexión real con broker NATS mediante la librería oficial `nats` para pruebas de integración.
