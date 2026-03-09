import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

export default function DepositForm({ ethBalance, onDeposit, loading, success, error, txHash }) {
  const [amount, setAmount] = useState("");
  const { isConnected } = useAccount();

  const nilPreview =
    amount && !isNaN(amount) && Number(amount) > 0
      ? ((Number(amount) * 100) / 150).toFixed(6)
      : null;

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setAmount(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (amount && Number(amount) > 0) {
      onDeposit(amount);
    }
  };

  const isDisabled = !isConnected || !amount || Number(amount) <= 0 || Number(amount) > ethBalance || loading;

  return (
    <div className="nil-card p-6">
      <h3 className="text-nil-white text-lg font-semibold mb-1">Deposit</h3>
      <p className="text-nil-grey text-sm mb-6">Lock ETH via Lido. Receive NIL + yield.</p>

      <form onSubmit={handleSubmit}>
        <label className="text-nil-grey text-xs uppercase tracking-widest block mb-2">
          ETH Amount
        </label>
        <div className="relative mb-2">
          <input
            type="number"
            step="any"
            min="0"
            className="nil-input pr-16"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-nil-muted text-sm">
            ETH
          </span>
        </div>
        <p className="text-nil-grey text-xs mb-4">
          Balance: {ethBalance.toFixed(4)} ETH
        </p>

        {/* Preview */}
        {nilPreview && (
          <div className="border-t border-nil-border/60 pt-4 mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-nil-grey">You receive</span>
              <span className="text-nil-white font-mono">{nilPreview} NIL</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-nil-grey">Ratio</span>
              <span className="text-nil-muted">150%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-nil-grey">Staking yield</span>
              <span className="text-emerald-400">~4.0% APY via Lido</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-nil-grey">Gas estimate</span>
              <span className="text-nil-muted">~$0.02</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="nil-button-primary w-full flex items-center justify-center gap-2"
          disabled={isDisabled}
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-nil-black/30 border-t-nil-black rounded-full animate-spin" />
              Depositing...
            </>
          ) : (
            "Deposit ETH"
          )}
        </button>

        {/* Success */}
        {success && (
          <div className="mt-4 text-center">
            <p className="text-emerald-400 text-sm mb-1">✓ Deposited successfully</p>
            {txHash && (
              <a
                href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-nil-grey text-xs hover:text-nil-white transition-colors duration-200"
              >
                View transaction ↗
              </a>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
        )}
      </form>
    </div>
  );
}
