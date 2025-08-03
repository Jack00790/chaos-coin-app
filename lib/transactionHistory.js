
import { createThirdwebClient } from "thirdweb";
import { defineChain } from "thirdweb/chains";

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TW_CLIENT_ID,
});

// Get transaction history from blockchain
export const getTransactionHistory = async (walletAddress, contractAddress) => {
  try {
    // Using Etherscan API for transaction history
    const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || 'YourEtherscanAPIKey';
    const chainId = process.env.NEXT_PUBLIC_CHAIN;
    
    let baseUrl = 'https://api.etherscan.io/api';
    if (chainId === 'sepolia') {
      baseUrl = 'https://api-sepolia.etherscan.io/api';
    } else if (chainId === 'polygon') {
      baseUrl = 'https://api.polygonscan.com/api';
    }

    const response = await fetch(
      `${baseUrl}?module=account&action=tokentx&contractaddress=${contractAddress}&address=${walletAddress}&page=1&offset=100&sort=desc&apikey=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.status === '1' && data.result) {
      return data.result.map(tx => ({
        hash: tx.hash,
        type: tx.to.toLowerCase() === walletAddress.toLowerCase() ? 'Buy' : 'Sell',
        amount: (parseInt(tx.value) / 10**18).toFixed(4),
        timestamp: new Date(parseInt(tx.timeStamp) * 1000),
        date: new Date(parseInt(tx.timeStamp) * 1000).toLocaleDateString(),
        status: 'Completed',
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        from: tx.from,
        to: tx.to
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
};

// Real-time balance monitoring
export const subscribeToBalanceUpdates = (walletAddress, contractAddress, callback) => {
  const pollInterval = 10000; // 10 seconds
  
  const poll = async () => {
    try {
      const transactions = await getTransactionHistory(walletAddress, contractAddress);
      callback(transactions);
    } catch (error) {
      console.error('Error polling transactions:', error);
    }
  };
  
  const intervalId = setInterval(poll, pollInterval);
  poll(); // Initial call
  
  return () => clearInterval(intervalId);
};
