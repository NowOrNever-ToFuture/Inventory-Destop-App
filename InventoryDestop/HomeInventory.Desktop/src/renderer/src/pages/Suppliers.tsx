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
import type { SupplierResponseDto } from '@shared/types/dtos'

interface FormState {
  name: string
  phone: string
}

export function Suppliers() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<SupplierResponseDto[]>([])

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<SupplierResponseDto | null>(null)
  const [form, setForm] = useState<FormState>({ name: '', phone: '' })

  const loadSuppliers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.api.supplier.getAll()
      setSuppliers(data)
    } catch (error) {
      reportAppError(toast, 'NCC-LOAD-01', 'Không tải được nhà cung cấp', error)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadSuppliers()
  }, [loadSuppliers])

  const handleCreate = () => {
    setSelectedItem(null)
    setForm({ name: '', phone: '' })
    setIsFormOpen(true)
  }

  const handleEdit = (item: SupplierResponseDto) => {
    setSelectedItem(item)
    setForm({
      name: item.name,
      phone: item.phone ?? ''
    })
    setIsFormOpen(true)
  }

  const handleDelete = (item: SupplierResponseDto) => {
    setSelectedItem(item)
    setIsDeleteOpen(true)
  }

  const handleSave = async () => {
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined
    }
    if (!payload.name) return

    try {
      if (selectedItem) {
        await window.api.supplier.update(selectedItem.id, payload)
        toast.success('Cập nhật nhà cung cấp thành công')
      } else {
        await window.api.supplier.create(payload)
        toast.success('Tạo nhà cung cấp thành công')
      }
      setIsFormOpen(false)
      await loadSuppliers()
    } catch (error) {
      reportAppError(toast, 'NCC-SAVE-01', 'Không lưu được nhà cung cấp', error)
    }
  }

  const confirmDelete = async () => {
    if (!selectedItem) return
    try {
      await window.api.supplier.delete(selectedItem.id)
      toast.success('Xóa nhà cung cấp thành công')
      setIsDeleteOpen(false)
      setSelectedItem(null)
      await loadSuppliers()
    } catch (error) {
      reportAppError(toast, 'NCC-DEL-01', 'Không xóa được nhà cung cấp', error)
    }
  }

  const filteredData = useMemo(
    () =>
      suppliers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.phone ?? '').toLowerCase().includes(search.toLowerCase())
      ),
    [suppliers, search]
  )
  const canSave = form.name.trim().length > 0

  const columns: ColumnDef<SupplierResponseDto>[] = [
    {
      key: 'name',
      header: 'Tên đại lý / nhà cung cấp',
      cell: (p) => <span className="font-medium text-gray-900">{p.name}</span>
    },
    {
      key: 'phone',
      header: 'Số điện thoại',
      cell: (p) => <span className="text-gray-600">{p.phone ?? '-'}</span>
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
          <h1 className="text-2xl font-semibold text-gray-900">Đại lý phân phối</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý danh sách các nhà cung cấp, đại lý cấp 1.
          </p>
        </div>
        <Button icon={Plus} onClick={handleCreate}>
          Thêm đại lý
        </Button>
      </div>

      <div className="flex flex-col flex-1 min-h-0 drop-shadow-sm">
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm theo tên hoặc số điện thoại..."
        />
        <DataTable
          data={filteredData}
          columns={columns}
          loading={loading}
          emptyStateTitle="Chưa có nhà cung cấp"
          emptyStateDescription="Thêm nhà cung cấp để lập phiếu nhập kho chính xác."
          keyExtractor={(item) => item.id}
          pagination={{ page, pageSize: 10, total: filteredData.length, onPageChange: setPage }}
        />
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedItem ? 'Cập nhật đại lý' : 'Thêm đại lý mới'}
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
            <label htmlFor="supplier-name" className="block text-sm font-medium text-gray-700 mb-1">
              Tên đại lý (*)
            </label>
            <Input
              id="supplier-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="VD: Công ty TNHH ABC..."
            />
          </div>
          <div>
            <label
              htmlFor="supplier-phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Số điện thoại
            </label>
            <Input
              id="supplier-phone"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="VD: 0901234567"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => void confirmDelete()}
        title="Xóa đại lý"
        description={`Bạn có chắc chắn muốn xóa đại lý "${selectedItem?.name}" không? Hành động này không thể hoàn tác.`}
      />
    </div>
  )
}
