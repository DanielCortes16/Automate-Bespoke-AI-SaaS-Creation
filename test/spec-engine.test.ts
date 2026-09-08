import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import {
  SpecLoader,
  SkillRuntime,
  registerAllStandardSkills,
} from '../dist/index.js';

test('SpecEngine: Carga y valida exitosamente restaurant_spec.yaml', async () => {
  const runtime = new SkillRuntime();
  registerAllStandardSkills(runtime);

  const filePath = resolve(process.cwd(), 'specs/examples/restaurant_spec.yaml');
  const result = await SpecLoader.loadFromFile(filePath);

  if (!result.success) {
    console.error('Errores en restaurant_spec:', result.errors);
  }

  assert.equal(result.success, true);
  assert.ok(result.spec);
  assert.equal(result.spec.tenant.id, 'tenant_restaurante_gourmet_01');
  assert.equal(result.spec.tenant.currency, 'COP');
  assert.equal(result.spec.data_models.length, 3);
  assert.equal(result.spec.agents.length, 4);
  assert.equal(result.spec.harness_policies.strict_schema_validation, true);
});

test('SpecEngine: Carga y valida exitosamente hardware_store_spec.yaml', async () => {
  const filePath = resolve(process.cwd(), 'specs/examples/hardware_store_spec.yaml');
  const result = await SpecLoader.loadFromFile(filePath);

  if (!result.success) {
    console.error('Errores en hardware_store_spec:', result.errors);
  }

  assert.equal(result.success, true);
  assert.ok(result.spec);
  assert.equal(result.spec.tenant.id, 'tenant_ferreteria_industrial_02');
  assert.equal(result.spec.tenant.jurisdiction, 'MX');
  assert.equal(result.spec.tenant.currency, 'MXN');
  assert.equal(result.spec.branding.theme.tokens.layout.density, 'compact');
  assert.equal(result.spec.agents.length, 3);
});

test('SpecEngine: Detección de errores sintácticos y campos faltantes', () => {
  const yamlInvalido = `
tenant:
  name: "Falta id y jurisdiction"
`;
  const result = SpecLoader.loadFromString(yamlInvalido, 'yaml');
  assert.equal(result.success, false);
  assert.ok(result.errors && result.errors.length > 0);
  assert.ok(result.errors.some((e) => e.includes('tenant.id') || e.includes('tenant')));
});

test('SpecEngine: Verificación semántica cruzada (modelos duplicados y referencias inválidas)', () => {
  const yamlConErroresSemanticos = `
spec_version: "1.0.0"
tenant:
  id: "tenant_demo"
  name: "Demo Tenant"
  domain_vertical: "demo"
  jurisdiction: "CO"
  currency: "COP"
  compliance_profile:
    standard: []
    retention_period_days: 30
    require_dual_control_above: 10000
branding:
  brand_name: "Demo"
  logo_url: "https://example.com/logo.svg"
  theme:
    mode: "light"
    tokens:
      colors:
        primary: "#000"
        secondary: "#fff"
      typography:
        font_family_headings: "Arial"
        font_family_body: "Arial"
      layout: {}
data_models:
  - name: "pedidos"
    label: "Pedidos"
    schema:
      id: { type: "uuid" }
      cliente_id: { type: "uuid", references: "clientes_fantasma.id" }
  - name: "pedidos"
    label: "Pedidos Duplicados"
    schema:
      id: { type: "uuid" }
agents:
  - id: "agent_1"
    type: "operations"
    role: "Operaciones"
    model: "claude-3"
    allowed_delegations: ["agente_inexistente"]
harness_policies:
  strict_schema_validation: true
  max_parallel_tool_calls: 2
  budget_caps:
    max_tokens_per_request: 2000
    max_cost_usd_per_day: 5
`;

  const result = SpecLoader.loadFromString(yamlConErroresSemanticos, 'yaml');
  assert.equal(result.success, false);
  assert.ok(result.errors);
  assert.ok(result.errors.some((e) => e.includes("Modelo duplicado: 'pedidos'")));
  assert.ok(result.errors.some((e) => e.includes("clientes_fantasma")));
  assert.ok(result.errors.some((e) => e.includes("agente_inexistente")));
});
