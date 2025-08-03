import React, { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { TransactionButton } from "thirdweb/react";
import { transfer } from "thirdweb/extensions/erc20";
import { toWei } from "thirdweb/utils";
import { chaosCoinContract } from "../lib/contract";
import { getUniswapQuote, subscribeToPriceUpdates } from "../lib/uniswap";
import Navbar from "../components/Navbar";