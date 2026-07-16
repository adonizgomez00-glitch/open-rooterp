#!/usr/bin/env bash
# ERP Ligero Offline - Script de instalacion (Linux)
# Uso: chmod +x setup.sh && ./setup.sh
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ERP Ligero Offline - Instalacion${NC}"
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

# ------ 5. Abrir navegador ------
echo ""

# Intentar abrir el navegador segun el entorno
if command -v xdg-open &>/dev/null; then
    xdg-open http://localhost:3000 &>/dev/null || true
elif command -v sensible-browser &>/dev/null; then
    sensible-browser http://localhost:3000 &>/dev/null || true
elif command -v gnome-open &>/dev/null; then
    gnome-open http://localhost:3000 &>/dev/null || true
fi

# ------ 6. Iniciar servidor ------
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Servidor iniciado en:${NC}"
echo -e "${GREEN}  http://localhost:3000${NC}"
echo -e "${GREEN}========================================${NC}"

if command -v python3 &>/dev/null; then
    python3 -m http.server 3000
elif command -v python &>/dev/null; then
    python -m http.server 3000
else
    echo -e "${RED}[ERROR] No se encontro Python.${NC}"
    echo "Instalalo o ejecuta manualmente:"
    echo "  npx serve ."
    exit 1
fi
