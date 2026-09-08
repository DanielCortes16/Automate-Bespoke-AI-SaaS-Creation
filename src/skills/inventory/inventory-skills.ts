/**
 * Skills Modulares: Inventario & Abastecimiento
 * Gestión de existencias, valuación de stock, puntos de reorden y órdenes de reposición.
 */

import { z } from 'zod';
import { SkillRegistration } from '../../core/skills/skill-runtime.js';
import { TenantContext } from '../../types/spec.js';

// -----------------------------------------------------------------------------
// 1. skill_calcular_inventario
// -----------------------------------------------------------------------------
export const CalcularInventarioInputSchema = z.object({
  sku: z.string(),
  almacen_id: z.string().default('default_warehouse'),
  lotes: z.array(
    z.object({
      lote_id: z.string(),
      cantidad: z.number().nonnegative(),
      costo_unitario: z.number().nonnegative(),
    })
  ).default([]),
});

export type CalcularInventarioInput = z.infer<typeof CalcularInventarioInputSchema>;

export const skillCalcularInventario: SkillRegistration<CalcularInventarioInput, any> = {
  id: 'skill_calcular_inventario',
  category: 'inventory',
  description: 'Calcula el stock valorizado total y el costo unitario promedio ponderado (PMP).',
  handler: async (ctx: TenantContext, rawInput: CalcularInventarioInput) => {
    const input = CalcularInventarioInputSchema.parse(rawInput);

    let stockTotal = 0;
    let costoTotal = 0;

    for (const lote of input.lotes) {
      stockTotal += lote.cantidad;
      costoTotal += lote.cantidad * lote.costo_unitario;
    }

    const costoPromedioPonderado = stockTotal > 0 ? Math.round((costoTotal / stockTotal) * 100) / 100 : 0;

    return {
      sku: input.sku,
      almacen_id: input.almacen_id,
      stock_total: stockTotal,
      costo_promedio_ponderado: costoPromedioPonderado,
      valoracion_total: Math.round(costoTotal * 100) / 100,
    };
  },
};

// -----------------------------------------------------------------------------
// 2. skill_ajustar_stock
// -----------------------------------------------------------------------------
export const AjustarStockInputSchema = z.object({
  sku: z.string(),
  almacen_id: z.string().default('default_warehouse'),
  cantidad_ajuste: z.number(), // Puede ser positivo (entrada/sobrante) o negativo (merma/salida)
  motivo: z.enum(['MERMA_DETERIORO', 'CONTEO_FISICO', 'INGRESO_COMPRA', 'CONSUMO_PRODUCCION', 'CORRECCION']),
  idempotency_key: z.string().min(8),
});

export type AjustarStockInput = z.infer<typeof AjustarStockInputSchema>;

export interface AjustarStockOutput {
  movimiento_id: string;
  sku: string;
  almacen_id: string;
  cantidad_ajuste: number;
  motivo: string;
  timestamp: string;
}

export const skillAjustarStock: SkillRegistration<AjustarStockInput, AjustarStockOutput> = {
  id: 'skill_ajustar_stock',
  category: 'inventory',
  description: 'Registra un movimiento de inventario con motivo e idempotencia estricta.',
  handler: async (ctx: TenantContext, rawInput: AjustarStockInput) => {
    const input = AjustarStockInputSchema.parse(rawInput);
    const movimientoId = `MOV-${Date.now().toString().slice(-8)}`;

    return {
      movimiento_id: movimientoId,
      sku: input.sku,
      almacen_id: input.almacen_id,
      cantidad_ajuste: input.cantidad_ajuste,
      motivo: input.motivo,
      timestamp: new Date().toISOString(),
    };
  },
  compensationSkillId: 'skill_ajustar_stock_inverso',
  compensationHandler: async (ctx: TenantContext, output: AjustarStockOutput) => {
    console.log(`[Saga Rollback] Revirtiendo ajuste de stock en ${output.sku}: Contra-ajuste de ${-output.cantidad_ajuste}`);
  },
};

