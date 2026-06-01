-- Migration 002: Add warehouses and inventory_transactions tables
-- Required by WarehouseService and InventoryTransactionService.

CREATE TABLE IF NOT EXISTS warehouses (
  id       TEXT PRIMARY KEY,
  name     TEXT NOT NULL,
  location TEXT
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id               TEXT PRIMARY KEY,
  product_id       TEXT NOT NULL,
  warehouse_id     TEXT NOT NULL,
  type             TEXT NOT NULL CHECK(type IN ('IN', 'OUT')),
  quantity         REAL NOT NULL,
  note             TEXT,
  transaction_date TEXT NOT NULL
);
