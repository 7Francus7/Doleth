# Sprint 1 Freeze

**Estado:** congelado  
**Fecha:** 2026-07-02  
**Alcance:** Foundation, Design System ejecutable y primer flujo completo de Ahora.

## Resumen

Sprint 1 convierte Doleth en una aplicación local ejecutable. El flujo congelado permite leer el estado financiero actual, abrir la evidencia del disponible, entender su composición y volver al mismo contexto. Ahora está validada en estados Stable, Attention e Incomplete, con responsive, accesibilidad y motion sensible a preferencias del sistema.

## Commits incluidos

- `b258446 feat: initialize Doleth frontend foundation`
- `66a25e1 feat: add core design primitives`
- `09db7c5 feat: add now hero composites`
- `59edaeb feat: assemble stable now screen`
- `7d678a3 feat: add evidence sheet for available balance`
- `213a107 feat: implement attention state for now`
- `579a3de feat: implement incomplete state for now`
- `3e73a97 feat: implement motion system for sprint 1`
- `docs: freeze sprint 1` incluye la corrección de contraste y este reporte.

## Sistema construido

### Primitives

- Button
- Divider
- Label
- NumericValue
- SectionTitle
- Surface
- TextLink

### Composites

- ActionStrip
- AttentionBanner
- BottomSheet
- CoverageMeter
- EvidenceRow
- FinancialRow
- Hero
- InformationBlock
- ReserveBlock
- StabilityStatement
- SystemRail

### Navigation

- SheetHeader

### Foundations ejecutables

- colores
- tipografía
- espaciado
- radios
- bordes
- elevación
- motion

## Estados completados

- Stable: disponible confirmado, cobertura completa y evidencia reconciliada.
- Attention: una prioridad explícita, tratamiento tonal calmo y acción `resolve`.
- Incomplete: último valor visible como parcial, información faltante explícita y evidencia no definitiva.
- Evidence Sheet: breakdown completo y parcial, focus trap, Escape, backdrop, botón close y retorno de foco.

## QA ejecutado

### Visual y responsive

- `320x568`
- `390x844`
- `430x932` como iPhone alto
- `768x900` como desktop narrow
- Stable, Attention e Incomplete en Storybook
- Hero, jerarquía, wrapping, clipping y overflow horizontal
- Attention sin tratamiento crítico agresivo
- Incomplete sin lenguaje ni color de error
- Evidence Sheet preservando contexto
- consola del navegador sin errores

Resultado: ningún overflow de página, Hero íntegro y textos críticos legibles. El desborde interno de 2 px detectado en TextLink corresponde al chevron y no produce clipping visual ni overflow de viewport.

### Accesibilidad

- focus trap dentro de Bottom Sheet
- Escape cierra
- backdrop cierra
- botón `Cerrar` con nombre accesible
- foco vuelve a `Ver evidencia del disponible`
- navegación Tab permanece dentro del diálogo
- trigger y controles usan semántica nativa de botón
- `aria-haspopup`, `aria-expanded`, títulos y descripciones presentes
- reduced motion real: desplazamientos eliminados y fades mínimos conservados
- contraste de texto activo validado contra umbrales AA

Se corrigió un bug de contraste: texto tertiary y valores parciales daban entre `2.3:1` y `2.53:1`. Los usos informativos ahora renderizan con `text.secondary`; la auditoría final no detectó fallos AA en texto activo.

### Técnica

- `pnpm lint`: pasa
- `pnpm build`: pasa
- `pnpm build-storybook`: pasa
- TypeScript strict, `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes` activos
- sin componentes huérfanos detectados
- sin TODO, FIXME, HACK, `@ts-ignore` ni suppressions de ESLint
- sin timings o easing hardcodeados fuera de tokens
- stories presentes para todos los primitives y composites implementados

## Deuda técnica aceptada

- Motion existe en dos representaciones: CSS para animaciones nativas y TypeScript para Motion React. Deben mantenerse sincronizadas hasta definir una fuente generada única.
- CoverageMeter conserva `<progress>` nativo por decisión explícita. Su reemplazo queda fuera del freeze.
- QA visual y accesible todavía es manual; no existe suite Playwright persistente de regresión.
- Storybook informa chunks grandes propios del entorno de documentación. No se observó impacto en el build de la aplicación.
- El entorno de QA disponible reporta `prefers-reduced-motion: reduce`; esa ruta fue validada con la preferencia real del sistema. La ruta completa con desplazamientos debe verificarse nuevamente en un entorno con reducción desactivada antes de release público.

## Decisiones congeladas

- `DESIGN.md` continúa como autoridad visual.
- Arquitectura y jerarquía de Ahora no cambian.
- Component Library v1 no se amplía sin patrón real repetido.
- `NowViewModel` es la única entrada de Pattern Ahora.
- Fixtures no calculan dentro de componentes.
- Radix Dialog permanece como base accesible del Bottom Sheet.
- Motion usa exclusivamente duraciones y curvas oficiales.
- Ninguna cifra principal queda a más de una acción de su evidencia.
- Cambios posteriores en Sprint 1 requieren un bug reproducible o una necesidad real descubierta por producto.

## Fuera de Sprint 1

- estado New
- pantalla Actuar
- Movimientos
- Patrimonio
- Configuración y onboarding
- backend, persistencia y APIs
- autenticación
- sincronización bancaria
- navegación global
- motion entre rutas
- datos financieros reales

## Criterio para abrir Sprint 2

Sprint 2 puede comenzar cuando:

1. este freeze está integrado con working tree limpio;
2. Actuar nace de una pantalla real y reutiliza el sistema congelado;
3. ninguna modificación de Sprint 1 se mezcla con trabajo de Actuar salvo corrección de regresión;
4. cualquier componente nuevo demuestra que primitives y composites existentes no resuelven el caso;
5. cambios al Design System siguen la regla de tres acordada.

Con este commit, Sprint 1 queda oficialmente congelado.
