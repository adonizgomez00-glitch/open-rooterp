# Instalación — Open RootERP

**Requisitos mínimos:**
- **Node.js 18+** (https://nodejs.org/) — solo se usa durante la instalación para `npm install`
- **Python 3.7+** (`python3`) para servir la aplicación
- Navegador moderno (Chrome, Edge, Firefox, Safari)
- Conexión a internet solo durante la instalación (la app es 100% offline)

## Instalación automática (recomendada)

### Linux / macOS

```bash
chmod +x setup.sh
./setup.sh
```

### Windows

```batch
setup.bat
```

> El `.bat` se puede abrir **como administrador**: al inicio hace `cd /d "%~dp0"`, así que npm encuentra el `package.json` aunque el símbolo del sistema arranque en `C:\Windows\system32`.

## Qué hace el script automático

1. Verifica **Node.js y npm** e instala dependencias (`npm install`).
2. Copia **Dexie a `assets/lib/dexie.js`** (indispensable para el modo offline).
3. Detecta un **puerto libre de forma persistente** y lo guarda en `.openroot-erp-port` (el puerto no cambia entre ejecuciones).
4. Configura el **auto-inicio del servidor** (obligatorio):
   - **Linux con systemd:** servicio de usuario `~/.config/systemd/user/openrooterp.service`.
   - **Linux sin systemd** (ej. antiX/sysvinit): entrada `@reboot` en el crontab del usuario.
   - **Windows:** lanzador oculto `OpenRootERP.vbs` en la carpeta de Inicio (arranca `python -m http.server <puerto> --directory <proyecto>` en segundo plano, **sin ventana cmd**).
5. Abre el navegador en `http://localhost:<puerto>`.
6. Inicia el servidor (`python3 -m http.server <puerto>`).

**Varias apps en la misma máquina:** si instalas Open RootERP y Open Root Gym juntos, cada una conserva su propia entrada de auto-inicio y toma un puerto distinto automáticamente (3000, 3001, …). Los scripts solo tocan su propia entrada, nunca la de la otra app ni tus tareas cron de producción.

## Instalación manual (opcional)

```bash
# 1. Dependencias
npm install

# 2. Dexie local (offline)
cp node_modules/dexie/dist/dexie.mjs assets/lib/dexie.js

# 3. Servidor (ES Modules requieren HTTP)
python3 -m http.server 3000
# Abrir http://localhost:3000
```

## Primer Uso

1. Al abrir por primera vez aparece el **Asistente de Configuración**.
2. Ingresar: **Nombre del negocio**, **Usuario administrador**, **Contraseña** (mínimo 8 caracteres).
3. Hacer clic en **"Configurar Sistema"**.
4. Iniciar sesión con las credenciales creadas.
5. ¡Listo! Viene con datos de ejemplo.

## Ejecutar Tests

```bash
# Tests unitarios e integración
npm test

# Tests E2E (requiere Playwright)
npm run test:e2e
```

## Actualización

```bash
git pull
npm install
cp node_modules/dexie/dist/dexie.mjs assets/lib/dexie.js
```

Al recargar la página, el Service Worker actualiza los assets automáticamente (el nombre de caché cambia con cada versión).

## Notas

- La aplicación es **100% offline**: una vez cargada no necesita internet.
- Los datos se guardan en **IndexedDB del navegador** (por origen: `localhost`, IP de red y puerto son orígenes distintos).
- No hay servidor remoto ni sincronización en la nube.
- Para respaldar datos: **Exportar → JSON**. Para restaurar: **Importar → JSON**.
- Para desinstalar: [UNINSTALL.md](UNINSTALL.md).