# ∅ Nil Protocol

**Everything starts from nil.**

A full-stack DeFi collateral vault protocol on Arbitrum Sepolia with Lido-style stETH yield integration. Deposit ETH, earn staking yield via stETH, mint NIL stablecoins at 150% collateralization, and redeem anytime.

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   React UI  │────▶│  Rust / Axum │────▶│   SQLite DB  │
│  (Vite)     │◀────│  Backend     │◀────│   nil.db     │
└──────┬──────┘     └──────┬───────┘     └──────────────┘
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

## Deployed Contracts (Arbitrum Sepolia)

| Contract  | Address |
|-----------|---------|
| NilStETH  | `0xEf5b5D6Ec354C4c4E1394C6827688f34c0b721Fe` |
| NilLido   | `0xcE570FA7C5f5AeaD8239ee3a65179D8E6d3424fd` |
| NilToken  | `0xa2D009B832CdD62d3603F47eF7fB7a735412884D` |
| NilVault  | `0x30d3cF643cB5db836FfCCF5999CBDe0Ed1b4DfD4` |

> View on [Arbiscan](https://sepolia.arbiscan.io/address/0x30d3cF643cB5db836FfCCF5999CBDe0Ed1b4DfD4)

## Tech Stack

| Layer      | Technology                                        |
|------------|---------------------------------------------------|
| Contracts  | Solidity 0.8.28, Hardhat 2.28, OpenZeppelin 5    |
| Backend    | Rust, Axum 0.8, SQLx 0.8 (SQLite), Alloy 1.7    |
| Frontend   | React 19, Vite 7, wagmi 3, viem 2, TailwindCSS 4 |
| Network    | Arbitrum Sepolia (Chain ID 421614)                |

## How It Works

1. **Deposit** — User sends ETH → routed through NilLido staking → receives stETH collateral → NIL minted at 150% ratio
2. **Yield** — stETH exchange rate grows ~4% APY → collateral value increases over time
3. **Redeem** — Burn NIL → receive stETH back (including accrued yield)

## Project Structure

```
nil/
├── contracts/              # Solidity + Hardhat (4 contracts, 20 tests)
│   ├── contracts/
│   │   ├── staking/        # NilStETH.sol, NilLido.sol
│   │   ├── NilVault.sol    # Core vault with Lido integration
│   │   └── NilToken.sol    # ERC-20 stablecoin
│   ├── scripts/deploy.js   # Deploys all 4 contracts, writes ABIs
│   └── test/               # 20 comprehensive tests
├── backend/                # Rust + Axum API + event listener
│   └── src/
│       ├── main.rs         # Entry, router, CORS
│       ├── routes/         # stats, position, history
│       ├── db/             # SQLite + migrations
│       └── listener/       # On-chain event poller
├── frontend/               # React + Vite + wagmi
│   └── src/
│       ├── pages/          # Home, Vault, Dashboard
│       ├── components/     # UI + vault + wallet + layout
│       ├── hooks/          # usePosition, useVault, usePrice
│       └── config/         # ABIs + contract addresses
└── docs/                   # Architecture & documentation
```

## Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **Rust** ≥ 1.75
- **MetaMask** with Arbitrum Sepolia ETH

### 1. Deploy Contracts

```bash
cd contracts
cp .env.example .env
# Fill in: ALCHEMY_URL, Arbitrum_Sepolia_private_KEY
npm install
npx hardhat test                                          # 20 tests
npx hardhat run scripts/deploy.js --network arbitrumSepolia
```

Deploy script automatically writes addresses + ABIs to frontend and backend.

### 2. Start Backend

```bash
cd backend
# Create .env with: ALCHEMY_URL (WSS), VAULT_ADDRESS, NIL_TOKEN_ADDRESS, STETH_ADDRESS
cargo run --release
```

Runs on `http://localhost:3001`.

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`.

## API Endpoints

| Method | Path                     | Description                                        |
|--------|--------------------------|----------------------------------------------------|
| GET    | `/api/stats`             | Protocol stats + stETH held + APY + live ETH price |
| GET    | `/api/position/:address` | On-chain position with yield info                  |
| GET    | `/api/history/:address`  | Transaction history with stETH amounts             |

## Getting Testnet ETH

- [Arbitrum Faucet](https://faucet.arbitrum.io/)
- [Alchemy Faucet](https://www.alchemy.com/faucets/arbitrum-sepolia)
- [Bridge from Sepolia](https://bridge.arbitrum.io/)

## Documentation

- [Architecture](docs/architecture.md) — Full technical architecture
- [Architecture Diagram](docs/architecture-diagram.md) — Mermaid system diagram
- [System Components](docs/system-components.md) — Component breakdown
- [Tech Stack](docs/tech-stack.md) — Technology choices & rationale
- [Security](docs/security.md) — Security considerations

---

<p align="center">
  <strong>∅</strong><br/>
  <em>Named after the Go nil pointer. Represents nothing.<br/>
  The smart contract creates value from nothing.</em>
</p>
