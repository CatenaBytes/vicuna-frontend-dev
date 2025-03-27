"use client";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button, ChainButton } from "@/components/ui/button";
import Image from "next/image";
import { DialogTitle } from "@radix-ui/react-dialog";
import {
  useLooping,
  useMarket,
  useQueryParams,
  useSelectedMarket,
} from "@/hooks";
import { getTokenByAddress, MARKET_DEFINITIONS, Token } from "@/constants";
import { Address } from "viem";
import { bnToStr, formatSuffix } from "@/helpers";
import {
  LeverageSlider,
  MaxInputWithSlider,
  WrapIntoTooltip,
} from "@/components";
import { CheckCheck } from "lucide-react";
import { Deposit } from "@/components/icons/deposit";
import { DoubleAvatar } from "@/components/ui/double-avatar";
import { ChangeEvent, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { QueryValue } from "@/types";

const RefreshButton = ({
  isOdosQuoteLoading,
  queryOdosQuote,
}: {
  isOdosQuoteLoading: boolean;
  queryOdosQuote: () => void;
}) => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isOdosQuoteLoading) {
      interval = setInterval(() => {
        setRotation((prev) => prev + 10);
      }, 50);
    } else {
      clearInterval(interval);
      setRotation((prev) => prev - (prev % 360));
    }
    return () => clearInterval(interval);
  }, [isOdosQuoteLoading]);

  return (
    <div
      onClick={() => queryOdosQuote()}
      className="transition-transform duration-500 ease-out cursor-pointer" // Adjust duration/ease as desired.
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <Image src="/icons/refresh.svg" alt="Refresh" width={20} height={20} />
    </div>
  );
};

