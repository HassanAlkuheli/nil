# Nil Protocol — Architecture

## Overview

Nil is a collateral vault protocol on Arbitrum Sepolia with **Lido-style yield integration**. Users lock ETH which is routed through a staking contract, receive stETH as collateral, and mint NIL tokens at a 150% collateralization ratio. Collateral earns ~4% APY via the stETH exchange rate. Redeeming NIL returns stETH (not raw ETH).

```
┌─────────────┐      ┌──────────────┐     ┌──────────────┐
│   React UI  │────▶│  Rust / Axum │────▶│   SQLite DB  │
│  (Vite)     │◀────│  Backend     │◀────│   nil.db     │
└──────┬──────┘      └──────┬───────┘     └──────────────┘
       │                   │
       │   JSON-RPC / WS   │   JSON-RPC (polling)
       ▼                   ▼
┌──────────────────────────────────────────────────────┐
│               Arbitrum Sepolia (L2)                  │
│  ┌───────────┐    ┌──────────┐    ┌──────────┐      │
│  │ NilLido   │───▶│NilStETH  │    │ NilToken │      │
│  │(staking)  │    │ (ERC-20) │    │ (ERC-20) │      │
│  └─────▲─────┘    └────▲─────┘    └────▲─────┘      │
│        │               │               │            │
│  ┌─────┴───────────────┴───────────────┴─────┐      │
│  │              NilVault                      │      │
│  │  deposit() → Lido → stETH collateral      │      │
│  │  redeem()  → returns stETH to user        │      │
│  └────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

## Components

### 1. Smart Contracts (Solidity 0.8.28)

| Contract   | Purpose                                            |
|------------|----------------------------------------------------|
| NilStETH   | ERC-20 "stETH" with time-based exchange rate (~4% APY) |
| NilLido    | Staking: accepts ETH, mints stETH at current rate |
| NilToken   | ERC-20 with vault-only mint/burn                   |
| NilVault   | Routes ETH through Lido, holds stETH, mints NIL   |

**Lido Yield System:**
- `NilStETH.getExchangeRate()` — returns `1e18 + (daysSinceDeployment * 11 * 1e18 / 100000)`, ~0.011%/day ≈ 4%/year
- `NilLido.submit{value: eth}()` — accepts ETH, mints stETH to caller
- `NilStETH.rebase()` — can be called to mint additional supply based on elapsed time

**Key mechanics:**
- `deposit()` → sends ETH to NilLido → receives stETH → mints `(stEthReceived * 100) / 150` NIL
- `redeem(nilAmount)` → burns NIL → transfers `(nilAmount * 150) / 100` stETH to sender
- `getPosition(user)` → returns `(collateral, debt, depositedETH)` — 3 values
- `getStETHValue(user)` → returns current value of collateral at latest exchange rate
- `getStats()` → returns `(totalETHLocked, totalNILMinted, totalUsers, totalStETHHeld)` — 4 values
- One-time `setVault()` links token to vault (immutable after set)
- `ReentrancyGuard` on all state-changing functions
- `Ownable` for admin controls

**Collateral ratio:** 150% — depositing 1.5 ETH (→ 1.5 stETH at day 0) mints 1.0 NIL.

### 2. Rust Backend (Axum 0.8)

```
backend/
├── src/
│   ├── main.rs           # Entry point, router, CORS
│   ├── models/mod.rs     # Structs: Transaction, Stats, Position, etc.
│   ├── db/
│   │   ├── mod.rs        # SQLite queries (SQLx)
│   │   └── migrations/
│   │       ├── 001_init.sql       # Base tables
│   │       └── 002_add_steth.sql  # stETH columns
│   ├── routes/
│   │   ├── mod.rs        # Route module
│   │   ├── history.rs    # GET /api/history/:address
│   │   └── stats.rs      # GET /api/stats, /api/position/:address
│   └── listener/
│       ├── mod.rs        # Listener module
│       └── events.rs     # On-chain event poller (4-param Deposited, 2-param Redeemed)
```

**Event Listener:**
- Polls `Deposited(user, ethAmount, stEthReceived, nilAmount)` and `Redeemed(user, nilAmount, stEthReturned)` events
- Replays missed events from last processed block on startup
- Saves transactions (including steth_amount) to SQLite with `ON CONFLICT IGNORE`
- Updates aggregate stats (including total_steth_held) after each batch

**API Endpoints:**

| Method | Path                     | Description                                        |
|--------|--------------------------|----------------------------------------------------|
| GET    | `/api/stats`             | Protocol stats + stETH held + APY + live ETH price |
| GET    | `/api/position/:address` | On-chain position with yield info                  |
| GET    | `/api/history/:address`  | Transaction history with stETH amounts             |

### 3. React Frontend (Vite + wagmi v2 + TailwindCSS v4)

```
frontend/src/
├── config/
│   ├── wagmi.js          # Chain + connector config
│   ├── contracts.js      # ABI + address exports (4 contracts)
│   ├── NilVault.json     # Vault ABI
│   ├── NilToken.json     # Token ABI
│   ├── NilStETH.json     # stETH ABI
│   └── NilLido.json      # Lido ABI
├── hooks/
│   ├── usePrice.js       # CoinGecko ETH price
│   ├── usePosition.js    # On-chain position + stETH value + yield
│   └── useVault.js       # Deposit/redeem transactions
├── components/
│   ├── layout/           # Navbar, Footer
│   ├── wallet/           # ConnectButton
│   ├── vault/            # PositionCard (with yield), DepositForm, RedeemForm
│   └── ui/               # Skeleton, Badge, StatCard, BackgroundScene
├── pages/
│   ├── Home.jsx          # Hero + stats + How It Works
│   ├── Vault.jsx         # Deposit/Redeem interface
│   └── Dashboard.jsx     # Position + yield + history + stats
├── styles/
│   └── index.css         # Tailwind directives + custom classes
├── App.jsx               # Providers + Router
└── main.jsx              # Entry point
```

**Design system:**
- Monochrome palette: `#050507` (black), `#e4e4e7` (white), `#52525b` (grey)
- Inter font, `font-mono` for numbers/addresses
- Spline 3D background (iframe embed)
- Custom component classes via `@layer components`

