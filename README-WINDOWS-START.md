# Archivos de arranque Windows para App Node.js / Next.js

## Uso

1. Copia estos 3 archivos en la raíz del proyecto:
   - package.json
   - install.windows.bat
   - start.windows.bat

2. Ejecuta `install.windows.bat` una vez.

3. Ejecuta `start.windows.bat` cada vez que quieras iniciar la app en modo desarrollo.

## Cambios principales

- Se eliminaron comandos Linux/macOS del package.json: `tee`, `cp` y `NODE_ENV=...`.
- Se reemplazó el arranque con Bun por `next start`/`next dev` usando npm.
- Se eliminó la validación obligatoria de LanceDB porque el package.json actual no incluye LanceDB.
- Prisma se ejecuta solo si existe `prisma/schema.prisma`.
- La app se expone en `0.0.0.0` para poder probar desde otros equipos de la red local.

## URLs

- Local: http://localhost:3000
- Red local: el archivo start.windows.bat mostrará la IP detectada.
