# Implementation Plan: Safety Harness & HITL Circuit Breaker
> **Feature ID:** `feat-02-safety-harness-hitl`  

---

## 1. Arquitectura de Componentes

```
Input Prompt/Event -> [Pre-Execution Gate] -> Agent Decision -> [Runtime Gate / HITL Check] -> Execution -> [Post-Execution WORM Audit]
```

- **Módulo Core**: `src/core/harness/safety-harness.ts`.
- **Integración con Auditoría**: Conectado directamente a `ImmutableAuditLedger` para registrar veredictos de cumplimiento (`COMPLIANT`, `FLAGGED`, `REJECTED`).

---

## 2. Flujo de Aprobación Dual Asíncrono (HITL Workflow)

1. El arnés detecta que `total_pagar > 500000`.
2. Emite evento NATS: `tenants.<tenant_id>.compliance.hitl_approval_requested`.
3. La ejecución se suspende temporalmente en Redis con un TTL de expiración (ej. 24 horas).
4. Un supervisor humano firma la aprobación vía endpoint seguro `/api/v1/harness/approvals/:id`.
5. El arnés reanuda la ejecución en el punto exacto donde se congeló.

---

## 3. Criterios de Aceptación
- [x] Pre-gate bloquea inyecciones de prompt documentadas.
- [x] Runtime gate detecta umbrales numéricos condicionales.
- [ ] Implementar soporte para expresiones condicionales complejas (AND/OR, expresiones Rego/OPA).
