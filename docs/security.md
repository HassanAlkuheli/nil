# Nil Protocol — Security Considerations

## Smart Contract Security

### Reentrancy Protection
All state-changing functions in NilVault (`deposit`, `redeem`) use OpenZeppelin's `ReentrancyGuard`. This prevents reentrant calls during external interactions with NilLido and NilStETH.

### Checks-Effects-Interactions Pattern
State is updated **before** external calls:
- `deposit()` — updates `collateral`, `debt`, `depositedETH`, totals → then calls `NilLido.submit()` and `NilToken.mint()`
- `redeem()` — updates mappings and totals → then calls `NilToken.burnFrom()` and `stETH.transfer()`

### Access Control

| Function | Restriction | Mechanism |
|----------|-------------|-----------|
| `NilToken.mint()` / `burn()` | Vault only | `require(msg.sender == vault)` |
| `NilToken.setVault()` | Owner, one-time | `require(vault == address(0))` |
| `NilStETH.mint()` / `burn()` | Minter only | `onlyMinter` modifier |
| `NilStETH.setMinter()` | Owner only | `onlyOwner` (OpenZeppelin) |
| `NilStETH.rebase()` | Public | Safe — only mints protocol yield |

### One-Time Bindings
- `NilToken.setVault()` — once the vault is set, it **cannot be changed**. This prevents an admin from redirecting mint authority.
- `NilStETH.setMinter()` — restricted to owner via OpenZeppelin `Ownable`.

### Input Validation
- `deposit()` — reverts if `msg.value == 0`
- `redeem()` — reverts if `nilAmount > debt` (insufficient position)
- `submit()` — reverts if `msg.value == 0`

### Integer Overflow
Solidity 0.8.x has built-in overflow/underflow checks. All arithmetic is safe by default without SafeMath.

## Backend Security

### Environment Secrets
- Private keys, RPC URLs, and API keys stored in `.env` files
- `.gitignore` excludes all `.env` files, `*.db`, `node_modules/`, `target/`, `artifacts/`, `cache/`
- Only `.env.example` with empty placeholders is committed

### Event Listener Idempotency
- Transactions inserted with `ON CONFLICT IGNORE` on `tx_hash` primary key
- Tracks `last_processed_block` in `meta` table — replays from that block on restart
- No duplicate processing even after crashes or restarts

### CORS
- Backend restricts allowed origins via Tower-HTTP CORS middleware
- Only configured frontend origins can access the API

### SQL Injection Prevention
- All database queries use SQLx parameterized queries (compile-time checked)
- No string concatenation in SQL statements

## Frontend Security

### Wallet Interaction
- Uses wagmi/viem for all contract interactions — typed ABIs prevent malformed calldata
- No private keys stored client-side
- Users sign transactions in MetaMask — frontend never handles keys

### Environment Variables
- Contract addresses exposed via `VITE_` env vars (public by design — these are on-chain addresses)
- RPC URL contains API key but is only used client-side for read calls
- No sensitive server secrets in frontend bundle

## Protocol Risk Model

### Collateralization
- 150% ratio enforced at mint time: 1.5 ETH collateral → 1.0 NIL minted
- No liquidation mechanism (testnet design) — users self-manage positions
- Over-collateralization provides buffer against ETH price volatility

### Yield Risk
- stETH exchange rate is deterministic (time-based formula)
- No external oracle dependency — rate calculated on-chain from `block.timestamp`
- `rebase()` is public but only distributes yield according to the formula

### Admin Risk
- Owner can call `setMinter()` on NilStETH (Ownable)
- Vault binding on NilToken is immutable after `setVault()`
- No pause/upgrade mechanism — contracts are immutable once deployed
