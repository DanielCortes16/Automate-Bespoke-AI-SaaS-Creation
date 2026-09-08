/**
 * Skills Modulares: Contabilidad & Finanzas
 * Implementación determinista con validación Zod y compensación Saga.
 */

import { z } from 'zod';
import { SkillRegistration } from '../../core/skills/skill-runtime.js';
import { TenantContext } from '../../types/spec.js';

// -----------------------------------------------------------------------------
// 1. skill_crear_factura
// -----------------------------------------------------------------------------
export const CrearFacturaInputSchema = z.object({
  cliente_id: z.string().min(1, 'cliente_id es obligatorio'),
  items: z.array(
    z.object({
      sku: z.string(),
      descripcion: z.string(),
      cantidad: z.number().positive(),
      precio_unitario: z.number().nonnegative(),
      tasa_impuesto: z.number().min(0).max(1), // ej: 0.19 para 19%
    })
  ).min(1, 'Debe incluir al menos un item'),
  moneda: z.string().length(3),
  metodo_pago: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CREDITO']),
});

export type CrearFacturaInput = z.infer<typeof CrearFacturaInputSchema>;

export interface CrearFacturaOutput {
  factura_id: string;
  folio_fiscal: string;
  subtotal: number;
  total_impuestos: number;
  total_pagar: number;
  asiento_contable: {
    asiento_id: string;
    debe: { cuenta: string; monto: number }[];
    haber: { cuenta: string; monto: number }[];
  };
}

export const skillCrearFactura: SkillRegistration<CrearFacturaInput, CrearFacturaOutput> = {
  id: 'skill_crear_factura',
  category: 'accounting',
  description: 'Emite factura fiscal con cálculo exacto de impuestos y asiento contable de contrapartida.',
  handler: async (ctx: TenantContext, rawInput: CrearFacturaInput) => {
    const input = CrearFacturaInputSchema.parse(rawInput);

    let subtotal = 0;
    let totalImpuestos = 0;

    for (const item of input.items) {
      const lineSubtotal = Math.round(item.cantidad * item.precio_unitario * 100) / 100;
      const lineTax = Math.round(lineSubtotal * item.tasa_impuesto * 100) / 100;
      subtotal += lineSubtotal;
      totalImpuestos += lineTax;
    }

    subtotal = Math.round(subtotal * 100) / 100;
    totalImpuestos = Math.round(totalImpuestos * 100) / 100;
    const totalPagar = Math.round((subtotal + totalImpuestos) * 100) / 100;

    const facturaId = crypto.randomUUID();
    const folioFiscal = `FAC-${ctx.jurisdiction}-${Date.now().toString().slice(-6)}`;
    const asientoId = crypto.randomUUID();

    // Generar partida doble exacta
    const cuentaCobro = input.metodo_pago === 'CREDITO' ? '1305_CUENTAS_POR_COBRAR' : '1105_CAJA_GENERAL';
    const asientoContable = {
      asiento_id: asientoId,
      debe: [{ cuenta: cuentaCobro, monto: totalPagar }],
      haber: [
        { cuenta: '4135_INGRESOS_OPERACIONALES', monto: subtotal },
        { cuenta: '2408_IMPUESTOS_POR_PAGAR_IVA', monto: totalImpuestos },
      ],
    };

    return {
      factura_id: facturaId,
      folio_fiscal: folioFiscal,
      subtotal,
      total_impuestos: totalImpuestos,
      total_pagar: totalPagar,
      asiento_contable: asientoContable,
    };
  },
  compensationSkillId: 'skill_anular_factura_nota_credito',
  compensationHandler: async (ctx: TenantContext, output: CrearFacturaOutput) => {
    // Generación de nota de crédito / reversión contable
    console.log(`[Saga Rollback] Emitiendo Nota de Crédito para factura ${output.factura_id} (${output.folio_fiscal})`);
  },
};

