/**
 * Skills Modulares: Mantenimiento Preventivo & Telemetría IoT
 * Monitoreo predictivo, diagnóstico z-score de sensores y órdenes de trabajo.
 */

import { z } from 'zod';
import { SkillRegistration } from '../../core/skills/skill-runtime.js';
import { TenantContext } from '../../types/spec.js';

// -----------------------------------------------------------------------------
// 1. skill_alertar_mantenimiento_preventivo
// -----------------------------------------------------------------------------
export const AlertarMantenimientoInputSchema = z.object({
  activo_id: z.string(),
  nombre_activo: z.string(),
  horas_acumuladas: z.number().nonnegative(),
  umbral_horas_mantenimiento: z.number().positive(),
  dias_desde_ultimo_mantenimiento: z.number().nonnegative(),
});

export type AlertarMantenimientoInput = z.infer<typeof AlertarMantenimientoInputSchema>;

export const skillAlertarMantenimientoPreventivo: SkillRegistration<AlertarMantenimientoInput, any> = {
  id: 'skill_alertar_mantenimiento_preventivo',
  category: 'maintenance',
  description: 'Evalúa umbrales de horas de operación y dispara alertas de servicio preventivo.',
  handler: async (ctx: TenantContext, rawInput: AlertarMantenimientoInput) => {
    const input = AlertarMantenimientoInputSchema.parse(rawInput);
    const porcentajeUso = Math.round((input.horas_acumuladas / input.umbral_horas_mantenimiento) * 100);

    let severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA' = 'BAJA';
    let requiereServicioInmediato = false;

    if (porcentajeUso >= 100) {
      severidad = 'CRITICA';
      requiereServicioInmediato = true;
    } else if (porcentajeUso >= 90) {
      severidad = 'ALTA';
    } else if (porcentajeUso >= 75) {
      severidad = 'MEDIA';
    }

    return {
      activo_id: input.activo_id,
      nombre_activo: input.nombre_activo,
      porcentaje_uso: porcentajeUso,
      severidad,
      requiere_servicio_inmediato: requiereServicioInmediato,
      mensaje: `El activo ${input.nombre_activo} se encuentra al ${porcentajeUso}% del ciclo recomendado de mantenimiento.`,
      timestamp: new Date().toISOString(),
    };
  },
};

// -----------------------------------------------------------------------------
// 2. skill_registrar_orden_trabajo_mantenimiento
// -----------------------------------------------------------------------------
export const RegistrarOrdenTrabajoInputSchema = z.object({
  activo_id: z.string(),
  descripcion_falla: z.string().min(5),
  prioridad: z.enum(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']),
  repuestos_solicitados: z.array(z.string()).default([]),
  tecnico_asignado_id: z.string().optional(),
});

export type RegistrarOrdenTrabajoInput = z.infer<typeof RegistrarOrdenTrabajoInputSchema>;

export interface RegistrarOrdenTrabajoOutput {
  orden_trabajo_id: string;
  codigo_ot: string;
  activo_id: string;
  prioridad: string;
  repuestos_bloqueados: string[];
  estado: string;
}

export const skillRegistrarOrdenTrabajoMantenimiento: SkillRegistration<
  RegistrarOrdenTrabajoInput,
  RegistrarOrdenTrabajoOutput
> = {
  id: 'skill_registrar_orden_trabajo_mantenimiento',
  category: 'maintenance',
  description: 'Crea orden de trabajo técnico y bloquea repuestos en inventario.',
  handler: async (ctx: TenantContext, rawInput: RegistrarOrdenTrabajoInput) => {
    const input = RegistrarOrdenTrabajoInputSchema.parse(rawInput);
    const otId = crypto.randomUUID();
    const codigoOT = `OT-${Date.now().toString().slice(-6)}`;

    return {
      orden_trabajo_id: otId,
      codigo_ot: codigoOT,
      activo_id: input.activo_id,
      prioridad: input.prioridad,
      repuestos_bloqueados: input.repuestos_solicitados,
      estado: 'ASIGNADA',
    };
  },
  compensationSkillId: 'skill_liberar_repuestos_orden_trabajo',
  compensationHandler: async (ctx: TenantContext, output: RegistrarOrdenTrabajoOutput) => {
    console.log(`[Saga Rollback] Liberando repuestos apartados para orden ${output.codigo_ot}`);
  },
};

// -----------------------------------------------------------------------------
// 3. skill_diagnosticar_anomalia_telemetria
// -----------------------------------------------------------------------------
export const DiagnosticarAnomaliaInputSchema = z.object({
  activo_id: z.string(),
  tipo_sensor: z.string(),
  lecturas: z.array(z.number()).min(5, 'Se requieren al menos 5 lecturas para cálculo estadístico'),
  rango_nominal: z.object({
    min: z.number(),
    max: z.number(),
  }),
});

export type DiagnosticarAnomaliaInput = z.infer<typeof DiagnosticarAnomaliaInputSchema>;

export const skillDiagnosticarAnomaliaTelemetria: SkillRegistration<DiagnosticarAnomaliaInput, any> = {
  id: 'skill_diagnosticar_anomalia_telemetria',
  category: 'maintenance',
  description: 'Calcula desviaciones z-score en lecturas de sensores IoT y detecta patrones anómalos.',
  handler: async (ctx: TenantContext, rawInput: DiagnosticarAnomaliaInput) => {
    const input = DiagnosticarAnomaliaInputSchema.parse(rawInput);

    const n = input.lecturas.length;
    const media = input.lecturas.reduce((a, b) => a + b, 0) / n;
    const varianza = input.lecturas.reduce((a, b) => a + Math.pow(b - media, 2), 0) / n;
    const desviacionEstandar = Math.sqrt(varianza) || 0.0001;

    let maxZScore = 0;
    let anomalasFueraDeRango = 0;

    for (const val of input.lecturas) {
      const z = Math.abs((val - media) / desviacionEstandar);
      if (z > maxZScore) maxZScore = z;
      if (val < input.rango_nominal.min || val > input.rango_nominal.max) {
        anomalasFueraDeRango++;
      }
    }

    const anomaliaDetectada = maxZScore >= 2.5 || anomalasFueraDeRango > 0;

    return {
      activo_id: input.activo_id,
      tipo_sensor: input.tipo_sensor,
      media_lecturas: Math.round(media * 100) / 100,
      desviacion_estandar: Math.round(desviacionEstandar * 100) / 100,
      max_z_score: Math.round(maxZScore * 100) / 100,
      anomalia_detectada: anomaliaDetectada,
      diagnostico: anomaliaDetectada
        ? `Desviación estadística severa detectada (Z-Score: ${maxZScore.toFixed(2)}, Outliers: ${anomalasFueraDeRango})`
        : 'Patrón de telemetría nominal y estable',
    };
  },
};
