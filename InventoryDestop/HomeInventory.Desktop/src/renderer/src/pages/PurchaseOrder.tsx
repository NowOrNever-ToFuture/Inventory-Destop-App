import { useEffect, useMemo, useState } from 'react'
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Modal } from '@renderer/components/ui/modal'
import { SuggestInput } from '@renderer/components/shared/SuggestInput'
import { DataTable, type ColumnDef } from '@renderer/components/shared/DataTable'
import { ConfirmDialog } from '@renderer/components/shared/ConfirmDialog'
import { useToast } from '@renderer/components/shared/ToastProvider'
import { reportAppError } from '@renderer/lib/app-error'
import { formatCurrencyVnd, formatDateDdMmYyyy } from '@renderer/lib/format'
import { limitWords } from '@renderer/lib/input-sanitize'
import { normalizeSearchText } from '@shared/utils/text-normalize'
import type {
  SupplierResponseDto,
  ProductResponseDto,
  CategoryResponseDto,
  BrandResponseDto,
  PurchaseOrderItemRequestDto,
  PurchaseOrderResponseDto
} from '@shared/types/dtos'

interface POItem {
  id: string
  model: string
  name: string
  unit: string
  quantity: number
  price: number
  categoryId: string
  brandId: string
}

interface PurchaseOrderDraft {
  id: string
  orderDate: string
  supplierQuery: string
  supplierId: string
  items: POItem[]
  savedAt: string
}

const MAX_MONEY = 1_000_000_000_000_000
const PAGE_SIZE = 10
const PURCHASE_DRAFT_STORAGE_KEY = 'homeinventory:drafts:purchase-order'
const PURCHASE_DRAFT_LEGACY_STORAGE_KEY = 'homeinventory:draft:purchase-order'

