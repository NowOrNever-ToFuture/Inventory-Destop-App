-- Migration 004: Settings table + attachment path for purchase orders

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Default settings
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('storeName', 'HomeInventory');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('dataPath', '');

-- Add attachment_path column to purchase_orders
ALTER TABLE purchase_orders ADD COLUMN attachment_path TEXT;
