# 02 - Domain Model

## Entities

Định nghĩa tại `src/shared/types/entities.ts`:

| Entity | Fields chính |
|---|---|
| `Brand` | id, name, nameNormalized |
| `Category` | id, name, nameNormalized, description? |
| `Supplier` | id, name, nameNormalized, phone?, address?, taxCode? |
| `Product` | id, model, modelNormalized, name, unit?, stockQuantity, importPrice, categoryId, brandId |
| `PurchaseOrder` | id, code, supplierId, orderDate, totalAmount |
| `PurchaseOrderItem` | id, purchaseOrderId, productId, quantity, unitCost, lineTotal |
| `SalesOrder` | id, code, orderDate |
| `SalesOrderItem` | id, salesOrderId, productId, quantity |

## Money Storage

**Tất cả giá trị tiền lưu trong DB dưới dạng INTEGER (cents = value × 100)**

```ts
// src/shared/utils/money.ts
toMoneyInt(displayAmount: number): number   // 100.50 → 10050
fromMoneyInt(storedInt: number): number     // 10050 → 100.50
MONEY_SCALE = 100
```

- **Write**: nhân 100 trước khi INSERT/UPDATE
- **Read**: chia 100 sau khi SELECT
- **Display**: dùng `formatCurrencyVnd(cents)` từ `src/renderer/src/lib/format.ts`

## DTOs

Định nghĩa tại `src/shared/types/dtos/`:

```
product.dto.ts          → ProductRequestDto, ProductResponseDto, ProductGetAllQueryDto, ProductGetAllResponseDto
category.dto.ts         → CategoryRequestDto, CategoryResponseDto
brand.dto.ts            → BrandRequestDto, BrandResponseDto
supplier.dto.ts         → SupplierRequestDto, SupplierResponseDto
purchase-order.dto.ts   → PurchaseOrderRequestDto, PurchaseOrderResponseDto, PurchaseOrderItemRequestDto
sales-order.dto.ts      → SalesOrderRequestDto, SalesOrderResponseDto, SalesOrderItemRequestDto
report.dto.ts           → ImportSummaryDto, TopImportedItemDto, TopSupplierDto, TopSupplierReportRequestDto
warehouse.dto.ts        → WarehouseDto
inventory-transaction.dto.ts → InventoryTransactionDto
```

## IPC Channels

Single source of truth tại `src/shared/contracts/ipc-channels.ts`:

```ts
// Pattern: 'domain:action'
PRODUCT_GET_ALL: 'product:getAll'
PRODUCT_GET_LIST: 'product:getList'
PRODUCT_GET_BY_ID: 'product:getById'
PRODUCT_CREATE: 'product:create'
PRODUCT_UPDATE: 'product:update'
PRODUCT_DELETE: 'product:delete'

CATEGORY_GET_ALL / CREATE / UPDATE / DELETE
BRAND_GET_ALL / CREATE / UPDATE / DELETE
SUPPLIER_GET_ALL / CREATE / UPDATE / DELETE

PURCHASE_ORDER_GET_ALL / GET_BY_ID / CREATE / DELETE
SALES_ORDER_GET_ALL / GET_BY_ID / CREATE / DELETE

REPORT_INVENTORY_SUMMARY / SALES_SUMMARY / IMPORT_SUMMARY
REPORT_SALES_ORDER_MONTHLY / AVAILABLE_YEARS
REPORT_TOP_IMPORTED_ITEMS / TOP_SUPPLIERS

EXPORT_PURCHASE_REPORT / EXPORT_SALES_REPORT
```

## Database Schema

Migrations tại `src/infrastructure/database/migrations/`:

**001_init.sql** - Schema ban đầu:
- `brands`, `categories`, `suppliers`
- `products` (stock_quantity REAL, import_price REAL)
- `purchase_orders`, `purchase_order_items`
- `sales_orders`, `sales_order_items`

**002_add_warehouses_and_inventory_transactions.sql** - Thêm:
- `warehouses`, `inventory_transactions`

**003_convert_money_to_integer_cents.sql** - Convert:
- `import_price`, `unit_cost`, `line_total`, `total_amount` → INTEGER

**Base schema** cũng được hardcode trong `migrate.ts` để tránh crash khi migrations không được copy.

## Window.api Shape

```ts
window.api = {
  product:       { getAll, getList, getById, create, update, delete }
  category:      { getAll, create, update, delete }
  brand:         { getAll, create, update, delete }
  supplier:      { getAll, create, update, delete }
  purchaseOrder: { getAll, getById, create, delete }
  salesOrder:    { getAll, getById, create, delete }
  report:        { getInventorySummary, getSalesSummary, getImportSummary,
                   getSalesOrderMonthly, getAvailableYears,
                   getTopImportedItems, getTopSuppliers }
  export:        { exportPurchaseReport, exportSalesReport }
}
```