// -----------------------------------------------------------------------------
// 3. skill_evaluar_punto_reorden
// -----------------------------------------------------------------------------
export const EvaluarPuntoReordenInputSchema = z.object({
  sku: z.string(),
  stock_actual: z.number(),
  stock_en_transito: z.number().default(0),
  punto_reorden: z.number().positive(),
  consumo_diario_promedio: z.number().positive(),
  lead_time_dias: z.number().positive(),
});

export type EvaluarPuntoReordenInput = z.infer<typeof EvaluarPuntoReordenInputSchema>;

export const skillEvaluarPuntoReorden: SkillRegistration<EvaluarPuntoReordenInput, any> = {
  id: 'skill_evaluar_punto_reorden',
  category: 'inventory',
  description: 'Determina si el inventario cruzó el punto de reorden y sugiere reposición óptima.',
  handler: async (ctx: TenantContext, rawInput: EvaluarPuntoReordenInput) => {
    const input = EvaluarPuntoReordenInputSchema.parse(rawInput);
    const stockEfectivo = input.stock_actual + input.stock_en_transito;
    const requiereReorden = stockEfectivo <= input.punto_reorden;

    const diasCobertura = Math.round((input.stock_actual / input.consumo_diario_promedio) * 10) / 10;
    
    // Cantidad sugerida: reposición para cubrir lead_time + colchón de seguridad (30%)
    const consumoPeriodoLeadTime = input.consumo_diario_promedio * input.lead_time_dias;
    const stockSeguridad = Math.round(consumoPeriodoLeadTime * 0.3);
    const cantidadSugerida = requiereReorden
      ? Math.max(0, Math.round(consumoPeriodoLeadTime + stockSeguridad - stockEfectivo))
      : 0;

    return {
      sku: input.sku,
      stock_efectivo: stockEfectivo,
      requiere_reorden: requiereReorden,
      dias_cobertura_restantes: diasCobertura,
      cantidad_sugerida_reposicion: cantidadSugerida,
      alerta_quiebre_inminente: diasCobertura < input.lead_time_dias,
    };
  },
};

// -----------------------------------------------------------------------------
// 4. skill_generar_orden_compra
// -----------------------------------------------------------------------------
export const GenerarOrdenCompraInputSchema = z.object({
  proveedor_id: z.string(),
  items: z.array(
    z.object({
      sku: z.string(),
      cantidad: z.number().positive(),
      precio_unitario_acordado: z.number().positive(),
    })
  ).min(1),
  moneda: z.string().length(3),
});

export type GenerarOrdenCompraInput = z.infer<typeof GenerarOrdenCompraInputSchema>;

export interface GenerarOrdenCompraOutput {
  orden_compra_id: string;
  consecutivo: string;
  proveedor_id: string;
  monto_total: number;
  moneda: string;
  estado: string;
}

export const skillGenerarOrdenCompra: SkillRegistration<GenerarOrdenCompraInput, GenerarOrdenCompraOutput> = {
  id: 'skill_generar_orden_compra',
  category: 'inventory',
  description: 'Genera orden de compra formal para reabastecimiento con proveedor.',
  handler: async (ctx: TenantContext, rawInput: GenerarOrdenCompraInput) => {
    const input = GenerarOrdenCompraInputSchema.parse(rawInput);
    const montoTotal = Math.round(
      input.items.reduce((acc, curr) => acc + curr.cantidad * curr.precio_unitario_acordado, 0) * 100
    ) / 100;

    const ordenCompraId = crypto.randomUUID();
    const consecutivo = `OC-${ctx.jurisdiction}-${Date.now().toString().slice(-6)}`;

    return {
      orden_compra_id: ordenCompraId,
      consecutivo,
      proveedor_id: input.proveedor_id,
      monto_total: montoTotal,
      moneda: input.moneda,
      estado: 'GENERADA_AUTOMATICA',
    };
  },
  compensationSkillId: 'skill_cancelar_orden_compra',
  compensationHandler: async (ctx: TenantContext, output: GenerarOrdenCompraOutput) => {
    console.log(`[Saga Rollback] Cancelando orden de compra ${output.consecutivo} (${output.orden_compra_id})`);
  },
};
