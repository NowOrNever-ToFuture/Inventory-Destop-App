import type {
  BrandRepository,
  CategoryRepository,
  ProductRepository,
  PurchaseOrderRepository,
  ReportRepository,
  SalesOrderRepository,
  SupplierRepository
} from '@core/repositories'
import { CreateBrandUseCase } from './brands/CreateBrandUseCase'
import { DeleteBrandUseCase } from './brands/DeleteBrandUseCase'
import { GetAllBrandUseCase } from './brands/GetAllBrandUseCase'
import { GetByIdBrandUseCase } from './brands/GetByIdBrandUseCase'
import { UpdateBrandUseCase } from './brands/UpdateBrandUseCase'
import { CreateCategoryUseCase } from './categories/CreateCategoryUseCase'
import { DeleteCategoryUseCase } from './categories/DeleteCategoryUseCase'
import { GetAllCategoryUseCase } from './categories/GetAllCategoryUseCase'
import { GetByIdCategoryUseCase } from './categories/GetByIdCategoryUseCase'
import { UpdateCategoryUseCase } from './categories/UpdateCategoryUseCase'
import { CreateProductUseCase } from './products/CreateProductUseCase'
import { DeleteProductUseCase } from './products/DeleteProductUseCase'
import { GetAllProductUseCase } from './products/GetAllProductUseCase'
import { GetByIdProductUseCase } from './products/GetByIdProductUseCase'
import { UpdateProductUseCase } from './products/UpdateProductUseCase'
import { CreateSupplierUseCase } from './suppliers/CreateSupplierUseCase'
import { DeleteSupplierUseCase } from './suppliers/DeleteSupplierUseCase'
import { GetAllSupplierUseCase } from './suppliers/GetAllSupplierUseCase'
import { GetByIdSupplierUseCase } from './suppliers/GetByIdSupplierUseCase'
import { UpdateSupplierUseCase } from './suppliers/UpdateSupplierUseCase'
import { CreatePurchaseOrderUseCase } from './purchase-orders/CreatePurchaseOrderUseCase'
import { DeletePurchaseOrderUseCase } from './purchase-orders/DeletePurchaseOrderUseCase'
import { GetAllPurchaseOrderUseCase } from './purchase-orders/GetAllPurchaseOrderUseCase'
import { GetByIdPurchaseOrderUseCase } from './purchase-orders/GetByIdPurchaseOrderUseCase'
import { UpdatePurchaseOrderUseCase } from './purchase-orders/UpdatePurchaseOrderUseCase'
import { CreateSalesOrderUseCase } from './sales-orders/CreateSalesOrderUseCase'
import { DeleteSalesOrderUseCase } from './sales-orders/DeleteSalesOrderUseCase'
import { GetAllSalesOrderUseCase } from './sales-orders/GetAllSalesOrderUseCase'
import { GetByIdSalesOrderUseCase } from './sales-orders/GetByIdSalesOrderUseCase'
import { UpdateSalesOrderUseCase } from './sales-orders/UpdateSalesOrderUseCase'
import { GetAvailableYearsUseCase } from './reports/GetAvailableYearsUseCase'
import { GetImportSummaryUseCase } from './reports/GetImportSummaryUseCase'
import { GetInventorySummaryUseCase } from './reports/GetInventorySummaryUseCase'
import { GetSalesOrderMonthlyUseCase } from './reports/GetSalesOrderMonthlyUseCase'
import { GetSalesSummaryUseCase } from './reports/GetSalesSummaryUseCase'
import { GetTopImportedItemsUseCase } from './reports/GetTopImportedItemsUseCase'

class CrudUseCases {
  protected constructor(
    private readonly getAllUseCase: { execute: (...args: any[]) => Promise<any> },
    private readonly getByIdUseCase: { execute: (...args: any[]) => Promise<any> },
    private readonly createUseCase: { execute: (...args: any[]) => Promise<any> },
    private readonly updateUseCase: { execute: (...args: any[]) => Promise<any> },
    private readonly deleteUseCase: { execute: (...args: any[]) => Promise<any> }
  ) {}

  getAllAsync(...args: any[]): Promise<any> {
    return this.getAllUseCase.execute(...args)
  }

  getByIdAsync(...args: any[]): Promise<any> {
    return this.getByIdUseCase.execute(...args)
  }

  createAsync(...args: any[]): Promise<any> {
    return this.createUseCase.execute(...args)
  }

  updateAsync(...args: any[]): Promise<any> {
    return this.updateUseCase.execute(...args)
  }

  deleteAsync(...args: any[]): Promise<any> {
    return this.deleteUseCase.execute(...args)
  }
}

