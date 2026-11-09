# Carrito: instalación y comprobación

Este arreglo se integra en `feat/admin-panel`, conservando el panel de Gustavo y trayendo el carrito y checkout de `develop`.

## Instalación

1. Aplicar `supabase/migrations/012_cart_atomic.sql` en el mismo proyecto Supabase usado por la API, después de las migraciones anteriores. Agrega una función de guardado transaccional y una tabla de claves de fusión; instalarla no modifica los carritos existentes.
2. Actualizar la rama y ejecutar `npm ci` en `backend` y `frontend`.
3. Reiniciar ambos servidores. Actualizar frontend y backend juntos: `POST /api/cart/merge` ahora requiere `mergeId` (UUID).

Si falta la migración, la API devuelve 503 con un mensaje explícito; no intenta borrar ni reemplazar datos por otro mecanismo.

## Comportamiento

- Visitantes: cantidades y productos en LocalStorage.
- Sesión: se fusiona solo el carrito de visitante, con una clave persistente para que reintentar una respuesta perdida no duplique cantidades. Una copia que ya pertenece a la cuenta se recupera con GET.
- Cierre/cambio de sesión: se limpia la copia local y se ignoran cargas y guardados pendientes de la cuenta anterior. Su carrito en Supabase se conserva.
- Cantidades: enteros positivos y variantes únicas, con límite de stock en el cliente y en PostgreSQL. La fusión limita cantidades al stock y omite variantes agotadas o productos inactivos.
- Guardado: escrituras del navegador en orden; la base reemplaza todo en una transacción. Un fallo revierte el borrado y la inserción.
- Checkout: espera los guardados pendientes y detiene la compra si el carrito no pudo sincronizarse.
- Errores de sincronización: se muestran en el panel del carrito y se pueden reintentar.

## Prueba manual

1. Como visitante, agregar un producto, cambiar cantidad, recargar y comprobar subtotal.
2. Iniciar sesión: comprobar fusión; recargar dos veces y verificar que no se sumen unidades otra vez.
3. Cerrar sesión: el carrito local debe quedar vacío. Entrar con otra cuenta: no debe recibir los productos de la primera.
4. Intentar superar stock: no debe permitirlo. Enviar una cantidad inválida directamente a la API: debe devolver 400; exceso de stock, 409.
5. Simular falta de conexión al guardar: debe mostrar el error y permitir reintentar, sin perder el carrito anterior de la base.
6. Confirmar un pedido y comprobar que el carrito queda vacío.

## Pruebas automáticas

- `frontend`: `npx vitest run`, `npx eslint .`, `npm run build`.
- `backend`: `npm test`, `npm run lint`.
- `backend/tests/cart.database.test.js` ejecuta el SQL real en PostgreSQL local aislado: rollback, stock, fusión idempotente y permisos. No modifica Supabase.
