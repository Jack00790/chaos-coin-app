
import { ethers } from "ethers";
import { createThirdwebClient, getContract } from "thirdweb";
import { avalanche } from "thirdweb/chains";
import { transfer } from "thirdweb/extensions/erc20";
import { privateKeyToAccount } from "thirdweb/wallets";

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TW_CLIENT_ID,
});

// Security validation
const validateWebhook = (req) => {
  // Verify webhook signature from ThirdWeb
  const signature = req.headers['x-thirdweb-signature'];
  const webhookSecret = process.env.THIRDWEB_WEBHOOK_SECRET;
  
  if (!signature || !webhookSecret) {
    throw new Error('Invalid webhook signature');
  }
  
  // Additional signature verification logic here
  return true;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate webhook authenticity
    validateWebhook(req);
    
    const { paymentData } = req.body;
    
    // Validate payment data
    if (!paymentData || !paymentData.buyerAddress || !paymentData.amount) {
      return res.status(400).json({ error: 'Invalid payment data' });
    }

    const {
      buyerAddress,
      amount, // USD amount paid
      transactionHash,
      paymentStatus
    } = paymentData;

    // Only process successful payments
    if (paymentStatus !== 'completed') {
      return res.status(200).json({ message: 'Payment not completed yet' });
    }

    // Calculate token amount based on current price
    const tokenPrice = await getCurrentTokenPrice();
    const tokenAmount = (parseFloat(amount) / tokenPrice).toString();

    // Get treasury account from private key
    const treasuryAccount = privateKeyToAccount({
      client,
      privateKey: process.env.TREASURY_PRIVATE_KEY, // Store securely in secrets
    });

    // Create contract instance
    const contract = getContract({
      client,
      chain: avalanche,
      address: process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS,
    });

    // Prepare and send token transfer
    const transaction = transfer({
      contract,
      to: buyerAddress,
      amount: ethers.parseEther(tokenAmount),
    });

    // Execute transaction from treasury wallet
    const result = await transaction.send({
      account: treasuryAccount,
    });

    // Log successful transfer
    console.log(`Tokens sent: ${tokenAmount} CHAOS to ${buyerAddress}`);
    console.log(`Transaction hash: ${result.transactionHash}`);

    // Store transaction record
    await storeTransactionRecord({
      buyerAddress,
      usdAmount: amount,
      tokenAmount,
      paymentTxHash: transactionHash,
      transferTxHash: result.transactionHash,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      tokenAmount,
      transferTxHash: result.transactionHash,
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// Helper function to get current token price
async function getCurrentTokenPrice() {
  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS}`
    );
    const data = await response.json();
    return data.pairs?.[0]?.priceUsd || 0.000001;
  } catch {
    return 0.000001; // Fallback price
  }
}

// Helper function to store transaction records
async function storeTransactionRecord(record) {
  // You can implement database storage here
  // For now, just log to console
  console.log('Transaction record:', record);
}
