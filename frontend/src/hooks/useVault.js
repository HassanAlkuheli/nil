import { useState, useCallback, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { NIL_VAULT_ADDRESS, NIL_TOKEN_ADDRESS, NIL_VAULT_ABI, NIL_TOKEN_ABI } from "../config/contracts";

export function useVault(refetchPosition) {
  // ── Deposit ──
  const {
    writeContract: writeDeposit,
    data: depositHash,
    isPending: depositPending,
    error: depositError,
    reset: resetDeposit,
  } = useWriteContract();

  const { isLoading: depositConfirming, isSuccess: depositSuccess } =
    useWaitForTransactionReceipt({ hash: depositHash });

  const deposit = useCallback(
    (ethAmount) => {
      resetDeposit();
      writeDeposit({
        address: NIL_VAULT_ADDRESS,
        abi: NIL_VAULT_ABI,
        functionName: "deposit",
        value: parseEther(ethAmount),
      });
    },
    [writeDeposit, resetDeposit]
  );

  // ── Redeem ──
  const [redeemStep, setRedeemStep] = useState("idle"); // idle | approving | redeeming

  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: approvePending,
    error: approveError,
    reset: resetApprove,
  } = useWriteContract();

  const { isLoading: approveConfirming, isSuccess: approveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash });

  const {
    writeContract: writeRedeem,
    data: redeemHash,
    isPending: redeemPending,
    error: redeemError,
    reset: resetRedeem,
  } = useWriteContract();

  const { isLoading: redeemConfirming, isSuccess: redeemSuccess } =
    useWaitForTransactionReceipt({ hash: redeemHash });

  const redeem = useCallback(
    (nilAmount) => {
      resetApprove();
      resetRedeem();
      setRedeemStep("approving");

      writeApprove({
        address: NIL_TOKEN_ADDRESS,
        abi: NIL_TOKEN_ABI,
        functionName: "approve",
        args: [NIL_VAULT_ADDRESS, parseEther(nilAmount)],
      });
    },
    [writeApprove, resetApprove, resetRedeem]
  );

  // When approve succeeds, trigger redeem
  const executeRedeem = useCallback(
    (nilAmount) => {
      setRedeemStep("redeeming");
      writeRedeem({
        address: NIL_VAULT_ADDRESS,
        abi: NIL_VAULT_ABI,
        functionName: "redeem",
        args: [parseEther(nilAmount)],
      });
    },
    [writeRedeem]
  );

  // Refetch position on success (in useEffect to avoid infinite re-renders)
  useEffect(() => {
    if (depositSuccess && refetchPosition) {
      refetchPosition();
    }
  }, [depositSuccess, refetchPosition]);

  useEffect(() => {
    if (redeemSuccess && refetchPosition) {
      refetchPosition();
    }
  }, [redeemSuccess, refetchPosition]);

  return {
    // Deposit
    deposit,
    depositLoading: depositPending || depositConfirming,
    depositSuccess,
    depositError: depositError?.shortMessage || depositError?.message,
    depositHash,

    // Redeem
    redeem,
    executeRedeem,
    approveSuccess,
    approveLoading: approvePending || approveConfirming,
    redeemLoading: redeemPending || redeemConfirming,
    redeemSuccess,
    redeemError:
      approveError?.shortMessage ||
      approveError?.message ||
      redeemError?.shortMessage ||
      redeemError?.message,
    redeemHash,
    redeemStep,
  };
}
