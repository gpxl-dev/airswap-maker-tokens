import { Fragment } from "react";
import classNames from "classnames";
import { useEffect, useState } from "react";
import { getSupoprtedTokensForStaker, getURLsForStakers } from "./registryApi";
import { TokenInfo } from "@uniswap/token-lists";
import { fetchTokens, findTokenByAddress } from "@airswap/metadata";
import truncateEthAddress from "truncate-eth-address";
import { Tooltip } from "react-tippy";
import { CgExternal } from "react-icons/cg";

import "react-tippy/dist/tippy.css";

function App() {
  const [tokens, setTokens] = useState<TokenInfo[] | null>(null);
  const [stakerURLs, setStakerURLs] = useState<string[]>([]);
  const [stakers] = useState<string[]>([
    "0x7bE351f273Ef11892E4125045D363F56Cb755966",
    "0x00000000000080c886232e9b7ebbfb942b5987aa",
    "0x4f3a120e72c76c22ae802d129f599bfdbc31cb81",
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

    getURLsForStakers(stakers).then((urls) => setStakerURLs(urls));
  }, [stakers, stakerTokensLoading]);
  return (
    <div
      className={classNames(
        "flex flex-col h-full p-4 pt-8",
        "text-white",
        "bg-gradient-to-br from-gray-600 via-teal-700 to-gray-800"
      )}
    >
      {!tokens ? (
        "Loading..."
      ) : (
        <div
          className="font-mono grid grid-cols-2 gap-x-8 gap-y-4 max-w-6xl mx-auto"
          style={{
            gridTemplateColumns: "auto 1fr",
          }}
        >
          <span className="font-bold">Staker</span>
          <span className="font-bold">Supported tokens</span>
          {stakers.map((staker, i) => {
            const isLoading = stakerTokensLoading[staker];
            const supportedTokens = stakerTokens[staker];
            let tokenContent;

            if (!isLoading && supportedTokens) {
              tokenContent = (
                <div>
                  {supportedTokens.map((tokenAddress, i) => {
                    const isLast = i === supportedTokens.length - 1;
                    const lowerCaseTokenAddress = tokenAddress.toLowerCase();
                    const token = findTokenByAddress(
                      lowerCaseTokenAddress,
                      tokens
                    );
                    if (token) {
                      return token.symbol + (!isLast ? ", " : "");
                    } else {
                      return (
                        <span
                          className="cursor-pointer"
                          key={`${staker}-${tokenAddress}`}
                        >
                          <Tooltip
                            trigger="click"
                            interactive
                            position="bottom"
                            arrow={true}
                            arrowSize="big"
                            theme="dark"
                            html={
                              <div className="flex flex-col">
                                <span>{tokenAddress}</span>
                                <a
                                  className="underline"
                                  href={`https://etherscan.io/token/${tokenAddress}`}
                                >
                                  Click here to view on etherscan{" "}
                                  <CgExternal className="inline-block" />
                                </a>
                              </div>
                            }
                          >
                            <span>???</span>
                          </Tooltip>
                          {!isLast && ", "}
                        </span>
                      );
                    }
                  })}
                </div>
              );
            } else {
              tokenContent = <div>Loading</div>;
            }
            return (
              <Fragment key={staker}>
                <div className="flex flex-col">
                  <span>{truncateEthAddress(staker)}</span>
                  <span className="text-sm">{stakerURLs[i]}</span>
                </div>
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
