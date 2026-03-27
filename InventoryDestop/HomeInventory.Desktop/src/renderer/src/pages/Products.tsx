import { useEffect, useMemo, useState } from 'react'
import { Plus, MoreVertical } from 'lucide-react'
import { DataTable, ColumnDef } from '@renderer/components/shared/DataTable'
import { FilterBar } from '@renderer/components/shared/FilterBar'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { Modal } from '@renderer/components/ui/modal'
import { Input } from '@renderer/components/ui/input'
import { useToast } from '@renderer/components/shared/ToastProvider'
import { reportAppError } from '@renderer/lib/app-error'
import { formatCurrencyVnd } from '@renderer/lib/format'
import type { ProductResponseDto, CategoryResponseDto, BrandResponseDto } from '@shared/types/dtos'

const MAX_MONEY = 1_000_000_000_000_000

interface ProductRow extends ProductResponseDto {
  categoryName: string
  brandName: string
}

export function Products() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<ProductResponseDto[]>([])
  const [categories, setCategories] = useState<CategoryResponseDto[]>([])
  const [brands, setBrands] = useState<BrandResponseDto[]>([])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newProduct, setNewProduct] = useState({
    model: '',
    name: '',
    unit: '',
    categoryId: '',
    brandId: '',
    stockQuantity: '0',
    importPrice: ''
  })
  const pageSize = 10

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [categoryData, brandData] = await Promise.all([
          window.api.category.getAll(),
          window.api.brand.getAll()
        ])
        setCategories(categoryData)
        setBrands(brandData)
      } catch (error) {
        reportAppError(toast, 'SP-LOAD-02', 'Không tải được dữ liệu danh mục sản phẩm', error)
      }
    }

    void loadLookups()
  }, [toast])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, categoryId])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await window.api.product.getList({
        search: debouncedSearch || undefined,
        categoryId: categoryId || undefined,
        page,
        pageSize
      })

      setProducts(res.items)
      setTotal(res.total)
    } catch (error) {
      setProducts([])
      setTotal(0)
      reportAppError(toast, 'SP-LOAD-01', 'Không tải được danh sách sản phẩm', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProducts()
  }, [debouncedSearch, categoryId, page])

  useEffect(() => {
    if (!newProduct.categoryId && categories.length > 0) {
      setNewProduct((prev) => ({ ...prev, categoryId: categories[0].id }))
    }
  }, [categories])

  useEffect(() => {
    if (!newProduct.brandId && brands.length > 0) {
      setNewProduct((prev) => ({ ...prev, brandId: brands[0].id }))
    }
  }, [brands])

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories])
  const brandMap = useMemo(() => new Map(brands.map((b) => [b.id, b.name])), [brands])

  const data: ProductRow[] = useMemo(
    () =>
      products.map((p) => ({
        ...p,
        categoryName: categoryMap.get(p.categoryId) ?? p.categoryId,
        brandName: brandMap.get(p.brandId) ?? p.brandId
      })),
    [products, categoryMap, brandMap]
  )

  // Optional: Modal states
  // const [isModalOpen, setIsModalOpen] = useState(false)
  // const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const columns: ColumnDef<ProductRow>[] = [
    {
      key: 'model',
      header: 'Model',
      cell: (p) => <span className="font-medium text-gray-900">{p.model}</span>
    },
    {
      key: 'name',
      header: 'Tên sản phẩm',
      cell: (p) => <span className="text-gray-600">{p.name}</span>
    },
    {
      key: 'category',
      header: 'Danh mục',
      cell: (p) => <Badge variant="secondary">{p.categoryName}</Badge>
    },
    {
      key: 'brand',
      header: 'Hãng',
      cell: (p) => <span className="text-gray-600">{p.brandName}</span>
    },
    {
      key: 'price',
      header: 'Giá nhập',
      align: 'right',
      cell: (p) => (
        <span className="text-gray-900 font-medium">{formatCurrencyVnd(p.importPrice)}</span>
      )
    },
    {
      key: 'stock',
      header: 'Tồn kho',
      align: 'right',
      cell: (p) => (
        <Badge
          variant={
            p.stockQuantity > 10 ? 'success' : p.stockQuantity > 0 ? 'default' : 'destructive'
          }
        >
          {p.stockQuantity} {p.unit ?? '-'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '50px',
      cell: () => (
        <button className="text-gray-400 hover:text-gray-900 p-1">
          <MoreVertical size={16} />
        </button>
      )
    }
  ]

  const canSaveProduct =
    newProduct.model.trim() &&
    newProduct.name.trim() &&
    newProduct.categoryId &&
    newProduct.brandId &&
    Number(newProduct.stockQuantity) >= 0 &&
    (newProduct.importPrice.trim() === '' ||
      (Number(newProduct.importPrice) >= 0 && Number(newProduct.importPrice) <= MAX_MONEY))

  const handleCreateProduct = async () => {
    if (!canSaveProduct) return

    try {
      await window.api.product.create({
        model: newProduct.model.trim(),
        name: newProduct.name.trim(),
        unit: newProduct.unit.trim() || undefined,
        categoryId: newProduct.categoryId,
        brandId: newProduct.brandId,
        stockQuantity: Number(newProduct.stockQuantity) || 0,
        importPrice: newProduct.importPrice.trim() === '' ? null : Number(newProduct.importPrice)
      })

      toast.success('Thêm sản phẩm thành công')
      setIsModalOpen(false)
      setNewProduct({
        model: '',
        name: '',
        unit: '',
        categoryId: categories[0]?.id ?? '',
        brandId: brands[0]?.id ?? '',
        stockQuantity: '0',
        importPrice: ''
      })
      await loadProducts()
    } catch (error) {
      reportAppError(toast, 'SP-CREATE-01', 'Không thêm được sản phẩm', error)
    }
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý danh mục hàng hóa và số lượng tồn kho.
          </p>
        </div>
        <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
          Thêm sản phẩm
        </Button>
      </div>

      <div className="flex flex-col flex-1 min-h-0 drop-shadow-sm">
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm theo model hoặc tên..."
          actions={
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="border border-gray-300 rounded-md text-sm px-3 py-2 bg-white text-gray-700 min-w-[200px]"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          }
        />
        <DataTable
          data={data}
          columns={columns}
          loading={loading}
          emptyStateTitle="Chưa có sản phẩm"
          emptyStateDescription="Hãy thêm sản phẩm mới hoặc thay đổi bộ lọc tìm kiếm."
          keyExtractor={(item) => item.id}
          pagination={{
            page,
            pageSize,
            total,
            onPageChange: setPage
          }}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Thêm sản phẩm"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => void handleCreateProduct()} disabled={!canSaveProduct}>
              Lưu lại
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            placeholder="Model (VD: SS3100XH)"
            value={newProduct.model}
            onChange={(e) => setNewProduct((p) => ({ ...p, model: e.target.value }))}
          />
          <Input
            placeholder="Tên sản phẩm"
            value={newProduct.name}
            onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            placeholder="Đơn vị (tùy chọn)"
            value={newProduct.unit}
            onChange={(e) => setNewProduct((p) => ({ ...p, unit: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              value={newProduct.categoryId}
              onChange={(e) => setNewProduct((p) => ({ ...p, categoryId: e.target.value }))}
              className="h-9 rounded-md border border-gray-300 px-3 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={newProduct.brandId}
              onChange={(e) => setNewProduct((p) => ({ ...p, brandId: e.target.value }))}
              className="h-9 rounded-md border border-gray-300 px-3 text-sm"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              min={0}
              placeholder="Tồn kho ban đầu"
              value={newProduct.stockQuantity}
              onChange={(e) => setNewProduct((p) => ({ ...p, stockQuantity: e.target.value }))}
            />
            <Input
              type="number"
              min={0}
              max={MAX_MONEY}
              placeholder="Đơn giá nhập (VNĐ) - để trống nếu chưa có"
              value={newProduct.importPrice}
              onChange={(e) => setNewProduct((p) => ({ ...p, importPrice: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
