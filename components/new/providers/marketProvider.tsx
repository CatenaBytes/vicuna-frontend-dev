"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { DEFAULT_MARKET_ID, MARKET_DEFINITIONS } from "@/constants";
import { MarketDefinition } from "@/types";

interface MarketContextType {
  marketID: string;
  marketDefinition: MarketDefinition;
  availableMarkets: string[];
  setMarketID: (id: string) => void;
}

const SeletectMarketContext = createContext<MarketContextType | undefined>(
  undefined
);

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [marketID, setMarketID] = useState<string>(() => {
    let marketID = localStorage.getItem("marketID");
    return !marketID || !MARKET_DEFINITIONS[marketID]
      ? DEFAULT_MARKET_ID
      : marketID;
  });

  useEffect(() => {
    localStorage.setItem("marketID", marketID);
  }, [marketID]);

  const marketDefinition = MARKET_DEFINITIONS[marketID];
  const availableMarkets = Object.keys(MARKET_DEFINITIONS);

  return (
    <SeletectMarketContext.Provider
      value={{ marketID, marketDefinition, availableMarkets, setMarketID }}
    >
      {children}
    </SeletectMarketContext.Provider>
  );
};

export const contextUseSelectedMarket = (): MarketContextType => {
  const context = useContext(SeletectMarketContext);
  if (!context) {
    throw new Error("useMarket must be used within a MarketProvider");
  }
  return context;
};
