# Seguridad

RLS está habilitado en ambas tablas. `profiles` exige que `auth.uid() = user_id` para todas las operaciones. Las policies de `chess_accounts` verifican mediante `exists` que el perfil pertenezca al usuario autenticado, incluso ante llamadas directas a Data API. Las claves de servicio nunca se exponen en el frontend.

La validación final se realizó directamente a nivel PostgreSQL/RLS: 13 pruebas cruzadas entre Usuario A y Usuario B, 13 PASS y 0 FAIL. Se validó que B no puede seleccionar, actualizar, borrar ni insertar datos ligados al perfil de A, mientras conserva acceso a sus propios datos. Data API está expuesta únicamente para `profiles` y `chess_accounts`; RLS sigue siendo la capa que determina las filas permitidas.
