import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SkillRuntime,
  registerAllStandardSkills,
} from '../dist/index.js';

const dummyContext = {
  tenantId: 'tenant_test_suite_01',
  userRole: 'service_executor',
  jurisdiction: 'CO',
  currency: 'COP',
  timezone: 'America/Bogota',
  correlationId: 'corr-skills-test-999',
};

test('Skills Suite: Inicialización y registro masivo de las 18 skills', async () => {
  const runtime = new SkillRuntime();
  registerAllStandardSkills(runtime);

  const res = await runtime.executeSkill('skill_fantasma', dummyContext, {});
  assert.equal(res.success, false);
  assert.match(res.error!, /no está registrada/);
});

test('Skills Suite: Contabilidad (skill_crear_factura y partida doble)', async () => {
  const runtime = new SkillRuntime();
  registerAllStandardSkills(runtime);

  const res = await runtime.executeSkill('skill_crear_factura', dummyContext, {
    cliente_id: 'cli-1001',
    items: [
      { sku: 'VINO_TINTO_CABERNET', descripcion: 'Botella 750ml', cantidad: 2, precio_unitario: 120000, tasa_impuesto: 0.19 },
      { sku: 'CORTE_RIBEYE', descripcion: 'Corte 400g', cantidad: 3, precio_unitario: 85000, tasa_impuesto: 0.08 },
    ],
    moneda: 'COP',
    metodo_pago: 'TARJETA',
  });

  assert.equal(res.success, true);
  const data = res.data as any;
  assert.equal(data.subtotal, 495000); // 2*120000 + 3*85000 = 240000 + 255000 = 495000
  assert.equal(data.total_impuestos, 66000); // (240000*0.19 = 45600) + (255000*0.08 = 20400) = 66000
  assert.equal(data.total_pagar, 561000);
  assert.match(data.folio_fiscal, /^FAC-CO-/);

  // Verificar partida doble
  const debeTotal = data.asiento_contable.debe.reduce((a: number, b: any) => a + b.monto, 0);
  const haberTotal = data.asiento_contable.haber.reduce((a: number, b: any) => a + b.monto, 0);
  assert.equal(debeTotal, haberTotal);

  // Probar compensación Saga
  const comp = await runtime.compensate('skill_crear_factura', dummyContext, data);
  assert.equal(comp.success, true);
});

test('Skills Suite: Inventario (skill_calcular_inventario y punto de reorden)', async () => {
  const runtime = new SkillRuntime();
  registerAllStandardSkills(runtime);

  // 1. Valuación de inventario con PMP
  const invRes = await runtime.executeSkill('skill_calcular_inventario', dummyContext, {
    sku: 'TORNILLO_HEX_3_8',
    lotes: [
      { lote_id: 'L1', cantidad: 100, costo_unitario: 5.0 },
      { lote_id: 'L2', cantidad: 200, costo_unitario: 6.5 },
    ],
  });

  assert.equal(invRes.success, true);
  const invData = invRes.data as any;
  assert.equal(invData.stock_total, 300);
  assert.equal(invData.costo_promedio_ponderado, 6.0); // (500 + 1300) / 300 = 6.0
  assert.equal(invData.valoracion_total, 1800);

  // 2. Evaluación de punto de reorden
  const reordenRes = await runtime.executeSkill('skill_evaluar_punto_reorden', dummyContext, {
    sku: 'TORNILLO_HEX_3_8',
    stock_actual: 50,
    stock_en_transito: 20,
    punto_reorden: 100,
    consumo_diario_promedio: 15,
    lead_time_dias: 7,
  });

  assert.equal(reordenRes.success, true);
  const reordenData = reordenRes.data as any;
  assert.equal(reordenData.requiere_reorden, true);
  assert.equal(reordenData.alerta_quiebre_inminente, true); // 50 / 15 = 3.3 días de cobertura < 7 días lead time
  assert.ok(reordenData.cantidad_sugerida_reposicion > 0);
});

