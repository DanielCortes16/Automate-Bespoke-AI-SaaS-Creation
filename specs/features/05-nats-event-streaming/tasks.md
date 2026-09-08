# Task Breakdown: NATS JetStream Event Streaming
> **Feature ID:** `feat-05-nats-event-streaming`  

---

## Lista de Tareas de Ingeniería

- [x] **TASK-05.1**: Diseñar interfaz `SaaSCloudEvent` en `src/core/events/nats-stream.ts`.
- [x] **TASK-05.2**: Implementar `TenantEventBus.buildSubject()` y `createEvent()`.
- [ ] **TASK-05.3**: Implementar wrapper de conexión `connectNats()` usando `@nats-io/transport-node` con reconexión automática y backoff exponencial.
- [ ] **TASK-05.4**: Implementar gestor de streams JetStream (`JetStreamManager`) para auto-crear streams si no existen al iniciar el servicio.
- [ ] **TASK-05.5**: Configurar puente SSE (Server-Sent Events) en Fastify para suscripción del front-end a eventos de su propio tenant.
