import "../styles/globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import Head from "next/head";

/**
 * The custom App component for Next.js.  It wraps every page with the
 * thirdweb provider so that hooks and UI components such as `ConnectButton` and
 * `TransactionButton` can access shared state.  In thirdweb v5, the
 * provider no longer accepts chain or client configuration; those values
 * should be supplied directly to the relevant components【866568320390362†L214-L224】.
 */
export default function MyApp({ Component, pageProps }) {
  return (
    <ThirdwebProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>
      <Component {...pageProps} />
    </ThirdwebProvider>
  );
}