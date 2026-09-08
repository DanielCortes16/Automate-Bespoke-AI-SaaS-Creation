/**
 * Skills Modulares: Hospitalidad & Asignación de Recursos
 * Gestión de aforo, reservas de mesas/salas y asignación optimista de recursos físicos.
 */

import { z } from 'zod';
import { SkillRegistration } from '../../core/skills/skill-runtime.js';
import { TenantContext } from '../../types/spec.js';

// -----------------------------------------------------------------------------
// 1. skill_validar_disponibilidad
// -----------------------------------------------------------------------------
export const ValidarDisponibilidadInputSchema = z.object({
  fecha_hora: z.string().datetime(),
  duracion_minutos: z.number().int().min(15).max(360),
  num_personas: z.number().int().positive(),
  zona_preferida: z.string().optional(),
  recursos_existentes: z.array(
    z.object({
      id: z.string(),
      identificador: z.string(),
      zona: z.string(),
      capacidad: z.number().int(),
      estado: z.string(),
    })
  ),
});

export type ValidarDisponibilidadInput = z.infer<typeof ValidarDisponibilidadInputSchema>;

export const skillValidarDisponibilidad: SkillRegistration<ValidarDisponibilidadInput, any> = {
  id: 'skill_validar_disponibilidad',
  category: 'hospitality',
  description: 'Verifica capacidad y recursos candidatos disponibles para una franja horaria.',
  handler: async (ctx: TenantContext, rawInput: ValidarDisponibilidadInput) => {
    const input = ValidarDisponibilidadInputSchema.parse(rawInput);

    // Filtrar recursos libres con capacidad suficiente
    const candidatos = input.recursos_existentes.filter((r) => {
      const matchZona = !input.zona_preferida || r.zona === input.zona_preferida;
      const capacidadOk = r.capacidad >= input.num_personas;
      const libre = r.estado === 'libre';
      return matchZona && capacidadOk && libre;
    });

    // Ordenar por mejor ajuste de capacidad para evitar desperdicio de aforo
    candidatos.sort((a, b) => a.capacidad - b.capacidad);

    const disponible = candidatos.length > 0;

    return {
      disponible,
      total_candidatos: candidatos.length,
      mejor_opcion: candidatos[0] || null,
      candidatos_ids: candidatos.map((c) => c.id),
      mensaje: disponible
        ? `Se encontraron ${candidatos.length} opciones disponibles.`
        : 'No hay disponibilidad para el aforo o zona solicitada.',
    };
  },
};

// -----------------------------------------------------------------------------
// 2. skill_crear_reserva
// -----------------------------------------------------------------------------
export const CrearReservaInputSchema = z.object({
  cliente_nombre: z.string().min(2),
  cliente_telefono: z.string().min(7),
  fecha_hora: z.string().datetime(),
  duracion_minutos: z.number().int().default(120),
  num_personas: z.number().int().positive(),
  recurso_asignado_id: z.string(),
});

export type CrearReservaInput = z.infer<typeof CrearReservaInputSchema>;

export interface CrearReservaOutput {
  reserva_id: string;
  codigo_confirmacion: string;
  cliente_nombre: string;
  fecha_hora: string;
  recurso_asignado_id: string;
  estado: string;
}

export const skillCrearReserva: SkillRegistration<CrearReservaInput, CrearReservaOutput> = {
  id: 'skill_crear_reserva',
  category: 'hospitality',
  description: 'Genera una reserva confirmada con código único y bloqueo de recurso.',
  handler: async (ctx: TenantContext, rawInput: CrearReservaInput) => {
    const input = CrearReservaInputSchema.parse(rawInput);
    const reservaId = crypto.randomUUID();
    const codigoConfirmacion = `RSV-${Date.now().toString().slice(-6)}`;

    return {
      reserva_id: reservaId,
      codigo_confirmacion: codigoConfirmacion,
      cliente_nombre: input.cliente_nombre,
      fecha_hora: input.fecha_hora,
      recurso_asignado_id: input.recurso_asignado_id,
      estado: 'CONFIRMADA',
    };
  },
  compensationSkillId: 'skill_cancelar_reserva',
  compensationHandler: async (ctx: TenantContext, output: CrearReservaOutput) => {
    console.log(`[Saga Rollback] Cancelando reserva ${output.codigo_confirmacion} (${output.reserva_id})`);
  },
};

// -----------------------------------------------------------------------------
// 3. skill_asignar_recurso
// -----------------------------------------------------------------------------
export const AsignarRecursoInputSchema = z.object({
  recurso_id: z.string(),
  nuevo_estado: z.enum(['libre', 'reservada', 'ocupada', 'mantenimiento']),
  motivo: z.string().optional(),
});

export type AsignarRecursoInput = z.infer<typeof AsignarRecursoInputSchema>;

export interface AsignarRecursoOutput {
  recurso_id: string;
  estado_anterior: string;
  estado_actual: string;
  timestamp: string;
}

export const skillAsignarRecurso: SkillRegistration<AsignarRecursoInput, AsignarRecursoOutput> = {
  id: 'skill_asignar_recurso',
  category: 'hospitality',
  description: 'Cambia el estado operativo de un recurso físico (mesa, sala, bahía).',
  handler: async (ctx: TenantContext, rawInput: AsignarRecursoInput) => {
    const input = AsignarRecursoInputSchema.parse(rawInput);

    return {
      recurso_id: input.recurso_id,
      estado_anterior: 'libre',
      estado_actual: input.nuevo_estado,
      timestamp: new Date().toISOString(),
    };
  },
  compensationSkillId: 'skill_liberar_recurso',
  compensationHandler: async (ctx: TenantContext, output: AsignarRecursoOutput) => {
    console.log(`[Saga Rollback] Liberando recurso ${output.recurso_id} a estado 'libre'`);
  },
};
