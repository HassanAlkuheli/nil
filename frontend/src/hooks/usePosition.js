import { useAccount, useReadContract, useBalance, useBlockNumber } from "wagmi";
import { formatEther } from "viem";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { NIL_VAULT_ADDRESS, NIL_TOKEN_ADDRESS, NIL_VAULT_ABI, NIL_TOKEN_ABI, STETH_ADDRESS, STETH_ABI } from "../config/contracts";
import { usePrice } from "./usePrice";

export function usePosition() {
  const { address, isConnected } = useAccount();
  const { ethPrice } = usePrice();
  const queryClient = useQueryClient();

  const { data: position, queryKey: positionQueryKey } = useReadContract({
    address: NIL_VAULT_ADDRESS,
    abi: NIL_VAULT_ABI,
    functionName: "getPosition",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  const { data: stethValue, queryKey: stethValueQueryKey } = useReadContract({
    address: NIL_VAULT_ADDRESS,
    abi: NIL_VAULT_ABI,
    functionName: "getStETHValue",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  const { data: exchangeRate, queryKey: exchangeRateQueryKey } = useReadContract({
    address: STETH_ADDRESS,
    abi: STETH_ABI,
    functionName: "getExchangeRate",
    query: { enabled: isConnected },
  });

  const { data: nilBalance, queryKey: nilQueryKey } = useReadContract({
    address: NIL_TOKEN_ADDRESS,
    abi: NIL_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  const { data: ethBalanceData, queryKey: ethQueryKey } = useBalance({
    address,
    query: { enabled: isConnected && !!address },
  });

  // Auto-refetch on new blocks
  const { data: blockNumber } = useBlockNumber({ watch: true });

  useEffect(() => {
    if (blockNumber) {
      queryClient.invalidateQueries({ queryKey: positionQueryKey });
      queryClient.invalidateQueries({ queryKey: stethValueQueryKey });
      queryClient.invalidateQueries({ queryKey: exchangeRateQueryKey });
      queryClient.invalidateQueries({ queryKey: nilQueryKey });
      queryClient.invalidateQueries({ queryKey: ethQueryKey });
    }
  }, [blockNumber, queryClient, positionQueryKey, stethValueQueryKey, exchangeRateQueryKey, nilQueryKey, ethQueryKey]);

  const collateralWei = position?.[0] || 0n;
  const debtWei = position?.[1] || 0n;
  const depositedETHWei = position?.[2] || 0n;

  const collateralETH = Number(formatEther(collateralWei));
  const debtNIL = Number(formatEther(debtWei));
  const depositedETH = Number(formatEther(depositedETHWei));
  const stethValueETH = stethValue ? Number(formatEther(stethValue)) : collateralETH;
  const yieldEarned = stethValueETH > collateralETH ? stethValueETH - collateralETH : 0;
  const nilBalanceFormatted = nilBalance ? Number(formatEther(nilBalance)) : 0;
  const ethBalance = ethBalanceData ? Number(formatEther(ethBalanceData.value)) : 0;
  const currentAPY = 4.0; // ~4% Lido staking APY

  const collateralUSD = collateralETH * ethPrice;
  const debtUSD = debtNIL; // 1 NIL = $1
  const ratio = debtNIL > 0 ? (collateralUSD / debtUSD) * 100 : 0;
  const health = ratio > 150 ? "safe" : ratio > 120 ? "warning" : debtNIL > 0 ? "danger" : "safe";

  const loading = !position && isConnected;

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: positionQueryKey });
    queryClient.invalidateQueries({ queryKey: stethValueQueryKey });
    queryClient.invalidateQueries({ queryKey: exchangeRateQueryKey });
    queryClient.invalidateQueries({ queryKey: nilQueryKey });
    queryClient.invalidateQueries({ queryKey: ethQueryKey });
  };

  return {
    collateralETH,
    debtNIL,
    depositedETH,
    stethValueETH,
    yieldEarned,
    currentAPY,
    collateralUSD,
    nilBalance: nilBalanceFormatted,
    ethBalance,
    ratio,
    health,
    ethPrice,
    loading,
    refetch,
  };
}
