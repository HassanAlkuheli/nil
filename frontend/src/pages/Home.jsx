import { useEffect, useState } from "react";
import { Link } from "react-router";
import axios from "axios";
import StatCard from "../components/ui/StatCard";
import { BACKEND_URL, NIL_TOKEN_ADDRESS } from "../config/contracts";

export default function Home() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/stats`);
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      {/* ── Hero ── */}
      <section className="min-h-screen flex items-center px-4 sm:px-8 lg:px-16 relative">
        <div className="max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-32 items-center py-24">
          {/* Left — Logo + Text */}
          <div className="flex flex-col items-start lg:pl-4">
            <img
              src="/assets/logo_with_company_name.png"
              alt="nil protocol"
              className="h-40 md:h-52 lg:h-60 mb-10 opacity-90 drop-shadow-2xl"
            />

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.95] ">
              <span className="text-nil-white">Everything starts</span>
              <br />
              <span className="text-nil-muted">From nil.</span>
            </h1>

            <p className="text-nil-grey text-lg md:text-xl max-w-md mb-14 ml-1 -mt-1">
              In. Grow. Out.
            </p>

            <div className="flex items-center gap-5">
              <Link to="/vault" className="nil-button-primary">
                Open Vault
              </Link>
              <Link to="/dashboard" className="nil-button-ghost">
                View Dashboard
              </Link>
            </div>
          </div>

          {/* Right — Token Card */}
          <div className="border border-nil-border/60 rounded-xl p-8 md:p-10 space-y-8 lg:ml-auto lg:max-w-md">
            {/* Token header */}
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-nil-elevated border border-nil-border flex items-center justify-center shrink-0">
                <img
                  src="/assets/logo_without_company_name.png"
                  alt="NIL token"
                  className="w-12 h-12 md:w-14 md:h-14"
                />
              </div>
              <div>
                <h2 className="text-nil-white text-2xl md:text-3xl font-bold">
                  NIL Token
                </h2>
                <span className="text-nil-grey text-xs font-mono">ERC-20</span>
              </div>
            </div>

            <p className="text-nil-grey text-sm leading-relaxed">
              NIL is the synthetic stablecoin minted when you deposit ETH into the Nil Vault.
              Each NIL is backed by at least 150% collateral in ETH, fully redeemable at any time.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="nil-card p-4">
                <p className="text-nil-grey text-xs uppercase tracking-wider mb-1">Ticker</p>
                <p className="text-nil-white font-semibold font-mono">NIL</p>
              </div>
              <div className="nil-card p-4">
                <p className="text-nil-grey text-xs uppercase tracking-wider mb-1">Standard</p>
                <p className="text-nil-white font-semibold font-mono">ERC-20</p>
              </div>
              <div className="nil-card p-4">
                <p className="text-nil-grey text-xs uppercase tracking-wider mb-1">Network</p>
                <p className="text-nil-white font-semibold font-mono text-xs">Arbitrum Sepolia</p>
              </div>
              <div className="nil-card p-4">
                <p className="text-nil-grey text-xs uppercase tracking-wider mb-1">Collateral</p>
                <p className="text-nil-white font-semibold font-mono">150%</p>
              </div>
            </div>

            {NIL_TOKEN_ADDRESS && (
              <div className="nil-card p-4">
                <p className="text-nil-grey text-xs uppercase tracking-wider mb-1">Contract Address</p>
                <a
                  href={`https://sepolia.arbiscan.io/token/${NIL_TOKEN_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-nil-muted hover:text-nil-white font-mono text-xs md:text-sm transition-colors duration-200 break-all"
                >
                  {NIL_TOKEN_ADDRESS}
                </a>
              </div>
            )}
          </div>
        </div>

      </section>

      <hr className="border-nil-border/40 max-w-[1200px] mx-auto" />

      {/* ── Stats Bar ── */}
      <section>
        <div className="max-w-[1200px] mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard
            label="Total ETH Locked"
            value={stats ? `${Number(stats.total_eth_locked).toFixed(4)} ETH` : "—"}
            subvalue={stats ? `$${(Number(stats.total_eth_locked) * Number(stats.eth_price)).toFixed(2)}` : null}
            loading={loading}
          />
          <StatCard
            label="Total NIL Minted"
            value={stats ? `${Number(stats.total_nil_minted).toFixed(4)} NIL` : "—"}
            loading={loading}
          />
          <StatCard
            label="Total Users"
            value={stats ? stats.total_users.toString() : "—"}
            loading={loading}
          />
        </div>
      </section>

      <hr className="border-nil-border/40 max-w-[1200px] mx-auto" />

      {/* ── How It Works ── */}
      <section className="max-w-[1200px] mx-auto px-6 py-28">
        <h2 className="text-nil-white text-3xl font-bold mb-20 text-center">
          How it works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {[
            {
              num: "01",
              title: "Connect",
              desc: "Connect your wallet to Arbitrum Sepolia testnet.",
            },
            {
              num: "02",
              title: "Deposit",
              desc: "Lock ETH as collateral at 150% ratio and receive NIL tokens.",
            },
            {
              num: "03",
              title: "Reclaim",
              desc: "Burn NIL to recover your locked ETH anytime.",
            },
          ].map((step) => (
            <div key={step.num} className="group">
              <p className="text-nil-ring font-mono text-5xl font-bold mb-5 transition-colors duration-300 group-hover:text-nil-muted">
                {step.num}
              </p>
              <h3 className="text-nil-white text-xl font-semibold mb-3">
                {step.title}
              </h3>
              <p className="text-nil-grey text-sm leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-nil-border/40 max-w-[1200px] mx-auto" />

      {/* ── Why Arbitrum ── */}
      <section className="max-w-[1200px] mx-auto px-6 py-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-nil-white text-3xl font-bold mb-8">
              Why Arbitrum
            </h2>
            <p className="text-nil-grey text-sm leading-relaxed mb-5">
              Arbitrum is an Ethereum L2 scaling solution that inherits
              Ethereum&apos;s security while providing near-instant transactions
              at a fraction of the cost.
            </p>
            <p className="text-nil-grey text-sm leading-relaxed">
              Nil is deployed on Arbitrum Sepolia testnet — the same technology
              powering billions in DeFi, just on testnet for experimentation and
              learning.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <StatCard label="Gas per transaction" value="~$0.02" />
            <StatCard label="Confirmation time" value="<2s" />
            <StatCard label="Ethereum security" value="100%" />
          </div>
        </div>
      </section>
    </div>
  );
}
