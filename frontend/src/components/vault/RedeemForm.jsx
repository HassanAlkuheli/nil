import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

export default function RedeemForm({
  nilBalance,
  onRedeem,
  onExecuteRedeem,
  approveSuccess,
  approveLoading,
  redeemLoading,
  redeemSuccess,
  error,
  redeemHash,
  redeemStep,
}) {
  const [amount, setAmount] = useState("");
  const { isConnected } = useAccount();

  const ethPreview =
    amount && !isNaN(amount) && Number(amount) > 0
      ? ((Number(amount) * 150) / 100).toFixed(6)
      : null;

  const stethLabel = "stETH";

  useEffect(() => {
    if (approveSuccess && redeemStep === "approving" && amount) {
      onExecuteRedeem(amount);
    }
  }, [approveSuccess, redeemStep, amount, onExecuteRedeem]);

  useEffect(() => {
    if (redeemSuccess) {
      const timer = setTimeout(() => setAmount(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [redeemSuccess]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (amount && Number(amount) > 0) {
      onRedeem(amount);
    }
  };

  const loading = approveLoading || redeemLoading;
  const isDisabled = !isConnected || !amount || Number(amount) <= 0 || Number(amount) > nilBalance || loading;

  const buttonText = () => {
    if (approveLoading) return "Approving...";
    if (redeemLoading) return "Redeeming...";
    return "Redeem NIL";
  };

  return (
    <div className="nil-card p-6">
      <h3 className="text-nil-white text-lg font-semibold mb-1">Redeem</h3>
      <p className="text-nil-grey text-sm mb-6">Burn NIL. Receive stETH.</p>

      <form onSubmit={handleSubmit}>
        <label className="text-nil-grey text-xs uppercase tracking-widest block mb-2">
          NIL Amount
        </label>
        <div className="relative mb-2">
          <input
            type="number"
            step="any"
            min="0"
            className="nil-input pr-20"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              className="text-nil-grey text-xs hover:text-nil-white transition-colors duration-200"
              onClick={() => setAmount(nilBalance.toString())}
            >
              Max
            </button>
            <span className="text-nil-muted text-sm">NIL</span>
          </div>
        </div>
        <p className="text-nil-grey text-xs mb-4">
          Balance: {nilBalance.toFixed(4)} NIL
        </p>

        {/* Preview */}
        {ethPreview && (
          <div className="border-t border-nil-border/60 pt-4 mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-nil-grey">You receive</span>
              <span className="text-nil-white font-mono">{ethPreview} {stethLabel}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-nil-grey">Gas estimate</span>
              <span className="text-nil-muted">~$0.02</span>
            </div>
          </div>
        )}

        {/* Two step indicator */}
        {loading && (
          <div className="flex items-center gap-4 mb-4 text-xs">
            <div className={`flex items-center gap-2 ${redeemStep === "approving" ? "text-nil-white" : "text-nil-grey"}`}>
              <span className={`w-5 h-5 rounded-full border text-center leading-5 ${approveSuccess ? "bg-emerald-400/20 border-emerald-400 text-emerald-400" : redeemStep === "approving" ? "border-nil-white" : "border-nil-ring"}`}>
                {approveSuccess ? "✓" : "1"}
              </span>
              Approve NIL
            </div>
            <div className="flex-1 h-px bg-nil-border" />
            <div className={`flex items-center gap-2 ${redeemStep === "redeeming" ? "text-nil-white" : "text-nil-grey"}`}>
              <span className={`w-5 h-5 rounded-full border text-center leading-5 ${redeemSuccess ? "bg-emerald-400/20 border-emerald-400 text-emerald-400" : redeemStep === "redeeming" ? "border-nil-white" : "border-nil-ring"}`}>
                {redeemSuccess ? "✓" : "2"}
              </span>
              Redeem stETH
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
              {buttonText()}
            </>
          ) : (
            "Redeem NIL"
          )}
        </button>

        {/* Success */}
        {redeemSuccess && (
          <div className="mt-4 text-center">
            <p className="text-emerald-400 text-sm mb-1">✓ Redeemed successfully</p>
            {redeemHash && (
              <a
                href={`https://sepolia.arbiscan.io/tx/${redeemHash}`}
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