const ReviewSummary = ({
  depositToken,
  depositUSDValue,
  borrowToken,
  borrowUSDValue,
  vaultToken,
  vaultTokenUSDMinValue,
  vaultTokenUSDMaxValue,
  feeUSDValue,
  slippage,
  setSlippage,
  queryOdosQuote,
  isOdosQuoteLoading,
  needsOdosQuote,
}: {
  depositToken: Token;
  depositUSDValue: number;
  borrowToken: Token;
  borrowUSDValue: number;
  vaultToken: Token;
  vaultTokenUSDMinValue: number;
  vaultTokenUSDMaxValue: number;
  feeUSDValue: number;
  slippage: string;
  setSlippage: (val: string) => void;
  queryOdosQuote: () => void;
  isOdosQuoteLoading: boolean;
  needsOdosQuote: boolean;
}) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (value == 0) {
      setSlippage(e.target.value);
    } else if (isNaN(value)) {
      setSlippage("");
    } else {
      setSlippage(value < 0.01 ? "0.01" : e.target.value);
    }
  };

  return (
    <div className="p-6 rounded-lg space-y-4">
      <div className="flex flex-row items-center justify-between">
        <h4 className="text-xl font-semibold text-primary">Review Summary</h4>
        {needsOdosQuote && (
          <RefreshButton
            isOdosQuoteLoading={isOdosQuoteLoading}
            queryOdosQuote={queryOdosQuote}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col">
          <div className="text-sm text-gray-600">You pay:</div>
          <div className="flex flex-row items-center gap-1">
            <div className="text-lg font-bold text-primary">
              ${formatSuffix(depositUSDValue, "money")}
            </div>
            <Image
              src={depositToken.icon}
              alt={depositToken.symbol}
              width={20}
              height={20}
            />
          </div>
        </div>
        <div className="flex flex-col justify-self-end">
          <div className="text-sm text-gray-600">You borrow:</div>
          <div className="flex flex-row items-center gap-1">
            <div className="text-lg font-bold text-primary">
              ${formatSuffix(borrowUSDValue, "money")}
            </div>
            <Image
              src={borrowToken.icon}
              alt={borrowToken.symbol}
              width={20}
              height={20}
            />
          </div>
        </div>
        <div className="flex flex-col">
          <div className="text-sm text-gray-600">You deposit:</div>
          <div className="flex flex-row items-center gap-3">
            <div className="text-lg font-bold text-primary">
              {vaultTokenUSDMinValue.toFixed(2) !=
              vaultTokenUSDMaxValue.toFixed(2)
                ? `$${formatSuffix(
                    vaultTokenUSDMinValue,
                    "money"
                  )} - $${formatSuffix(vaultTokenUSDMaxValue, "money")}`
                : `$${formatSuffix(vaultTokenUSDMinValue, "money")}`}
            </div>
            <DoubleAvatar
              firstSrc={vaultToken.pair![0].icon}
              secondSrc={vaultToken.pair![1].icon}
              firstAlt={vaultToken.pair![0].symbol}
              secondAlt={vaultToken.pair![1].symbol}
              size="medium"
            />
          </div>
        </div>
        <div className="flex flex-col justify-self-end">
          <div className="text-sm text-gray-600">Protocol Fee</div>
          <div className="flex flex-row items-center gap-1">
            <div className="text-lg font-bold text-primary">
              ${formatSuffix(feeUSDValue, "money")}
            </div>
            <Image
              src={depositToken.icon}
              alt={depositToken.symbol}
              width={20}
              height={20}
            />
          </div>
        </div>
      </div>
      {needsOdosQuote && (
        <div className="flex flex-row items-center justify-between">
          <div className="text-sm text-gray-600">Slippage Tolerance:</div>
          <div className="flex flex-row items-center gap-2">
            <input
              type="number"
              value={slippage}
              onChange={(e) => handleChange(e)}
              className="w-20 p-2 text-right bg-transparent border-b border-primary text-primary"
            />
            <span className="text-primary">%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const LoopingButton = ({ onClick }: { onClick: (e: any) => void }) => {
  return (
    <div className="flex justify-center">
      <Button
        onClick={(e) => {
          onClick(e);
        }}
        variant="default"
        className="bg-primary w-[100px] flex flex-row items-center justify-center"
      >
        <Image
          src={"/icons/clear-infinity.svg"}
          alt="Infinity"
          width={40}
          height={40}
        />
      </Button>
    </div>
  );
};

const StepDeposit = ({
  depositToken,
  setDepositToken,
  depositInfo,
  depositAmount,
  setDepositAmount,
}: {
  depositToken: Token;
  setDepositToken: (t: Token) => void;
  depositInfo: Record<
    Address,
    { token: Token; balance: bigint; valueUSD: number }
  >;
  depositAmount: string;
  setDepositAmount: (val: string) => void;
}) => {
  const info = depositInfo[depositToken.address];
  if (!info) return null;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row items-center justify-between text-primary">
        <h3 className="text-lg font-semibold">Supply Token: </h3>
        <div className="flex items-center justify-center  p-2 space-x-2">
          {Object.values(depositInfo).map(({ token, valueUSD }) => (
            <button
              key={token.address}
              onClick={() => setDepositToken(token)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors space-y-1 w-[100px] ${
                depositToken?.address === token.address
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-transparent text-primary hover:bg-primary/20"
              }`}
            >
              {token.icon && (
                <img
                  src={token.icon}
                  alt={token.symbol}
                  className="w-8 h-8 object-contain"
                />
              )}
              <span className="text-sm font-medium">{token.symbol}</span>
              <span className="text-xs">
                ${formatSuffix(valueUSD, "money")}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <MaxInputWithSlider
          amount={depositAmount}
          onChange={setDepositAmount}
          max={bnToStr(info.balance, info.token.decimals)}
          precision={info.token.decimals}
        />
      </div>
    </div>
  );
};

const StepBorrow = ({
  borrowToken,
  setBorrowToken,
  borrowInfo,
  borrowAmount,
  setBorrowAmount,
  boostedAPR,
}: {
  borrowToken: Token;
  setBorrowToken: (t: Token) => void;
  borrowInfo: Record<
    Address,
    { token: Token; maxLeverage: number; available: boolean }
  >;
  borrowAmount: string;
  setBorrowAmount: (val: string) => void;
  boostedAPR: number;
}) => {
  const info = borrowInfo[borrowToken.address];
  if (!info) return null;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row items-center justify-between text-primary">
        <h3 className="text-lg font-semibold">Borrow Token:</h3>
        <div className="flex items-center justify-center p-2 space-x-2">
          {Object.values(borrowInfo).map(
            ({ token, maxLeverage, available }) => (
              <button
                key={token.address}
                onClick={() => available && setBorrowToken(token)}
                disabled={!available}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors space-y-1 w-[100px] ${
                  borrowToken?.address === token.address
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-transparent text-primary hover:bg-primary/20"
                } ${!available ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {token.icon && (
                  <img
                    src={token.icon}
                    alt={token.symbol}
                    className="w-8 h-8 object-contain"
                  />
                )}
                <span className="text-sm font-medium">{token.symbol}</span>
                <span className="text-xs">{maxLeverage}x</span>
              </button>
            )
          )}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <LeverageSlider
          maxLeverage={info.maxLeverage}
          value={borrowAmount}
          onChange={setBorrowAmount}
          boostedAPR={boostedAPR}
        />
      </div>
    </div>
  );
};

const StepSelectVault = ({
  selectedVault,
  setSelectedVault,
  availableVaults,
}: {
  selectedVault: Token;
  setSelectedVault: (t: Token) => void;
  availableVaults: Token[];
}) => {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Vault to deposit in</h2>
      <div className="flex flex-wrap gap-2">
        {availableVaults.map((vault) => {
          return (
            <button
              key={vault.address}
              onClick={() => setSelectedVault(vault)}
              className={`px-3 py-2 border rounded ${
                selectedVault.address === vault.address
                  ? "border-blue-500 border-4"
                  : ""
              }`}
            >
              <div className="font-bold">{vault.name}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ExecuteButton = ({
  hasEnoughAllowanceOne,
  approveOne,
  isApproveConfirming,
  isApprovePending,
  hasEnoughVDTAllowance,
  approveVDT,
  isApproveVDTPending,
  isApproveVDTConfirming,
  confirm,
  isPending,
  isConfirming,
  isOdosQuoteLoading,
  isSlippageEqualToDebouncedSlippage,
  updateSlippage,
}: {
  hasEnoughAllowanceOne: boolean;
  approveOne: () => void;
  isApproveConfirming: boolean;
  isApprovePending: boolean;
  hasEnoughVDTAllowance: boolean;
  approveVDT: () => void;
  isApproveVDTPending: boolean;
  isApproveVDTConfirming: boolean;
  confirm: () => void;
  isPending: boolean;
  isConfirming: boolean;
  isOdosQuoteLoading: boolean;
  isSlippageEqualToDebouncedSlippage: boolean;
  updateSlippage: () => void;
}) => (
  <>
    {!isSlippageEqualToDebouncedSlippage && (
      <ChainButton
        className="w-full flex items-center justify-center gap-2"
        onClick={updateSlippage}
        disabled={isOdosQuoteLoading}
      >
        <CheckCheck className="w-5 h-5" />
        {isOdosQuoteLoading ? "Refetching Odos Quote..." : "Refetch ODOS quote"}
      </ChainButton>
    )}
    {!hasEnoughAllowanceOne && isSlippageEqualToDebouncedSlippage && (
      <ChainButton
        className="w-full flex items-center justify-center gap-2"
        onClick={approveOne}
        disabled={isApprovePending || isOdosQuoteLoading}
      >
        <CheckCheck className="w-5 h-5" />
        {isOdosQuoteLoading
          ? "Fetching Odos Quote..."
          : isApprovePending || isApproveConfirming
          ? "Approving..."
          : "Approve 1/2"}
      </ChainButton>
    )}
    {!hasEnoughVDTAllowance &&
      hasEnoughAllowanceOne &&
      isSlippageEqualToDebouncedSlippage && (
        <ChainButton
          className="w-full flex items-center justify-center gap-2"
          onClick={approveVDT}
          disabled={isApproveVDTPending || isOdosQuoteLoading}
        >
          <CheckCheck className="w-5 h-5" />
          {isOdosQuoteLoading
            ? "Fetching Odos Quote..."
            : isApproveVDTPending || isApproveVDTConfirming
            ? "Approving..."
            : "Approve 2/2"}
        </ChainButton>
      )}
    {hasEnoughAllowanceOne &&
      hasEnoughVDTAllowance &&
      isSlippageEqualToDebouncedSlippage && (
        <ChainButton
          className="w-full flex items-center justify-center gap-2"
          onClick={confirm}
          disabled={isPending || isOdosQuoteLoading}
        >
          <Deposit className="w-5 h-5" />
          {isOdosQuoteLoading
            ? "Fetching Odos Quote..."
            : isConfirming || isPending
            ? "Leveraging..."
            : "Leverage"}
        </ChainButton>
      )}
  </>
);

export const LoopingModal = () => {
  const { params, updateParams } = useQueryParams();
  const { modal, vault, supplyToken, borrowToken } = params;
  const pathname = usePathname();

  const { marketID } = useSelectedMarket();
  const fullReplace = pathname !== "/markets";

  if (modal !== "leverage") return null;

  const vaultToken = getTokenByAddress(vault);
  const supplyTokenObj = getTokenByAddress(supplyToken);
  const borrowTokenObj = getTokenByAddress(borrowToken);

  const marketDefinition = MARKET_DEFINITIONS[marketID];

  if (!marketDefinition?.LOOPING) return null;

  const isValidVault = !!vaultToken?.pair;
  const depositTokens = marketDefinition.LOOPING.IO;

  if (!isValidVault) return null;

  const fallbackSupply = depositTokens[0];
  const fallbackBorrow = depositTokens[0];

  const validSupply =
    depositTokens.find((t) => t.address === supplyToken) || fallbackSupply;
  const validBorrow =
    depositTokens.find((t) => t.address === borrowToken) || fallbackBorrow;

  if (
    !supplyTokenObj ||
    !borrowTokenObj ||
    validSupply.address !== supplyTokenObj.address ||
    validBorrow.address !== borrowTokenObj.address
  ) {
    updateParams({
      vault: vaultToken.address,
      supplyToken: validSupply.address,
      borrowToken: validBorrow.address,
      ...(fullReplace ? { market: marketID } : {}),
    });
    return null;
  }

  if (
    supplyTokenObj.address != borrowTokenObj.address &&
    borrowTokenObj.address != vaultToken.pair![0].address &&
    supplyTokenObj.address != vaultToken.pair![0].address
  ) {
    updateParams({
      borrowToken: vaultToken.pair![0].address,
    });
  }

  return (
    <InnerLoopingModal
      marketID={marketID}
      vault={vaultToken}
      supplyToken={validSupply}
      borrowToken={validBorrow}
      updateParams={updateParams}
      fullReplace={fullReplace}
    />
  );
};

const InnerLoopingModal = ({
  marketID,
  vault,
  supplyToken,
  borrowToken,
  updateParams,
  fullReplace,
}: {
  marketID: string;
  vault: Token;
  supplyToken: Token;
  borrowToken: Token;
  updateParams: (params: Record<string, QueryValue>) => void;
  fullReplace?: boolean;
}) => {
  const {
    depositInfo,
    depositAmount,
    setDepositAmount,

    borrowInfo,
    leverage,
    setLeverage,

    queryOdosQuote,
    isOdosQuoteError,
    reviewData,
    slippage,
    setSlippage,
    debouncedSlippage,
    setDebouncedSlippage,
    needsOdosQuote,

    hasEnoughAllowanceOne,
    approveOne,
    isApproveConfirming,
    isApprovePending,

    hasEnoughVDTAllowance,
    approveVDT,
    isApproveVDTPending,
    isApproveVDTConfirming,

    confirm,
    isPending,
    isConfirming,
    isOdosQuoteLoading,
    isConfirmed,
  } = useLooping(marketID, vault, supplyToken, borrowToken);

  const { market } = useMarket(marketID, vault);

  const [step, setStep] = useState(0);

  const handleNext = async () => {
    if (Number(depositAmount) === 0 || Number(leverage) === 0) return;
    await queryOdosQuote();
    setTimeout(() => {
      if (!isOdosQuoteError) setStep(1);
    }, 200);
  };

  const handlePrev = () => setStep(0);

  const handleClose = () =>
    updateParams({
      modal: null,
      vault: null,
      supplyToken: null,
      borrowToken: null,
      ...(fullReplace ? { market: null } : {}),
    });

  useEffect(() => {
    if (isConfirmed) {
      handleClose();
      setTimeout(() => setStep(0), 100);
    }
  }, [isConfirmed]);

  return (
    <Dialog
      open
      onOpenChange={(open: boolean) => {
        if (!open) {
          handleClose();
          setTimeout(() => setStep(0), 100);
        }
      }}
    >
      <VisuallyHidden>
        <DialogTitle>Looping</DialogTitle>
      </VisuallyHidden>

      <DialogContent
        autoFocus={false}
        className="bg-card text-primary overflow-y-auto select-none"
      >
        <div tabIndex={0} />
        <div className="absolute left-5 top-5">
          <Image src={vault.icon} alt="Vault Icon" width={30} height={30} />
        </div>

        <div className="absolute right-5 top-5">
          <Image
            src={"/icons/infinity.svg"}
            alt="Infinity"
            width={50}
            height={50}
          />
        </div>

        <div className="relative w-full flex items-center justify-center mt-6">
          <div className="flex items-center gap-8">
            <DoubleAvatar
              firstSrc={vault.pair![0].icon}
              secondSrc={vault.pair![1].icon}
              firstAlt={vault.pair![0].symbol}
              secondAlt={vault.pair![1].symbol}
            />
            <div className="flex flex-col items-start gap-2">
              <span className="text-sm font-semibold">{vault.name}</span>
              <span className="text-xs font-light">{vault.symbol}</span>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
          <Image
            src="/logo.svg"
            alt="Background Logo"
            className="opacity-10"
            width={500}
            height={500}
          />
        </div>

        <div className="relative z-10">
          <DialogHeader>
            <div className="text-sm flex flex-col gap-8 pt-4 text-primary">
              {step === 0 && (
                <>
                  <StepDeposit
                    depositToken={supplyToken}
                    setDepositToken={(t: Token) =>
                      updateParams({ supplyToken: t.address })
                    }
                    depositInfo={depositInfo}
                    depositAmount={depositAmount}
                    setDepositAmount={setDepositAmount}
                  />

                  <StepBorrow
                    borrowToken={borrowToken}
                    setBorrowToken={(t: Token) =>
                      updateParams({ borrowToken: t.address })
                    }
                    borrowInfo={borrowInfo}
                    borrowAmount={leverage}
                    setBorrowAmount={setLeverage}
                    boostedAPR={
                      (market?.supply.APR || 0) * Number(leverage) +
                      (borrowInfo[borrowToken.address.toLowerCase() as Address]
                        ?.borrowAPR || 0) *
                        (Number(leverage) - 1)
                    }
                  />
                  <div className="flex flex-row w-full">
                    <div className="w-full" />
                    <WrapIntoTooltip
                      content={
                        <div className="w-[145px]">
                          Needs supply {">0"} and leverage {">"}1.
                        </div>
                      }
                      enable={
                        Number(leverage) <= 1 || Number(depositAmount) === 0
                      }
                    >
                      <ChainButton
                        className="w-full flex gap-2"
                        onClick={handleNext}
                        disabled={
                          isOdosQuoteLoading ||
                          Number(leverage) <= 1 ||
                          Number(depositAmount) === 0
                        }
                      >
                        {isOdosQuoteLoading
                          ? "Fetching Odos Quote..."
                          : vault.pair![0].address.toLowerCase() ===
                              supplyToken.address.toLowerCase() &&
                            vault.pair![0].address.toLowerCase() ===
                              borrowToken.address.toLowerCase()
                          ? "Next"
                          : "Get Odos Quote"}
                      </ChainButton>
                    </WrapIntoTooltip>
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <ReviewSummary
                    {...reviewData}
                    depositToken={supplyToken}
                    borrowToken={borrowToken}
                    vaultToken={vault}
                    slippage={debouncedSlippage}
                    setSlippage={setDebouncedSlippage}
                    queryOdosQuote={queryOdosQuote}
                    isOdosQuoteLoading={isOdosQuoteLoading}
                    needsOdosQuote={needsOdosQuote}
                  />

                  <div className="flex flex-row w-full gap-2">
                    <ChainButton
                      className="w-full flex items-center justify-center gap-2"
                      onClick={handlePrev}
                    >
                      Prev
                    </ChainButton>

                    <ExecuteButton
                      hasEnoughAllowanceOne={hasEnoughAllowanceOne}
                      approveOne={approveOne}
                      isApproveConfirming={isApproveConfirming}
                      isApprovePending={isApprovePending}
                      hasEnoughVDTAllowance={hasEnoughVDTAllowance}
                      approveVDT={approveVDT}
                      isApproveVDTPending={isApproveVDTPending}
                      isApproveVDTConfirming={isApproveVDTConfirming}
                      confirm={confirm}
                      isPending={isPending}
                      isConfirming={isConfirming}
                      isOdosQuoteLoading={isOdosQuoteLoading}
                      isSlippageEqualToDebouncedSlippage={
                        Number(slippage) === Number(debouncedSlippage)
                      }
                      updateSlippage={() => {
                        setSlippage(debouncedSlippage);
                        queryOdosQuote(debouncedSlippage);
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </DialogHeader>
        </div>
      </DialogContent>
    </Dialog>
  );
};
