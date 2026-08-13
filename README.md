# Chess Profile Analyzer

Plataforma multiusuario para centralizar cuentas públicas de Lichess y Chess.com y producir análisis trazables.

## Ejecutar

```bash
npm install
npm run dev
```

## Configuración

1. Copia `.env.example` como `.env` e introduce `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
2. Aplica las migraciones versionadas de `supabase/migrations/` mediante Supabase CLI.

`.env` está ignorado por Git. Nunca uses `service_role` en el frontend.

## Estado de Fase 2

Supabase Auth, sesión persistente, rutas privadas y persistencia de perfiles/cuentas están implementados. El modo demo/local fue eliminado. Data API está habilitada para `profiles` y `chess_accounts`; RLS fue validada con 13 pruebas cruzadas entre usuarios y 0 fallos.

Confirm email está temporalmente desactivado para QA. Debe reactivarse antes de producción o sustituirse por SMTP configurado.

## Verificación de cuentas (Fase 3A)

La aplicación verifica usernames exclusivamente con las APIs públicas de Lichess y Chess.com. No solicita contraseñas ni marca una cuenta como verificada sin una respuesta válida de la plataforma. La importación masiva de partidas sigue fuera de alcance.

## Calidad

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```
