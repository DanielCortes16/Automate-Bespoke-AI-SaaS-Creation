/**
 * Ledger de Auditoría Inmutable (WORM - Write Once Read Many).
 * Implementa una cadena de bloques ligera (Hash-Chained Audit Trail) con HMAC-SHA256.
 */

import { createHmac } from 'node:crypto';
import { TenantContext } from '../../types/spec.js';

export interface AuditRecord {
  blockIndex: number;
  timestamp: string;
  tenantId: string;
  correlationId: string;
  agentId: string;
  skillId: string;
  inputPayload: unknown;
  outputResult: unknown;
  verdict: 'COMPLIANT' | 'FLAGGED' | 'REJECTED';
  previousHash: string;
  blockHash: string;
}

export class ImmutableAuditLedger {
  private secretKey: string;
  private lastHash: string;
  private currentBlockIndex: number;

  constructor(secretKey: string = 'audit-default-secret-salt') {
    this.secretKey = secretKey;
    this.lastHash = '0000000000000000000000000000000000000000000000000000000000000000';
    this.currentBlockIndex = 0;
  }

  /**
   * Calcula el hash criptográfico HMAC-SHA256 encadenado.
   */
  private computeHash(
    prevHash: string,
    index: number,
    tenantId: string,
    agentId: string,
    skillId: string,
    payloadString: string,
    timestamp: string
  ): string {
    const data = `${prevHash}|${index}|${tenantId}|${agentId}|${skillId}|${payloadString}|${timestamp}`;
    return createHmac('sha256', this.secretKey).update(data).digest('hex');
  }

  /**
   * Registra una transacción en el ledger inmutable.
   */
  public recordExecution(
    context: TenantContext,
    agentId: string,
    skillId: string,
    inputPayload: unknown,
    outputResult: unknown,
    verdict: 'COMPLIANT' | 'FLAGGED' | 'REJECTED' = 'COMPLIANT'
  ): AuditRecord {
    this.currentBlockIndex += 1;
    const timestamp = new Date().toISOString();
    const payloadString = JSON.stringify({ input: inputPayload, output: outputResult });

    const blockHash = this.computeHash(
      this.lastHash,
      this.currentBlockIndex,
      context.tenantId,
      agentId,
      skillId,
      payloadString,
      timestamp
    );

    const record: AuditRecord = {
      blockIndex: this.currentBlockIndex,
      timestamp,
      tenantId: context.tenantId,
      correlationId: context.correlationId,
      agentId,
      skillId,
      inputPayload,
      outputResult,
      verdict,
      previousHash: this.lastHash,
      blockHash,
    };

    // Actualiza la última cabeza de la cadena
    this.lastHash = blockHash;
    return record;
  }

  public getLatestHash(): string {
    return this.lastHash;
  }
}
