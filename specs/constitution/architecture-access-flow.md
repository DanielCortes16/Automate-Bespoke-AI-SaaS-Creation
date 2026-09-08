# Constitution: Architecture & Access Flow
> **Automate-Bespoke-AI-SaaS-Creation Engine**

---

## 1. Flujo Integral de Ejecución y Acceso (End-to-End Request Flow)

Este diagrama detalla cómo viaja una petición desde el comensal, técnico o cliente externo hasta la persistencia y auditoría final:

```mermaid
sequenceDiagram
    autonumber
    actor User as Usuario / Dispositivo IoT
    participant GW as Gateway Multitenant & Auth
    participant TC as Context Injector
    participant Har as Safety Harness (Pre-Gate)
    participant Sup as Supervisor & Prompt Engine
    participant Ag as Agente Autónomo
    participant HITL as Human-in-the-Loop Intercept
    participant Sk as Skills & MCP Runtime
    participant Aud as Ledger WORM & Auditor
    participant Bus as NATS JetStream

    User->>GW: Request (JWT + Tenant Slug)
    GW->>TC: Valida Auth y Resuelve Tenant
    TC->>Har: Inyecta TenantContext (tenant_id, role, correlation_id)
    
    Har->>Har: Evalúa Pre-Execution Gate (Anti-Jailbreak, PII Mask)
    alt Inyección maliciosa detectada
        Har-->>User: 403 Forbidden (Violación de Seguridad)
    else Petición Segura
        Har->>Sup: Enruta intención estructurada
        Sup->>Sup: Ensambla Dynamic Prompt (6 Capas)
        Sup->>Ag: Asigna tarea a Agente Especializado
        Ag->>Har: Propone ejecución de Skill con parámetros
        
        Har->>Har: Evalúa Runtime Gate (Zod Schema & Umbrales HITL)
        alt Requiere Aprobación Humana (ej. Monto > Límite Spec)
            Har->>HITL: Suspende ejecución & Emite Alerta a Supervisor Humano
            HITL-->>Har: Aprobación Criptográfica Dual Concedida
        end
        
        Har->>Sk: Ejecuta Skill determinista / Consulta MCP
        Sk-->>Har: Retorna resultado estructurado
        
        Har->>Aud: Registra bloque encadenado en Ledger HMAC-SHA256
        Aud-->>Bus: Publica CloudEvent en NATS: tenants.<tenant_id>.<domain>.<event>
        Bus-->>User: Confirmación en tiempo real (WebSocket / SSE)
    end
```

---

## 2. Jerarquía de Aislamiento y Control de Acceso (RBAC & ABAC)

### Nivel 1: Aislamiento de Inquilino (Tenant Isolation)
- Todo query relacional en PostgreSQL se encapsula en una transacción de sesión:
  ```sql
  BEGIN;
  SET LOCAL app.current_tenant_id = 'tenant_xyz';
  SET LOCAL app.current_user_role = 'operations_agent';
  -- Query seguro con RLS activo
  COMMIT;
  ```
- NATS JetStream aísla las transmisiones a nivel de materia: `tenants.<tenant_id>.*`.

### Nivel 2: Control Basado en Roles y Agentes (Agent-RBAC)
- Cada agente tiene una lista blanca inmutable de skills autorizadas (`allowed_skills`) declaradas en la spec.
- Ningún agente puede invocar una skill fuera de su perímetro operativo sin delegación formal del Supervisor.

### Nivel 3: Intercepción Human-in-the-Loop (Dual Control)
- Si una transacción supera los umbrales financieros o de riesgo declarados en `harness_policies.hitl_rules`, se produce un bloqueo atómico hasta recibir la firma digital de un operador humano calificado.
