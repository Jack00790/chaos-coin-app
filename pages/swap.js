import React from "react";
import { useActiveAccount } from "thirdweb/react";
import Navbar from "../components/Navbar";

export default function Swap() {
  const account = useActiveAccount();

  if (!account) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <h1 className="page-title">Swap Tokens</h1>
          <div className="card text-center">
            <h2 className="section-title">Connect Your Wallet</h2>
            <p className="text-gray mb-3">Please connect your wallet to start swapping</p>
          </div>
        </main>
      </div>
    );
  }

  // Uniswap URL with CHAOS token and AVAX (wrapped) prefilled
  const uniswapUrl = `https://app.uniswap.org/#/swap?inputCurrency=0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599&outputCurrency=${process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS}&chain=ethereum`;

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <h1 className="page-title">Swap Tokens</h1>

        <div className="card">
          <h2 className="section-title">Swap AVAX for CHAOS</h2>

          {/* Uniswap Embedded Interface */}
          <div style={{marginBottom: '2rem'}}>
            <iframe
              src={uniswapUrl}
              height="660px"
              width="100%"
              style={{
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: '12px',
                background: '#fff'
              }}
              title="Uniswap Swap Interface"
            />
          </div>

          {/* Instructions */}
          <div style={{padding: '1rem', background: 'rgba(16,185,129,0.1)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)'}}>
            <h3 style={{color: '#10b981', marginBottom: '1rem'}}>💱 How to Swap:</h3>
            <ol style={{paddingLeft: '1.5rem', lineHeight: '1.6'}}>
              <li>Connect your wallet to Uniswap (if not already connected)</li>
              <li>The interface is pre-configured for AVAX → CHAOS swap</li>
              <li>Enter the amount of AVAX you want to swap</li>
              <li>Review the exchange rate and slippage</li>
              <li>Click "Swap" and confirm the transaction</li>
              <li>Your CHAOS tokens will appear in your wallet</li>
            </ol>
          </div>

          {/* Alternative Tokens */}
          <div style={{marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px'}}>
            <h3 style={{marginBottom: '1rem'}}>Want to swap other tokens?</h3>
            <p style={{marginBottom: '1rem', color: '#6b7280'}}>
              You can change the input token in the Uniswap interface above to swap any supported token for CHAOS.
            </p>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', fontSize: '0.9rem'}}>
              <div style={{textAlign: 'center', padding: '0.5rem', background: 'rgba(16,185,129,0.1)', borderRadius: '8px'}}>
                <div>ETH</div>
                <div style={{fontSize: '0.8rem', color: '#6b7280'}}>Ethereum</div>
              </div>
              <div style={{textAlign: 'center', padding: '0.5rem', background: 'rgba(16,185,129,0.1)', borderRadius: '8px'}}>
                <div>USDC</div>
                <div style={{fontSize: '0.8rem', color: '#6b7280'}}>USD Coin</div>
              </div>
              <div style={{textAlign: 'center', padding: '0.5rem', background: 'rgba(16,185,129,0.1)', borderRadius: '8px'}}>
                <div>USDT</div>
                <div style={{fontSize: '0.8rem', color: '#6b7280'}}>Tether</div>
              </div>
              <div style={{textAlign: 'center', padding: '0.5rem', background: 'rgba(16,185,129,0.1)', borderRadius: '8px'}}>
                <div>WBTC</div>
                <div style={{fontSize: '0.8rem', color: '#6b7280'}}>Wrapped Bitcoin</div>
              </div>
            </div>
          </div>

          {/* Token Contract Info */}
          <div style={{marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px'}}>
            <h3 style={{marginBottom: '1rem'}}>CHAOS Token Contract:</h3>
            <div style={{fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '0.9rem', color: '#10b981'}}>
              {process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}