# Integraciones

Lichess y Chess.com se consultarán solo mediante datos públicos. Se valida el username antes de guardar una cuenta; la primera sincronización recupera historial y las posteriores solo partidas desde `last_sync_at`. Los errores y rate limits conservan los datos previos y se reintentan de forma controlada.
