# Feature Specification: Immutable WORM Audit Ledger
> **Feature ID:** `feat-06-immutable-audit-ledger`  
> **Status:** Implemented / Expanding  

---

## 1. Resumen Ejecutivo
El **Immutable WORM Audit Ledger (Write Once, Read Many)** provee un registro continuo, auditable e inmutable de cada decisión y mutación realizada por cualquier agente o usuario en el sistema. Utiliza encadenamiento criptográfico HMAC-SHA256 para impedir la manipulación retroactiva de datos financieros, médicos u operativos.

---

## 2. Requerimientos Funcionales

1. **Encadenamiento Criptográfico (Hash Chaining)**:
   - Cada bloque $n$ incorpora el hash del bloque $n-1$:
     $$\text{Hash}_n = \text{HMAC-SHA256}(\text{Hash}_{n-1} \parallel \text{Index} \parallel \text{TenantID} \parallel \text{AgentID} \parallel \text{SkillID} \parallel \text{Payload} \parallel \text{Timestamp})$$
2. **Registro Obligatorio de Veredicto**:
   - Cada entrada debe clasificar la operación como `COMPLIANT`, `FLAGGED` o `REJECTED`.
3. **Verificación de Integridad de la Cadena**:
   - Capacidad de verificar toda la secuencia de bloques desde el bloque génesis para certificar que ningún registro fue alterado o eliminado.

---

## 3. Requerimientos No Funcionales
- **Inalterabilidad**: La tabla o almacén subyacente no debe tener permisos de `UPDATE` o `DELETE` para ningún usuario de aplicación.
