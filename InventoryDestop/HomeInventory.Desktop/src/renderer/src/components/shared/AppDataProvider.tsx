import { createContext, use, useCallback, useEffect, useState } from 'react'
import type { CategoryResponseDto, BrandResponseDto, SupplierResponseDto } from '@shared/types/dtos'

interface AppData {
  categories: CategoryResponseDto[]
  brands: BrandResponseDto[]
  suppliers: SupplierResponseDto[]
  loading: boolean
  reload: () => void
}

const AppDataContext = createContext<AppData | null>(null)

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<CategoryResponseDto[]>([])
  const [brands, setBrands] = useState<BrandResponseDto[]>([])
  const [suppliers, setSuppliers] = useState<SupplierResponseDto[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cats, brnds, supps] = await Promise.all([
        window.api.category.getAll(),
        window.api.brand.getAll(),
        window.api.supplier.getAll()
      ])
      setCategories(cats)
      setBrands(brnds)
      setSuppliers(supps)
    } catch {
      // Non-critical - pages will fall back to their own fetches
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <AppDataContext.Provider value={{ categories, brands, suppliers, loading, reload: load }}>
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData(): AppData {
  const ctx = use(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider')
  return ctx
}
