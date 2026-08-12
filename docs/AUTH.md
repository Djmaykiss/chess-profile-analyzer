# Autenticación

Supabase Auth es el sistema oficial de autenticación. Usa email y contraseña, con alta, login, logout y sesión persistente. `/login` y `/register` redirigen al dashboard si hay sesión; todas las demás rutas redirigen a login sin sesión. La app espera el estado inicial de Auth para evitar flashes privados.

Confirm email está temporalmente OFF para QA. Antes de producción debe reactivarse o configurarse SMTP para una confirmación de correo funcional. Nunca se solicitan credenciales de plataformas de ajedrez.
