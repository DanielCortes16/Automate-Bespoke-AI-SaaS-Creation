/**
 * Spec-Driven Declarative Engine: Zod Validator
 * Esquema de validación estricta en tiempo de ejecución para SaaS Specs.
 */

import { z } from 'zod';

// -----------------------------------------------------------------------------
// 1. Tenant Metadata Schema
// -----------------------------------------------------------------------------
export const TenantMetadataSchema = z.object({
  id: z.string().min(3, 'El ID de tenant debe tener al menos 3 caracteres'),
  name: z.string().min(1, 'El nombre de tenant es obligatorio'),
  domain_vertical: z.string().min(1, 'El vertical de dominio es obligatorio'),
  jurisdiction: z.string().length(2, 'La jurisdicción debe ser un código ISO de 2 letras (ej. CO, MX, US)'),
  timezone: z.string().default('UTC'),
  locale: z.string().default('es'),
  currency: z.string().length(3, 'La moneda debe ser código ISO 4217 de 3 letras (ej. COP, MXN, USD)'),
  compliance_profile: z.object({
    standard: z.array(z.string()).default([]),
    retention_period_days: z.number().int().positive().default(365),
    require_dual_control_above: z.number().nonnegative().default(100000),
  }),
});

// -----------------------------------------------------------------------------
// 2. Branding & Theming Schema
// -----------------------------------------------------------------------------
export const BrandingTokensSchema = z.object({
  colors: z.object({
    primary: z.string(),
    primary_contrast: z.string().default('#FFFFFF'),
    secondary: z.string(),
    accent: z.string().default('#475569'),
    background: z.string().default('#F8FAFC'),
    surface: z.string().default('#FFFFFF'),
    surface_border: z.string().default('#E2E8F0'),
    text_primary: z.string().default('#0F172A'),
    text_secondary: z.string().default('#475569'),
    danger: z.string().default('#DC2626'),
    success: z.string().default('#16A34A'),
    warning: z.string().default('#D97706'),
  }),
  typography: z.object({
    font_family_headings: z.string(),
    font_family_body: z.string(),
    base_size_px: z.number().int().positive().default(14),
    scale_ratio: z.number().positive().default(1.2),
  }),
  layout: z.object({
    border_radius_card: z.string().default('8px'),
    border_radius_button: z.string().default('6px'),
    density: z.enum(['compact', 'comfortable', 'spacious']).default('comfortable'),
    sidebar_position: z.enum(['left', 'right']).default('left'),
    default_view_mode: z.enum(['floor_plan', 'kanban', 'data_table', 'calendar']).default('data_table'),
  }),
});

export const BrandingConfigSchema = z.object({
  brand_name: z.string().min(1),
  logo_url: z.string().url(),
  favicon_url: z.string().url().optional(),
  theme: z.object({
    mode: z.enum(['light', 'dark', 'auto']).default('light'),
    tokens: BrandingTokensSchema,
  }),
});

// -----------------------------------------------------------------------------
// 3. Dynamic Data Models Schema
// -----------------------------------------------------------------------------
export const DataFieldZodSchema = z.object({
  type: z.enum([
    'string',
    'integer',
    'decimal',
    'number',
    'boolean',
    'datetime',
    'date',
    'uuid',
    'currency',
    'enum',
    'email',
    'json',
  ]),
  primary_key: z.boolean().optional(),
  required: z.boolean().optional(),
  unique_per_tenant: z.boolean().optional(),
  default: z.unknown().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  precision: z.number().optional(),
  options: z.array(z.string()).optional(),
  references: z.string().optional(), // ej. 'mesas.id'
  nullable: z.boolean().optional(),
});

export const DataModelZodSchema = z.object({
  name: z.string().regex(/^[a-z0-9_]+$/, 'El nombre del modelo debe ser snake_case alfanumérico'),
  label: z.string().min(1),
  storage_type: z.enum(['relational', 'document']).default('relational'),
  indexes: z.array(z.string()).optional(),
  schema: z.record(DataFieldZodSchema),
});

