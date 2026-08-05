# Desinstalación — Open RootERP

La desinstalación se hace en pasos. La **carpeta del proyecto nunca se elimina automáticamente** (paso final manual).

## 1. Ejecutar el script de desinstalación

**Linux / macOS:**
```bash
uninstall.sh      # o si no tiene permiso de ejecución:  bash uninstall.sh
```

**Windows:**
```batch
uninstall.bat
```

El script hace automáticamente:

- **Detiene el servidor** si está corriendo (lee el puerto de `.openroot-erp-port` y, en su defecto, revisa los puertos 3000/3001/3002 — Linux), o por puerto con `netstat`/`taskkill` (Windows).
- **Elimina solo su propia entrada de auto-inicio**:
  - **Linux (cron):** quita la línea `@reboot` que referencia a *este directorio* (filtro por proyecto, `grep -vF "$(pwd)"`), de modo que **no borra** el `@reboot` de otras apps ni las tareas de producción.
  - **Linux (systemd):** elimina `~/.config/systemd/user/openrooterp.service`.
  - **Windows:** elimina `OpenRootERP.vbs` de la carpeta de Inicio (y el `OpenRootERP.bat` antiguo, y el registro `HKCU\...\Run\OpenRootERP`).
- **Limpia archivos temporales** (`.openroot-erp-port`, `.openroot-erp-port.bak`).
- Te indica el comando para eliminar la carpeta del proyecto (paso manual).

## 2. Detener el servidor en caliente (si hace falta)

**Linux:**
```bash
pkill -f "python3 -m http.server"
```

**Windows (PowerShell):**
```powershell
Get-NetTCPConnection -LocalPort 3000,3001,3002 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

## 3. Limpiar datos de IndexedDB (en el navegador)

Para borrar toda la información guardada localmente:

1. Abrir la app en el navegador.
2. Pulsar `F12` → pestaña **Application**.
3. **Storage → IndexedDB**, clic derecho sobre la base (`ERPLigero`) → **Clear**.
4. Recargar la página.

> Los datos viven en el navegador, **no** en `~/apps-locales`. Cada origen (`localhost:3000`, `192.168.0.150:3000`, …) tiene su propia base.

## 4. Eliminar la carpeta del proyecto (manual)

**Linux / macOS:**
```bash
rm -rf /ruta/a/Open-RootERP
```

**Windows (cmd):**
```batch
rd /s /q "C:\ruta\a\Open-RootERP"
```

**Windows (PowerShell):**
```powershell
Remove-Item -Recurse -Force "C:\ruta\a\Open-RootERP"
```

## 5. Eliminar el repositorio de GitHub (opcional)

```bash
gh repo delete adonizgomez00-glitch/open-rooterp --yes
```

## Notas

- El script **no** elimina la carpeta del proyecto por seguridad.
- Tras `uninstall.sh`, el servidor **ya no** se inicia solo al reiniciar el sistema.
- Si reinstalas, el puerto se detectará y guardará de nuevo automáticamente.