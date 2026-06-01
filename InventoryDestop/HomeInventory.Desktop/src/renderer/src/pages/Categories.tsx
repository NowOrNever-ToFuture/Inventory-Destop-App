import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { DataTable, ColumnDef } from '@renderer/components/shared/DataTable'
import { FilterBar } from '@renderer/components/shared/FilterBar'
import { Button } from '@renderer/components/ui/button'
import { Modal } from '@renderer/components/ui/modal'
import { Input } from '@renderer/components/ui/input'
import { ConfirmDialog } from '@renderer/components/shared/ConfirmDialog'
import { useToast } from '@renderer/components/shared/ToastProvider'
import { reportAppError } from '@renderer/lib/app-error'
import type { CategoryResponseDto } from '@shared/types/dtos'

interface FormState {
  name: string
}

export function Categories() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<CategoryResponseDto[]>([])

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CategoryResponseDto | null>(null)
  const [form, setForm] = useState<FormState>({ name: '' })

  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.api.category.getAll()
      setCategories(data)
    } catch (error) {
      reportAppError(toast, 'DM-LOAD-01', 'Không tải được danh mục', error)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  const handleCreate = () => {
    setSelectedItem(null)
    setForm({ name: '' })
    setIsFormOpen(true)
  }

  const handleEdit = (item: CategoryResponseDto) => {
    setSelectedItem(item)
    setForm({ name: item.name })
    setIsFormOpen(true)
  }

  const handleDelete = (item: CategoryResponseDto) => {
    setSelectedItem(item)
    setIsDeleteOpen(true)
  }

  const handleSave = async () => {
    const payload = { name: form.name.trim() }
    if (!payload.name) return

    try {
      if (selectedItem) {
        await window.api.category.update(selectedItem.id, payload)
        toast.success('Cập nhật danh mục thành công')
      } else {
        await window.api.category.create(payload)
        toast.success('Tạo danh mục thành công')
      }
      setIsFormOpen(false)
      await loadCategories()
    } catch (error) {
      reportAppError(toast, 'DM-SAVE-01', 'Không lưu được danh mục', error)
    }
  }

  const confirmDelete = async () => {
    if (!selectedItem) return
    try {
      await window.api.category.delete(selectedItem.id)
      toast.success('Xóa danh mục thành công')
      setIsDeleteOpen(false)
      setSelectedItem(null)
      await loadCategories()
    } catch (error) {
      reportAppError(toast, 'DM-DEL-01', 'Không xóa được danh mục', error)
    }
  }

  const filteredData = useMemo(
    () => categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [categories, search]
  )
  const canSave = form.name.trim().length > 0

  const columns: ColumnDef<CategoryResponseDto>[] = [
    {
      key: 'name',
      header: 'Tên danh mục',
      cell: (p) => <span className="font-medium text-gray-900">{p.name}</span>
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '100px',
      cell: (p) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => handleEdit(p)}
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => handleDelete(p)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Danh mục sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý các nhóm loại sản phẩm trong kho.</p>
        </div>
        <Button icon={Plus} onClick={handleCreate}>
          Thêm danh mục
        </Button>
      </div>

      <div className="flex flex-col flex-1 min-h-0 drop-shadow-sm">
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm danh mục..."
        />
        <DataTable
          data={filteredData}
          columns={columns}
          loading={loading}
          emptyStateTitle="Chưa có danh mục"
          emptyStateDescription="Nhấn 'Thêm danh mục' để bắt đầu quản lý danh mục sản phẩm."
          keyExtractor={(item) => item.id}
          pagination={{ page, pageSize: 10, total: filteredData.length, onPageChange: setPage }}
        />
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedItem ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => void handleSave()} disabled={!canSave}>
              Lưu lại
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <div>
            <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục (*)</label>
            <Input
              id="category-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="VD: Tivi, Tủ lạnh..."
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => void confirmDelete()}
        title="Xóa danh mục"
        description={`Bạn có chắc chắn muốn xóa danh mục "${selectedItem?.name}" không? Hành động này không thể hoàn tác.`}
      />
    </div>
  )
}
