import { Fragment } from "react";
import classNames from "classnames";
import { useEffect, useState } from "react";
import { getSupoprtedTokensForStaker } from "./registryApi";
import { TokenInfo } from "@uniswap/token-lists";
import { fetchTokens, findTokenByAddress } from "@airswap/metadata";
import truncateEthAddress from "truncate-eth-address";

function App() {
  const [tokens, setTokens] = useState<TokenInfo[] | null>(null);
  const [stakers] = useState<string[]>([
    "0x7bE351f273Ef11892E4125045D363F56Cb755966",
    "0x00000000000080c886232e9b7ebbfb942b5987aa",
    "0xa5d07e978398eb1715056d3ca5cb31035c02fdad",
    "0x0000006daea1723962647b7e189d311d757fb793",
    "0x567cd244d9f05bbfaf6fd421544f6d9faecada61",
  ]);
  const [stakerTokens, setstakerTokens] = useState<{
    [staker: string]: string[];
  }>({});
  const [stakerTokensLoading, setstakerTokensLoading] = useState<{
    [staker: string]: boolean;
  }>({});

  // Load tokens on load
  useEffect(() => {
    fetchTokens(1).then((tokens) => {
      setTokens(tokens);
    });
  }, []);

  useEffect(() => {
    stakers.forEach(async (staker) => {
      if (stakerTokensLoading[staker] == null) {
        setstakerTokensLoading((prev) => ({ ...prev, [staker]: true }));
        const stakerTokens = await getSupoprtedTokensForStaker(staker);
        setstakerTokensLoading((prev) => ({ ...prev, [staker]: false }));
        setstakerTokens((prev) => ({ ...prev, [staker]: stakerTokens }));
      }
    });
  }, [stakers, stakerTokensLoading]);
  return (
    <div
      className={classNames(
        "flex flex-col h-full p-4",
        "text-white",
        "bg-gradient-to-br from-gray-600 via-teal-700 to-gray-800"
      )}
    >
      {!tokens ? (
        "Loading..."
      ) : (
        <div
          className="font-mono grid grid-cols-2 max-w-xl gap-x-8 gap-y-4"
          style={{
            gridTemplateColumns: "auto 1fr",
          }}
        >
          <span className="font-bold">Maker</span>
          <span className="font-bold">Supported tokens</span>
          {stakers.map((staker) => {
            const isLoading = stakerTokensLoading[staker];
            const supportedTokens = stakerTokens[staker];
            let tokenContent;

            if (!isLoading && supportedTokens) {
              const tokenSymbols = supportedTokens.map((tokenAddress) => {
                const lowerCaseTokenAddress = tokenAddress.toLowerCase();
                const token = findTokenByAddress(lowerCaseTokenAddress, tokens);
                return token?.symbol || "???";
              });
              tokenContent = <div>{tokenSymbols.join(", ")}</div>;
            } else {
              tokenContent = <div>Loading</div>;
            }
            return (
              <Fragment key={staker}>
                <div>{truncateEthAddress(staker)}</div>
                <div>{tokenContent}</div>
              </Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default App;
