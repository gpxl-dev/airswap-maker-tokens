import { getDefaultProvider, Contract } from "ethers";
import registryAbi from "./registryAbi";
const registryAddress = "0x8f9da6d38939411340b19401e8c54ea1f51b8f95";

const registryContract = new Contract(
  registryAddress,
  registryAbi,
  getDefaultProvider()
);

export const getSupoprtedTokensForStaker: (
  staker: string
) => Promise<string[]> = async (staker) => {
  try {
    const supportedTokens: string[] = await registryContract.getSupportedTokens(
      staker
    );
    return supportedTokens;
  } catch (e) {
    console.error("Error getting supported tokens", e);
    return [];
  }
};
