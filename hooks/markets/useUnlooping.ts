"use client";
import { useEffect, useMemo, useState } from "react";
import {
  useAllowance,
  useApproveToken,
  useApproveVDT,
  useInvalidate,
  useLoopToast,
  useMarketPrices,
  useMarketRaw,
  useMarketsRaw,
  useOdosQuoteToast,
  useTokenBalance,
  useTokenBalances,
  useUnloopToast,
  useUserData,
  useUserDataRaw,
  useVDTAllowance,
} from "@/hooks";
import {
  Addresses,
  AutoDeleveragerAbi,
  AutoLeveragerAbi,
  ClientMap,
  getTokenByAddress,
  MARKET_DEFINITIONS,
  Token,
  UiHelperAbi,
} from "@/constants";
import { Address } from "viem";
import {
  bnToNumber,
  bnToStr,
  extractError,
  minBn,
  numToBn,
  strToBn,
} from "@/helpers";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

const getOdosQuote = async (
  inputTokens: { tokenAddress: string; amount: bigint }[],
  outputTokens: { tokenAddress: string; proportion: number }[],
  swapperAddress: Address,
  chainId: number,
  slippage: number
): Promise<{
  outputAmount: string;
  outputValue: string;
  quote: any;
  assembledTxData: `0x${string}`;
}> => {
  const quoteUrl = "https://api.odos.xyz/sor/quote/v2";
  const assembleUrl = "https://api.odos.xyz/sor/assemble";

  const quoteBody = {
    chainId,
    inputTokens: inputTokens.map((t) => ({
      tokenAddress: t.tokenAddress,
      amount: bnToStr(t.amount, 0),
    })),
    outputTokens: outputTokens,
    slippageLimitPercent: slippage,
    userAddr: swapperAddress,
    referralCode: 0,
    disableRFQs: true,
    compact: true,
  };

  const quoteRes = await fetch(quoteUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quoteBody),
  });

  if (!quoteRes.ok) {
    throw new Error(
      `Quote request failed: ${quoteRes.status} ${quoteRes.statusText}`
    );
  }

  const quoteJson = await quoteRes.json();
  if (!quoteJson?.outAmounts?.length || !quoteJson?.outValues?.length) {
    throw new Error(
      `Invalid ODOS quote response: ${JSON.stringify(quoteJson)}`
    );
  }

  const outputAmount = quoteJson.outAmounts[0];
  const outputValue = quoteJson.outValues[0];

  const assembleBody = {
    userAddr: swapperAddress,
    pathId: quoteJson.pathId,
    simulate: false,
  };

  const assembleRes = await fetch(assembleUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(assembleBody),
  });

  if (!assembleRes.ok) {
    throw new Error(
      `Assemble request failed: ${assembleRes.status} ${assembleRes.statusText}`
    );
  }

  const assembleJson = await assembleRes.json();
  const assembledTxData = assembleJson?.transaction?.data;
  if (!assembledTxData) {
    throw new Error(
      `Invalid assemble response: ${JSON.stringify(assembleJson)}`
    );
  }

  return {
    outputAmount,
    outputValue,
    quote: quoteJson,
    assembledTxData,
  };
};

type ReviewDataType = {
  depositUSDValue: number;
  borrowUSDValue: number;
  vaultTokenUSDMinValue: number;
  vaultTokenUSDMaxValue: number;
  feeUSDValue: number;
};

enum TokenType {
  CLASSIC,
  ICHI,
  BEATS,
}

