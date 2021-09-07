import { getDefaultProvider, Contract, Event } from "ethers";
import registryAbi from "./registryAbi";
const registryAddress = "0x8f9da6d38939411340b19401e8c54ea1f51b8f95";

const registryContract = new Contract(
  registryAddress,
  registryAbi,
  getDefaultProvider()
);

export async function getStakerTokens() {
  const addTokensEventFilter = registryContract.filters.AddTokens();
  const removeTokensEventFilter = registryContract.filters.RemoveTokens();

  // Fetch all AddTokens and RemoveTokens events from the registry
  const [addEvents, removeEvents] = await Promise.all([
    registryContract.queryFilter(addTokensEventFilter),
    registryContract.queryFilter(removeTokensEventFilter),
  ]);

  // Order matters here, so order AddTokens and RemoveTokens chronologically
  const sortedEvents: Event[] = [...addEvents, ...removeEvents]
    .filter((log) => !log.removed)
    .sort((a, b) => {
      // Sort by oldest first. If they're not in the same block, sort based
      // on blocknumber
      if (a.blockNumber !== b.blockNumber) return a.blockNumber - b.blockNumber;
      // if in the same block, sort by the index of the log in the block
      return a.logIndex - b.logIndex;
    });

  // Hold a list of tokens for each staker.
  const stakerTokens: Record<string, string[]> = {};

  sortedEvents.forEach((log) => {
    if (!log.args) return;
    // @ts-ignore (args are not typed)
    const [staker, tokens] = log.args as [string, string[]];
    const lowerCasedTokens = tokens.map((t) => t.toLowerCase());
    if (log.event === "AddTokens") {
      // Adding tokens
      stakerTokens[staker] = (stakerTokens[staker] || []).concat(
        lowerCasedTokens
      );
    } else {
      // Removing tokens
      stakerTokens[staker] = (stakerTokens[staker] || []).filter(
        (token) => !lowerCasedTokens.includes(token)
      );
    }
  });

  return stakerTokens;
}

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

export const getURLsForStakers: (stakers: string[]) => Promise<string[]> =
  async (stakers) => {
    try {
      const urls: string[] = await registryContract.getURLsForStakers(stakers);
      return urls;
    } catch (e) {
      console.error("Error getting staker urls", e);
      return [];
    }
  };
