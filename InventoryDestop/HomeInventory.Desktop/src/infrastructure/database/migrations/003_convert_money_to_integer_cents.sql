-- Migration: Convert money columns from REAL to INTEGER (cents = value * 100)
-- This avoids floating-point precision issues with JavaScript numbers.

-- products.import_price: REAL → INTEGER
UPDATE products SET import_price = CAST(ROUND(import_price * 100) AS INTEGER) WHERE import_price IS NOT NULL;

-- purchase_order_items.unit_cost, line_total: REAL → INTEGER
UPDATE purchase_order_items SET unit_cost = CAST(ROUND(unit_cost * 100) AS INTEGER) WHERE unit_cost IS NOT NULL;
UPDATE purchase_order_items SET line_total = CAST(ROUND(line_total * 100) AS INTEGER) WHERE line_total IS NOT NULL;

-- purchase_orders.total_amount: REAL → INTEGER
UPDATE purchase_orders SET total_amount = CAST(ROUND(total_amount * 100) AS INTEGER) WHERE total_amount IS NOT NULL;
