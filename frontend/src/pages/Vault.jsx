import { useAccount } from "wagmi";
import PositionCard from "../components/vault/PositionCard";
import DepositForm from "../components/vault/DepositForm";
import RedeemForm from "../components/vault/RedeemForm";
import ConnectButton from "../components/wallet/ConnectButton";
import { usePosition } from "../hooks/usePosition";
import { useVault } from "../hooks/useVault";

export default function Vault() {
  const { isConnected } = useAccount();
  const position = usePosition();
  const vault = useVault(position.refetch);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <p className="text-[120px] leading-none mb-6 text-nil-muted/30">∅</p>
        <h2 className="text-nil-white text-2xl font-bold mb-3">
          Connect Wallet
        </h2>
        <p className="text-nil-grey text-sm mb-8 text-center max-w-sm">
          Connect your wallet to interact with the Nil vault on Arbitrum
          Sepolia.
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
          <h1 className="text-nil-white text-4xl font-bold mb-3">Vault</h1>
          <p className="text-nil-grey text-sm">
            Lock ETH via Lido, mint NIL, earn yield, redeem stETH.
          </p>
        </div>

        {/* Position */}
        <div className="mb-12">
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

        {/* Deposit + Redeem Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <DepositForm
            ethBalance={position.ethBalance}
            onDeposit={vault.deposit}
            loading={vault.depositLoading}
            success={vault.depositSuccess}
            error={vault.depositError}
            txHash={vault.depositHash}
          />
          <RedeemForm
            nilBalance={position.nilBalance}
            onRedeem={vault.redeem}
            onExecuteRedeem={vault.executeRedeem}
            approveSuccess={vault.approveSuccess}
            approveLoading={vault.approveLoading}
            redeemLoading={vault.redeemLoading}
            redeemSuccess={vault.redeemSuccess}
            error={vault.redeemError}
            redeemHash={vault.redeemHash}
            redeemStep={vault.redeemStep}
          />
        </div>
      </div>
    </div>
  );
}
