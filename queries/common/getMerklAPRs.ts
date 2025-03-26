import { gaugeToATokens } from "@/constants";
import axios from "axios";
import { Address } from "viem";

export const getMerklAPRs = async () => {
  try {
    const response = await axios.get(
      "https://api.merkl.xyz/v4/opportunities?name=Vicuna&items=1000"
    );

    const aprs = response.data;
    const aprData: {
      [key: string]: { supply: number; borrow: number; vault: number };
    } = {};
    aprs.forEach(
      (data: {
        chainId: number;
        identifier: Address;
        name: string;
        apr: number;
      }) => {
        if (data.chainId !== 146) return;
        const tokenAddress = data.identifier.toLowerCase();
        if (!tokenAddress) return;

        if (!aprData[tokenAddress]) {
          aprData[tokenAddress] = { supply: 0, borrow: 0, vault: 0 };
        }

        if (data.name.toLowerCase().includes("supply")) {
          aprData[tokenAddress.toLowerCase()].supply += data.apr || 0;
        } else if (data.name.toLowerCase().includes("borrow")) {
          aprData[tokenAddress.toLowerCase()].borrow += data.apr || 0;
        } else if (data.name.toLowerCase().includes("vault")) {
          aprData[tokenAddress.toLowerCase()].vault += data.apr || 0;
        }
      }
    );

    const swapXResponse = await axios.get(
      "https://api.merkl.xyz/v4/opportunities?tags=SwapXGemsX&items=1000"
    );
    const swapXAprs = swapXResponse.data;
    swapXAprs.forEach(
      (data: {
        chainId: number;
        identifier: Address;
        name: string;
        apr: number;
      }) => {
        const tokenAddress = data.identifier.toLowerCase();
        if (!tokenAddress) return;
        const aTokens = gaugeToATokens[tokenAddress];
        if (!aTokens) return;
        for (const aToken of aTokens) {
          if (!aprData[aToken]) {
            aprData[aToken] = { supply: 0, borrow: 0, vault: 0 };
          }
          aprData[aToken].supply += data.apr || 0;
        }
      }
    );

    return aprData;
  } catch (error) {
    console.error("Error fetching Merkl market APRs:", error);
    return {};
  }
};
