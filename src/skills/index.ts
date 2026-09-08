/**
 * Catálogo Unificado de Skills Modulares del Motor SaaS.
 * Exporta todas las skills implementadas y provee la función de registro masivo.
 */

import { SkillRuntime } from '../core/skills/skill-runtime.js';

// Contabilidad & Finanzas
export * from './accounting/accounting-skills.js';
import {
  skillCrearFactura,
  skillConciliarTransaccion,
  skillAuditarAsientoContable,
  skillEmitirPagoProveedor,
} from './accounting/accounting-skills.js';

// Inventario & Abastecimiento
export * from './inventory/inventory-skills.js';
import {
  skillCalcularInventario,
  skillAjustarStock,
  skillEvaluarPuntoReorden,
  skillGenerarOrdenCompra,
} from './inventory/inventory-skills.js';

// Mantenimiento & IoT
export * from './maintenance/maintenance-skills.js';
import {
  skillAlertarMantenimientoPreventivo,
  skillRegistrarOrdenTrabajoMantenimiento,
  skillDiagnosticarAnomaliaTelemetria,
} from './maintenance/maintenance-skills.js';

// Hospitalidad & Asignación
export * from './hospitality/hospitality-skills.js';
import {
  skillValidarDisponibilidad,
  skillCrearReserva,
  skillAsignarRecurso,
} from './hospitality/hospitality-skills.js';

// Servicio & Solicitudes
export * from './service/service-skills.js';
import {
  skillRegistrarSolicitudServicio,
  skillEnrutarSolicitudSLA,
  skillEmitirNotificacionMulticanal,
} from './service/service-skills.js';

// Compliance & Seguridad
export * from './compliance/compliance-skills.js';
import {
  skillVerificarComplianceOperativo,
  skillBloquearTransaccionSospechosa,
} from './compliance/compliance-skills.js';

/**
 * Registra todas las 18 skills estándar en el runtime suministrado.
 */
export function registerAllStandardSkills(runtime: SkillRuntime): void {
  // Contabilidad
  runtime.registerSkill(skillCrearFactura);
  runtime.registerSkill(skillConciliarTransaccion);
  runtime.registerSkill(skillAuditarAsientoContable);
  runtime.registerSkill(skillEmitirPagoProveedor);

  // Inventario
  runtime.registerSkill(skillCalcularInventario);
  runtime.registerSkill(skillAjustarStock);
  runtime.registerSkill(skillEvaluarPuntoReorden);
  runtime.registerSkill(skillGenerarOrdenCompra);

  // Mantenimiento
  runtime.registerSkill(skillAlertarMantenimientoPreventivo);
  runtime.registerSkill(skillRegistrarOrdenTrabajoMantenimiento);
  runtime.registerSkill(skillDiagnosticarAnomaliaTelemetria);

  // Hospitalidad
  runtime.registerSkill(skillValidarDisponibilidad);
  runtime.registerSkill(skillCrearReserva);
  runtime.registerSkill(skillAsignarRecurso);

  // Servicio
  runtime.registerSkill(skillRegistrarSolicitudServicio);
  runtime.registerSkill(skillEnrutarSolicitudSLA);
  runtime.registerSkill(skillEmitirNotificacionMulticanal);

  // Compliance & Seguridad
  runtime.registerSkill(skillVerificarComplianceOperativo);
  runtime.registerSkill(skillBloquearTransaccionSospechosa);
}
