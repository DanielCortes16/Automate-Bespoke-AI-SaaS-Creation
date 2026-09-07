/**
 * Spec-Driven Multi-Agent SaaS Engine
 * Definiciones de tipos fundamentales para la especificación declarativa.
 */

export interface TenantMetadata {
  id: string;
  name: string;
  domain_vertical: string;
  jurisdiction: string;
  timezone: string;
  locale: string;
  currency: string;
  compliance_profile: {
    standard: string[];
    retention_period_days: number;
    require_dual_control_above: number;
  };
}

export interface BrandingTokens {
  colors: {
    primary: string;
    primary_contrast: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    surface_border: string;
    text_primary: string;
    text_secondary: string;
    danger: string;
    success: string;
    warning: string;
  };
  typography: {
    font_family_headings: string;
    font_family_body: string;
    base_size_px: number;
    scale_ratio: number;
  };
  layout: {
    border_radius_card: string;
    border_radius_button: string;
    density: 'compact' | 'comfortable' | 'spacious';
    sidebar_position: 'left' | 'right';
    default_view_mode: 'floor_plan' | 'kanban' | 'data_table' | 'calendar';
  };
}

export interface BrandingConfig {
  brand_name: string;
  logo_url: string;
  favicon_url?: string;
  theme: {
    mode: 'light' | 'dark' | 'auto';
    tokens: BrandingTokens;
  };
}

export interface DataFieldSchema {
  type: 'string' | 'integer' | 'decimal' | 'boolean' | 'datetime' | 'date' | 'uuid' | 'currency' | 'enum' | 'email' | 'json';
  primary_key?: boolean;
  required?: boolean;
  unique_per_tenant?: boolean;
  default?: unknown;
  min?: number;
  max?: number;
  precision?: number;
  options?: string[];
  references?: string;
  nullable?: boolean;
}

export interface DataModel {
  name: string;
  label: string;
  storage_type: 'relational' | 'document';
  indexes?: string[];
  schema: Record<string, DataFieldSchema>;
}

export interface AgentConfig {
  id: string;
  type: 'supervisor' | 'operations' | 'accounting' | 'maintenance' | 'audit' | 'service';
  role: string;
  model: string;
  max_turns_per_loop?: number;
  temperature: number;
  allowed_skills?: string[];
  allowed_delegations?: string[];
}

export interface MCPServerConfig {
  id: string;
  description: string;
  transport: 'stdio' | 'sse' | 'grpc';
  endpoint?: string;
  command?: string;
  args?: string[];
  auth_secret_ref?: string;
  permissions: string[];
}

export interface HITLRule {
  action: string;
  condition: string;
  reason: string;
}

export interface HarnessPolicy {
  strict_schema_validation: boolean;
  max_parallel_tool_calls: number;
  budget_caps: {
    max_tokens_per_request: number;
    max_cost_usd_per_day: number;
  };
  security_guardrails?: {
    block_prompts_containing?: string[];
    mask_pii_fields?: string[];
  };
  hitl_rules?: HITLRule[];
}

export interface SaaSSpec {
  spec_version: string;
  tenant: TenantMetadata;
  branding: BrandingConfig;
  data_models: DataModel[];
  agents: AgentConfig[];
  mcp_servers?: MCPServerConfig[];
  harness_policies: HarnessPolicy;
}

export interface TenantContext {
  tenantId: string;
  userId?: string;
  userRole: string;
  jurisdiction: string;
  currency: string;
  timezone: string;
  correlationId: string;
}
