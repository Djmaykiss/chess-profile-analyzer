# Changelog

## 0.2.1

- Validada la Fase 2: Auth, persistencia, Data API y RLS.
- Confirmado aislamiento multiusuario en PostgreSQL/RLS: 13 PASS, 0 FAIL.
- Congelada la base de Auth/RLS; la integración Lichess/Chess.com permanece fuera de alcance.
- Documentado que Confirm email está temporalmente OFF para QA y requiere revisión antes de producción.

## 0.2.0

- Añadidos Supabase Auth, restauración de sesión, logout y protección de rutas.
- Reemplazado el almacenamiento demo por servicios Supabase y hooks TanStack Query.
- Añadida migración versionada para perfiles, cuentas, trigger de fechas e RLS.

## 0.1.0

- Creada la aplicación React/TypeScript/Vite.
- Implementados login y registro demostrativos, dashboard, perfiles y cuentas.
- Añadida documentación de producto y arquitectura.
