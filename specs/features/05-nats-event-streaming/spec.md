# Feature Specification: NATS JetStream Event Streaming
> **Feature ID:** `feat-05-nats-event-streaming`  
> **Status:** Implemented / Expanding  

---

## 1. Resumen Ejecutivo
El componente de **Event Streaming** utiliza **NATS JetStream** para desacoplar las interacciones entre los agentes autónomos, la auditoría continua y las actualizaciones en tiempo real hacia las aplicaciones web y móviles de los clientes finales.

---

## 2. Requerimientos Funcionales

1. **Aislamiento Multitenant por Materias (Subject Namespacing)**:
   - Todo mensaje debe publicarse siguiendo la convención:
     `tenants.<tenant_id>.<domain_vertical>.<event_type>`
2. **Estandarización CloudEvents v1.0**:
   - Campos canónicos: `id`, `source`, `specversion`, `type`, `time`, `tenantId`, `correlationId`, `data`.
3. **Persistencia y Grupos de Consumidores (Durable Consumers)**:
   - Los consumidores de auditoría y de sync con base de datos deben procesar mensajes con garantía *At-least-once*.

---

## 3. Requerimientos No Funcionales
- **Latencia Sub-milisegundo**: Tiempo de enrutamiento y persistencia en memoria $< 1\text{ ms}$.
