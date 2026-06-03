import { useEffect, useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  Tags,
  Award,
  Truck,
  BarChart3,
  RefreshCw,
  Settings,
  Bell
} from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import type { AppSettingsDto } from '@shared/types/dtos/settings.dto'

import { useAuth } from '@renderer/components/shared/AuthProvider'

const APP_ICON = './icon_destop_app_1024x1024.png'

interface SidebarItemProps {
  icon: React.ElementType
  label: string
  to: string
}

const SidebarItem = ({ icon: Icon, label, to }: SidebarItemProps) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors text-sm font-medium',
          isActive
            ? 'bg-gray-100 text-gray-900'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
          {label}
        </>
      )}
    </NavLink>
  )
}

export function AppLayout() {
  const [storeName, setStoreName] = useState('HomeInventory')
  const { logout, username } = useAuth()

  useEffect(() => {
    const loadStoreName = async () => {
      try {
        const s = await window.api.settings.getAll()
        if (s.storeName) setStoreName(s.storeName)
      } catch {
        // keep default
      }
    }
    void loadStoreName()

    // Listen for settings updates
    const handler = (e: Event) => {
      const updated = (e as CustomEvent<AppSettingsDto>).detail
      if (updated?.storeName) setStoreName(updated.storeName)
    }
    window.addEventListener('settings:updated', handler)
    return () => window.removeEventListener('settings:updated', handler)
  }, [])

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-900 font-sans selection:bg-blue-100">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-5 border-b border-gray-200">
          <div className="flex items-center gap-3 font-bold text-lg min-w-0">
            <img
              src={APP_ICON}
              alt={storeName}
              className="size-10 rounded-lg object-cover shadow-sm shrink-0"
            />
            <span className="text-gray-900">{storeName}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2 mt-4">
            Tổng quan
          </div>
          <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" />

          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2 mt-6">
            Quản lý kho
          </div>
          <SidebarItem icon={Package} label="Sản phẩm" to="/products" />
          <SidebarItem icon={ArrowDownToLine} label="Nhập kho" to="/purchase-orders" />
          <SidebarItem icon={ArrowUpFromLine} label="Xuất kho" to="/sales-orders" />

          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2 mt-6">
            Danh mục
          </div>
          <SidebarItem icon={Tags} label="Thiết lập Danh mục" to="/categories" />
          <SidebarItem icon={Award} label="Thiết lập Hãng" to="/brands" />
          <SidebarItem icon={Truck} label="Đại lý phân phối" to="/suppliers" />

          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2 mt-6">
            Hệ thống
          </div>
          <SidebarItem icon={BarChart3} label="Báo cáo" to="/reports" />
          <SidebarItem icon={Settings} label="Cài đặt" to="/settings" />
        </div>

        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                {username ? username[0].toUpperCase() : 'A'}
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">{username ?? 'Admin'}</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              title="Đăng xuất"
            >
              ✕
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
          <div />
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="text-gray-400 hover:text-blue-600 transition-colors"
              title="Làm mới dữ liệu"
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={18} />
            </button>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 relative"
              aria-label="Thông báo"
            >
              <Bell size={20} />
              <span className="absolute top-0 right-0 size-2 bg-red-500 rounded-full border border-white"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
          <div className="w-full mx-auto max-w-7xl h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
