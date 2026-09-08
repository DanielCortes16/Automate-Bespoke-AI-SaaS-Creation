# Implementation Plan: Bespoke Headless UI & Theming
> **Feature ID:** `feat-08-bespoke-ui-theming`  

---

## 1. Arquitectura de Componentes

```
SaaS-Spec (branding + data_models) -> [Token Compiler] -> Inyección CSS :root -> [Dynamic Schema Form / View Factory] -> UI Final
```

---

## 2. Estrategia de Renderizado

- Frontend: Next.js (App Router) + Tailwind CSS v4 / Vanilla CSS variables.
- Dynamic Form Generator: Renderizado recursivo de campos basado en el tipo canónico (`string`, `currency`, `enum`, `datetime`).
- Sincronización en Vivo: Suscripción a canal SSE expuesto por el gateway NATS para actualización instantánea de estados (ej. cambio de mesa de `libre` a `ocupada`).

---

## 3. Criterios de Aceptación
- [x] Tipado formal de `BrandingConfig` y `BrandingTokens` en `src/types/spec.ts`.
- [x] Ejemplos reales de temas en `restaurant_spec.yaml` (cálido, fuentes serif) y `hardware_store_spec.yaml` (azul industrial, fuentes angulares).
- [ ] Implementar generador de CSS strings para inyección en el SSR del cliente web.
