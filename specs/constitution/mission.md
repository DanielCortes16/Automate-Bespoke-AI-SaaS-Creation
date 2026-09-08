# Constitution: Mission & Guiding Principles
> **Automate-Bespoke-AI-SaaS-Creation Engine**

---

## 1. Misión Central

Construir el **motor definitivo de generación y ejecución de plataformas SaaS empresariales**, permitiendo que cualquier solución de software especializada (restauración, manufactura pesada, logística, contabilidad o clínicas) sea creada y personalizada **únicamente a través de especificaciones declarativas (Spec-Driven Development)**, eliminando la necesidad de escribir nuevo código de backend para cada caso de uso.

---

## 2. Los 5 Mandamientos de la Plataforma (Invariantes del Sistema)

### I. Separación Absoluta entre Motor y Dominio
El núcleo del motor (harness, bus de eventos, ledger WORM, orquestación de loops) debe ser **estrictamente agnóstico del vertical**. Jamás debe existir una condición `if (sector === 'restaurant')` en el código base. Todo comportamiento específico del dominio debe emanar de la especificación YAML y del adaptador de prompt inyectado.

### II. Seguridad Determinista sobre Heurísticas Cognitivas
Los agentes LLM son generadores de **intenciones estructuradas**, pero **nunca ejecutores directos**. Ninguna operación en base de datos, dispersión financiera o mutación de inventario puede saltarse el **Safety Harness** ni los contratos estrictos de validación con Zod/JSON Schema.

### III. Aislamiento Multitenant a Nivel Criptográfico y de Datos
Ningún inquilino puede acceder, inferir o comprometer datos de otro. Cada transacción, consulta SQL, evento en el bus NATS y registro en el Ledger WORM debe portar obligatoriamente el contexto de inquilino (`tenant_id`), reforzado por **Row Level Security (RLS)** y subjects aislados.

### IV. Auditoría Continua y Trazabilidad Inmutable (WORM)
Toda acción ejecutada por un agente o usuario genera un bloque inmutable encadenado criptográficamente ($\text{HMAC-SHA256}$). El cumplimiento normativo no es una característica opcional ni un proceso batch nocturno: se valida y registra en tiempo real en cada ciclo.

### V. Transacciones con Auto-Corrección y Compensación Saga
Cada skill mutacional debe proveer una contraparte de compensación reversa (*rollback*). Los procesos complejos operan bajo el patrón Saga y ciclos de **Loop Engineering** (`VALIDATE -> EXECUTE -> AUDIT -> OPTIMIZE`), otorgando resiliencia y auto-sanación ante discrepancias operativas.

---

## 3. Sectores Objetivo (Verticals)

1. **Hospitalidad & Restauración**: Asignación dinámica de mesas, comandas, aforos y monitoreo de frío (HACCP).
2. **Manufactura & Maquinaria**: Telemetría IoT en tiempo real, mantenimiento preventivo por ciclos de trabajo y control de activos.
3. **Retail & Ferretería Industrial**: Control de stock multialmacén, punto de reorden con predicción de demanda y facturación fiscal automatizada.
4. **Servicios Profesionales & Contabilidad**: Cruce de cuentas por cobrar/pagar, conciliación bancaria y auditoría inmutable de partida doble.