const useUnlooping = (marketID: string, borrowToken: Token) => {
  const marketDefinition = MARKET_DEFINITIONS[marketID];
  const { marketsData } = useMarketsRaw(marketID);
  const feeInPerTenK = 30;

  const [repayAmount, setRepayAmount] = useState<string>("");

  const [collateralToken, setCollateralToken] = useState<Token>(
    marketDefinition.LOOPING!.VAULTS[0]
  );
  const [computedCollateralAmountBn, setComputedCollateralAmountBn] =
    useState<bigint>(BigInt(0));

  const [slippage, setSlippage] = useState<string>("1.00");
  const [debouncedSlippage, setDebouncedSlippage] = useState<string>("1.00");

  const { marketData: borrowMarketData } = useMarketRaw(marketID, borrowToken);
  const { marketData: collateralMarketData } = useMarketRaw(
    marketID,
    collateralToken
  );

  const repayAmountBn = strToBn(repayAmount, borrowToken.decimals);

  const borrowTokenAddress = borrowToken.address.toLowerCase() as Address;
  const collateralTokenAddress =
    collateralToken.address.toLowerCase() as Address;
  const collateralATokenAddress = collateralMarketData?.aTokenAddress || "0x0";

  const unloopingContract = marketDefinition.LOOPING!.UNLOOPING_CONTRACT;
  const possibleCollateralTokens = marketDefinition.LOOPING!.VAULTS;

  const { invalidateMarketState } = useInvalidate(marketID, borrowToken);

  const { isPricesLoading, prices } = useMarketPrices(marketID);

  const { userData, invalidateUserDataRawQuery } = useUserDataRaw(marketID);
  const { userData: borrowTokenUserData } = useUserData(marketID, borrowToken);
  const { userData: collateralTokenUserData } = useUserData(
    marketID,
    collateralToken
  );

  const collateralInfo = useMemo(() => {
    const result: Record<
      Address,
      {
        token: Token;
        maxRepay: bigint;
        maxRepayUSD: number;
        valueUSD: number;
      }
    > = {};

    if (!borrowMarketData) return result;

    const borrowTokenPrice = prices[borrowTokenAddress] || BigInt(0);

    for (const collateral of possibleCollateralTokens) {
      const collateralAddress = collateral.address.toLowerCase() as Address;
      const collateralMarket = (marketsData || []).find(
        (m) => m.underlyingAsset.toLowerCase() === collateralAddress
      );
      const userDataForCollateral = userData?.find(
        (d) => d.underlyingAsset.toLowerCase() === collateralAddress
      );
      if (!collateralMarket || !userDataForCollateral) {
        result[collateralAddress] = {
          token: collateral,
          maxRepay: BigInt(0),
          maxRepayUSD: 0,
          valueUSD: 0,
        };
        continue;
      }

      const collateralPrice = prices[collateralAddress] || BigInt(0);
      const collateralBalance = userDataForCollateral.aTokenBalance;
      const collateralLTV = collateralMarket.baseLTVasCollateral;

      const maxRepayFromCollateral =
        (collateralBalance *
          collateralLTV *
          collateralPrice *
          BigInt(10 ** borrowToken.decimals)) /
        borrowTokenPrice /
        BigInt(1e4) /
        BigInt(10 ** collateral.decimals);
      const maxRepay = minBn(
        maxRepayFromCollateral,
        borrowTokenUserData?.variableDebt
      );
      const maxRepayUSD = bnToNumber(
        maxRepay * borrowTokenPrice,
        borrowToken.decimals + 8
      );

      result[collateralAddress] = {
        token: collateral,
        maxRepay,
        maxRepayUSD,
        valueUSD:
          bnToNumber(
            collateralBalance * collateralPrice,
            collateral.decimals + 8
          ) * bnToNumber(collateralLTV, 4),
      };
    }
    return result;
  }, [
    borrowToken,
    repayAmount,
    borrowMarketData,
    possibleCollateralTokens,
    prices,
    marketsData,
    userData,
  ]);

  const { allowance, invalidateAllowanceQuery } = useAllowance(
    unloopingContract,
    collateralATokenAddress
  );

  const { approve, isApproveConfirming, isApprovePending, setApproveAmount } =
    useApproveToken(
      unloopingContract,
      collateralATokenAddress,
      collateralToken
    );
  const hasEnoughAllowance =
    !!allowance && allowance > 0 && allowance >= computedCollateralAmountBn;

  useEffect(() => {
    if (computedCollateralAmountBn) {
      setApproveAmount(
        (computedCollateralAmountBn * BigInt(110)) / BigInt(100)
      );
    }
  }, [computedCollateralAmountBn, setApproveAmount]);

  const {
    writeContract,
    isPending,
    data: hash,
    reset,
    error,
    isError,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const [isOdosQuoteLoading, setIsOdosQuoteLoading] = useState(false);
  const [odosQuote, setOdosQuote] = useState<`0x${string}`>("0x");
  const [isOdosQuoteError, setIsOdosQuoteError] = useState<boolean>(false);

  type ReviewDataType = {
    repaidUSDValue: number;
    collateralUsedUSDValue: number;
    collateralBackUSDMinValue: number;
    collateralBackUSDMaxValue: number;
    priceImpactError: boolean;
  };
  const [reviewData, setReviewData] = useState<ReviewDataType>(
    {} as ReviewDataType
  );
  const { odosQuoteError } = useOdosQuoteToast();
  let slippageInPercent = parseFloat(slippage);

  const queryOdosQuote = async (__slippage?: string) => {
    if (__slippage) {
      slippageInPercent = parseFloat(__slippage);
    }
    let odosQuoteJson: any = null;
    let assembledData = "0x" as `0x${string}`;
    setIsOdosQuoteError(false);

    const collateralPrice = prices[collateralTokenAddress] || BigInt(0);
    const borrowPrice = prices[borrowTokenAddress];

    const collateralAmountBn = minBn(
      (strToBn(repayAmount, 0) *
        borrowPrice *
        BigInt(10 ** collateralToken.decimals) *
        BigInt(1e4)) /
        collateralPrice /
        collateralMarketData!.baseLTVasCollateral,
      collateralTokenUserData?.aTokenBalance || BigInt(0)
    );

    setComputedCollateralAmountBn(collateralAmountBn);

    const { tokens, amounts } = (
      await ClientMap[146].readContract({
        address: Addresses[146].CONTRACTS.UI_HELPER,
        abi: UiHelperAbi,
        functionName: "getTokensForInput",
        args: [
          [
            {
              token: collateralTokenAddress,
              marketType: marketDefinition.id,
            },
          ],
          [collateralAmountBn],
        ],
      })
    )[0];
    const odosInputTokenData: {
      tokenAddress: string;
      amount: bigint;
    }[] = [];
    let unswappedUSDValue = 0;
    let otherAddress = "0x0" as Address;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].toLowerCase() != borrowTokenAddress) {
        odosInputTokenData.push({
          tokenAddress: tokens[i],
          amount: (amounts[i] * BigInt(95)) / BigInt(100),
        });
        unswappedUSDValue +=
          bnToNumber(
            amounts[i] * prices[tokens[i].toLowerCase() as Address],
            getTokenByAddress(tokens[i])!.decimals + 8
          ) * 0.05;
      } else {
        unswappedUSDValue += bnToNumber(
          amounts[i] * borrowPrice,
          borrowToken.decimals + 8
        );
        otherAddress = tokens[i];
      }
    }

    try {
      setIsOdosQuoteLoading(true);

      const result = await getOdosQuote(
        odosInputTokenData,
        [
          {
            tokenAddress: borrowTokenAddress,
            proportion: 1,
          },
        ],
        unloopingContract,
        marketDefinition.chainId,
        slippageInPercent
      );
      odosQuoteJson = result.quote;
      assembledData = result.assembledTxData;
    } catch (error) {
      setIsOdosQuoteError(true);
      odosQuoteError("", (error as Error).message);
    } finally {
      setIsOdosQuoteLoading(false);
    }

    setOdosQuote(assembledData);

    const repaidUSDValue = bnToNumber(
      repayAmountBn * borrowPrice,
      borrowToken.decimals + 8
    );

    let collateralBackUSDMinValue =
      unswappedUSDValue +
      Number(odosQuoteJson.outValues[0]) * (1 - slippageInPercent / 100) -
      repaidUSDValue;
    if (collateralBackUSDMinValue < 0) {
      collateralBackUSDMinValue = 0;
    }
    const collateralBackUSDMaxValue =
      unswappedUSDValue + Number(odosQuoteJson.outValues[0]) - repaidUSDValue;
    setReviewData({
      repaidUSDValue,
      collateralUsedUSDValue: bnToNumber(
        collateralAmountBn * collateralPrice,
        collateralToken.decimals + 8
      ),
      collateralBackUSDMinValue,
      collateralBackUSDMaxValue,
      priceImpactError: Math.abs(odosQuoteJson.priceImpact) > 0.00001,
    });
  };

  const confirm = async () => {
    writeContract(
      {
        abi: AutoDeleveragerAbi,
        address: unloopingContract,
        functionName: "leverageWithdraw",
        args: [
          {
            vicunaVault: collateralTokenAddress,
            withdrawAssetAToken: collateralATokenAddress,
            withdrawAmount: computedCollateralAmountBn,
            borrowAsset: borrowTokenAddress,
            repayAmount: repayAmountBn,
            swapParams: odosQuote,
          },
        ],
        chainId: marketDefinition.chainId,
      },
      {
        onSuccess: (data) => pendingUnloopToast(data),
      }
    );
  };

  const { pendingUnloopToast, successUnloopToast, errorUnloopToast } =
    useUnloopToast({
      amount: repayAmount,
      token: borrowToken,
    });

  useEffect(() => {
    if (isError) {
      console.log(error);
      errorUnloopToast(hash!, extractError(error?.message));
    }
  }, [isError, error]);

  const { invalidateTokenBalanceQuery } = useTokenBalance(borrowToken);

  useEffect(() => {
    if (isConfirmed) {
      successUnloopToast(hash!);
      setTimeout(() => {
        reset();
        setRepayAmount("");
        invalidateMarketState();
        invalidateAllowanceQuery();
        invalidateTokenBalanceQuery();
        invalidateUserDataRawQuery();
      }, 500);
    }
  }, [isConfirmed, reset, hash]);

  return {
    selectedToken: borrowToken,

    repayAmount,
    setRepayAmount,

    collateralToken,
    setCollateralToken,
    collateralInfo,

    queryOdosQuote,
    isOdosQuoteError,
    reviewData,
    slippage,
    setSlippage,
    debouncedSlippage,
    setDebouncedSlippage,
    needsOdosQuote: true,

    hasEnoughAllowance,
    approve,
    isApproveConfirming,
    isApprovePending,

    confirm,
    isPending,
    isConfirming,
    isOdosQuoteLoading,
    isConfirmed,
  };
};

export { useUnlooping };
