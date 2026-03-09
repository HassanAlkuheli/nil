# Nil Protocol — System Components

## Smart Contracts Layer

### NilStETH
- **Type:** ERC-20 (OpenZeppelin) + Ownable
- **Purpose:** Represents staked ETH with a time-based yield mechanism
- **Key state:** `minter`, `deployTime`, `lastRebaseTime`
- **Yield model:** `DAILY_YIELD = 11` / `YIELD_PRECISION = 100000` → ~0.011%/day ≈ 4% APY
- `getExchangeRate()` — increases linearly from 1e18 based on days since deployment
- `rebase()` — mints additional supply to simulate yield accrual
- `setMinter()` — one-time assignment, restricts minting to NilLido only

### NilLido
- **Type:** Staking gateway
- **Purpose:** Accepts ETH deposits and mints stETH to the caller
- **Key state:** `stETH` (NilStETH address), `totalStaked`
- `submit(referral)` — payable, mints stETH 1:1 at day 0, stores ETH
- `receive()` — accepts raw ETH transfers

### NilToken
- **Type:** ERC-20 (OpenZeppelin) + Ownable
- **Purpose:** Protocol's synthetic stablecoin (1 NIL ≈ $1)
- **Key state:** `vault` (authorized minter/burner)
- `setVault()` — one-time binding, cannot be changed after set
- `mint()` / `burn()` — restricted to vault contract only

### NilVault
- **Type:** Core protocol contract (ReentrancyGuard + Ownable)
- **Purpose:** Manages deposits, collateral, debt, and redemptions
- **Key state:** `collateral`, `debt`, `depositedETH` (per user), `totalETHLocked`, `totalStETHHeld`, `totalNILMinted`, `totalUsers`
- `deposit()` — routes ETH → NilLido → stores stETH → mints NIL at `stETH * 100 / 150`
- `redeem(nilAmount)` — burns NIL → returns `nilAmount * 150 / 100` stETH to user
- `getPosition(user)` — returns (collateral, debt, depositedETH)
- `getStats()` — returns (totalETHLocked, totalNILMinted, totalUsers, totalStETHHeld)
- `getStETHValue(user)` — collateral valued at current exchange rate
- **Collateral ratio:** 150% enforced at mint time

## Backend Layer

### Axum HTTP Server (`main.rs`)
- Binds to `0.0.0.0:3001`, serves REST API with CORS
- Initializes SQLite pool, runs migrations, starts event listener in background task

### Event Listener (`listener/events.rs`)
- Polls Arbitrum Sepolia every ~12s for `Deposited` and `Redeemed` events
- Tracks `last_processed_block` in SQLite to replay missed events on restart
- Parses 4-param `Deposited(user, ethAmount, stEthReceived, nilAmount)`
- Parses 3-param `Redeemed(user, nilAmount, stEthReturned)`
- Writes to `transactions` table with `ON CONFLICT IGNORE` for idempotency
- Updates aggregate `stats` after each batch

### Database (`db/mod.rs`)
- SQLite via SQLx with compile-time–checked queries
- **Tables:** `transactions` (tx_hash PK, user, type, eth_amount, nil_amount, steth_amount, block, timestamp), `stats` (singleton row), `meta` (last_processed_block)
- **Migrations:** `001_init.sql` (base schema), `002_add_steth.sql` (stETH columns)

### Routes
| Route | Handler | Description |
|-------|---------|-------------|
| `GET /api/stats` | `stats.rs` | Returns protocol stats + fetches live ETH price from CoinGecko + calculates stETH APY |
| `GET /api/position/:address` | `stats.rs` | Reads on-chain position via JSON-RPC, adds yield calculations |
| `GET /api/history/:address` | `history.rs` | Returns paginated transaction history from SQLite |

## Frontend Layer

### Pages
- **Home** — Hero section with 3D Spline background, protocol stats bar, "How It Works" steps, "Why Arbitrum" section
- **Vault** — Deposit and Redeem forms side-by-side, live position card with yield display
- **Dashboard** — Full position breakdown, yield earned, transaction history table, protocol-wide stats

### Hooks
- `usePosition()` — reads `getPosition`, `getStETHValue`, `getExchangeRate`, token balances; auto-refetches on new blocks; calculates health ratio and yield
- `useVault()` — `deposit()` via writeContract, `redeem()` via approve + writeContract two-step
- `usePrice()` — fetches ETH/USD from CoinGecko, caches with 60s TTL

### Config
- `wagmi.js` — Arbitrum Sepolia chain definition, Alchemy transport, MetaMask connector
- `contracts.js` — exports addresses from env vars + ABI JSON imports for all 4 contracts

### Design System
- Monochrome palette: `#050507` / `#e4e4e7` / `#52525b`
- Inter font, `font-mono` for numbers and addresses
- Spline 3D animated background
- Custom Tailwind v4 component classes via `@layer components`