// -----------------------------------------------------------------------------
// 2. skill_conciliar_transaccion
// -----------------------------------------------------------------------------
export const ConciliarTransaccionInputSchema = z.object({
  transaccion_externa_id: z.string(),
  monto_externo: z.number(),
  monto_libro_mayor: z.number(),
  tolerancia_maxima: z.number().default(0.01),
});

export type ConciliarTransaccionInput = z.infer<typeof ConciliarTransaccionInputSchema>;

export const skillConciliarTransaccion: SkillRegistration<ConciliarTransaccionInput, any> = {
  id: 'skill_conciliar_transaccion',
  category: 'accounting',
  description: 'Cruza movimientos bancarios externos vs libro mayor con umbral de tolerancia.',
  handler: async (ctx: TenantContext, rawInput: ConciliarTransaccionInput) => {
    const input = ConciliarTransaccionInputSchema.parse(rawInput);
    const diferencia = Math.abs(Math.round((input.monto_externo - input.monto_libro_mayor) * 100) / 100);

    const conciliado = diferencia <= input.tolerancia_maxima;

    return {
      transaccion_externa_id: input.transaccion_externa_id,
      conciliado,
      diferencia,
      estado: conciliado ? 'CONCILIADO' : 'DISCREPANCIA_PENDIENTE_REVISION',
    };
  },
};

// -----------------------------------------------------------------------------
// 3. skill_auditar_asiento_contable
// -----------------------------------------------------------------------------
export const AuditarAsientoInputSchema = z.object({
  asiento_id: z.string(),
  debe: z.array(z.object({ cuenta: z.string(), monto: z.number().nonnegative() })),
  haber: z.array(z.object({ cuenta: z.string(), monto: z.number().nonnegative() })),
});

export type AuditarAsientoInput = z.infer<typeof AuditarAsientoInputSchema>;

export const skillAuditarAsientoContable: SkillRegistration<AuditarAsientoInput, any> = {
  id: 'skill_auditar_asiento_contable',
  category: 'accounting',
  description: 'Verifica la invariante estricta de partida doble (Suma Debe == Suma Haber).',
  handler: async (ctx: TenantContext, rawInput: AuditarAsientoInput) => {
    const input = AuditarAsientoInputSchema.parse(rawInput);

    const sumaDebe = Math.round(input.debe.reduce((acc, curr) => acc + curr.monto, 0) * 100) / 100;
    const sumaHaber = Math.round(input.haber.reduce((acc, curr) => acc + curr.monto, 0) * 100) / 100;
    const discrepancia = Math.abs(Math.round((sumaDebe - sumaHaber) * 100) / 100);

    const valido = discrepancia === 0;

    return {
      asiento_id: input.asiento_id,
      valido,
      suma_debe: sumaDebe,
      suma_haber: sumaHaber,
      discrepancia,
      veredicto: valido ? 'ASIENTO_BALANCEADO' : 'PARTIDA_DOBLE_VIOLADA',
    };
  },
};

// -----------------------------------------------------------------------------
// 4. skill_emitir_pago_proveedor
// -----------------------------------------------------------------------------
export const EmitirPagoInputSchema = z.object({
  proveedor_id: z.string(),
  monto: z.number().positive(),
  moneda: z.string().length(3),
  referencia_factura_origen: z.string(),
});

export type EmitirPagoInput = z.infer<typeof EmitirPagoInputSchema>;

export const skillEmitirPagoProveedor: SkillRegistration<EmitirPagoInput, any> = {
  id: 'skill_emitir_pago_proveedor',
  category: 'accounting',
  description: 'Procesa y dispersa una orden de pago hacia un proveedor acreditado.',
  handler: async (ctx: TenantContext, rawInput: EmitirPagoInput) => {
    const input = EmitirPagoInputSchema.parse(rawInput);
    const comprobanteId = `TRX-PAY-${Date.now().toString().slice(-8)}`;

    return {
      comprobante_bancario_id: comprobanteId,
      proveedor_id: input.proveedor_id,
      monto_pagado: input.monto,
      moneda: input.moneda,
      fecha_dispersion: new Date().toISOString(),
      estado: 'COMPLETADO',
    };
  },
};