## Data Flow

### Deposit Flow
```
User clicks "Deposit" with ETH amount
  → useVault.deposit() calls writeContract
    → NilVault.deposit{value: ethAmount}()
      → NilVault calls NilLido.submit{value: ethAmount}()
        → NilLido mints stETH to NilVault based on exchange rate
      → NilVault stores stETH as collateral
      → NilVault mints NIL via NilToken.mint()
      → Emits Deposited(user, ethAmount, stEthReceived, nilAmount)
  → Backend event poller picks up Deposited event
    → Saves to SQLite transactions table (with steth_amount)
    → Updates aggregate stats (including total_steth_held)
  → Frontend refetches position + stETH value on tx confirmation
```

### Redeem Flow
```
User clicks "Redeem" with NIL amount
  → Step 1: useVault.redeem() calls NilToken.approve(vault, amount)
  → Step 2: After approve confirms, calls NilVault.redeem(nilAmount)
    → NilVault burns NIL via NilToken.burnFrom()
    → Transfers stETH to user (not raw ETH)
    → Emits Redeemed(user, nilAmount, stEthReturned)
  → Backend event poller picks up Redeemed event
    → Saves to SQLite, updates stats
```

### Yield Accrual
```
Over time, NilStETH.getExchangeRate() increases (~0.011%/day)
  → getStETHValue(user) = collateral * exchangeRate / 1e18
  → Yield earned = stETHValue - collateral (in ETH terms)
  → Frontend displays yield in PositionCard
  → ~4% APY shown in Dashboard stats
```

## Security Considerations

1. **Reentrancy protection** — `ReentrancyGuard` on deposit/redeem
2. **Checks-effects-interactions** — State modified before external calls
3. **One-time vault binding** — `setVault()` can only be called once
4. **Vault-only minting** — Only the vault contract can mint/burn NIL
5. **Minter restriction** — Only NilLido can mint stETH (onlyMinter modifier)
6. **Input validation** — Zero-amount checks, balance checks, collateral sufficiency
7. **CORS** — Backend restricts origins in production

## Environment Variables

### contracts/.env
```
ARBISCAN_API_KEY=         # For contract verification
ALCHEMY_URL=              # Arbitrum Sepolia RPC
Arbitrum_Sepolia_private_KEY=  # Deployer wallet
```

### backend/.env
```
ALCHEMY_URL=              # WSS endpoint for event polling
DATABASE_URL=sqlite:nil.db
PORT=3001
VAULT_ADDRESS=            # Deployed vault address
NIL_TOKEN_ADDRESS=        # Deployed token address
STETH_ADDRESS=            # Deployed NilStETH address
```

### frontend/.env
```
VITE_ALCHEMY_URL=         # HTTP endpoint
VITE_VAULT_ADDRESS=       # Deployed vault address
VITE_TOKEN_ADDRESS=       # Deployed token address
VITE_STETH_ADDRESS=       # Deployed NilStETH address
VITE_LIDO_ADDRESS=        # Deployed NilLido address
VITE_BACKEND_URL=http://localhost:3001
```
