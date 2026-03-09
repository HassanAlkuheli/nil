import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import axios from "axios";
import PositionCard from "../components/vault/PositionCard";
import StatCard from "../components/ui/StatCard";
import ConnectButton from "../components/wallet/ConnectButton";
import { BACKEND_URL } from "../config/contracts";
import { usePosition } from "../hooks/usePosition";

function shortenTx(hash) {
  return hash ? `${hash.slice(0, 10)}…${hash.slice(-8)}` : "";
}

function formatTimestamp(ts) {
  // ts is a Unix epoch (seconds) from the backend `created_at` field
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const position = usePosition();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!address) return;
    const fetchHistory = async () => {
      try {
        const res = await axios.get(
          `${BACKEND_URL}/api/history/${address}`
        );
        setHistory(res.data);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [address]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/stats`);
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <p className="text-[120px] leading-none mb-6 text-nil-muted/30">∅</p>
        <h2 className="text-nil-white text-2xl font-bold mb-3">
          Connect Wallet
        </h2>
        <p className="text-nil-grey text-sm mb-8 text-center max-w-sm">
          Connect your wallet to view your dashboard on Arbitrum Sepolia.
        </p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-28 px-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-14">
          <h1 className="text-nil-white text-4xl font-bold mb-3">Dashboard</h1>
          <p className="text-nil-grey text-sm font-mono">
            {address}
          </p>
        </div>

        {/* Protocol Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
          <StatCard
            label="ETH Price"
            value={stats ? `$${Number(stats.eth_price).toFixed(2)}` : "—"}
            loading={loadingStats}
          />
          <StatCard
            label="Total ETH Locked"
            value={
              stats
                ? `${Number(stats.total_eth_locked).toFixed(4)} ETH`
                : "—"
            }
            loading={loadingStats}
          />
          <StatCard
            label="Total stETH Held"
            value={
              stats
                ? `${Number(stats.total_steth_held).toFixed(4)} stETH`
                : "—"
            }
            loading={loadingStats}
          />
          <StatCard
            label="Total NIL Minted"
            value={
              stats
                ? `${Number(stats.total_nil_minted).toFixed(4)} NIL`
                : "—"
            }
            loading={loadingStats}
          />
          <StatCard
            label="Current APY"
            value={stats ? `${stats.current_apy}%` : "—"}
            loading={loadingStats}
          />
        </div>

        {/* Position */}
        <div className="mb-10">
          <PositionCard
            collateralETH={position.collateralETH}
            debtNIL={position.debtNIL}
            collateralUSD={position.collateralUSD}
            depositedETH={position.depositedETH}
            stethValueETH={position.stethValueETH}
            yieldEarned={position.yieldEarned}
            currentAPY={position.currentAPY}
            ratio={position.ratio}
            health={position.health}
            ethPrice={position.ethPrice}
            loading={position.loading}
          />
        </div>

        {/* Transaction History */}
        <div className="nil-card p-6">
          <h2 className="text-nil-white text-lg font-semibold mb-6">
            Transaction History
          </h2>

          {loadingHistory ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-nil-border/30 rounded animate-pulse"
                />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-nil-grey text-sm">No transactions yet.</p>
              <p className="text-nil-grey text-xs mt-1">
                Deposit ETH to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-nil-border text-nil-grey text-xs font-mono uppercase tracking-wider">
                    <th className="text-left py-3 pr-4">Type</th>
                    <th className="text-right py-3 px-4">ETH</th>
                    <th className="text-right py-3 px-4">stETH</th>
                    <th className="text-right py-3 px-4">NIL</th>
                    <th className="text-right py-3 px-4">Tx Hash</th>
                    <th className="text-right py-3 pl-4">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((tx, index) => (
                    <tr
                      key={tx.tx_hash || index}
                      className="border-b border-nil-border/40 hover:bg-nil-elevated/50 transition-colors duration-200"
                    >
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-mono border ${tx.tx_type?.toLowerCase() === "deposit"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}
                        >
                          {tx.tx_type}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-nil-white font-mono">
                        {Number(tx.eth_amount).toFixed(4)}
                      </td>
                      <td className="text-right py-3 px-4 text-nil-white font-mono">
                        {Number(tx.steth_amount).toFixed(4)}
                      </td>
                      <td className="text-right py-3 px-4 text-nil-white font-mono">
                        {Number(tx.nil_amount).toFixed(4)}
                      </td>
                      <td className="text-right py-3 px-4">
                        <a
                          href={`https://sepolia.arbiscan.io/tx/${tx.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-nil-grey hover:text-nil-white font-mono text-xs transition-colors duration-200"
                        >
                          {shortenTx(tx.tx_hash)}
                        </a>
                      </td>
                      <td className="text-right py-3 pl-4 text-nil-grey text-xs">
                        {formatTimestamp(tx.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
