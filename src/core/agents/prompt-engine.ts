/**
 * Dynamic Prompt Engine (Context Assembly Pipeline de 6 Capas).
 * Ensambla dinámicamente el contexto para cada agente en milisegundos.
 */

import { SaaSSpec, AgentConfig, TenantContext } from '../../types/spec.js';

export interface PromptAssemblyContext {
  spec: SaaSSpec;
  agent: AgentConfig;
  tenantContext: TenantContext;
  liveState: Record<string, unknown>;
  availableSkillsDescriptions: string[];
}

export class DynamicPromptEngine {
  /**
   * Ensambla el prompt completo para un agente particular.
   */
  public assemblePrompt(context: PromptAssemblyContext): string {
    const { spec, agent, tenantContext, liveState, availableSkillsDescriptions } = context;

    // CAPA 1: Invariante del Sistema
    const layer1 = `
<system_identity>
Eres un Agente Autónomo Especializado (${agent.role}) para la plataforma SaaS.
ID de Agente: ${agent.id} | Tipo: ${agent.type}.
Principio Inmutable: Tu único medio para alterar el mundo exterior es invocar formalmente las skills autorizadas.
Jamás alucines acciones completadas sin haber recibido la respuesta exitosa de una skill.
</system_identity>
`.trim();

    // CAPA 2: Adaptador de Dominio (Sector de Negocio)
    const layer2 = `
<domain_vertical>
Sector Operativo: ${spec.tenant.domain_vertical}
Jurisdicción Fiscal/Legal: ${spec.tenant.jurisdiction}
Moneda Oficial: ${spec.tenant.currency}
Zona Horaria: ${spec.tenant.timezone}
</domain_vertical>
`.trim();

    // CAPA 3: Alcance y Seguridad del Inquilino
    const layer3 = `
<tenant_security_scope>
Tenant ID: ${tenantContext.tenantId}
Rol de Ejecución: ${tenantContext.userRole}
Correlation ID: ${tenantContext.correlationId}
Políticas de Cumplimiento: ${spec.tenant.compliance_profile.standard.join(', ')}
Requiere Aprobación Dual Humana (HITL) por encima de: ${spec.tenant.compliance_profile.require_dual_control_above} ${spec.tenant.currency}
</tenant_security_scope>
`.trim();

    // CAPA 4: Estado Operativo en Vivo (Blackboard)
    const layer4 = `
<live_operational_state>
${JSON.stringify(liveState, null, 2)}
</live_operational_state>
`.trim();

    // CAPA 5: Catálogo de Skills Habilitadas
    const layer5 = `
<available_skills>
${availableSkillsDescriptions.map((desc) => `- ${desc}`).join('\n')}
</available_skills>
`.trim();

    // CAPA 6: Guías de Ejecución & Loop de Calidad
    const layer6 = `
<loop_guidelines>
1. VALIDAR: Evalúa las precondiciones antes de solicitar cualquier mutación.
2. EJECUTAR: Invoca las skills con parámetros tipados estrictos.
3. Si una skill retorna error, analiza el código de error e intenta una corrección alternativa (Loop turn budget: ${agent.max_turns_per_loop || 5} intentos).
4. No intentes saltar validaciones de seguridad o arneses.
</loop_guidelines>
`.trim();

    return [layer1, layer2, layer3, layer4, layer5, layer6].join('\n\n');
  }
}
