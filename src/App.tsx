import { Fragment, useReducer } from "react";
import classNames from "classnames";
import { useEffect } from "react";
import { getStakerTokens, getURLsForStakers } from "./registryApi";
import { TokenInfo } from "@uniswap/token-lists";
import { fetchTokens, findTokenByAddress } from "@airswap/metadata";
import truncateEthAddress from "truncate-eth-address";
import { Tooltip } from "react-tippy";
import { CgExternal } from "react-icons/cg";

import "react-tippy/dist/tippy.css";

type AppState = {
  stakers: {
    [address: string]: {
      supportedTokens: string[];
      url: string;
    };
  };
  tokenInfo: TokenInfo[];
};

const initialState: AppState = { stakers: {}, tokenInfo: [] };

const reducer = (state: AppState, action: { type: string; payload: any }) => {
  const { type, payload } = action;
  switch (type) {
    case "set_supported_tokens": {
      const stakerTokens: Record<string, string[]> = payload;
      const stakers = Object.keys(stakerTokens);
      const newState = { ...state };
      stakers.forEach((stakerAddress) => {
        const supportedTokens = stakerTokens[stakerAddress];
        newState.stakers[stakerAddress] = {
          url: newState.stakers[stakerAddress]?.url || "",
          supportedTokens,
        };
      });
      return newState;
    }
    case "set_staker_urls": {
      const [addresses, urls]: [string[], string[]] = payload;
      const newState = { ...state };
      addresses.forEach((address, i) => {
        newState.stakers[address].url = urls[i];
      });
      return newState;
    }
    case "set_token_info":
      return { ...state, tokenInfo: payload };

    default:
      return state;
  }
};

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  // Load tokens on load
  useEffect(() => {
    fetchTokens(1).then((tokens) => {
      dispatch({ type: "set_token_info", payload: tokens });
    });

    const getTokensAndUrls = async () => {
      const stakerTokens = await getStakerTokens();
      dispatch({ type: "set_supported_tokens", payload: stakerTokens });
      const stakers = Object.keys(stakerTokens);
      const urls = await getURLsForStakers(stakers);
      dispatch({ type: "set_staker_urls", payload: [stakers, urls] });
    };
    getTokensAndUrls();
  }, []);

  const stakerAddressess = Object.keys(state.stakers);

  return (
    <div
      className={classNames(
        "flex flex-col h-full p-4 pt-8",
        "text-white",
        "bg-gradient-to-br from-gray-600 via-teal-700 to-gray-800"
      )}
    >
      {!stakerAddressess.length ? (
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
          {stakerAddressess.map((staker, i) => {
            const supportedTokens = state.stakers[staker].supportedTokens;
            let tokenContent;

            tokenContent = (
              <div>
                {supportedTokens.map((tokenAddress, i) => {
                  const isLast = i === supportedTokens.length - 1;
                  const lowerCaseTokenAddress = tokenAddress.toLowerCase();
                  const token = findTokenByAddress(
                    lowerCaseTokenAddress,
                    state.tokenInfo
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
            return (
              <Fragment key={staker}>
                <div className="flex flex-col">
                  <span>{truncateEthAddress(staker)}</span>
                  <span className="text-sm">{state.stakers[staker].url}</span>
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
