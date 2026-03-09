import Skeleton from "../ui/Skeleton";
import Badge from "../ui/Badge";

export default function PositionCard({ collateralETH, debtNIL, collateralUSD, depositedETH, stethValueETH, yieldEarned, currentAPY, ratio, health, ethPrice, loading }) {
  // Empty state
  if (!loading && collateralETH === 0 && debtNIL === 0) {
    return (
      <div className="nil-card p-10 text-center">
        <img src="/assets/logo_without_company_name.png" alt="nil" className="h-14 w-14 mx-auto mb-4 opacity-30" />
        <p className="text-nil-grey text-sm">
          No position. Deposit ETH to begin.
        </p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="nil-card p-6">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <Skeleton width="80px" height="14px" className="mb-3" />
            <Skeleton width="140px" height="28px" className="mb-1" />
            <Skeleton width="100px" height="16px" />
          </div>
          <div>
            <Skeleton width="80px" height="14px" className="mb-3" />
            <Skeleton width="140px" height="28px" />
          </div>
        </div>
        <Skeleton width="100%" height="8px" />
      </div>
    );
  }

  const ratioPercent = Math.min(ratio, 200) / 200;
  const barColor =
    health === "safe"
      ? "bg-nil-white"
      : health === "warning"
        ? "bg-amber-400"
        : "bg-red-400";

  return (
    <div className="nil-card p-6">
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-nil-grey text-xs uppercase tracking-widest mb-2">
            Collateral (stETH)
          </p>
          <p className="text-nil-white text-2xl font-semibold font-mono tracking-tight">
            {collateralETH.toFixed(6)} stETH
          </p>
          <p className="text-nil-muted text-sm">
            ${collateralUSD.toFixed(2)} USD
          </p>
        </div>
        <div>
          <p className="text-nil-grey text-xs uppercase tracking-widest mb-2">
            Debt
          </p>
          <p className="text-nil-white text-2xl font-semibold font-mono tracking-tight">
            {debtNIL.toFixed(6)} NIL
          </p>
        </div>
      </div>

      {/* Yield Section */}
      <div className="border-t border-nil-border/60 pt-4 mb-6">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-nil-grey text-xs uppercase tracking-widest mb-2">
              Deposited ETH
            </p>
            <p className="text-nil-white text-lg font-semibold font-mono">
              {(depositedETH || 0).toFixed(6)}
            </p>
          </div>
          <div>
            <p className="text-nil-grey text-xs uppercase tracking-widest mb-2">
              stETH Value
            </p>
            <p className="text-nil-white text-lg font-semibold font-mono">
              {(stethValueETH || 0).toFixed(6)}
            </p>
          </div>
          <div>
            <p className="text-nil-grey text-xs uppercase tracking-widest mb-2">
              Yield Earned
            </p>
            <p className="text-emerald-400 text-lg font-semibold font-mono">
              +{(yieldEarned || 0).toFixed(6)}
            </p>
            <p className="text-nil-muted text-xs">
              ~{(currentAPY || 4.0).toFixed(1)}% APY
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-nil-grey text-xs uppercase tracking-widest">
            Health Ratio
          </p>
          <div className="flex items-center gap-3">
            <span className="text-nil-white text-lg font-semibold font-mono">
              {ratio.toFixed(1)}%
            </span>
            <Badge status={health} />
          </div>
        </div>
        <div className="w-full h-1.5 bg-nil-elevated rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${ratioPercent * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
