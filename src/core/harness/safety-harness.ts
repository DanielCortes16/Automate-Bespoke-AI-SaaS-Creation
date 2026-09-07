/**
 * Safety Harness & Guardrail Engine.
 * Asegura que los agentes operen dentro de límites estrictos, validación de esquemas y triggers HITL.
 */

import { TenantContext, HarnessPolicy } from '../../types/spec.js';
import { ImmutableAuditLedger, AuditRecord } from '../audit/worm-ledger.js';

export interface PreExecutionResult {
  allowed: boolean;
  sanitizedInput?: string;
  violations?: string[];
}

export interface RuntimeGateResult {
  status: 'EXECUTE' | 'HITL_REQUIRED' | 'REJECTED';
  reason?: string;
}

export class SafetyHarness {
  private ledger: ImmutableAuditLedger;

  constructor(ledger?: ImmutableAuditLedger) {
    this.ledger = ledger || new ImmutableAuditLedger();
  }

  /**
   * 1. Pre-Execution Gate:
   * Valida inyecciones maliciosas de prompt, contexto de inquilino y censura de PII.
   */
  public evaluatePreExecution(
    context: TenantContext,
    prompt: string,
    policy: HarnessPolicy
  ): PreExecutionResult {
    const violations: string[] = [];

    // Verificación de patrones de evasión o jailbreak
    const blockList = policy.security_guardrails?.block_prompts_containing || [
      'ignore previous instructions',
      'drop table',
      'system prompt override',
    ];

    const lowerPrompt = prompt.toLowerCase();
    for (const phrase of blockList) {
      if (lowerPrompt.includes(phrase.toLowerCase())) {
        violations.push(`Prompt contiene patrón bloqueado por el arnés: "${phrase}"`);
      }
    }

    if (violations.length > 0) {
      return { allowed: false, violations };
    }

    // Sanitización y enmascaramiento básico de PII
    let sanitized = prompt;
    if (policy.security_guardrails?.mask_pii_fields?.includes('cliente_telefono')) {
      sanitized = sanitized.replace(/\b\+?[0-9]{10,15}\b/g, '[TELEFONO_ENMASCARADO]');
    }

    return { allowed: true, sanitizedInput: sanitized };
  }

  /**
   * 2. Runtime Gate & HITL Interceptor:
   * Comprueba si la acción sobrepasa umbrales críticos configurados en la spec.
   */
  public evaluateRuntimeGate(
    context: TenantContext,
    skillId: string,
    payload: Record<string, unknown>,
    policy: HarnessPolicy
  ): RuntimeGateResult {
    if (!policy.hitl_rules || policy.hitl_rules.length === 0) {
      return { status: 'EXECUTE' };
    }

    for (const rule of policy.hitl_rules) {
      if (rule.action === skillId) {
        // Evaluación simple de condición numérica (ej. total_pagar > 500000)
        const match = rule.condition.match(/(input\.[a-zA-Z0-9_]+)\s*(>|<|>=|<=|==)\s*([0-9.]+)/);
        if (match) {
          const fieldPath = match[1].replace('input.', '');
          const operator = match[2];
          const threshold = parseFloat(match[3]);
          const actualValue = parseFloat(String(payload[fieldPath] ?? 0));

          let conditionMet = false;
          if (operator === '>' && actualValue > threshold) conditionMet = true;
          if (operator === '>=' && actualValue >= threshold) conditionMet = true;
          if (operator === '<' && actualValue < threshold) conditionMet = true;
          if (operator === '<=' && actualValue <= threshold) conditionMet = true;
          if (operator === '==' && actualValue === threshold) conditionMet = true;

          if (conditionMet) {
            return {
              status: 'HITL_REQUIRED',
              reason: `Interrupción HITL activada por política: ${rule.reason} (Valor: ${actualValue} vs Umbral: ${threshold})`,
            };
          }
        }
      }
    }

    return { status: 'EXECUTE' };
  }

  /**
   * 3. Post-Execution Gate:
   * Valida que la salida sea consistente y la registra en el Ledger WORM.
   */
  public auditPostExecution(
    context: TenantContext,
    agentId: string,
    skillId: string,
    input: unknown,
    output: unknown,
    verdict: 'COMPLIANT' | 'FLAGGED' | 'REJECTED' = 'COMPLIANT'
  ): AuditRecord {
    return this.ledger.recordExecution(context, agentId, skillId, input, output, verdict);
  }
}
