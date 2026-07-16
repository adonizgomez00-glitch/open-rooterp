# Instalación — Open RootERP

**Requisitos mínimos:**
- Node.js 18+ (descargar de https://nodejs.org/)
- Navegador moderno (Chrome, Edge, Firefox, Safari)
- Conexión a internet solo para la instalación inicial

## Instalación

### Linux / macOS

```bash
# 1. Ir a la carpeta del proyecto
cd open-rooterp

# 2. Ejecutar instalación
chmod +x setup.sh
./setup.sh
```

### Windows

```batch
:: 1. Ir a la carpeta del proyecto
cd open-rooterp

:: 2. Ejecutar instalación
setup.bat
```

### Manual

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar Dexie a assets/lib (necesario para offline)
cp node_modules/dexie/dist/dexie.mjs assets/lib/dexie.js

# 3. Iniciar servidor
python3 -m http.server 3000

# 4. Abrir en el navegador
# http://localhost:3000
```

## Primer Uso

1. Al abrir por primera vez, aparecerá el **Asistente de Configuración**
2. Ingresar:
   - **Nombre del negocio** (ej: "Mi Tienda")
   - **Usuario administrador** (ej: "admin")
   - **Contraseña** (mínimo 8 caracteres)
3. Hacer clic en "Configurar Sistema"
4. Iniciar sesión con el usuario y contraseña creados
5. ¡Listo! El sistema ya está operativo con datos de ejemplo

## Ejecutar Tests

```bash
# Tests unitarios e integración
npm test

# Tests E2E (requiere Playwright)
npm run test:e2e
```

## Actualización

Para actualizar a una nueva versión:

```bash
git pull
npm install
cp node_modules/dexie/dist/dexie.mjs assets/lib/dexie.js
```

Al recargar la página, el Service Worker actualizará los assets automáticamente.

## Notas

- La aplicación es **100% offline**: una vez cargada, no necesita internet
- Los datos se almacenan en IndexedDB (navegador)
- No hay servidor remoto ni sincronización en la nube
- Para respaldar los datos, usar Exportar → JSON (guardar el archivo)
- Para restaurar, usar Importar → JSON (seleccionar el archivo)
