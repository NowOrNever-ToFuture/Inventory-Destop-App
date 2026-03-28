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
  Bell
} from 'lucide-react'
import { cn } from '@renderer/lib/utils'

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
  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-900 font-sans selection:bg-blue-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-lg">
            <Package size={24} strokeWidth={2.5} />
            HomeInventory
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
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
              AD
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-900">Admin</div>
              <div className="text-gray-500 text-xs">admin@home.local</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
          <div />
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-gray-600 relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
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
