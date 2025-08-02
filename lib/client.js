import { createThirdwebClient } from "thirdweb";

/**
 * Create a singleton thirdweb client.
 *
 * The client is initialized with a clientId from your environment variables.  Per
 * the thirdweb v5 migration guide, you pass the client to individual
 * components (e.g. ConnectButton) rather than through the provider【866568320390362†L214-L224】.
 */
export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TW_CLIENT_ID,
});