# Arquitectura

El frontend React no contiene lógica de análisis. La capa de datos reside en `src/services/` y los hooks de TanStack Query en `src/hooks/`; los componentes no llaman Supabase directamente. Supabase proporciona Auth, PostgreSQL y RLS. La sesión se restaura antes de montar contenido privado.

Flujo: cuenta pública → descarga PGN → normalización → almacenamiento deduplicado → análisis → dossier.
