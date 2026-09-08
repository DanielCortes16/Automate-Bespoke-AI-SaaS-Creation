# Feature Specification: Safety Harness & HITL Circuit Breaker
> **Feature ID:** `feat-02-safety-harness-hitl`  
> **Status:** Implemented / Expanding  

---

## 1. Resumen Ejecutivo
El **Safety Harness** envuelve todas las interacciones cognitivas y de ejecución de la plataforma, garantizando que los agentes operen bajo barreras deterministas (*guardrails*), mitigando riesgos de inyección de prompt, fugas de datos personales (PII) y asegurando que las operaciones financieras o de alto impacto requieran autorización humana (*Human-in-the-Loop*).

---

## 2. Requerimientos Funcionales

1. **Pre-Execution Ingress Gate**:
   - Bloqueo inmediato de patrones maliciosos conocidos (`ignore previous instructions`, `drop table`, etc.).
   - Censura de PII (teléfonos, correos, números de tarjeta).
2. **Runtime Sandbox & Circuit Breaker**:
   - Evaluación en milisegundos de condiciones declarativas en la spec (ej. `input.total_pagar > 500000`).
   - Estado de suspensión segura (`HITL_REQUIRED`) con generación de ticket criptográfico para aprobación de supervisor.
3. **Post-Execution & Egress Gate**:
   - Comprobación de que la salida cumple el contrato de datos esperado antes de ser entregada al bus o cliente.

---

## 3. Requerimientos No Funcionales

- **Latencia de Evaluación**: El pre-gate y runtime gate deben evaluarse en $< 2\text{ ms}$.
- **Tolerancia a Fallos**: Si el motor de evaluación de reglas entra en pánico o falla, la política por defecto es **FAIL-CLOSED** (bloquear la acción preventivamente).
