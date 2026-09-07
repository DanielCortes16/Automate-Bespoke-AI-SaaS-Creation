/**
 * Runtime de Skills Modulares & Orquestador Saga.
 * Ejecución atómica, determinista e idempotente con soporte para rollback / compensación.
 */

import { TenantContext } from '../../types/spec.js';

export type SkillHandler<TInput = any, TOutput = any> = (
  context: TenantContext,
  input: TInput
) => Promise<TOutput>;

export interface SkillRegistration<TInput = any, TOutput = any> {
  id: string;
  category: string;
  description: string;
  handler: SkillHandler<TInput, TOutput>;
  compensationSkillId?: string;
  compensationHandler?: SkillHandler<TOutput, void>;
}

export class SkillRuntime {
  private skills: Map<string, SkillRegistration> = new Map();

  /**
   * Registra una nueva skill en el catálogo en tiempo de ejecución.
   */
  public registerSkill<TInput, TOutput>(skill: SkillRegistration<TInput, TOutput>): void {
    this.skills.set(skill.id, skill);
  }

  /**
   * Ejecuta una skill de manera controlada e idempotente.
   */
  public async executeSkill<TInput, TOutput>(
    skillId: string,
    context: TenantContext,
    input: TInput
  ): Promise<{ success: boolean; data?: TOutput; error?: string }> {
    const registration = this.skills.get(skillId);
    if (!registration) {
      return { success: false, error: `Skill '${skillId}' no está registrada en el catálogo.` };
    }

    try {
      const result = await registration.handler(context, input);
      return { success: true, data: result };
    } catch (err: any) {
      return {
        success: false,
        error: `Fallo durante la ejecución de '${skillId}': ${err.message || String(err)}`,
      };
    }
  }

  /**
   * Ejecuta la compensación Saga en caso de fallo posterior en el loop.
   */
  public async compensate<TOutput>(
    skillId: string,
    context: TenantContext,
    outputToCompensate: TOutput
  ): Promise<{ success: boolean; error?: string }> {
    const registration = this.skills.get(skillId);
    if (!registration || !registration.compensationHandler) {
      return {
        success: false,
        error: `No existe handler de compensación Saga registrado para '${skillId}'.`,
      };
    }

    try {
      await registration.compensationHandler(context, outputToCompensate);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: `Fallo en compensación Saga para '${skillId}': ${err.message}`,
      };
    }
  }
}
