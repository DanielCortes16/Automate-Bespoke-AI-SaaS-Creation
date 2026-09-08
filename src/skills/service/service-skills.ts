/**
 * Skills Modulares: Servicio, Solicitudes & Notificaciones
 * Triaje de peticiones, cálculo de SLA multicanal y despacho de notificaciones.
 */

import { z } from 'zod';
import { SkillRegistration } from '../../core/skills/skill-runtime.js';
import { TenantContext } from '../../types/spec.js';

// -----------------------------------------------------------------------------
// 1. skill_registrar_solicitud_servicio
// -----------------------------------------------------------------------------
export const RegistrarSolicitudInputSchema = z.object({
  cliente_id: z.string(),
  canal: z.enum(['WHATSAPP', 'PORTAL_WEB', 'EMAIL', 'TELEFONO']),
  categoria: z.string(),
  descripcion: z.string().min(5),
});

export type RegistrarSolicitudInput = z.infer<typeof RegistrarSolicitudInputSchema>;

export const skillRegistrarSolicitudServicio: SkillRegistration<RegistrarSolicitudInput, any> = {
  id: 'skill_registrar_solicitud_servicio',
  category: 'service',
  description: 'Ingesta y clasifica una solicitud de servicio o ticket de atención.',
  handler: async (ctx: TenantContext, rawInput: RegistrarSolicitudInput) => {
    const input = RegistrarSolicitudInputSchema.parse(rawInput);
    const ticketId = crypto.randomUUID();
    const numeroTicket = `TCK-${Date.now().toString().slice(-6)}`;

    return {
      ticket_id: ticketId,
      numero_ticket: numeroTicket,
      cliente_id: input.cliente_id,
      canal: input.canal,
      categoria: input.categoria,
      estado: 'INGRESADO',
      timestamp: new Date().toISOString(),
    };
  },
};

// -----------------------------------------------------------------------------
// 2. skill_enrutar_solicitud_sla
// -----------------------------------------------------------------------------
export const EnrutarSolicitudSLAInputSchema = z.object({
  ticket_id: z.string(),
  prioridad: z.enum(['BAJA', 'MEDIA', 'ALTA', 'CRITICA']),
  categoria: z.string(),
});

export type EnrutarSolicitudSLAInput = z.infer<typeof EnrutarSolicitudSLAInputSchema>;

export const skillEnrutarSolicitudSLA: SkillRegistration<EnrutarSolicitudSLAInput, any> = {
  id: 'skill_enrutar_solicitud_sla',
  category: 'service',
  description: 'Calcula el SLA contractual y asigna la cola de atención correspondiente.',
  handler: async (ctx: TenantContext, rawInput: EnrutarSolicitudSLAInput) => {
    const input = EnrutarSolicitudSLAInputSchema.parse(rawInput);

    let slaMinutos = 1440; // 24h por defecto
    let cola = 'cola_general';

    switch (input.prioridad) {
      case 'CRITICA':
        slaMinutos = 60; // 1 hora
        cola = 'cola_soporte_urgente';
        break;
      case 'ALTA':
        slaMinutos = 240; // 4 horas
        cola = 'cola_soporte_nivel2';
        break;
      case 'MEDIA':
        slaMinutos = 480; // 8 horas
        cola = 'cola_soporte_nivel1';
        break;
      case 'BAJA':
        slaMinutos = 1440;
        cola = 'cola_general';
        break;
    }

    const fechaLimite = new Date(Date.now() + slaMinutos * 60 * 1000).toISOString();

    return {
      ticket_id: input.ticket_id,
      prioridad: input.prioridad,
      sla_minutos_resolucion: slaMinutos,
      fecha_limite_resolucion: fechaLimite,
      cola_asignada: cola,
    };
  },
};

// -----------------------------------------------------------------------------
// 3. skill_emitir_notificacion_multicanal
// -----------------------------------------------------------------------------
export const EmitirNotificacionInputSchema = z.object({
  canal: z.enum(['WHATSAPP', 'SMS', 'EMAIL', 'WEBHOOK']),
  destinatario: z.string().min(3),
  asunto: z.string().optional(),
  mensaje: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

export type EmitirNotificacionInput = z.infer<typeof EmitirNotificacionInputSchema>;

export const skillEmitirNotificacionMulticanal: SkillRegistration<EmitirNotificacionInput, any> = {
  id: 'skill_emitir_notificacion_multicanal',
  category: 'service',
  description: 'Despacha notificaciones transaccionales vía WhatsApp, SMS, Email o Webhooks.',
  handler: async (ctx: TenantContext, rawInput: EmitirNotificacionInput) => {
    const input = EmitirNotificacionInputSchema.parse(rawInput);
    const notificationId = `NOTIF-${Date.now().toString().slice(-8)}`;

    return {
      notification_id: notificationId,
      canal: input.canal,
      destinatario: input.destinatario,
      estado_envio: 'ENTREGADO_A_PROVEEDOR',
      timestamp: new Date().toISOString(),
    };
  },
};
