# ThemeManager — Sistema de Temas (Claro/Oscuro)

**Archivo:** `src/utils/ThemeManager.js`
**Patrón:** Singleton

## API Pública

| Método | Descripción |
|--------|-------------|
| `getInstance()` | Obtiene la instancia singleton |
| `init()` | Carga el tema guardado desde localStorage y lo aplica |
| `getCurrentTheme()` | Retorna `'light'` o `'dark'` |
| `isDark()` | Retorna `true` si el tema actual es oscuro |
| `toggle()` | Cambia entre claro/oscuro, persiste y notifica |
| `setTheme(theme)` | Fija un tema específico (`'light'`/`'dark'`) |
| `onChange(callback)` | Registra callback que se ejecuta al cambiar tema |
| `renderToggle()` | Crea un `<button>` DOM para alternar tema |

## Almacenamiento

La preferencia se guarda en `localStorage` bajo la clave `open-rooterp-theme`.

## Aplicación

El tema se aplica agregando/removiendo la clase `theme-dark` en `document.documentElement`.

## Uso en app.js

```js
import { ThemeManager } from './utils/ThemeManager.js'

const themeManager = ThemeManager.getInstance()
themeManager.init()

// Agregar toggle al header
header.appendChild(themeManager.renderToggle())
```
