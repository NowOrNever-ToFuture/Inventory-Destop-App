#!/usr/bin/env bash
# ============================================================
#  HomeInventory Desktop - Build & Setup Script (Unix)
#  Tu dong kiem tra Node.js, cai dependencies, build installer
#  Tao installer (co icon, Start Menu / Dock / Launchpad)
# ============================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║     HomeInventory Desktop - Build        ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""

# ─── Check Node.js ──────────────────────────────────────────
echo -e "${BLUE}[1/4]${NC} Kiem tra Node.js..."
echo "--------------------------------"

if ! command -v node &> /dev/null; then
    echo -e "  ${RED}[!]${NC} Node.js chua duoc cai dat."
    echo "  Cai dat tai: https://nodejs.org"
    exit 1
fi
echo -e "  ${GREEN}[OK]${NC} Node.js $(node -v)"

if ! command -v npm &> /dev/null; then
    echo -e "  ${RED}[!]${NC} npm khong tim thay."
    exit 1
fi
echo -e "  ${GREEN}[OK]${NC} npm v$(npm -v)"
echo ""

# ─── Install dependencies ──────────────────────────────────
echo -e "${BLUE}[2/4]${NC} Cai dat dependencies..."
echo "--------------------------------"
echo ""
npm install
echo ""
echo -e "  ${GREEN}[OK]${NC} Dependencies da duoc cai dat."
echo ""

APP_VERSION=$(node -e "console.log(require('./package.json').version)")

# ─── Choose OS ──────────────────────────────────────────────
echo -e "${BLUE}[3/4]${NC} Chon he dieu hanh de build:"
echo "--------------------------------"
echo ""
echo "  [1] Windows  (setup.exe co icon + Start Menu)"
echo "  [2] macOS    (file .dmg - keo vao Applications)"
echo "  [3] Linux    (file .AppImage / .deb)"
echo ""
read -p "Nhap lua chon (1/2/3): " CHOICE

case $CHOICE in
    1) BUILD_CMD="build:win";   OS_NAME="Windows" ;;
    2) BUILD_CMD="build:mac";   OS_NAME="macOS" ;;
    3) BUILD_CMD="build:linux"; OS_NAME="Linux" ;;
    *)
        echo -e "  ${RED}[!]${NC} Lua chon khong hop le."
        exit 1
        ;;
esac

echo ""
echo -e "  ${GREEN}[OK]${NC} Da chon: $OS_NAME"
echo ""

# ─── Build ──────────────────────────────────────────────────
echo -e "${BLUE}[4/4]${NC} Dang build installer cho $OS_NAME..."
echo "--------------------------------"
echo ""
echo "  Qua trinh nay co the mat vai phut..."
echo ""

# Show spinner during build
npm run $BUILD_CMD &
BUILD_PID=$!

# Simple spinner
SPINNER=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
i=0
while kill -0 $BUILD_PID 2>/dev/null; do
    printf "\r  ${SPINNER[$i]} Dang build... "
    i=$(( (i+1) % 10 ))
    sleep 0.1
done
printf "\r  ${GREEN}[OK]${NC} Build xong!        \n"

wait $BUILD_PID
if [ $? -ne 0 ]; then
    echo ""
    echo -e "  ${RED}[!]${NC} Build that bai."
    exit 1
fi

echo ""

# ─── Copy installer sang releases/ ──────────────────────────
echo "  Dang copy installer vao thu muc releases..."
mkdir -p releases

INSTALLER_FOUND=0

case $CHOICE in
    1)
        for f in dist/*setup.exe; do
            [ -e "$f" ] && cp "$f" releases/ && echo -e "  ${GREEN}[OK]${NC} Da copy: $(basename "$f")" && INSTALLER_FOUND=1
        done
        echo ""
        echo -e "  ${YELLOW}MacOS tuong thich:${NC} Chay file installer .exe bang Wine"
        echo "  hoac build lai script nay tren Windows."
        ;;
    2)
        for f in dist/*.dmg; do
            [ -e "$f" ] && cp "$f" releases/ && echo -e "  ${GREEN}[OK]${NC} Da copy: $(basename "$f")" && INSTALLER_FOUND=1
        done
        echo ""
        echo -e "  ${YELLOW}=== Huong dan cai dat macOS ===${NC}"
        echo "  1. Mo file .dmg trong thu muc releases/"
        echo "  2. Keo HomeInventory Desktop vao Applications"
        echo "  3. Mo Launchpad hoac Spotlight (Cmd+Space)"
        echo "  4. Mo HomeInventory Desktop"
        echo "     (macOS se yeu cau xac nhan lan dau)"
        echo "  5. Icon se hien thi o Dock"
        ;;
    3)
        for f in dist/*.AppImage; do
            [ -e "$f" ] && cp "$f" releases/ && echo -e "  ${GREEN}[OK]${NC} Da copy: $(basename "$f")" && INSTALLER_FOUND=1
        done
        for f in dist/*.deb; do
            [ -e "$f" ] && cp "$f" releases/ && echo -e "  ${GREEN}[OK]${NC} Da copy: $(basename "$f")" && INSTALLER_FOUND=1
        done
        echo ""
        echo -e "  ${YELLOW}=== Huong dan cai dat Linux ===${NC}"
        echo "  .AppImage: chmod +x file, chay truc tiep"
        echo "  .deb:      sudo dpkg -i file.deb"
        ;;
esac

echo ""
if [ $INSTALLER_FOUND -eq 1 ]; then
    echo "  ========================================"
    echo "    Build hoan tat!"
    echo "    OS     : $OS_NAME"
    echo "    Version: v$APP_VERSION"
    echo "    Folder : releases/"
    echo "  ========================================"
    echo ""
    ls -1 releases/
else
    echo -e "  ${RED}[!]${NC} Khong tim thay file installer trong dist/"
    echo "  Kiem tra lai electron-builder.yml"
fi
echo ""
