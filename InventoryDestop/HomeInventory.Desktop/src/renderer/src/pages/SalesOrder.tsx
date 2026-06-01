import { useEffect, useMemo, useState } from 'react'
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Modal } from '@renderer/components/ui/modal'
import { SuggestInput } from '@renderer/components/shared/SuggestInput'
import { Badge } from '@renderer/components/ui/badge'
import { DataTable, type ColumnDef } from '@renderer/components/shared/DataTable'
import { ConfirmDialog } from '@renderer/components/shared/ConfirmDialog'
import { useToast } from '@renderer/components/shared/ToastProvider'
import { reportAppError } from '@renderer/lib/app-error'
import { formatDateDdMmYyyy } from '@renderer/lib/format'
import { limitWords } from '@renderer/lib/input-sanitize'
import { normalizeSearchText } from '@shared/utils/text-normalize'
import type {
  ProductResponseDto,
  SalesOrderItemRequestDto,
  SalesOrderResponseDto
} from '@shared/types/dtos'

const MAX_MONEY = 1_000_000_000_000_000
const PAGE_SIZE = 10
const SALES_DRAFT_STORAGE_KEY = 'homeinventory:drafts:sales-order'
const SALES_DRAFT_LEGACY_STORAGE_KEY = 'homeinventory:draft:sales-order'

// Hoist formatter to avoid rebuilding on every render
const viVnFormatter = new Intl.NumberFormat('vi-VN')

interface SOItem {
  id: string
  productId: string
  model: string
  name: string
  unit: string
  quantity: number
  availableStock: number
}

interface SalesOrderDraft {
  id: string
  orderDate: string
  items: SOItem[]
  savedAt: string
}

