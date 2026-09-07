/**
 * Loop Controller (Multi-Agent Loop Engineering Engine).
 * Orquesta ciclos iterativos deterministas: VALIDAR -> EJECUTAR -> AUDITAR -> OPTIMIZAR.
 */

import { TenantContext, SaaSSpec, AgentConfig } from '../../types/spec.js';
import { SafetyHarness } from '../harness/safety-harness.js';
import { SkillRuntime } from '../skills/skill-runtime.js';
import { TenantEventBus } from '../events/nats-stream.js';

export interface LoopExecutionPlan {
  skillId: string;
  payload: Record<string, unknown>;
}

export interface LoopStepResult {
  turn: number;
  phase: 'VALIDATE' | 'EXECUTE' | 'AUDIT' | 'OPTIMIZE';
  success: boolean;
  output?: unknown;
  error?: string;
  hitlRequired?: boolean;
}

export class MultiAgentLoopController {
  private harness: SafetyHarness;
  private skillRuntime: SkillRuntime;
  private eventBus: TenantEventBus;

  constructor(harness: SafetyHarness, skillRuntime: SkillRuntime, eventBus: TenantEventBus) {
    this.harness = harness;
    this.skillRuntime = skillRuntime;
    this.eventBus = eventBus;
  }

  /**
   * Ejecuta el ciclo coordinado para una intención estructurada de agente.
   */
  public async runLoop(
    spec: SaaSSpec,
    agent: AgentConfig,
    context: TenantContext,
    plan: LoopExecutionPlan,
    maxTurns: number = 5
  ): Promise<{ status: 'SUCCESS' | 'HITL_PAUSED' | 'FAILED'; history: LoopStepResult[]; finalData?: unknown }> {
    const history: LoopStepResult[] = [];
    let currentTurn = 1;
    let currentPlan = plan;

    while (currentTurn <= maxTurns) {
      // 1. FASE DE VALIDACIÓN (Harness Pre-gate & Runtime Gate)
      const runtimeCheck = this.harness.evaluateRuntimeGate(
        context,
        currentPlan.skillId,
        currentPlan.payload,
        spec.harness_policies
      );

      if (runtimeCheck.status === 'HITL_REQUIRED') {
        history.push({
          turn: currentTurn,
          phase: 'VALIDATE',
          success: false,
          hitlRequired: true,
          error: runtimeCheck.reason,
        });

        return {
          status: 'HITL_PAUSED',
          history,
        };
      }

      if (runtimeCheck.status === 'REJECTED') {
        history.push({
          turn: currentTurn,
          phase: 'VALIDATE',
          success: false,
          error: runtimeCheck.reason,
        });
        return { status: 'FAILED', history };
      }

      history.push({
        turn: currentTurn,
        phase: 'VALIDATE',
        success: true,
      });

      // 2. FASE DE EJECUCIÓN (Skill Runtime / MCP)
      const executionResult = await this.skillRuntime.executeSkill(
        currentPlan.skillId,
        context,
        currentPlan.payload
      );

      if (!executionResult.success) {
        history.push({
          turn: currentTurn,
          phase: 'EXECUTE',
          success: false,
          error: executionResult.error,
        });

        // 4. FASE DE OPTIMIZACIÓN / AUTO-CORRECCIÓN (Si falla la ejecución)
        currentTurn += 1;
        continue;
      }

      history.push({
        turn: currentTurn,
        phase: 'EXECUTE',
        success: true,
        output: executionResult.data,
      });

      // 3. FASE DE AUDITORÍA CONTINUA (Ledger WORM & Invariantes)
      const auditRecord = this.harness.auditPostExecution(
        context,
        agent.id,
        currentPlan.skillId,
        currentPlan.payload,
        executionResult.data,
        'COMPLIANT'
      );

      // Publicar evento auditado al bus NATS
      const { subject, event } = this.eventBus.createEvent(
        context,
        spec.tenant.domain_vertical,
        `${currentPlan.skillId}.completed`,
        {
          auditRecordId: auditRecord.blockHash,
          output: executionResult.data,
        }
      );

      history.push({
        turn: currentTurn,
        phase: 'AUDIT',
        success: true,
        output: { blockHash: auditRecord.blockHash, subject },
      });

      return {
        status: 'SUCCESS',
        history,
        finalData: executionResult.data,
      };
    }

    return {
      status: 'FAILED',
      history,
    };
  }
}
