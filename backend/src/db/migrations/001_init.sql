CREATE TABLE IF NOT EXISTS transactions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    tx_type      TEXT NOT NULL,
    address      TEXT NOT NULL,
    eth_amount   TEXT NOT NULL,
    nil_amount   TEXT NOT NULL,
    tx_hash      TEXT NOT NULL UNIQUE,
    block_number INTEGER NOT NULL,
    created_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_address
ON transactions(address);

CREATE INDEX IF NOT EXISTS idx_created_at
ON transactions(created_at DESC);

CREATE TABLE IF NOT EXISTS stats (
    id                 INTEGER PRIMARY KEY CHECK (id = 1),
    total_eth_locked   TEXT NOT NULL DEFAULT '0',
    total_nil_minted   TEXT NOT NULL DEFAULT '0',
    total_users        INTEGER NOT NULL DEFAULT 0,
    last_block         INTEGER NOT NULL DEFAULT 0,
    updated_at         INTEGER NOT NULL
);

INSERT OR IGNORE INTO stats (id, total_eth_locked, total_nil_minted,
total_users, last_block, updated_at)
VALUES (1, '0', '0', 0, 0, 0);