test('Skills Suite: Mantenimiento & IoT (skill_diagnosticar_anomalia_telemetria)', async () => {
  const runtime = new SkillRuntime();
  registerAllStandardSkills(runtime);

  // Telemetría con salto anómalo
  const res = await runtime.executeSkill('skill_diagnosticar_anomalia_telemetria', dummyContext, {
    activo_id: 'CAMARA_FRIA_01',
    tipo_sensor: 'temperatura',
    lecturas: [2.1, 2.3, 2.2, 2.0, 2.4, 2.1, 8.5], // 8.5 es un pico anómalo evidente
    rango_nominal: { min: -2.0, max: 4.0 },
  });

  assert.equal(res.success, true);
  const data = res.data as any;
  assert.equal(data.anomalia_detectada, true);
  assert.ok(data.max_z_score >= 2.0);
});

test('Skills Suite: Hospitalidad (skill_validar_disponibilidad y reservas)', async () => {
  const runtime = new SkillRuntime();
  registerAllStandardSkills(runtime);

  const mesas = [
    { id: 'm-1', identificador: 'Mesa 1', zona: 'terraza', capacidad: 2, estado: 'libre' },
    { id: 'm-2', identificador: 'Mesa 2', zona: 'terraza', capacidad: 4, estado: 'libre' },
    { id: 'm-3', identificador: 'Mesa 3', zona: 'salon', capacidad: 6, estado: 'ocupada' },
  ];

  // 1. Validar disponibilidad para 4 personas en terraza
  const dispRes = await runtime.executeSkill('skill_validar_disponibilidad', dummyContext, {
    fecha_hora: '2026-09-07T20:00:00.000Z',
    duracion_minutos: 120,
    num_personas: 4,
    zona_preferida: 'terraza',
    recursos_existentes: mesas,
  });

  assert.equal(dispRes.success, true);
  const dispData = dispRes.data as any;
  assert.equal(dispData.disponible, true);
  assert.equal(dispData.mejor_opcion.id, 'm-2');

  // 2. Crear reserva formal
  const resCrear = await runtime.executeSkill('skill_crear_reserva', dummyContext, {
    cliente_nombre: 'Mariana Gómez',
    cliente_telefono: '+573001234567',
    fecha_hora: '2026-09-07T20:00:00.000Z',
    duracion_minutos: 120,
    num_personas: 4,
    recurso_asignado_id: dispData.mejor_opcion.id,
  });

  assert.equal(resCrear.success, true);
  const dataCrear = resCrear.data as any;
  assert.match(dataCrear.codigo_confirmacion, /^RSV-/);
});

test('Skills Suite: Compliance & Seguridad (skill_verificar_compliance_operativo)', async () => {
  const runtime = new SkillRuntime();
  registerAllStandardSkills(runtime);

  // Test PCI-DSS con tarjeta en texto plano
  const resInseguro = await runtime.executeSkill('skill_verificar_compliance_operativo', dummyContext, {
    estandar: 'PCI-DSS',
    datos_evaluacion: {
      nota: 'Pago con tarjeta 4532 1122 3344 5566',
    },
  });

  assert.equal(resInseguro.success, true);
  assert.equal((resInseguro.data as any).aprobado, false);
  assert.match((resInseguro.data as any).violaciones[0], /PCI-DSS/);

  // Test HACCP con cámara frigorífica fuera de temperatura
  const resHACCP = await runtime.executeSkill('skill_verificar_compliance_operativo', dummyContext, {
    estandar: 'HACCP_SANITARIO',
    datos_evaluacion: {
      temperatura_camara_frio: 7.2, // Superior a 4.0
    },
  });

  assert.equal(resHACCP.success, true);
  assert.equal((resHACCP.data as any).aprobado, false);
  assert.match((resHACCP.data as any).violaciones[0], /HACCP/);
});