export function SalesOrder() {
  const navigate = useNavigate()
  const toast = useToast()
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [items, setItems] = useState<SOItem[]>([])
  const [products, setProducts] = useState<ProductResponseDto[]>([])
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [savedDrafts, setSavedDrafts] = useState<SalesOrderDraft[]>(() => {
    try {
      const raw =
        localStorage.getItem(SALES_DRAFT_STORAGE_KEY) ??
        localStorage.getItem(SALES_DRAFT_LEGACY_STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw) as SalesOrderDraft | SalesOrderDraft[]
      const drafts = Array.isArray(parsed) ? parsed : parsed ? [parsed] : []
      const normalized = drafts.map((draft) => ({
        ...draft,
        id: draft.id ?? crypto.randomUUID(),
        orderDate: draft.orderDate ?? new Date().toISOString().slice(0, 10)
      }))
      localStorage.setItem(SALES_DRAFT_STORAGE_KEY, JSON.stringify(normalized))
      return normalized
    } catch {
      return []
    }
  })
  const [orders, setOrders] = useState<SalesOrderResponseDto[]>([])
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderResponseDto | null>(null)
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null)
  const [draftPage, setDraftPage] = useState(1)
  const [orderPage, setOrderPage] = useState(1)
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false)

  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true)
      try {
        const data = await window.api.product.getAll({ page: 1, pageSize: 1000 })
        setProducts(data.items)
      } catch (error) {
        reportAppError(toast, 'PX-LOAD-01', 'Không tải được dữ liệu phiếu xuất', error)
      } finally {
        setLoadingProducts(false)
      }
    }
    void loadProducts()
  }, [toast])

  const loadOrders = async () => {
    try {
      const rows = await window.api.salesOrder.getAll()
      setOrders(rows)
    } catch (error) {
      reportAppError(toast, 'PX-LIST-01', 'Không tải được danh sách phiếu xuất', error)
    }
  }

  useEffect(() => {
    void loadOrders()
  }, [toast])

  // Derived page bounds - clamp pages when data shrinks
  const draftTotalPages = Math.max(1, Math.ceil(savedDrafts.length / PAGE_SIZE))
  const effectiveDraftPage = Math.min(draftPage, draftTotalPages)
  const orderTotalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE))
  const effectiveOrderPage = Math.min(orderPage, orderTotalPages)

  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        id: p.id,
        label: p.model,
        name: p.name,
        unit: p.unit ?? 'Cái',
        stock: p.stockQuantity
      })),
    [products]
  )

  const normalizedProductOptions = useMemo(
    () =>
      productOptions.map((opt) => ({
        ...opt,
        searchLabel: normalizeSearchText(opt.label),
        searchName: normalizeSearchText(opt.name),
        searchDescription: normalizeSearchText(`${opt.label} ${opt.name}`)
      })),
    [productOptions]
  )

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        productId: '',
        model: '',
        name: '',
        unit: 'Cái',
        quantity: 1,
        availableStock: 0
      }
    ])
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const handleUpdateItem = <K extends keyof SOItem>(id: string, field: K, value: SOItem[K]) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const handleModelInputChange = (id: string, value: string) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              model: value,
              productId: '',
              name: '',
              availableStock: 0
            }
          : item
      )
    )
  }

  const handleModelSelect = (id: string, selectedModel: any) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              productId: selectedModel.id,
              model: selectedModel.label,
              name: selectedModel.name,
              unit: selectedModel.unit,
              availableStock: selectedModel.stock
            }
          : item
      )
    )
  }

  const handleLoadDraft = (draft: SalesOrderDraft) => {
    setOrderDate(draft.orderDate)
    setItems(draft.items)
    toast.success('Đã nạp phiếu nháp')
  }

  const handleDeleteDraft = (draftId: string) => {
    const nextDrafts = savedDrafts.filter((draft) => draft.id !== draftId)
    localStorage.setItem(SALES_DRAFT_STORAGE_KEY, JSON.stringify(nextDrafts))
    localStorage.removeItem(SALES_DRAFT_LEGACY_STORAGE_KEY)
    setSavedDrafts(nextDrafts)
    toast.success('Đã xóa phiếu nháp')
  }

  const isFormValid =
    items.length > 0 &&
    items.every(
      (item) =>
        item.productId &&
        item.quantity > 0 &&
        item.quantity <= item.availableStock &&
        item.quantity <= MAX_MONEY
    )

  const totalValue = items.reduce((sum, item) => {
    const product = productMap.get(item.productId)
    const unitPrice = product?.importPrice ?? 0
    return sum + item.quantity * unitPrice
  }, 0)

  const handleSubmit = async () => {
    if (!isFormValid) return

    const payloadItems: SalesOrderItemRequestDto[] = items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity
    }))

    setLoadingSubmit(true)
    try {
      await window.api.salesOrder.create({ orderDate, items: payloadItems })
      toast.success('Tạo phiếu xuất thành công')
      setItems([])
      setOrderDate(new Date().toISOString().slice(0, 10))
      const fresh = await window.api.product.getAll({ page: 1, pageSize: 1000 })
      setProducts(fresh.items)
      await loadOrders()
    } catch (error) {
      reportAppError(toast, 'PX-CREATE-01', 'Không tạo được phiếu xuất', error)
    } finally {
      setLoadingSubmit(false)
    }
  }

  const handleDeleteOrder = async () => {
    if (!deleteOrderId) return
    try {
      const ok = await window.api.salesOrder.delete(deleteOrderId)
      if (ok) {
        toast.success('Đã xoá phiếu xuất')
        await loadOrders()
        if (selectedOrder?.id === deleteOrderId) setSelectedOrder(null)
      }
    } catch (error) {
      reportAppError(toast, 'PX-DEL-01', 'Không xoá được phiếu xuất', error)
    } finally {
      setDeleteOrderId(null)
    }
  }

  const orderColumns: ColumnDef<SalesOrderResponseDto>[] = [
    {
      key: 'code',
      header: 'Mã phiếu',
      cell: (o) => <span className="font-medium text-gray-900">{o.code}</span>
    },
    {
      key: 'date',
      header: 'Ngày',
      cell: (o) => <span className="text-gray-700">{formatDateDdMmYyyy(o.orderDate)}</span>
    },
    {
      key: 'items',
      header: 'Số dòng',
      align: 'right',
      cell: (o) => <span className="text-gray-900">{o.items.length}</span>
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (o) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setSelectedOrder(o)}>
            Xem chi tiết
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOrderId(o.id)}>
            Xoá
          </Button>
        </div>
      )
    }
  ]

  const handleSaveDraft = () => {
    try {
      const draft = {
        id: crypto.randomUUID(),
        orderDate,
        items,
        savedAt: new Date().toISOString()
      }
      const nextDrafts = [draft, ...savedDrafts]
      localStorage.setItem(SALES_DRAFT_STORAGE_KEY, JSON.stringify(nextDrafts))
      setSavedDrafts(nextDrafts)
      setDraftPage(1)
      toast.success('Đã lưu nháp phiếu xuất')
    } catch (error) {
      reportAppError(toast, 'PX-DRAFT-01', 'Không lưu được nháp phiếu xuất', error)
    }
  }

  const pagedDrafts = useMemo(
    () => savedDrafts.slice((effectiveDraftPage - 1) * PAGE_SIZE, effectiveDraftPage * PAGE_SIZE),
    [savedDrafts, effectiveDraftPage]
  )

  const pagedOrders = useMemo(
    () => orders.slice((effectiveOrderPage - 1) * PAGE_SIZE, effectiveOrderPage * PAGE_SIZE),
    [orders, effectiveOrderPage]
  )

  const draftColumns: ColumnDef<SalesOrderDraft>[] = [
    {
      key: 'draftDate',
      header: 'Ngày nháp',
      cell: (draft) => <span className="text-gray-900">{formatDateDdMmYyyy(draft.orderDate)}</span>
    },
    {
      key: 'itemCount',
      header: 'Sản phẩm',
      align: 'right',
      cell: (draft) => <span className="text-gray-900">{draft.items.length}</span>
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (draft) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => handleLoadDraft(draft)}>
            Nạp nháp
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDeleteDraft(draft.id)}>
            Xóa
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Tạo Phiếu Xuất Kho</h1>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSaveDraft}>
            Lưu nháp
          </Button>
          <Button
            icon={Save}
            disabled={!isFormValid || loadingSubmit}
            onClick={() => setConfirmSubmitOpen(true)}
          >
            Hoàn tất & Xuất Kho
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4 h-fit">
          <h3 className="font-semibold text-gray-900 pb-2 border-b border-gray-100">
            Thông tin xuất
          </h3>
          <div>
            <label htmlFor="so-order-date" className="block text-sm font-medium text-gray-700 mb-1">Ngày lập phiếu</label>
            <Input id="so-order-date" type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="so-reason" className="block text-sm font-medium text-gray-700 mb-1">Lý do xuất</label>
            <select id="so-reason" aria-label="Lý do xuất" className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500">
              <option value="ban_hang">Xuất bán hàng</option>
              <option value="bao_hanh">Xuất bảo hành</option>
              <option value="khac">Khác…</option>
            </select>
          </div>
          <div>
            <label htmlFor="so-ref" className="block text-sm font-medium text-gray-700 mb-1">
              Mã tham chiếu (Đơn hàng)
            </label>
            <Input id="so-ref" type="text" placeholder="VD: DH-908" />
          </div>
          <div>
            <label htmlFor="so-note" className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              id="so-note"
              aria-label="Ghi chú"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[80px]"
              placeholder="Ghi chú thêm…"
              onChange={(e) => {
                const next = limitWords(e.currentTarget.value)
                if (next !== e.currentTarget.value) e.currentTarget.value = next
              }}
            />
          </div>
        </div>

        <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Danh sách sản phẩm xuất</h3>
            <Button variant="outline" size="sm" onClick={handleAddItem}>
              <Plus size={16} className="mr-2" /> Thêm dòng
            </Button>
          </div>

          <div className={`border border-gray-200 rounded-md relative z-0 ${items.length > 6 ? 'max-h-[450px] overflow-y-auto' : 'overflow-hidden'}`}>
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3">Sản phẩm xuất</th>
                  <th className="px-4 py-3 w-20">ĐVT</th>
                  <th className="px-4 py-3 w-32 text-center">Tồn khả dụng</th>
                  <th className="px-4 py-3 w-24 text-right">Sl Xuất</th>
                  <th className="px-4 py-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Chưa có sản phẩm nào. Nhấp "Thêm dòng" để bắt đầu.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const overStock = item.quantity > item.availableStock && item.model !== ''
                    const overMax = item.quantity > MAX_MONEY
                    const error = overStock || overMax

                    return (
                      <tr key={item.id} className={`bg-white ${error ? 'bg-red-50/50' : ''}`}>
                        <td className="px-4 py-3">
                          <SuggestInput
                            value={item.model}
                            onValueChange={(val) => handleModelInputChange(item.id, val)}
                            placeholder="Gõ model..."
                            loadOptions={async (q) => {
                              const keyword = normalizeSearchText(q)
                              return normalizedProductOptions.filter(
                                (m) =>
                                  m.searchLabel.includes(keyword) ||
                                  m.searchName.includes(keyword) ||
                                  m.searchDescription.includes(keyword)
                              )
                            }}
                            onSelect={(selected) => handleModelSelect(item.id, selected)}
                            className={error ? 'border-red-300' : ''}
                          />
                          {item.name && (
                            <div className="text-xs text-gray-500 mt-1 pl-1 line-clamp-1">
                              {item.name}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-3 align-top">
                          <Input
                            value={item.model ? item.unit : ''}
                            readOnly
                            placeholder="-"
                            className="px-2 text-center bg-gray-50 text-gray-600"
                          />
                        </td>
                        <td className="px-2 py-3 align-top">
                          <div className="h-9 flex items-center justify-center">
                            {item.model ? (
                              <Badge variant={item.availableStock > 0 ? 'default' : 'destructive'}>
                                {item.availableStock}
                              </Badge>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex flex-col items-end gap-1 min-h-[56px]">
                            <Input
                              type="number"
                              min={1}
                              max={MAX_MONEY}
                              inputMode="decimal"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'quantity', Number(e.target.value))
                              }
                              className={`px-2 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            />
                            {overStock && (
                              <div className="text-[10px] text-red-500 whitespace-nowrap leading-none">
                                Vượt quá tồn kho
                              </div>
                            )}
                            {overMax && (
                              <div className="text-[10px] text-red-500 whitespace-nowrap leading-none">
                                Số lượng vượt quá 1 triệu tỷ
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-3 text-center align-top">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>

            {items.length > 0 && (
              <div className="relative z-0 bg-gray-50 border-t border-gray-200 p-4 flex justify-end items-center gap-6">
                <div className="text-gray-500">Tổng cộng:</div>
                <div className="text-xl font-bold text-gray-900">
                  {viVnFormatter.format(Math.round(totalValue))} VNĐ
                </div>
              </div>
            )}
          </div>

          {loadingProducts && (
            <div className="text-sm text-gray-500">Đang tải dữ liệu sản phẩm…</div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">Phiếu lưu nháp</h3>
        <DataTable
          data={pagedDrafts}
          columns={draftColumns}
          keyExtractor={(item) => item.id}
          emptyStateTitle="Chưa có phiếu nháp"
          emptyStateDescription="Lưu nháp phiếu xuất để thấy dữ liệu ở đây."
          pagination={{
            page: effectiveDraftPage,
            pageSize: PAGE_SIZE,
            total: savedDrafts.length,
            onPageChange: setDraftPage
          }}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">Danh sách phiếu xuất kho</h3>
        <DataTable
          data={pagedOrders}
          columns={orderColumns}
          keyExtractor={(item) => item.id}
          emptyStateTitle="Chưa có phiếu xuất kho"
          emptyStateDescription="Hoàn tất phiếu xuất để thấy dữ liệu ở đây."
          pagination={{
            page: effectiveOrderPage,
            pageSize: PAGE_SIZE,
            total: orders.length,
            onPageChange: setOrderPage
          }}
        />
      </div>

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Chi tiết ${selectedOrder.code}` : 'Chi tiết phiếu xuất'}
        className="sm:max-w-[760px]"
      >
        {selectedOrder && (
          <div className="space-y-3">
            <div className="text-sm">
              <div className="text-gray-500">Ngày xuất</div>
              <div className="font-medium text-gray-900">
                {formatDateDdMmYyyy(selectedOrder.orderDate)}
              </div>
            </div>

            <div className="border border-gray-200 rounded-md overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-4 py-2">Sản phẩm</th>
                    <th className="px-4 py-2 text-right">Số lượng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedOrder.items.map((it, idx) => {
                    const product = productMap.get(it.productId)
                    return (
                      <tr key={`${it.productId}-${idx}`}>
                        <td className="px-4 py-2">
                          <div className="font-medium text-gray-900">
                            {product ? `${product.model} - ${product.name}` : it.productId}
                          </div>
                          <div className="text-xs text-gray-500">Mã SP: {it.productId}</div>
                        </td>
                        <td className="px-4 py-2 text-right">{it.quantity}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={confirmSubmitOpen}
        onClose={() => setConfirmSubmitOpen(false)}
        onConfirm={() => {
          setConfirmSubmitOpen(false)
          void handleSubmit()
        }}
        title="Xác nhận hoàn tất xuất kho"
        description="Bạn có chắc chắn muốn hoàn tất phiếu xuất kho này không? Dữ liệu sẽ được ghi nhận và không chỉnh sửa trực tiếp trên phiếu đã xuất."
        confirmText="Xác nhận hoàn tất"
        cancelText="Quay lại"
        isDestructive={false}
      />

      <ConfirmDialog
        isOpen={!!deleteOrderId}
        onClose={() => setDeleteOrderId(null)}
        onConfirm={() => void handleDeleteOrder()}
        title="Xóa phiếu xuất"
        description="Bạn có chắc chắn muốn xóa phiếu xuất này không?"
        confirmText="Xóa"
        cancelText="Hủy"
        isDestructive
      />
    </div>
  )
}
