import { getContract } from "thirdweb";
import {
  ethereum,
  sepolia,
  polygon,
  mumbai,
  optimism,
  base,
  avalancheFuji,
} from "thirdweb/chains";
import { client } from "./client";

/**
 * A simple lookup map from string identifiers to thirdweb chain objects.
 *
 * The keys in this map correspond to the values accepted by the
 * `NEXT_PUBLIC_CHAIN` environment variable.  Update this list if you deploy
 * Chaos Coin to a different chain.
 */
const CHAIN_MAP = {
  ethereum,
  sepolia,
  polygon,
  mumbai,
  optimism,
  base,
  fuji: avalancheFuji,
};

/**
 * Returns the chain object for the given environment variable.  Defaults to
 * `sepolia` if the provided key is unknown.  Using testnets by default avoids
 * accidental interactions with mainnet while developing.
 */
function getActiveChain() {
  const key = process.env.NEXT_PUBLIC_CHAIN;
  return CHAIN_MAP[key] || sepolia;
}

/**
 * Export a configured contract instance.
 *
 * The contract address is pulled from `NEXT_PUBLIC_CHAOS_COIN_ADDRESS`.  You
 * should ensure this address points to an ERC‑20 contract that supports
 * minting and transferring.  The chain is selected via `NEXT_PUBLIC_CHAIN`.
 */
export const chaosCoinContract = getContract({
  address: process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS,
  chain: getActiveChain(),
  client,
});

export { getActiveChain };