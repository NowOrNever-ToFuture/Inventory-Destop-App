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
import type { BrandResponseDto } from '@shared/types/dtos'

export function Brands() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [brands, setBrands] = useState<BrandResponseDto[]>([])

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<BrandResponseDto | null>(null)
  const [name, setName] = useState('')

  const loadBrands = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.api.brand.getAll()
      setBrands(data)
    } catch (error) {
      reportAppError(toast, 'HANG-LOAD-01', 'Không tải được danh sách hãng', error)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadBrands()
  }, [loadBrands])

  const handleCreate = () => {
    setSelectedItem(null)
    setName('')
    setIsFormOpen(true)
  }

  const handleEdit = (item: BrandResponseDto) => {
    setSelectedItem(item)
    setName(item.name)
    setIsFormOpen(true)
  }

  const handleDelete = (item: BrandResponseDto) => {
    setSelectedItem(item)
    setIsDeleteOpen(true)
  }

  const handleSave = async () => {
    const payload = { name: name.trim() }
    if (!payload.name) return

    try {
      if (selectedItem) {
        await window.api.brand.update(selectedItem.id, payload)
        toast.success('Cập nhật hãng thành công')
      } else {
        await window.api.brand.create(payload)
        toast.success('Tạo hãng thành công')
      }
      setIsFormOpen(false)
      await loadBrands()
    } catch (error) {
      reportAppError(toast, 'HANG-SAVE-01', 'Không lưu được hãng', error)
    }
  }

  const confirmDelete = async () => {
    if (!selectedItem) return
    try {
      await window.api.brand.delete(selectedItem.id)
      toast.success('Xóa hãng thành công')
      setIsDeleteOpen(false)
      setSelectedItem(null)
      await loadBrands()
    } catch (error) {
      reportAppError(toast, 'HANG-DEL-01', 'Không xóa được hãng', error)
    }
  }

  const filteredData = useMemo(
    () => brands.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [brands, search]
  )
  const canSave = name.trim().length > 0

  const columns: ColumnDef<BrandResponseDto>[] = [
    {
      key: 'name',
      header: 'Tên hãng',
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
          <h1 className="text-2xl font-semibold text-gray-900">Hãng sản xuất</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách các thương hiệu sản phẩm.</p>
        </div>
        <Button icon={Plus} onClick={handleCreate}>
          Thêm hãng
        </Button>
      </div>

      <div className="flex flex-col flex-1 min-h-0 drop-shadow-sm">
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm hãng..."
        />
        <DataTable
          data={filteredData}
          columns={columns}
          loading={loading}
          emptyStateTitle="Chưa có hãng sản xuất"
          emptyStateDescription="Thêm hãng để map thương hiệu cho sản phẩm."
          keyExtractor={(item) => item.id}
          pagination={{ page, pageSize: 10, total: filteredData.length, onPageChange: setPage }}
        />
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedItem ? 'Cập nhật hãng' : 'Thêm hãng mới'}
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
            <label htmlFor="brand-name" className="block text-sm font-medium text-gray-700 mb-1">
              Tên hãng (*)
            </label>
            <Input
              id="brand-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Sony, Samsung..."
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => void confirmDelete()}
        title="Xóa hãng sản xuất"
        description={`Bạn có chắc chắn muốn xóa hãng "${selectedItem?.name}" không? Hành động này không thể hoàn tác.`}
      />
    </div>
  )
}
