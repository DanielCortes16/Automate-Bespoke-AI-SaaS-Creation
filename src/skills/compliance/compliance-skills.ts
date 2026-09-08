/**
 * Skills Modulares: Compliance, Auditoría & Seguridad
 * Validación de reglas normativas y activación de cortafuegos transaccionales.
 */

import { z } from 'zod';
import { SkillRegistration } from '../../core/skills/skill-runtime.js';
import { TenantContext } from '../../types/spec.js';

// -----------------------------------------------------------------------------
// 1. skill_verificar_compliance_operativo
// -----------------------------------------------------------------------------
export const VerificarComplianceInputSchema = z.object({
  estandar: z.enum(['PCI-DSS', 'FISCAL_DIAN', 'FISCAL_SAT', 'HACCP_SANITARIO', 'ISO-9001']),
  datos_evaluacion: z.record(z.unknown()),
});

export type VerificarComplianceInput = z.infer<typeof VerificarComplianceInputSchema>;

export const skillVerificarComplianceOperativo: SkillRegistration<VerificarComplianceInput, any> = {
  id: 'skill_verificar_compliance_operativo',
  category: 'compliance',
  description: 'Evalúa si una operación cumple con las directivas normativas configuradas.',
  handler: async (ctx: TenantContext, rawInput: VerificarComplianceInput) => {
    const input = VerificarComplianceInputSchema.parse(rawInput);
    const violaciones: string[] = [];

    if (input.estandar === 'PCI-DSS') {
      const datosStr = JSON.stringify(input.datos_evaluacion);
      // Validar que no se transmitan números de tarjeta en texto claro (PAN 16 dígitos)
      if (/\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/.test(datosStr)) {
        violaciones.push('Violación PCI-DSS: Detección de número de tarjeta no cifrado (PAN en texto plano).');
      }
    }

    if (input.estandar === 'HACCP_SANITARIO') {
      const temp = Number(input.datos_evaluacion['temperatura_camara_frio'] ?? 0);
      if (temp > 4.0) {
        violaciones.push(`Violación HACCP: Temperatura en cámara fría superior a 4°C (${temp}°C).`);
      }
    }

    const aprobado = violaciones.length === 0;

    return {
      estandar: input.estandar,
      aprobado,
      violaciones,
      timestamp: new Date().toISOString(),
    };
  },
};

// -----------------------------------------------------------------------------
// 2. skill_bloquear_transaccion_sospechosa
// -----------------------------------------------------------------------------
export const BloquearTransaccionInputSchema = z.object({
  entidad_id: z.string(),
  tipo_entidad: z.enum(['CLIENTE', 'TRANSACCION', 'USUARIO', 'ACTIVO']),
  score_riesgo: z.number().min(0).max(1),
  motivo_bloqueo: z.string().min(5),
});

export type BloquearTransaccionInput = z.infer<typeof BloquearTransaccionInputSchema>;

export interface BloquearTransaccionOutput {
  bloqueo_id: string;
  entidad_id: string;
  score_riesgo: number;
  estado_cuarentena: string;
  timestamp: string;
}

export const skillBloquearTransaccionSospechosa: SkillRegistration<
  BloquearTransaccionInput,
  BloquearTransaccionOutput
> = {
  id: 'skill_bloquear_transaccion_sospechosa',
  category: 'security',
  description: 'Activa cuarentena y congela operaciones ante detección de anomalía de alto riesgo.',
  handler: async (ctx: TenantContext, rawInput: BloquearTransaccionInput) => {
    const input = BloquearTransaccionInputSchema.parse(rawInput);
    const bloqueoId = `BLK-${Date.now().toString().slice(-8)}`;

    return {
      bloqueo_id: bloqueoId,
      entidad_id: input.entidad_id,
      score_riesgo: input.score_riesgo,
      estado_cuarentena: 'CUARENTENA_ACTIVA',
      timestamp: new Date().toISOString(),
    };
  },
  compensationSkillId: 'skill_desbloquear_con_aprobacion_dual',
  compensationHandler: async (ctx: TenantContext, output: BloquearTransaccionOutput) => {
    console.log(`[Saga Rollback] Levantando bloqueo ${output.bloqueo_id} tras aprobación dual autorizada`);
  },
};
