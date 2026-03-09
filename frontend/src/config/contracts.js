import NilVaultABI from "./NilVault.json";
import NilTokenABI from "./NilToken.json";
import NilStETHABI from "./NilStETH.json";
import NilLidoABI from "./NilLido.json";

export const NIL_VAULT_ADDRESS = import.meta.env.VITE_VAULT_ADDRESS;
export const NIL_TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS;
export const STETH_ADDRESS = import.meta.env.VITE_STETH_ADDRESS;
export const LIDO_ADDRESS = import.meta.env.VITE_LIDO_ADDRESS;
export const NIL_VAULT_ABI = NilVaultABI;
export const NIL_TOKEN_ABI = NilTokenABI;
export const STETH_ABI = NilStETHABI;
export const LIDO_ABI = NilLidoABI;
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
