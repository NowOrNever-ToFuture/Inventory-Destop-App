import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@renderer/components/ui/table'
import { Button } from '@renderer/components/ui/button'

export interface ColumnDef<T> {
  key: string
  header: React.ReactNode
  cell: (item: T) => React.ReactNode
  align?: 'left' | 'center' | 'right'
  width?: string
}

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  keyExtractor: (item: T) => string | number
  loading?: boolean
  loadingRows?: number
  emptyMessage?: string
  emptyStateTitle?: string
  emptyStateDescription?: string
  pagination?: PaginationProps
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  loading,
  loadingRows = 5,
  emptyMessage = 'Không có dữ liệu.',
  emptyStateTitle,
  emptyStateDescription,
  pagination
}: DataTableProps<T>) {
  return (
    <div className="flex flex-col flex-1 h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={`
                    ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                  `}
                  style={{ width: col.width }}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: loadingRows }).map((_, idx) => (
                <TableRow key={`loading-${idx}`}>
                  {columns.map((col) => (
                    <TableCell key={`${col.key}-${idx}`}>
                      <div className="h-4 w-full max-w-[160px] bg-gray-100 animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-1 py-4">
                    <span className="font-medium text-gray-700">
                      {emptyStateTitle ?? 'Không có dữ liệu'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {emptyStateDescription ?? emptyMessage}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={keyExtractor(item)}>
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                      }
                    >
                      {col.cell(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-white">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {pagination.onPageSizeChange && (
              <>
                <span>Hàng mỗi trang:</span>
                <select
                  value={pagination.pageSize}
                  onChange={(e) => pagination.onPageSizeChange?.(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-500 mr-4">
              Hiển thị {Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.total)}{' '}
              - {Math.min(pagination.page * pagination.pageSize, pagination.total)} của{' '}
              {pagination.total}
            </div>
            <Button
              variant="ghost"
              size="icon"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <div className="px-3 py-1 rounded-md bg-blue-50 text-blue-600 font-medium text-sm">
              {pagination.page}
            </div>
            <Button
              variant="ghost"
              size="icon"
              disabled={pagination.page * pagination.pageSize >= pagination.total}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