// -----------------------------------------------------------------------------
// 4. Agents & MCP Configuration
// -----------------------------------------------------------------------------
export const AgentConfigSchema = z.object({
  id: z.string().min(3),
  type: z.enum(['supervisor', 'operations', 'accounting', 'maintenance', 'audit', 'service']),
  role: z.string().min(3),
  model: z.string().min(1),
  max_turns_per_loop: z.number().int().min(1).max(20).default(5),
  temperature: z.number().min(0).max(2).default(0.0),
  allowed_skills: z.array(z.string()).optional(),
  allowed_delegations: z.array(z.string()).optional(),
});

export const MCPServerConfigSchema = z.object({
  id: z.string().min(3),
  description: z.string(),
  transport: z.enum(['stdio', 'sse', 'grpc']),
  endpoint: z.string().optional(),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  auth_secret_ref: z.string().optional(),
  permissions: z.array(z.string()).default([]),
});

// -----------------------------------------------------------------------------
// 5. Harness Policies Schema
// -----------------------------------------------------------------------------
export const HITLRuleSchema = z.object({
  action: z.string().min(1),
  condition: z.string().min(1),
  reason: z.string().min(1),
});

export const HarnessPolicySchema = z.object({
  strict_schema_validation: z.boolean().default(true),
  max_parallel_tool_calls: z.number().int().positive().default(3),
  budget_caps: z.object({
    max_tokens_per_request: z.number().int().positive().default(8000),
    max_cost_usd_per_day: z.number().positive().default(10.0),
  }),
  security_guardrails: z
    .object({
      block_prompts_containing: z.array(z.string()).optional(),
      mask_pii_fields: z.array(z.string()).optional(),
    })
    .optional(),
  hitl_rules: z.array(HITLRuleSchema).optional(),
});

// -----------------------------------------------------------------------------
// 6. Master SaaSSpec Schema
// -----------------------------------------------------------------------------
export const SaaSSpecSchema = z.object({
  spec_version: z.string().default('1.0.0'),
  tenant: TenantMetadataSchema,
  branding: BrandingConfigSchema,
  data_models: z.array(DataModelZodSchema),
  agents: z.array(AgentConfigSchema),
  mcp_servers: z.array(MCPServerConfigSchema).optional(),
  harness_policies: HarnessPolicySchema,
});

export type ValidatedSaaSSpec = z.infer<typeof SaaSSpecSchema>;

/**
 * Verificador semántico cruzado: Valida referencias entre modelos y asignaciones de skills.
 */
export function validateSemanticIntegrity(
  spec: ValidatedSaaSSpec,
  registeredSkills?: Set<string> | string[]
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Unicidad de nombres de modelos
  const modelNames = new Set<string>();
  for (const model of spec.data_models) {
    if (modelNames.has(model.name)) {
      errors.push(`Modelo duplicado: '${model.name}' está definido más de una vez.`);
    }
    modelNames.add(model.name);
  }

  // 2. Validación de llaves foráneas (references)
  for (const model of spec.data_models) {
    for (const [fieldName, field] of Object.entries(model.schema)) {
      if (field.references) {
        const [refModel] = field.references.split('.');
        if (!modelNames.has(refModel)) {
          errors.push(
            `Referencia inválida en ${model.name}.${fieldName}: El modelo '${refModel}' no existe en data_models.`
          );
        }
      }
    }
  }

  // 3. Unicidad de IDs de agentes
  const agentIds = new Set<string>();
  for (const agent of spec.agents) {
    if (agentIds.has(agent.id)) {
      errors.push(`Agente duplicado: '${agent.id}' está definido más de una vez.`);
    }
    agentIds.add(agent.id);
  }

  // 4. Verificación de delegaciones de agentes
  for (const agent of spec.agents) {
    if (agent.allowed_delegations) {
      for (const targetAgent of agent.allowed_delegations) {
        if (!agentIds.has(targetAgent)) {
          errors.push(
            `Delegación inválida en agente '${agent.id}': El agente destino '${targetAgent}' no existe en la spec.`
          );
        }
      }
    }
  }

  // 5. Verificación de skills registradas (si se proporciona el catálogo)
  if (registeredSkills) {
    const knownSkills = registeredSkills instanceof Set ? registeredSkills : new Set(registeredSkills);
    for (const agent of spec.agents) {
      if (agent.allowed_skills) {
        for (const skill of agent.allowed_skills) {
          if (!knownSkills.has(skill)) {
            warnings.push(
              `Advertencia: El agente '${agent.id}' solicita la skill '${skill}', la cual no está registrada en el runtime.`
            );
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
