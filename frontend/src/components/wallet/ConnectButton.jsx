import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain, useConnectors } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";

export default function ConnectButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect, isPending } = useConnect();
  const connectors = useConnectors();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: balance } = useBalance({ address, query: { enabled: isConnected } });

  if (isPending) {
    return (
      <button className="nil-button-primary flex items-center gap-2" disabled>
        <span className="inline-block w-4 h-4 border-2 border-nil-black/30 border-t-nil-black rounded-full animate-spin" />
        Connecting...
      </button>
    );
  }

  if (!isConnected) {
    return (
      <button
        className="nil-button-primary"
        onClick={() => connect({ connector: connectors[0] })}
      >
        Connect Wallet
      </button>
    );
  }

  if (chain?.id !== arbitrumSepolia.id) {
    return (
      <button
        className="nil-button-ghost border-red-400/40 text-red-400 hover:border-red-400/70 hover:bg-red-400/5"
        onClick={() => switchChain({ chainId: arbitrumSepolia.id })}
      >
        Switch Network
      </button>
    );
  }

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const ethBalance = balance ? Number(balance.formatted).toFixed(4) : "0.00";

  return (
    <button
      className="nil-button-ghost flex items-center gap-3"
      onClick={() => disconnect()}
    >
      <span className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_6px_rgba(52,211,153,0.4)]" />
      <span className="font-mono text-sm">{shortAddress}</span>
      <span className="text-nil-muted text-sm">{ethBalance} ETH</span>
    </button>
  );
}
