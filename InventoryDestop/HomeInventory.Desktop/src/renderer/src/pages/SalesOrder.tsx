import { useEffect, useMemo, useState } from 'react'
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { SuggestInput } from '@renderer/components/shared/SuggestInput'
import { Badge } from '@renderer/components/ui/badge'
import { useToast } from '@renderer/components/shared/ToastProvider'
import { reportAppError } from '@renderer/lib/app-error'
import type { ProductResponseDto, SalesOrderItemRequestDto } from '@shared/types/dtos'

interface SOItem {
  id: string
  productId: string
  model: string
  name: string
  unit: string
  quantity: number
  availableStock: number
}

export function SalesOrder() {
  const navigate = useNavigate()
  const toast = useToast()
  const [items, setItems] = useState<SOItem[]>([])
  const [products, setProducts] = useState<ProductResponseDto[]>([])
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)

  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true)
      try {
        const data = await window.api.product.getAll()
        setProducts(data.items)
      } catch (error) {
        reportAppError(toast, 'PX-LOAD-01', 'Không tải được dữ liệu phiếu xuất', error)
      } finally {
        setLoadingProducts(false)
      }
    }

    void loadProducts()
  }, [])

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

  const isFormValid =
    items.length > 0 &&
    items.every(
      (item) => item.productId && item.quantity > 0 && item.quantity <= item.availableStock
    )

  const handleSubmit = async () => {
    if (!isFormValid) return

    const payloadItems: SalesOrderItemRequestDto[] = items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity
    }))

    setLoadingSubmit(true)
    try {
      await window.api.salesOrder.create({ items: payloadItems })
      toast.success('Tạo phiếu xuất thành công')
      setItems([])
      const fresh = await window.api.product.getAll()
      setProducts(fresh.items)
    } catch (error) {
      reportAppError(toast, 'PX-CREATE-01', 'Không tạo được phiếu xuất', error)
    } finally {
      setLoadingSubmit(false)
    }
  }

  const handleSaveDraft = () => {
    try {
      const draft = { items, savedAt: new Date().toISOString() }
      localStorage.setItem('homeinventory:draft:sales-order', JSON.stringify(draft))
      toast.success('Đã lưu nháp phiếu xuất')
    } catch (error) {
      reportAppError(toast, 'PX-DRAFT-01', 'Không lưu được nháp phiếu xuất', error)
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
            <h1 className="text-2xl font-semibold text-gray-900">Tạo Phiếu Xuất Kho</h1>
            <p className="text-sm text-gray-500">
              XK-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSaveDraft}>
            Lưu nháp
          </Button>
          <Button
            icon={Save}
            disabled={!isFormValid || loadingSubmit}
            onClick={() => void handleSubmit()}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày lập phiếu</label>
            <Input
              type="date"
              value={new Date().toISOString().slice(0, 10)}
              readOnly
              className="bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lý do xuất</label>
            <select className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500">
              <option value="ban_hang">Xuất bán hàng</option>
              <option value="bao_hanh">Xuất bảo hành</option>
              <option value="khac">Khác...</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mã tham chiếu (Đơn hàng)
            </label>
            <Input type="text" placeholder="VD: DH-908" />
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
            <h3 className="font-semibold text-gray-900">Danh sách sản phẩm xuất</h3>
            <Button variant="outline" size="sm" onClick={handleAddItem}>
              <Plus size={16} className="mr-2" /> Thêm dòng
            </Button>
          </div>

          <div className="border border-gray-200 rounded-md overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-4 py-3 min-w-[200px]">Sản phẩm xuất</th>
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
                    const error = item.quantity > item.availableStock && item.model !== ''

                    return (
                      <tr key={item.id} className={`bg-white ${error ? 'bg-red-50/50' : ''}`}>
                        <td className="px-4 py-3">
                          <SuggestInput
                            value={item.model}
                            onValueChange={(val) => handleUpdateItem(item.id, 'model', val)}
                            placeholder="Tìm sản phẩm theo model..."
                            loadOptions={async (q) =>
                              productOptions.filter((m) =>
                                m.label.toLowerCase().includes(q.toLowerCase())
                              )
                            }
                            onSelect={(selected) => handleModelSelect(item.id, selected)}
                            className={error ? 'border-red-300' : ''}
                          />
                          {item.name && (
                            <div className="text-xs text-gray-500 mt-1 pl-1 line-clamp-1">
                              {item.name}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-3 text-gray-500">{item.model ? item.unit : '-'}</td>
                        <td className="px-2 py-3 text-center">
                          {item.model ? (
                            <Badge variant={item.availableStock > 0 ? 'default' : 'destructive'}>
                              {item.availableStock}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-2 py-3">
                          <div className="relative">
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'quantity', Number(e.target.value))
                              }
                              className={`px-2 text-right ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            />
                            {error && (
                              <div className="absolute top-10 right-0 text-[10px] text-red-500 whitespace-nowrap">
                                Vượt quá tồn kho
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-3 text-center align-top">
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
          </div>

          {loadingProducts && (
            <div className="text-sm text-gray-500">Đang tải dữ liệu sản phẩm...</div>
          )}
        </div>
      </div>
    </div>
  )
}