export function PurchaseOrder() {
  const navigate = useNavigate()
  const toast = useToast()
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10))
  const [supplierQuery, setSupplierQuery] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [items, setItems] = useState<POItem[]>([])
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [loadingLookups, setLoadingLookups] = useState(false)
  const [savedDrafts, setSavedDrafts] = useState<PurchaseOrderDraft[]>([])
  const [orders, setOrders] = useState<PurchaseOrderResponseDto[]>([])
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderResponseDto | null>(null)
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null)
  const [draftPage, setDraftPage] = useState(1)
  const [orderPage, setOrderPage] = useState(1)
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false)

  const [suppliers, setSuppliers] = useState<SupplierResponseDto[]>([])
  const [products, setProducts] = useState<ProductResponseDto[]>([])
  const [categories, setCategories] = useState<CategoryResponseDto[]>([])
  const [brands, setBrands] = useState<BrandResponseDto[]>([])

  useEffect(() => {
    const loadLookups = async () => {
      setLoadingLookups(true)
      try {
        const [supplierData, productData, categoryData, brandData] = await Promise.all([
          window.api.supplier.getAll(),
          window.api.product.getAll({ page: 1, pageSize: 1000 }),
          window.api.category.getAll(),
          window.api.brand.getAll()
        ])
        setSuppliers(supplierData)
        setProducts(productData.items)
        setCategories(categoryData)
        setBrands(brandData)
      } catch (error) {
        reportAppError(toast, 'PN-LOAD-01', 'Không tải được dữ liệu phiếu nhập', error)
      } finally {
        setLoadingLookups(false)
      }
    }

    void loadLookups()
  }, [])

  const loadOrders = async () => {
    try {
      const data = await window.api.purchaseOrder.getAll()
      setOrders(data)
    } catch (error) {
      reportAppError(toast, 'PN-LIST-01', 'Không tải được danh sách phiếu nhập', error)
    }
  }

  useEffect(() => {
    void loadOrders()
  }, [])

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(PURCHASE_DRAFT_STORAGE_KEY) ??
        localStorage.getItem(PURCHASE_DRAFT_LEGACY_STORAGE_KEY)
      if (!raw) {
        setSavedDrafts([])
        return
      }
      const parsed = JSON.parse(raw) as PurchaseOrderDraft | PurchaseOrderDraft[]
      const drafts = Array.isArray(parsed) ? parsed : parsed ? [parsed] : []
      const normalizedDrafts = drafts.map((draft) => ({
        ...draft,
        id: draft.id ?? crypto.randomUUID()
      }))
      setSavedDrafts(normalizedDrafts)
      localStorage.setItem(PURCHASE_DRAFT_STORAGE_KEY, JSON.stringify(normalizedDrafts))
    } catch {
      setSavedDrafts([])
    }
  }, [])

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(savedDrafts.length / PAGE_SIZE))
    if (draftPage > totalPages) setDraftPage(totalPages)
  }, [savedDrafts.length, draftPage])

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE))
    if (orderPage > totalPages) setOrderPage(totalPages)
  }, [orders.length, orderPage])

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories])
  const brandMap = useMemo(() => new Map(brands.map((b) => [b.id, b.name])), [brands])

  const supplierOptions = useMemo(
    () =>
      suppliers.map((s) => ({
        id: s.id,
        label: s.name,
        description: [s.phone].filter(Boolean).join(' • ')
      })),
    [suppliers]
  )

  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        id: p.id,
        label: p.model,
        name: p.name,
        unit: p.unit ?? 'Cái',
        categoryId: p.categoryId,
        brandId: p.brandId,
        description: `${categoryMap.get(p.categoryId) ?? p.categoryId} • ${brandMap.get(p.brandId) ?? p.brandId}`
      })),
    [products, categoryMap, brandMap]
  )

  const normalizedProductOptions = useMemo(
    () =>
      productOptions.map((opt) => ({
        ...opt,
        searchLabel: normalizeSearchText(opt.label),
        searchName: normalizeSearchText(opt.name),
        searchDescription: normalizeSearchText(opt.description)
      })),
    [productOptions]
  )

  const defaultCategoryId = categories[0]?.id ?? ''
  const defaultBrandId = brands[0]?.id ?? ''

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        model: '',
        name: '',
        unit: 'Cái',
        quantity: 1,
        price: Number.NaN,
        categoryId: defaultCategoryId,
        brandId: defaultBrandId
      }
    ])
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const handleUpdateItem = <K extends keyof POItem>(id: string, field: K, value: POItem[K]) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const handleModelSelect = (id: string, selectedModel: any) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              model: selectedModel.label,
              name: selectedModel.name,
              unit: selectedModel.unit,
              categoryId: selectedModel.categoryId,
              brandId: selectedModel.brandId
            }
          : item
      )
    )
  }

  const totalValue = items.reduce((sum, item) => {
    if (!Number.isFinite(item.price)) return sum
    return sum + item.quantity * item.price
  }, 0)

  const isFormValid =
    !!supplierId &&
    items.length > 0 &&
    items.every(
      (i) =>
        i.model.trim() &&
        i.name.trim() &&
        i.quantity > 0 &&
        i.quantity <= MAX_MONEY &&
        Number.isFinite(i.price) &&
        i.price >= 0 &&
        i.price <= MAX_MONEY
    )

  const handleSubmit = async () => {
    if (!isFormValid) return

    const payloadItems: PurchaseOrderItemRequestDto[] = items.map((item) => ({
      model: item.model.trim(),
      name: item.name.trim(),
      unit: item.unit.trim() || undefined,
      quantity: item.quantity,
      unitCost: Number(item.price),
      categoryId: item.categoryId || defaultCategoryId,
      brandId: item.brandId || defaultBrandId
    }))

    setLoadingSubmit(true)
    try {
      await window.api.purchaseOrder.create({
        orderDate,
        supplierId,
        items: payloadItems
      })
      toast.success('Tạo phiếu nhập thành công')
      setItems([])
      setOrderDate(new Date().toISOString().slice(0, 10))
      setSupplierId('')
      setSupplierQuery('')
      await loadOrders()
    } catch (error) {
      reportAppError(toast, 'PN-CREATE-01', 'Không tạo được phiếu nhập', error)
    } finally {
      setLoadingSubmit(false)
    }
  }

  const handleDeleteOrder = async () => {
    if (!deleteOrderId) return
    try {
      const ok = await window.api.purchaseOrder.delete(deleteOrderId)
      if (ok) {
        toast.success('Đã xoá phiếu nhập')
        await loadOrders()
        if (selectedOrder?.id === deleteOrderId) setSelectedOrder(null)
      }
    } catch (error) {
      reportAppError(toast, 'PN-DEL-01', 'Không xoá được phiếu nhập', error)
    } finally {
      setDeleteOrderId(null)
    }
  }

  const orderColumns: ColumnDef<PurchaseOrderResponseDto>[] = [
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
      key: 'total',
      header: 'Tổng tiền',
      align: 'right',
      cell: (o) => <span className="text-gray-900">{formatCurrencyVnd(o.totalAmount)}</span>
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
        supplierQuery,
        supplierId,
        items,
        savedAt: new Date().toISOString()
      }
      const nextDrafts = [draft, ...savedDrafts]
      localStorage.setItem(PURCHASE_DRAFT_STORAGE_KEY, JSON.stringify(nextDrafts))
      toast.success('Đã lưu nháp phiếu nhập')
      setSavedDrafts(nextDrafts)
      setDraftPage(1)
    } catch (error) {
      reportAppError(toast, 'PN-DRAFT-01', 'Không lưu được nháp phiếu nhập', error)
    }
  }

  const handleLoadDraft = (draft: PurchaseOrderDraft) => {
    setOrderDate(draft.orderDate)
    setSupplierQuery(draft.supplierQuery)
    setSupplierId(draft.supplierId)
    setItems(draft.items)
    toast.success('Đã nạp phiếu nháp')
  }

  const handleDeleteDraft = (draftId: string) => {
    const nextDrafts = savedDrafts.filter((draft) => draft.id !== draftId)
    localStorage.setItem(PURCHASE_DRAFT_STORAGE_KEY, JSON.stringify(nextDrafts))
    localStorage.removeItem(PURCHASE_DRAFT_LEGACY_STORAGE_KEY)
    setSavedDrafts(nextDrafts)
    toast.success('Đã xóa phiếu nháp')
  }

  const supplierMap = useMemo(() => new Map(suppliers.map((s) => [s.id, s.name])), [suppliers])
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])

  const pagedDrafts = useMemo(
    () => savedDrafts.slice((draftPage - 1) * PAGE_SIZE, draftPage * PAGE_SIZE),
    [savedDrafts, draftPage]
  )

  const pagedOrders = useMemo(
    () => orders.slice((orderPage - 1) * PAGE_SIZE, orderPage * PAGE_SIZE),
    [orders, orderPage]
  )

  const draftColumns: ColumnDef<PurchaseOrderDraft>[] = [
    {
      key: 'draftDate',
      header: 'Ngày nháp',
      cell: (draft) => <span className="text-gray-900">{formatDateDdMmYyyy(draft.orderDate)}</span>
    },
    {
      key: 'supplier',
      header: 'Nhà cung cấp',
      cell: (draft) => <span className="text-gray-700">{draft.supplierQuery || '-'}</span>
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
            <h1 className="text-2xl font-semibold text-gray-900">Tạo Phiếu Nhập Kho</h1>
            <p className="text-sm text-gray-500">
              NK-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSaveDraft}>
            Lưu nháp
          </Button>
          <Button
            icon={Save}
            onClick={() => setConfirmSubmitOpen(true)}
            disabled={!isFormValid || loadingSubmit}
          >
            Hoàn tất & Nhập Kho
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4 h-fit">
          <h3 className="font-semibold text-gray-900 pb-2 border-b border-gray-100">
            Thông tin chung
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày lập phiếu</label>
            <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp (*)</label>
            <SuggestInput
              value={supplierQuery}
              onValueChange={setSupplierQuery}
              placeholder="Chọn đại lý/nhà cung cấp..."
              loadOptions={async (q) => {
                const query = normalizeSearchText(q)
                return supplierOptions.filter((s) => {
                  const label = normalizeSearchText(s.label)
                  const description = normalizeSearchText(s.description ?? '')
                  return label.includes(query) || description.includes(query)
                })
              }}
              onSelect={(item) => {
                setSupplierQuery(item.label)
                setSupplierId(item.id)
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số chứng từ (Hóa đơn)
            </label>
            <Input type="text" placeholder="VD: HD-00123" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[80px]"
              placeholder="Ghi chú thêm..."
              onChange={(e) => {
                const next = limitWords(e.currentTarget.value)
                if (next !== e.currentTarget.value) e.currentTarget.value = next
              }}
            />
          </div>
        </div>

        <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Danh sách sản phẩm</h3>
            <Button variant="outline" size="sm" onClick={handleAddItem}>
              <Plus size={16} className="mr-2" /> Thêm dòng
            </Button>
          </div>

          <div className="border border-gray-200 rounded-md overflow-visible relative z-0">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-4 py-3 min-w-[200px]">Model / Tên Sản phẩm</th>
                  <th className="px-4 py-3 w-20">ĐVT</th>
                  <th className="px-4 py-3 w-24 text-right">Số lượng</th>
                  <th className="px-4 py-3 w-32 text-right">Đơn giá (VNĐ)</th>
                  <th className="px-4 py-3 w-32 text-right">Thành tiền (VNĐ)</th>
                  <th className="px-4 py-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Chưa có sản phẩm nào. Nhấp "Thêm dòng" để bắt đầu.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const quantityOverMax = item.quantity > MAX_MONEY
                    const priceOverMax = Number.isFinite(item.price) && item.price > MAX_MONEY

                    return (
                      <tr key={item.id} className="bg-white">
                        <td className="px-4 py-3">
                          <SuggestInput
                            value={item.model}
                            onValueChange={(val) => handleUpdateItem(item.id, 'model', val)}
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
                          />
                          {item.name && (
                            <div className="text-xs text-gray-500 mt-1 pl-1 line-clamp-1">
                              {item.name}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-3 align-top">
                          <Input
                            value={item.unit}
                            onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                            className="px-2 text-center"
                          />
                        </td>
                        <td className="px-2 py-3 align-top">
                          <div className="relative">
                            <Input
                              type="number"
                              min={1}
                              max={MAX_MONEY}
                              inputMode="decimal"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'quantity', Number(e.target.value))
                              }
                              placeholder="Số lượng"
                              className={`px-2 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${quantityOverMax ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            />
                            {quantityOverMax && (
                              <div className="absolute top-10 right-0 text-[10px] text-red-500 whitespace-nowrap">
                                Số lượng vượt quá 1 triệu tỷ
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-3 align-top">
                          <div className="relative">
                            <Input
                              type="number"
                              min={0}
                              max={MAX_MONEY}
                              inputMode="decimal"
                              value={Number.isFinite(item.price) ? item.price : ''}
                              onChange={(e) =>
                                handleUpdateItem(
                                  item.id,
                                  'price',
                                  e.target.value.trim() === '' ? Number.NaN : Number(e.target.value)
                                )
                              }
                              placeholder="Nhập đơn giá"
                              className={`px-2 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${priceOverMax ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            />
                            {priceOverMax && (
                              <div className="absolute top-10 right-0 text-[10px] text-red-500 whitespace-nowrap">
                                Giá vượt quá 1 triệu tỷ VNĐ
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-blue-600">
                          {Number.isFinite(item.price)
                            ? formatCurrencyVnd(item.quantity * item.price)
                            : '-'}
                        </td>
                        <td className="px-2 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
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
                  {formatCurrencyVnd(totalValue)}
                </div>
              </div>
            )}
          </div>

          {loadingLookups && (
            <div className="text-sm text-gray-500">
              Đang tải dữ liệu danh mục/sản phẩm/nhà cung cấp...
            </div>
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
          emptyStateDescription="Lưu nháp phiếu nhập để thấy dữ liệu ở đây."
          pagination={{
            page: draftPage,
            pageSize: PAGE_SIZE,
            total: savedDrafts.length,
            onPageChange: setDraftPage
          }}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">Danh sách phiếu nhập kho</h3>
        <DataTable
          data={pagedOrders}
          columns={orderColumns}
          keyExtractor={(item) => item.id}
          emptyStateTitle="Chưa có phiếu nhập kho"
          emptyStateDescription="Hoàn tất phiếu nhập để thấy dữ liệu ở đây."
          pagination={{
            page: orderPage,
            pageSize: PAGE_SIZE,
            total: orders.length,
            onPageChange: setOrderPage
          }}
        />
      </div>

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Chi tiết ${selectedOrder.code}` : 'Chi tiết phiếu nhập'}
        className="sm:max-w-[760px]"
      >
        {selectedOrder && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-gray-500">Ngày nhập</div>
                <div className="font-medium text-gray-900">
                  {formatDateDdMmYyyy(selectedOrder.orderDate)}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Nhà cung cấp</div>
                <div className="font-medium text-gray-900">
                  {supplierMap.get(selectedOrder.supplierId) ?? selectedOrder.supplierId}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Tổng tiền</div>
                <div className="font-medium text-gray-900">
                  {formatCurrencyVnd(selectedOrder.totalAmount)}
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-md overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-4 py-2">Sản phẩm</th>
                    <th className="px-4 py-2 text-right">Số lượng</th>
                    <th className="px-4 py-2 text-right">Đơn giá</th>
                    <th className="px-4 py-2 text-right">Thành tiền</th>
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
                        <td className="px-4 py-2 text-right">{formatCurrencyVnd(it.unitCost)}</td>
                        <td className="px-4 py-2 text-right">{formatCurrencyVnd(it.lineTotal)}</td>
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
        title="Xác nhận hoàn tất nhập kho"
        description="Bạn có chắc chắn muốn hoàn tất phiếu nhập kho này không? Dữ liệu sẽ được ghi nhận và không chỉnh sửa trực tiếp trên phiếu đã xuất."
        confirmText="Xác nhận hoàn tất"
        cancelText="Quay lại"
        isDestructive={false}
      />

      <ConfirmDialog
        isOpen={!!deleteOrderId}
        onClose={() => setDeleteOrderId(null)}
        onConfirm={() => void handleDeleteOrder()}
        title="Xóa phiếu nhập"
        description="Bạn có chắc chắn muốn xóa phiếu nhập này không?"
        confirmText="Xóa"
        cancelText="Hủy"
        isDestructive
      />
    </div>
  )
}
