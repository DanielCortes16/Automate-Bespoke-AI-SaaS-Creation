# Feature Specification: Modular Skills & Saga Orchestration
> **Feature ID:** `feat-04-modular-skills-saga`  
> **Status:** Implemented / Expanding  

---

## 1. Resumen Ejecutivo
El **Modular Skills & Saga Engine** provee un catálogo unificado de capacidades empresariales atómicas, idempotentes y deterministas. Cada skill tiene un contrato de entrada y salida tipado con Zod y registra de manera obligatoria una función de compensación (*Saga rollback*) para garantizar la consistencia en fallos distribuidos.

---

## 2. Requerimientos Funcionales

1. **Catálogo Estándar de 18 Skills**:
   - **Contabilidad**: Facturación fiscal, conciliación bancaria, partida doble, dispersión a proveedores.
   - **Inventario**: Valuación PMP, ajuste con idempotencia, punto de reorden, órdenes de compra.
   - **Mantenimiento**: Alertas predictivas de uso, órdenes técnicas de trabajo, diagnóstico Z-score de telemetría IoT.
   - **Hospitalidad**: Consulta de aforo/disponibilidad, creación de reservas con bloqueo optimista, asignación de mesas/bahías.
   - **Servicios**: Ingesta de tickets, matriz de SLA con cálculo de horas, notificaciones multicanal.
   - **Seguridad**: Validación PCI-DSS/HACCP, circuit breaker de cuarentena.
2. **Patrón Saga (Rollback Compensatorio)**:
   - Toda mutación que persista estado debe tener un `compensationHandler` ejecutable en caso de aborto posterior.

---

## 3. Requerimientos No Funcionales
- **Idempotencia Absoluta**: Invocaciones repetidas con la misma clave de idempotencia deben retornar el mismo resultado sin duplicar efectos secundarios.
