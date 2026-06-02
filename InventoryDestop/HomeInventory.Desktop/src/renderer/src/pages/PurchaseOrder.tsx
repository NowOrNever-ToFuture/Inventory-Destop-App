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
import { useAppData } from '@renderer/components/shared/AppDataProvider'
import { reportAppError } from '@renderer/lib/app-error'
import { formatCurrencyVnd, formatDateDdMmYyyy } from '@renderer/lib/format'
import { limitWords } from '@renderer/lib/input-sanitize'
import { normalizeSearchText } from '@shared/utils/text-normalize'
import type {
  ProductResponseDto,
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
  const { suppliers, categories, brands } = useAppData()
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [supplierQuery, setSupplierQuery] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [items, setItems] = useState<POItem[]>([])
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [loadingLookups, setLoadingLookups] = useState(false)
  const [savedDrafts, setSavedDrafts] = useState<PurchaseOrderDraft[]>(() => {
    try {
      const raw =
        localStorage.getItem(PURCHASE_DRAFT_STORAGE_KEY) ??
        localStorage.getItem(PURCHASE_DRAFT_LEGACY_STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw) as PurchaseOrderDraft | PurchaseOrderDraft[]
      const drafts = Array.isArray(parsed) ? parsed : parsed ? [parsed] : []
      const normalized = drafts.map((draft) => ({ ...draft, id: draft.id ?? crypto.randomUUID() }))
      localStorage.setItem(PURCHASE_DRAFT_STORAGE_KEY, JSON.stringify(normalized))
      return normalized
    } catch {
      return []
    }
  })
  const [orders, setOrders] = useState<PurchaseOrderResponseDto[]>([])
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderResponseDto | null>(null)
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null)
  const [draftPage, setDraftPage] = useState(1)
  const [orderPage, setOrderPage] = useState(1)
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false)

  const [products, setProducts] = useState<ProductResponseDto[]>([])
  const [attachmentSource, setAttachmentSource] = useState<string | null>(null)
  const [attachmentName, setAttachmentName] = useState<string | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [attachmentDataUrl, setAttachmentDataUrl] = useState<string | null>(null)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
  const [zoomedOrderId, setZoomedOrderId] = useState<string | null>(null)
  const [zoomScale, setZoomScale] = useState(1)

  useEffect(() => {
    const loadProducts = async () => {
      setLoadingLookups(true)
      try {
        const productData = await window.api.product.getAll({ page: 1, pageSize: 1000 })
        setProducts(productData.items)
      } catch (error) {
        reportAppError(toast, 'PN-LOAD-01', 'Không tải được dữ liệu sản phẩm', error)
      } finally {
        setLoadingLookups(false)
      }
    }
    void loadProducts()
  }, [toast])

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
  }, [toast])

  // Derived page bounds - clamp pages when data shrinks
  const draftTotalPages = Math.max(1, Math.ceil(savedDrafts.length / PAGE_SIZE))
  const effectiveDraftPage = Math.min(draftPage, draftTotalPages)
  const orderTotalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE))
  const effectiveOrderPage = Math.min(orderPage, orderTotalPages)

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

  const handleSubmit = async (): Promise<void> => {
    if (!isFormValid) return

    // Validate date - không cho phép ngày tương lai
    const today = new Date().toISOString().slice(0, 10)
    if (orderDate > today) {
      toast.error('Ngày lập phiếu không thể là ngày trong tương lai.')
      return
    }

    // Check data path is configured in settings
    try {
      const settings = await window.api.settings.getAll()
      if (!settings.dataPath || !settings.dataPath.trim()) {
        toast.error(
          'Vui lòng vào Cài đặt để cấu hình đường dẫn lưu dữ liệu trước khi tạo phiếu nhập kho.'
        )
        return
      }
    } catch {
      toast.error('Lỗi kiểm tra cài đặt. Vui lòng kiểm tra Cài đặt.')
      return
    }

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
      let attachmentPath: string | undefined
      if (attachmentSource) {
        attachmentPath =
          (await window.api.file.saveAttachment(attachmentSource, crypto.randomUUID())) ?? undefined
        await window.api.purchaseOrder.create({
          orderDate,
          supplierId,
          items: payloadItems,
          attachmentSourcePath: attachmentPath
        })
      } else {
        await window.api.purchaseOrder.create({
          orderDate,
          supplierId,
          items: payloadItems
        })
      }
      toast.success('Tạo phiếu nhập thành công')
      setItems([])
      setOrderDate(new Date().toISOString().slice(0, 10))
      setSupplierId('')
      setSupplierQuery('')
      setAttachmentSource(null)
      setAttachmentName(null)
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
    if (!supplierId || items.length === 0) {
      toast.error('Vui lòng chọn nhà cung cấp và thêm ít nhất một sản phẩm trước khi lưu nháp.')
      return
    }
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

  // Load attachment preview when selected order changes
  useEffect(() => {
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl)
    setPdfBlobUrl(null)
    setAttachmentDataUrl(null)

    if (!selectedOrder?.attachmentPath) return
    const isPdf = selectedOrder.attachmentPath.toLowerCase().endsWith('.pdf')

    void window.api.file.readAttachment(selectedOrder.attachmentPath).then((url) => {
      if (!url) {
        // File might not exist - show fallback
        return
      }
      if (url.startsWith('data:application/pdf') || (isPdf && url.startsWith('data:'))) {
        try {
          const raw = atob(url.split(',')[1])
          const arr = new Uint8Array(raw.length)
          for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
          const blob = new Blob([arr], { type: 'application/pdf' })
          setPdfBlobUrl(URL.createObjectURL(blob))
        } catch {
          // PDF preview failed - pdfBlobUrl stays null → shows fallback button
        }
      } else if (url.startsWith('data:image/')) {
        setAttachmentDataUrl(url)
      }
    })
  }, [selectedOrder])

  // Close detail modal when zoom opens, reopen when zoom closes
  useEffect(() => {
    if (lightboxImage && zoomedOrderId) {
      setSelectedOrder(null)
      setZoomScale(1)
    }
  }, [lightboxImage, zoomedOrderId])

  useEffect(() => {
    if (!lightboxImage && zoomedOrderId) {
      const order = orders.find((o) => o.id === zoomedOrderId)
      if (order) setSelectedOrder(order)
      setZoomedOrderId(null)
    }
  }, [lightboxImage, zoomedOrderId, orders])

  const handlePickAttachment = async () => {
    try {
      const path = await window.api.file.pickAttachment()
      if (path) {
        setAttachmentSource(path)
        setAttachmentName(path.split('\\').pop()?.split('/').pop() ?? 'file')
      }
    } catch (error) {
      reportAppError(toast, 'PN-ATT-01', 'Không chọn được file đính kèm', error)
    }
  }

  const handleRemoveAttachment = () => {
    setAttachmentSource(null)
    setAttachmentName(null)
  }

  const pagedDrafts = useMemo(
    () => savedDrafts.slice((effectiveDraftPage - 1) * PAGE_SIZE, effectiveDraftPage * PAGE_SIZE),
    [savedDrafts, effectiveDraftPage]
  )

  const pagedOrders = useMemo(
    () => orders.slice((effectiveOrderPage - 1) * PAGE_SIZE, effectiveOrderPage * PAGE_SIZE),
    [orders, effectiveOrderPage]
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
            <label htmlFor="po-order-date" className="block text-sm font-medium text-gray-700 mb-1">
              Ngày lập phiếu
            </label>
            <Input
              id="po-order-date"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="po-supplier" className="block text-sm font-medium text-gray-700 mb-1">
              Nhà cung cấp (*)
            </label>
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
            <label htmlFor="po-ref" className="block text-sm font-medium text-gray-700 mb-1">
              Số chứng từ (Hóa đơn)
            </label>
            <Input id="po-ref" type="text" placeholder="VD: HD-00123" />
          </div>
          <div>
            <label htmlFor="po-note" className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú
            </label>
            <textarea
              id="po-note"
              aria-label="Ghi chú"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[80px]"
              placeholder="Ghi chú thêm…"
              onChange={(e) => {
                const next = limitWords(e.currentTarget.value)
                if (next !== e.currentTarget.value) e.currentTarget.value = next
              }}
            />
          </div>
          {/* Attachment picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hoá đơn đính kèm</label>
            {attachmentName ? (
              <div className="flex items-center gap-2 p-2 rounded-md border border-blue-200 bg-blue-50">
                <span className="text-sm text-blue-700 truncate flex-1">{attachmentName}</span>
                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  className="text-red-500 hover:text-red-700 text-xs font-medium"
                >
                  Xoá
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handlePickAttachment()}
                className="w-full"
              >
                Chọn file PNG/JPG/PDF
              </Button>
            )}
          </div>
        </div>

        <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Danh sách sản phẩm</h3>
            <Button variant="outline" size="sm" onClick={handleAddItem}>
              <Plus size={16} className="mr-2" /> Thêm dòng
            </Button>
          </div>

          <div className="border border-gray-200 rounded-md overflow-hidden">
            <div className={items.length > 6 ? 'max-h-[450px] overflow-y-auto' : ''}>
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 min-w-[260px]">Model / Tên Sản phẩm</th>
                    <th className="px-4 py-3 w-20">ĐVT</th>
                    <th className="px-4 py-3 w-24 text-right">Số lượng</th>
                    <th className="px-4 py-3 w-40 text-right whitespace-nowrap">Đơn giá (VNĐ)</th>
                    <th className="px-4 py-3 w-40 text-right whitespace-nowrap">
                      Thành tiền (VNĐ)
                    </th>
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
                                    e.target.value.trim() === ''
                                      ? Number.NaN
                                      : Number(e.target.value)
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
            </div>

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
              Đang tải dữ liệu danh mục/sản phẩm/nhà cung cấp…
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
            page: effectiveDraftPage,
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
            page: effectiveOrderPage,
            pageSize: PAGE_SIZE,
            total: orders.length,
            onPageChange: setOrderPage
          }}
        />
      </div>

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => {
          setSelectedOrder(null)
          setLightboxImage(null)
        }}
        title={selectedOrder ? `Chi tiết ${selectedOrder.code}` : 'Chi tiết phiếu nhập'}
        className="sm:max-w-[960px]"
      >
        {selectedOrder && (
          <div className="grid grid-cols-1 gap-4">
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
                    <th className="px-4 py-2 text-right whitespace-nowrap">Đơn giá</th>
                    <th className="px-4 py-2 text-right whitespace-nowrap">Thành tiền</th>
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
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          {formatCurrencyVnd(it.unitCost)}
                        </td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          {formatCurrencyVnd(it.lineTotal)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Attachment preview */}
            {selectedOrder.attachmentPath && (
              <div className="border border-gray-200 rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-200">
                  Hoá đơn đính kèm
                </div>
                <div className="p-4">
                  {attachmentDataUrl?.startsWith('data:image/') ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={attachmentDataUrl}
                        alt="Hoá đơn"
                        className="max-h-64 max-w-full rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity object-contain"
                        onClick={() => {
                          if (selectedOrder) setZoomedOrderId(selectedOrder.id)
                          setLightboxImage(attachmentDataUrl)
                        }}
                      />
                      <button
                        type="button"
                        className="text-xs text-blue-600 hover:text-blue-800"
                        onClick={() => {
                          const a = document.createElement('a')
                          a.href = attachmentDataUrl
                          const ext = attachmentDataUrl.startsWith('data:image/png')
                            ? '.png'
                            : '.jpg'
                          a.download = `hoa-don${ext}`
                          a.click()
                        }}
                      >
                        Tải xuống
                      </button>
                    </div>
                  ) : pdfBlobUrl ? (
                    <iframe
                      src={pdfBlobUrl}
                      className="w-full h-96 rounded border border-gray-200"
                    />
                  ) : selectedOrder.attachmentPath?.toLowerCase().endsWith('.pdf') ? (
                    <div className="flex flex-col items-center gap-3 py-6 text-gray-500">
                      <svg
                        className="size-12"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm">Hoá đơn PDF</span>
                      <button
                        type="button"
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                        onClick={() =>
                          selectedOrder.attachmentPath &&
                          void window.api.file.open(selectedOrder.attachmentPath)
                        }
                      >
                        Mở bằng ứng dụng mặc định
                      </button>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm text-center py-4">Đang tải...</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Zoom overlay - floating block above modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-gray-200 p-3 w-[90vw] max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2 shrink-0">
              <span className="text-sm font-medium text-gray-700">
                Hoá đơn
                <span className="text-gray-400 ml-2 font-normal">
                  {Math.round(zoomScale * 100)}%
                </span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
                  onClick={() => setZoomScale((s) => Math.max(0.25, s - 0.25))}
                >
                  -
                </button>
                <button
                  type="button"
                  className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
                  onClick={() => setZoomScale((s) => Math.min(5, s + 0.25))}
                >
                  +
                </button>
                <button
                  type="button"
                  className="ml-2 text-gray-400 hover:text-gray-600 text-lg leading-none p-1"
                  onClick={() => setLightboxImage(null)}
                >
                  ✕
                </button>
              </div>
            </div>
            <div
              className="overflow-auto flex-1 flex items-center justify-center bg-gray-50 rounded-lg min-h-[200px]"
              onWheel={(e) => {
                e.preventDefault()
                const delta = e.deltaY > 0 ? -0.1 : 0.1
                setZoomScale((s) => Math.max(0.25, Math.min(5, s + delta)))
              }}
            >
              {lightboxImage.startsWith('data:image/') ? (
                <img
                  src={lightboxImage}
                  alt="Hoá đơn phóng to"
                  style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }}
                  className="max-w-full transition-transform duration-75"
                  draggable={false}
                />
              ) : (
                <div className="text-gray-400 p-4">Không thể xem file này</div>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1 shrink-0 text-center">
              Lăn chuột để zoom, kéo thanh cuộn để di chuyển
            </div>
          </div>
        </div>
      )}

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
