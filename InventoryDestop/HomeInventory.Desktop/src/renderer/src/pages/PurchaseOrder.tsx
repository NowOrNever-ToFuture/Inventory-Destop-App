import { useEffect, useMemo, useState } from 'react'
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { SuggestInput } from '@renderer/components/shared/SuggestInput'
import { useToast } from '@renderer/components/shared/ToastProvider'
import { reportAppError } from '@renderer/lib/app-error'
import { formatCurrencyVnd } from '@renderer/lib/format'
import type {
  SupplierResponseDto,
  ProductResponseDto,
  CategoryResponseDto,
  BrandResponseDto,
  PurchaseOrderItemRequestDto
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

const MAX_MONEY = 1_000_000_000_000_000

export function PurchaseOrder() {
  const navigate = useNavigate()
  const toast = useToast()
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10))
  const [supplierQuery, setSupplierQuery] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [items, setItems] = useState<POItem[]>([])
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [loadingLookups, setLoadingLookups] = useState(false)

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
          window.api.product.getAll(),
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

  const totalValue = items.reduce((sum, item) => sum + item.quantity * item.price, 0)

  const isFormValid =
    !!supplierId &&
    items.length > 0 &&
    items.every(
      (i) =>
        i.model.trim() &&
        i.name.trim() &&
        i.quantity > 0 &&
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
    } catch (error) {
      reportAppError(toast, 'PN-CREATE-01', 'Không tạo được phiếu nhập', error)
    } finally {
      setLoadingSubmit(false)
    }
  }

  const handleSaveDraft = () => {
    try {
      const draft = {
        orderDate,
        supplierQuery,
        supplierId,
        items,
        savedAt: new Date().toISOString()
      }
      localStorage.setItem('homeinventory:draft:purchase-order', JSON.stringify(draft))
      toast.success('Đã lưu nháp phiếu nhập')
    } catch (error) {
      reportAppError(toast, 'PN-DRAFT-01', 'Không lưu được nháp phiếu nhập', error)
    }
  }

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
            onClick={() => void handleSubmit()}
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
              loadOptions={async (q) =>
                supplierOptions.filter((s) => s.label.toLowerCase().includes(q.toLowerCase()))
              }
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

          <div className="border border-gray-200 rounded-md overflow-hidden">
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
                  items.map((item) => (
                    <tr key={item.id} className="bg-white">
                      <td className="px-4 py-3">
                        <SuggestInput
                          value={item.model}
                          onValueChange={(val) => handleUpdateItem(item.id, 'model', val)}
                          placeholder="Gõ model..."
                          loadOptions={async (q) =>
                            productOptions.filter((m) =>
                              m.label.toLowerCase().includes(q.toLowerCase())
                            )
                          }
                          onSelect={(selected) => handleModelSelect(item.id, selected)}
                        />
                        {item.name && (
                          <div className="text-xs text-gray-500 mt-1 pl-1 line-clamp-1">
                            {item.name}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-3">
                        <Input
                          value={item.unit}
                          onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                          className="px-2 text-center"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'quantity', Number(e.target.value))
                          }
                          className="px-2 text-right"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <Input
                          type="number"
                          min={0}
                          max={MAX_MONEY}
                          value={item.price}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.id,
                              'price',
                              e.target.value.trim() === '' ? Number.NaN : Number(e.target.value)
                            )
                          }
                          placeholder="Nhập đơn giá"
                          className="px-2 text-right"
                        />
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
                  ))
                )}
              </tbody>
            </table>

            {items.length > 0 && (
              <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end items-center gap-6">
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
    </div>
  )
}
