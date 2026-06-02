import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus, MoreVertical } from 'lucide-react'
import { DataTable, ColumnDef } from '@renderer/components/shared/DataTable'
import { FilterBar } from '@renderer/components/shared/FilterBar'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { Modal } from '@renderer/components/ui/modal'
import { Input } from '@renderer/components/ui/input'
import { useToast } from '@renderer/components/shared/ToastProvider'
import { useAppData } from '@renderer/components/shared/AppDataProvider'
import { reportAppError } from '@renderer/lib/app-error'
import { formatCurrencyVnd } from '@renderer/lib/format'
import type { ProductResponseDto } from '@shared/types/dtos'

interface ProductRow extends ProductResponseDto {
  categoryName: string
  brandName: string
}

export function Products() {
  const toast = useToast()
  const { categories, brands } = useAppData()
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<ProductResponseDto[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newProduct, setNewProduct] = useState({ model: '', name: '', categoryId: '', brandId: '' })

  const debouncedSearchRef = useRef('')
  const pageSize = 10

  const loadProducts = useCallback(
    async (searchVal: string, catId: string, pg: number) => {
      setLoading(true)
      try {
        const res = await window.api.product.getList({
          search: searchVal || undefined,
          categoryId: catId || undefined,
          page: pg,
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
    },
    [toast, pageSize]
  )

  // Debounce search + reset page + load in one effect
  useEffect(() => {
    const timer = window.setTimeout(() => {
      debouncedSearchRef.current = search.trim()
      setPage(1)
      void loadProducts(debouncedSearchRef.current, categoryId, 1)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [search, categoryId, loadProducts])

  // Load when page changes (not from search/category reset)
  useEffect(() => {
    void loadProducts(debouncedSearchRef.current, categoryId, page)
  }, [page, categoryId, loadProducts])

  // Derive default categoryId/brandId for new product inline
  const effectiveCategoryId = newProduct.categoryId || categories[0]?.id || ''
  const effectiveBrandId = newProduct.brandId || brands[0]?.id || ''

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
          {p.stockQuantity === 0 ? '0' : `${p.stockQuantity}${p.unit ? ` ${p.unit}` : ''}`}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '50px',
      cell: () => (
        <button
          type="button"
          className="text-gray-400 hover:text-gray-900 p-1"
          aria-label="Tùy chọn"
        >
          <MoreVertical size={16} />
        </button>
      )
    }
  ]

  const canSaveProduct =
    newProduct.model.trim() && newProduct.name.trim() && effectiveCategoryId && effectiveBrandId

  const handleCreateProduct = async () => {
    if (!canSaveProduct) return
    try {
      await window.api.product.create({
        model: newProduct.model.trim(),
        name: newProduct.name.trim(),
        categoryId: effectiveCategoryId,
        brandId: effectiveBrandId,
        stockQuantity: 0,
        importPrice: null
      })
      toast.success('Thêm sản phẩm thành công')
      setIsModalOpen(false)
      setNewProduct({ model: '', name: '', categoryId: '', brandId: '' })
      void loadProducts(debouncedSearchRef.current, categoryId, page)
    } catch (error) {
      reportAppError(toast, 'SP-CREATE-01', 'Không thêm được sản phẩm', error)
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full">
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
              aria-label="Lọc theo danh mục"
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
        <div className="flex flex-col gap-3">
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
          <div className="grid grid-cols-2 gap-3">
            <select
              value={effectiveCategoryId}
              onChange={(e) => setNewProduct((p) => ({ ...p, categoryId: e.target.value }))}
              className="h-9 rounded-md border border-gray-300 px-3 text-sm"
              aria-label="Danh mục"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={effectiveBrandId}
              onChange={(e) => setNewProduct((p) => ({ ...p, brandId: e.target.value }))}
              className="h-9 rounded-md border border-gray-300 px-3 text-sm"
              aria-label="Hãng"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
