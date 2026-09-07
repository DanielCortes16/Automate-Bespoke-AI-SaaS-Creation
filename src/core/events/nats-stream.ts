/**
 * Módulo de Event Streaming con NATS JetStream.
 * Provee publicación y suscripción aislada por inquilino (Tenant Subject Namespacing).
 */

import { TenantContext } from '../../types/spec.js';

export interface SaaSCloudEvent<T = unknown> {
  id: string;
  source: string;
  specversion: '1.0';
  type: string;
  time: string;
  tenantId: string;
  correlationId: string;
  data: T;
  traceParent?: string;
}

export class TenantEventBus {
  private serverUrls: string[];

  constructor(serverUrls: string[] = ['nats://localhost:4222']) {
    this.serverUrls = serverUrls;
  }

  /**
   * Genera el subject normalizado con aislamiento por inquilino.
   * Patrón: tenants.<tenant_id>.<domain>.<event_type>
   */
  public buildSubject(tenantId: string, domain: string, eventType: string): string {
    const cleanTenant = tenantId.replace(/\./g, '_');
    const cleanDomain = domain.replace(/\./g, '_');
    const cleanEvent = eventType.replace(/\./g, '_');
    return `tenants.${cleanTenant}.${cleanDomain}.${cleanEvent}`;
  }

  /**
   * Crea un sobre estandarizado de evento CloudEvent v1.0
   */
  public createEvent<T>(
    context: TenantContext,
    domain: string,
    eventType: string,
    payload: T
  ): { subject: string; event: SaaSCloudEvent<T> } {
    const subject = this.buildSubject(context.tenantId, domain, eventType);
    const event: SaaSCloudEvent<T> = {
      id: crypto.randomUUID(),
      source: `agent://${context.userRole}`,
      specversion: '1.0',
      type: `${domain}.${eventType}`,
      time: new Date().toISOString(),
      tenantId: context.tenantId,
      correlationId: context.correlationId,
      data: payload,
    };

    return { subject, event };
  }
}
