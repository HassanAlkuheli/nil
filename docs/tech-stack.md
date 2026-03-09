# Nil Protocol — Tech Stack

## Layer Breakdown

### Smart Contracts

| Technology | Version | Role |
|-----------|---------|------|
| Solidity | 0.8.28 | Contract language |
| Hardhat | 2.28.6 | Build, test, deploy framework |
| OpenZeppelin Contracts | 5.6.1 | ERC-20, Ownable, ReentrancyGuard |
| ethers.js | 6.x (via Hardhat) | Deployment scripts + test interactions |
| Chai + Mocha | — | 20 unit tests |

**Config:** EVM target `paris`, optimizer 200 runs, dotenv for environment secrets.

**Why Hardhat:** Industry standard for Solidity development — robust testing, built-in gas reporting, artifact management, and seamless Arbiscan verification.

**Why OpenZeppelin:** Battle-tested implementations of ERC-20, access control, and reentrancy guards. No reason to rewrite audited primitives.

### Backend

| Technology | Version | Role |
|-----------|---------|------|
| Rust | 1.75+ | Systems language |
| Axum | 0.8 | Async HTTP framework |
| SQLx | 0.8 | Async SQLite driver with compile-time query checking |
| Alloy | 1.7 | Ethereum JSON-RPC + ABI decoding |
| Tokio | 1.x | Async runtime |
| Tower-HTTP | 0.6 | CORS middleware |
| Serde | 1.x | JSON serialization |
| SQLite | — | Embedded database |

**Why Rust:** Zero-cost abstractions, memory safety without GC, and excellent async I/O via Tokio. Ideal for a long-running event listener that must be reliable.

**Why Axum:** Built on Tokio + Tower — composable middleware, type-safe extractors, minimal boilerplate. Chosen over Actix for simpler architecture.

**Why SQLite:** Zero-config embedded database — perfect for a single-server indexer. No external dependencies. SQLx provides compile-time query verification.

**Why Alloy:** Modern Rust Ethereum library (successor to ethers-rs). Native ABI decoding, typed providers, and first-class support for Arbitrum.

### Frontend

| Technology | Version | Role |
|-----------|---------|------|
| React | 19.2.4 | UI framework |
| Vite | 7.3.1 | Build tool + dev server |
| wagmi | 3.5.0 | React hooks for Ethereum |
| viem | 2.47.0 | TypeScript Ethereum library (wagmi's transport) |
| @tanstack/react-query | 5.90.21 | Async state management + caching |
| TailwindCSS | 4.2.1 | Utility-first CSS (CSS-first config via @tailwindcss/vite) |
| React Router | 7.x | Client-side routing |
| Axios | 1.x | HTTP client for backend API |

**Why wagmi + viem:** Type-safe, React-native hooks for wallet connection, contract reads/writes, and balance queries. Auto-refetch on new blocks via react-query integration.

**Why Tailwind v4:** CSS-first configuration — no `tailwind.config.js`. Custom design tokens defined directly in CSS via `@theme`. Faster builds via native Vite plugin.

**Why Vite:** Sub-second HMR, native ESM dev server, optimized Rollup production builds. Orders of magnitude faster than webpack for DeFi frontends.

### Network

| Property | Value |
|----------|-------|
| Network | Arbitrum Sepolia (testnet) |
| Chain ID | 421614 |
| L1 Security | Ethereum Sepolia |
| Block time | ~0.25s |
| Gas cost | ~$0.02/tx |
| RPC Provider | Alchemy |

**Why Arbitrum:** Ethereum L2 with full EVM compatibility, inherits Ethereum security via fraud proofs, near-instant confirmations, and minimal gas costs. Sepolia testnet mirrors mainnet behavior for development.
