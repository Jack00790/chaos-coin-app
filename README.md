# Chaos Coin App

This repository contains a lightweight, Robinhood‑style web3 application for interacting with an ERC‑20 token called **Chaos Coin**.  It is built with [Next.js](https://nextjs.org/) and uses the [thirdweb](https://portal.thirdweb.com/) SDK v5 to connect wallets, read smart‑contract state and send transactions.  The intent is to provide a friendly, easy‑to‑use interface that even beginners can operate.

## Features

* **Connect wallets easily.**  The app uses thirdweb’s `ConnectButton` component and a client configured with your own thirdweb `clientId`.  According to the migration guide for SDK v5, you no longer pass configuration through the provider; instead you create a client and pass it directly to the button【866568320390362†L214-L224】.
* **Read contract state.**  Token metadata such as total supply and the user’s balance are fetched using thirdweb’s new `useReadContract` hook together with the ERC‑20 extensions.  The migration guide explains that in v5 you call `useReadContract` with a prepared extension or function signature【644630468887960†L232-L249】.
* **Mint (buy) tokens.**  Buying Chaos Coin is performed by calling the ERC‑20 extension `mintTo`.  This prepares a transaction that mints tokens to the user’s address【408339710262257†L194-L208】.  The prepared transaction is sent to the blockchain via thirdweb’s `TransactionButton`, which handles network switching and transaction state for you【622043461082774†L138-L180】.
* **Transfer (sell) tokens.**  Selling is implemented using the ERC‑20 `transfer` extension.  Tokens are transferred from the user to a configurable treasury address【582303272244819†L1434-L1453】.  You can adjust the logic here to burn tokens or interact with a more complex marketplace smart contract if needed.
* **Secure by design.**  All sensitive configuration such as the thirdweb `clientId`, contract addresses and chain names are pulled from environment variables.  No private keys or secrets are stored in the repository.  User input is validated to ensure only positive numeric values are accepted.

## Prerequisites

Before running the app you will need:

1. A [thirdweb](https://thirdweb.com/) account with a registered **Client ID**.  The React SDK requires a client for wallet connection; you can obtain one from the thirdweb dashboard.
2. A deployed ERC‑20 contract that supports `mintTo` and `transfer` (the [TokenERC20](https://portal.thirdweb.com/contracts/publish?contract=ERC20) contract deployed via thirdweb works well).  Note the contract address and the chain it is deployed on.
3. A treasury (or burn) address to receive tokens when users sell their Chaos Coin.

## Getting Started

1. **Clone the repository** and install dependencies:

   ```bash
   git clone <your-fork-url>
   cd chaos-coin-app
   npm install
   ```

2. **Configure environment variables.**  Copy `.env.example` to `.env.local` and fill in your values:

   ```bash
   cp .env.example .env.local
   # then edit .env.local in your editor
   ```

   * `NEXT_PUBLIC_TW_CLIENT_ID` – Your thirdweb client ID.
   * `NEXT_PUBLIC_CHAOS_COIN_ADDRESS` – Address of your ERC‑20 contract.
   * `NEXT_PUBLIC_CHAIN` – The chain the contract is deployed on (e.g. `sepolia`, `ethereum`, `polygon`).
   * `NEXT_PUBLIC_TREASURY_ADDRESS` – Address to receive tokens when selling.

3. **Run the development server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.  You should see the Chaos Coin dashboard with a wallet connect button.

4. **Build for production:**

   ```bash
   npm run build
   npm start
   ```

## Security & Best Practices

* **Use environment variables.**  Never hard‑code secret keys or addresses in the front‑end.  Thirdweb’s client is created using `process.env.NEXT_PUBLIC_TW_CLIENT_ID`, as recommended in the migration guide【866568320390362†L214-L224】.
* **Validate user input.**  The buy/sell forms coerce input into non‑negative numbers.  Transactions are only enabled when valid amounts are entered and a wallet is connected.
* **Decouple logic from UI.**  Smart‑contract calls are encapsulated within `lib` modules and invoked through thirdweb’s `prepareContractCall` and `TransactionButton` components【622043461082774†L138-L180】.  This separation makes it easier to audit and test the code.
* **Beware of re‑entrancy and approvals.**  This sample application interacts only with the `mintTo` and `transfer` functions of an ERC‑20 token.  If you extend the contract or add staking/exchange functionality, follow secure coding practices and always audit your smart contracts.
* **Stay up‑to‑date.**  Thirdweb evolves quickly.  Check the latest documentation when upgrading packages to benefit from new features and security fixes.

## Folder Structure

```
chaos-coin-app/
  lib/              # thirdweb client & contract helpers
  components/       # React components (navigation, token info, forms)
  pages/            # Next.js pages
  styles/           # Global styles for the Robinhood‑inspired theme
  .env.example      # Example environment variables
  package.json      # Project metadata and scripts
  README.md         # This readme
```

## Next Steps

The current implementation provides basic minting and transferring functionality.  To extend Chaos Coin into a full‑fledged DeFi platform you might consider:

* Integrating with thirdweb’s **Swap API** to allow users to purchase Chaos Coin with other tokens or fiat.
* Building a **dashboard page** that displays historical price charts or transaction history.
* Adding a **notifications system** that informs users when their transactions are confirmed.

Pull requests are welcome!  Please open an issue first to discuss major changes.