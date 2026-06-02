# HomeInventory Desktop

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-39-blue)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)](https://www.typescriptlang.org/)

> Ứng dụng desktop quản lý kho hàng gia đình.  
> Xây dựng với Electron + React 19 + TypeScript + SQLite (better-sqlite3).

## Tính năng

- **Quản lý sản phẩm**: Thêm, sửa, xoá, tìm kiếm sản phẩm theo model/tên/danh mục
- **Nhập kho**: Tạo phiếu nhập kho, đính kèm ảnh/PDF hoá đơn, tự động tạo sản phẩm mới
- **Xuất kho**: Tạo phiếu xuất kho, kiểm tra tồn khả dụng
- **Danh mục**: Quản lý danh mục, hãng, nhà cung cấp/đại lý
- **Dashboard**: Biểu đồ nhập hàng theo tháng, top mặt hàng nhập nhiều nhất, top đại lý
- **Báo cáo**: Thống kê nhập xuất theo năm/tháng, xuất Excel (Times New Roman, VNĐ)
- **Đính kèm hoá đơn**: Hỗ trợ PNG, JPG, PDF - xem trực tiếp trong ứng dụng
- **Bảo mật**: Đăng nhập tài khoản, mã hoá mật khẩu (pbkdf2 SHA-512), đổi mật khẩu
- **Cài đặt**: Tuỳ chỉnh tên cửa hàng, đường dẫn lưu dữ liệu

## Công nghệ

| Layer | Công nghệ |
|---|---|
| Desktop Framework | Electron 39 + electron-vite |
| Frontend | React 19 + TypeScript |
| Routing | React Router DOM v7 (HashRouter) |
| UI | Tailwind CSS v4 + lucide-react |
| Charts | recharts |
| Database | SQLite (better-sqlite3) |
| Excel Export | exceljs |
| Build Installer | electron-builder (NSIS / DMG / AppImage) |

## Kiến trúc

```
src/
  core/                    # Business logic thuần (zero dependencies)
    repositories/          # Repository interfaces (ports)
    use-cases/             # Use case classes theo từng action
  infrastructure/          # Implementations
    database/              # SQLite setup, migrations
    repositories/          # SQLite repository implementations
    services/              # AuthService, ExcelExportService
  main/                    # Electron main process
    ipc/                   # IPC handlers
    windows/               # BrowserWindow setup
  preload/                 # Secure bridge (contextBridge)
  renderer/                # React UI
  shared/                  # DTOs, contracts, constants, utils
```

## Cài đặt & Build

### Yêu cầu

- Node.js >= 20
- npm >= 9

### Development

```bash
npm install
npm run dev
```

### Build Installer

Sử dụng script build tự động:

```bash
# Windows
build.bat

# macOS / Linux
chmod +x build.sh
./build.sh
```

Script sẽ:
1. Kiểm tra Node.js (tự động mở trang download nếu chưa có)
2. Chạy `npm install`
3. Hiển thị menu chọn OS:
   - **Windows** → tạo `setup.exe` (NSIS installer, Start Menu icon, Desktop shortcut)
   - **macOS** → tạo `.dmg` (kéo vào Applications, Dock icon, Launchpad)
   - **Linux** → tạo `.AppImage` / `.deb`
4. Copy installer vào thư mục `releases/`

### Build thủ công

```bash
npm run typecheck          # Kiểm tra TypeScript
npm run build              # Build production
npm run build:win          # Build Windows installer
npm run build:mac          # Build macOS installer
npm run build:linux        # Build Linux installer
```

## Cài đặt lần đầu

1. App sẽ kiểm tra nếu chưa có tài khoản → hiển thị Setup Wizard
2. Tạo tài khoản admin + đặt tên cửa hàng
3. Sau khi setup → đăng nhập và bắt đầu sử dụng

## License

MIT
