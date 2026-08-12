# Reglas del proyecto

1. Supabase Auth es el sistema oficial de autenticación. El modo demo/local está eliminado.
2. RLS es obligatoria; nunca desactivarla como solución rápida.
3. Nunca usar `service_role` en frontend ni exponer secretos.
4. Cada usuario solo puede acceder a sus propios perfiles. `chess_accounts` pertenece a un `profile` y hereda su propiedad.
5. El aislamiento multiusuario fue validado con 13 pruebas RLS y 0 fallos. Data API está habilitada para `profiles` y `chess_accounts`.
6. Confirm email está temporalmente OFF para QA y debe revisarse antes de producción o sustituirse por SMTP configurado.
7. Esta base de Auth/RLS queda congelada y no debe modificarse salvo solicitud explícita. No continuar aún con integración Lichess/Chess.com.
8. Los PGN originales son inmutables; nunca inventar partidas, estadísticas, ratings ni conclusiones.
9. Todo cambio de base de datos usa migraciones. La UI debe ser responsive y la lógica de análisis no vive en componentes visuales.
