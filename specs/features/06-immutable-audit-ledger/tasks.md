# Task Breakdown: Immutable WORM Audit Ledger
> **Feature ID:** `feat-06-immutable-audit-ledger`  

---

## Lista de Tareas de Ingeniería

- [x] **TASK-06.1**: Diseñar `AuditRecord` e `ImmutableAuditLedger` con HMAC-SHA256 en `src/core/audit/worm-ledger.ts`.
- [x] **TASK-06.2**: Implementar `recordExecution()` y actualización del puntero `lastHash`.
- [ ] **TASK-06.3**: Implementar función `verifyChainIntegrity()` que recorra una serie de bloques y certifique la validez criptográfica.
- [ ] **TASK-06.4**: Crear tabla PostgreSQL `audit_ledger` con políticas estrictas de revocación de permisos (`REVOKE UPDATE, DELETE ON audit_ledger FROM PUBLIC;`).
- [ ] **TASK-06.5**: Implementar exportación de reportes de auditoría en formato PDF/A firmado digitalmente para inspectores fiscales o reguladores sanitarios.
