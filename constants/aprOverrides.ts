import { MarketOverrides } from "@/types";

export const aprOverrides: MarketOverrides = {
  "0x5cd355cc40a0657c8c6b38f30bb0b66d3d638bcf": [
    {
      reason: "Merkl Rewards",
      totalDistributedUSD: 332,
      durationInDays: 7,
    },
  ],
  "0xeb5a1e2209bb52b2f6eb846ff15e221dc356c74a": [
    {
      reason: "Merkl Rewards",
      totalDistributedUSD: 332,
      durationInDays: 7,
    },
  ],
  "0xb31fb82458cad3bfa658659ef4a464176ff2f155": [
    {
      reason: "Merkl Rewards",
      totalDistributedUSD: 743,
      durationInDays: 7,
    },
  ],
  "0x6895439e47c362c1fbefccacb8f4cc0d36aef231": [
    {
      reason: "Merkl Rewards",
      totalDistributedUSD: 175,
      durationInDays: 7,
    },
  ],
  "0xa52d70eff22a8302e91a86f2ac9d95318063da10": [
    {
      reason: "Merkl Rewards",
      totalDistributedUSD: 743,
      durationInDays: 7,
    },
  ],
  "0xd320c24844eadb0710b31f92e4215dd7fe480460": [
    {
      reason: "Merkl Rewards",
      totalDistributedUSD: 175,
      durationInDays: 7,
    },
  ],
};

export const gaugeToATokens: { [key: string]: string[] } = {
  "0xd760791b29e7894fb827a94ca433254bb5afb653": [
    "0x5cd355cc40a0657c8c6b38f30bb0b66d3d638bcf",
    "0xeb5a1e2209bb52b2f6eb846ff15e221dc356c74a",
  ],
  "0xdd35c88b1754879ef86bbf3a24f81fcca5eb6b5d": [
    "0xb31fb82458cad3bfa658659ef4a464176ff2f155",
    "0xa52d70eff22a8302e91a86f2ac9d95318063da10",
  ],
  "0x0d13400cc7c46d77a43957fe614ba58c827dfde6": [
    "0x6895439e47c362c1fbefccacb8f4cc0d36aef231",
    "0xd320c24844eadb0710b31f92e4215dd7fe480460",
  ],
};
