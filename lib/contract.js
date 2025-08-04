
import { createThirdwebClient, getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";

// Create the thirdweb client
export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TW_CLIENT_ID,
});

// Enhanced chain definitions with fallbacks
const chainConfigurations = {
  ethereum: {
    id: 1,
    rpc: "https://cloudflare-eth.com",
    name: "Ethereum Mainnet",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorers: [{ name: "Etherscan", url: "https://etherscan.io" }],
  },
  sepolia: {
    id: 11155111,
    rpc: "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    name: "Sepolia Testnet",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    blockExplorers: [{ name: "Etherscan", url: "https://sepolia.etherscan.io" }],
    testnet: true,
  },
  polygon: {
    id: 137,
    rpc: "https://polygon-rpc.com",
    name: "Polygon Mainnet",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    blockExplorers: [{ name: "PolygonScan", url: "https://polygonscan.com" }],
  },
  mumbai: {
    id: 80001,
    rpc: "https://rpc-mumbai.maticvigil.com",
    name: "Mumbai Testnet",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    blockExplorers: [{ name: "PolygonScan", url: "https://mumbai.polygonscan.com" }],
    testnet: true,
  },
  avalanche: {
    id: 43114,
    rpc: "https://api.avax.network/ext/bc/C/rpc",
    name: "Avalanche C-Chain",
    nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
    blockExplorers: [{ name: "SnowTrace", url: "https://snowtrace.io" }],
  },
  fuji: {
    id: 43113,
    rpc: "https://api.avax-test.network/ext/bc/C/rpc",
    name: "Avalanche Fuji Testnet",
    nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
    blockExplorers: [{ name: "SnowTrace", url: "https://testnet.snowtrace.io" }],
    testnet: true,
  },
  arbitrum: {
    id: 42161,
    rpc: "https://arb1.arbitrum.io/rpc",
    name: "Arbitrum One",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorers: [{ name: "Arbiscan", url: "https://arbiscan.io" }],
  },
  optimism: {
    id: 10,
    rpc: "https://mainnet.optimism.io",
    name: "Optimism",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorers: [{ name: "Optimistic Etherscan", url: "https://optimistic.etherscan.io" }],
  },
};

// Get the current chain configuration
const getCurrentChain = () => {
  const chainName = process.env.NEXT_PUBLIC_CHAIN?.toLowerCase() || 'avalanche';
  const chainConfig = chainConfigurations[chainName];
  
  if (!chainConfig) {
    console.warn(`Unknown chain: ${chainName}, falling back to Avalanche`);
    return chainConfigurations.avalanche;
  }
  
  return chainConfig;
};

// Create the chain definition
export const activeChain = defineChain(getCurrentChain());

// Validate contract address
const validateContractAddress = (address) => {
  if (!address) {
    throw new Error("Contract address is not configured. Please check NEXT_PUBLIC_CHAOS_COIN_ADDRESS environment variable.");
  }
  
  if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error("Invalid contract address format. Must be a valid Ethereum address.");
  }
  
  return address;
};

// Create the contract with enhanced error handling
export const chaosCoinContract = (() => {
  try {
    const contractAddress = validateContractAddress(process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS);
    
    return getContract({
      client,
      chain: activeChain,
      address: contractAddress,
    });
  } catch (error) {
    console.error("Failed to create contract instance:", error);
    // Return a fallback contract that will fail gracefully
    return null;
  }
})();

// Export utilities
export const contractUtils = {
  getChainInfo: () => getCurrentChain(),
  getExplorerUrl: (txHash) => {
    const chain = getCurrentChain();
    const explorerUrl = chain.blockExplorers?.[0]?.url;
    return explorerUrl ? `${explorerUrl}/tx/${txHash}` : null;
  },
  getAddressUrl: (address) => {
    const chain = getCurrentChain();
    const explorerUrl = chain.blockExplorers?.[0]?.url;
    return explorerUrl ? `${explorerUrl}/address/${address}` : null;
  },
  isTestnet: () => getCurrentChain().testnet || false,
  formatAddress: (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  },
  validateAddress: (address) => {
    return address && address.match(/^0x[a-fA-F0-9]{40}$/);
  }
};

// Contract interaction helpers
export const contractHelpers = {
  // Safe contract call wrapper
  safeContractCall: async (contractCall) => {
    try {
      if (!chaosCoinContract) {
        throw new Error("Contract not initialized");
      }
      return await contractCall();
    } catch (error) {
      console.error("Contract call failed:", error);
      throw error;
    }
  },
  
  // Format token amounts
  formatTokenAmount: (amount, decimals = 18) => {
    if (!amount) return "0";
    try {
      const formatted = parseFloat(amount.toString()) / Math.pow(10, decimals);
      return formatted.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 6 
      });
    } catch (error) {
      console.error("Error formatting token amount:", error);
      return "0";
    }
  },
  
  // Parse token amounts
  parseTokenAmount: (amount, decimals = 18) => {
    if (!amount) return "0";
    try {
      return (parseFloat(amount) * Math.pow(10, decimals)).toString();
    } catch (error) {
      console.error("Error parsing token amount:", error);
      return "0";
    }
  }
};

// Export contract readiness check
export const isContractReady = () => {
  return chaosCoinContract !== null && process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS;
};

// Export environment info for debugging
export const environmentInfo = {
  clientId: process.env.NEXT_PUBLIC_TW_CLIENT_ID ? "✓ Configured" : "✗ Missing",
  contractAddress: process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS ? "✓ Configured" : "✗ Missing",
  chain: process.env.NEXT_PUBLIC_CHAIN || "avalanche",
  treasuryAddress: process.env.NEXT_PUBLIC_TREASURY_ADDRESS ? "✓ Configured" : "✗ Missing",
  ready: isContractReady()
};

console.log("🔧 Contract Configuration:", environmentInfo);