export class BrandUseCases extends CrudUseCases {
  constructor(repository: BrandRepository) {
    super(
      new GetAllBrandUseCase(repository),
      new GetByIdBrandUseCase(repository),
      new CreateBrandUseCase(repository),
      new UpdateBrandUseCase(repository),
      new DeleteBrandUseCase(repository)
    )
  }
}

export class CategoryUseCases extends CrudUseCases {
  constructor(repository: CategoryRepository) {
    super(
      new GetAllCategoryUseCase(repository),
      new GetByIdCategoryUseCase(repository),
      new CreateCategoryUseCase(repository),
      new UpdateCategoryUseCase(repository),
      new DeleteCategoryUseCase(repository)
    )
  }
}

export class ProductUseCases extends CrudUseCases {
  constructor(repository: ProductRepository) {
    super(
      new GetAllProductUseCase(repository),
      new GetByIdProductUseCase(repository),
      new CreateProductUseCase(repository),
      new UpdateProductUseCase(repository),
      new DeleteProductUseCase(repository)
    )
  }
}

export class SupplierUseCases extends CrudUseCases {
  constructor(repository: SupplierRepository) {
    super(
      new GetAllSupplierUseCase(repository),
      new GetByIdSupplierUseCase(repository),
      new CreateSupplierUseCase(repository),
      new UpdateSupplierUseCase(repository),
      new DeleteSupplierUseCase(repository)
    )
  }
}

export class PurchaseOrderUseCases extends CrudUseCases {
  constructor(repository: PurchaseOrderRepository) {
    super(
      new GetAllPurchaseOrderUseCase(repository),
      new GetByIdPurchaseOrderUseCase(repository),
      new CreatePurchaseOrderUseCase(repository),
      new UpdatePurchaseOrderUseCase(repository),
      new DeletePurchaseOrderUseCase(repository)
    )
  }
}

export class SalesOrderUseCases extends CrudUseCases {
  constructor(repository: SalesOrderRepository) {
    super(
      new GetAllSalesOrderUseCase(repository),
      new GetByIdSalesOrderUseCase(repository),
      new CreateSalesOrderUseCase(repository),
      new UpdateSalesOrderUseCase(repository),
      new DeleteSalesOrderUseCase(repository)
    )
  }
}

export class ReportUseCases {
  private readonly repository: ReportRepository
  private readonly getInventorySummaryUseCase: GetInventorySummaryUseCase
  private readonly getSalesSummaryUseCase: GetSalesSummaryUseCase
  private readonly getImportSummaryUseCase: GetImportSummaryUseCase
  private readonly getSalesOrderMonthlyUseCase: GetSalesOrderMonthlyUseCase
  private readonly getAvailableYearsUseCase: GetAvailableYearsUseCase
  private readonly getTopImportedItemsUseCase: GetTopImportedItemsUseCase

  constructor(repository: ReportRepository) {
    this.repository = repository
    this.getInventorySummaryUseCase = new GetInventorySummaryUseCase(repository)
    this.getSalesSummaryUseCase = new GetSalesSummaryUseCase(repository)
    this.getImportSummaryUseCase = new GetImportSummaryUseCase(repository)
    this.getSalesOrderMonthlyUseCase = new GetSalesOrderMonthlyUseCase(repository)
    this.getAvailableYearsUseCase = new GetAvailableYearsUseCase(repository)
    this.getTopImportedItemsUseCase = new GetTopImportedItemsUseCase(repository)
  }

  getInventorySummaryAsync(...args: any[]): Promise<any> {
    return this.getInventorySummaryUseCase.execute(...args)
  }

  getSalesSummaryAsync(...args: any[]): Promise<any> {
    return this.getSalesSummaryUseCase.execute(...args)
  }

  getImportSummaryAsync(...args: any[]): Promise<any> {
    return this.getImportSummaryUseCase.execute(...args)
  }

  getSalesOrderMonthlyAsync(...args: any[]): Promise<any> {
    return this.getSalesOrderMonthlyUseCase.execute(...args)
  }

  getAvailableYearsAsync(...args: any[]): Promise<any> {
    return this.getAvailableYearsUseCase.execute(...args)
  }

  getTopImportedItemsAsync(...args: any[]): Promise<any> {
    return this.getTopImportedItemsUseCase.execute(...args)
  }

  getTopSuppliersAsync(...args: any[]): Promise<any> {
    return this.repository.getTopSuppliersAsync(...args)
  }
}

export * from './brands'
export * from './categories'
export * from './products'
export * from './suppliers'
export * from './purchase-orders'
export * from './sales-orders'
export * from './reports'
