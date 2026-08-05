#!/usr/bin/env bash
# Open Root ERP - Script de instalacion (Linux)
# Uso: chmod +x setup.sh && ./setup.sh
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Open Root ERP - Instalacion${NC}"
echo -e "${GREEN}========================================${NC}"

# ------ 1. Verificar Node.js ------
if ! command -v node &>/dev/null; then
    echo -e "${RED}[ERROR] Node.js no esta instalado.${NC}"
    echo "Descargalo desde: https://nodejs.org/"
    echo "O via gestor de paquetes:"
    echo "  apt: sudo apt install nodejs npm"
    echo "  dnf: sudo dnf install nodejs"
    echo "  pacman: sudo pacman -S nodejs npm"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Node.js $(node --version)"

# ------ 2. Verificar npm ------
if ! command -v npm &>/dev/null; then
    echo -e "${RED}[ERROR] npm no encontrado.${NC}"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} npm encontrado"

# ------ 3. Instalar dependencias ------
echo ""
echo -e "${YELLOW}Instalando dependencias...${NC}"
npm install
echo -e "${GREEN}[OK]${NC} Dependencias instaladas"

# ------ 4. Copiar Dexie a assets/lib ------
echo ""
echo -e "${YELLOW}Copiando Dexie.js a assets/lib...${NC}"
if [ -f "node_modules/dexie/dist/dexie.mjs" ]; then
    cp "node_modules/dexie/dist/dexie.mjs" "assets/lib/dexie.js"
    echo -e "${GREEN}[OK]${NC} Dexie copiado"
elif [ -f "node_modules/dexie/dist/dexie.js" ]; then
    cp "node_modules/dexie/dist/dexie.js" "assets/lib/dexie.js"
    echo -e "${GREEN}[OK]${NC} Dexie copiado"
else
    echo -e "${RED}[ERROR] No se pudo copiar Dexie.${NC}"
    exit 1
fi

# ------ 5. Detectar puerto (persistente) ------
PORT_FILE=".openroot-erp-port"
if [ -f "$PORT_FILE" ]; then
  PORT=$(cat "$PORT_FILE")
  netstat -tuln 2>/dev/null | grep -q ":$PORT " && {
    echo -e "${YELLOW}[WARN]${NC} Puerto $PORT en uso, buscando otro...${NC}"
    PORT=3000
  }
else
  PORT=3000
fi
while ss -tuln 2>/dev/null | grep -q ":$PORT " || lsof -i :$PORT >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done
echo "$PORT" > "$PORT_FILE"

# ------ 6. Auto-inicio obligatorio ------
echo ""
echo -e "${YELLOW}Configurando auto-inicio del servidor...${NC}"
if command -v systemctl &>/dev/null; then
  SERVICE_FILE="$HOME/.config/systemd/user/openrooterp.service"
  mkdir -p "$(dirname "$SERVICE_FILE")"
  cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=Open Root ERP Server
After=network.target

[Service]
Type=simple
WorkingDirectory=$(pwd)
ExecStart=$(which python3) -m http.server $PORT
Restart=on-failure

[Install]
WantedBy=default.target
EOF
  if systemctl --user daemon-reload 2>/dev/null && systemctl --user enable openrooterp.service 2>/dev/null; then
    echo -e "${GREEN}[OK]${NC} Auto-inicio configurado con systemd user service"
  else
    CRON_LINE="@reboot cd $(pwd) && python3 -m http.server $PORT &"
    (crontab -l 2>/dev/null | grep -vF "$(pwd)"; echo "$CRON_LINE") | crontab -
    echo -e "${GREEN}[OK]${NC} Auto-inicio configurado con cron @reboot (fallback)"
  fi
else
  CRON_LINE="@reboot cd $(pwd) && python3 -m http.server $PORT &"
  (crontab -l 2>/dev/null | grep -v "http.server"; echo "$CRON_LINE") | crontab -
  echo -e "${GREEN}[OK]${NC} Auto-inicio configurado con cron @reboot"
fi

# ------ 7. Abrir navegador ------
echo ""

# Intentar abrir el navegador según el entorno
if command -v xdg-open &>/dev/null; then
  xdg-open http://localhost:$PORT &>/dev/null || true
elif command -v sensible-browser &>/dev/null; then
  sensible-browser http://localhost:$PORT &>/dev/null || true
elif command -v gnome-open &>/dev/null; then
  gnome-open http://localhost:$PORT &>/dev/null || true
fi

# ------ 8. Iniciar servidor ------
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Servidor iniciado en:${NC}"
echo -e "${GREEN}  http://localhost:${PORT}${NC}"
echo -e "${GREEN}  Puerto guardado en: ${PORT_FILE}${NC}"
echo -e "${GREEN}========================================${NC}"

if command -v python3 &>/dev/null; then
  python3 -m http.server $PORT
elif command -v python &>/dev/null; then
  python -m http.server $PORT
else
  echo -e "${RED}[ERROR] No se encontro Python.${NC}"
  echo "Instalalo o ejecuta manualmente:"
  echo "  npx serve ."
  exit 1
fi
