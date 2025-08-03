
import React from "react";
import Navbar from "../components/Navbar";

export default function Swap() {
  // Uniswap widget URL with CHAOS token pre-filled
  const uniswapUrl = `https://app.uniswap.org/#/swap?exactField=input&exactAmount=10&inputCurrency=0x2170Ed0880ac9A755fd29B2688956BD959F933F8&outputCurrency=${process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS}&chain=ethereum`;

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <h1 className="page-title">Swap for Chaos Coin</h1>

        <div className="card">
          <h2 className="section-title">Exchange AVAX for CHAOS</h2>
          <p className="text-gray mb-3" style={{textAlign: 'center'}}>
            Use Uniswap's interface to swap your AVAX or other tokens for CHAOS
          </p>
        </div>

        <div className="swap-container">
          <iframe
            src={uniswapUrl}
            className="swap-iframe"
            title="Uniswap Swap Interface"
            allow="clipboard-read; clipboard-write"
          />
        </div>

        <div className="card" style={{marginTop: '2rem'}}>
          <h3 className="section-title">Swap Instructions</h3>
          <div style={{display: 'grid', gap: '1rem'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <span style={{background: '#10b981', color: '#000', padding: '0.5rem', borderRadius: '50%', minWidth: '30px', textAlign: 'center', fontWeight: 'bold'}}>1</span>
              <span>Connect your wallet to Uniswap</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <span style={{background: '#10b981', color: '#000', padding: '0.5rem', borderRadius: '50%', minWidth: '30px', textAlign: 'center', fontWeight: 'bold'}}>2</span>
              <span>Choose the amount of AVAX you want to swap</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <span style={{background: '#10b981', color: '#000', padding: '0.5rem', borderRadius: '50%', minWidth: '30px', textAlign: 'center', fontWeight: 'bold'}}>3</span>
              <span>CHAOS token is already selected as output</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <span style={{background: '#10b981', color: '#000', padding: '0.5rem', borderRadius: '50%', minWidth: '30px', textAlign: 'center', fontWeight: 'bold'}}>4</span>
              <span>Review and confirm your swap</span>
            </div>
          </div>
        </div>

        <div className="card" style={{background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)'}}>
          <h3 style={{color: '#fca5a5', marginBottom: '1rem'}}>⚠️ Important Notes</h3>
          <ul style={{listStyle: 'none', padding: 0, color: '#fca5a5'}}>
            <li style={{marginBottom: '0.5rem'}}>• Always verify the token contract address</li>
            <li style={{marginBottom: '0.5rem'}}>• Check slippage tolerance settings</li>
            <li style={{marginBottom: '0.5rem'}}>• Be aware of gas fees on Ethereum network</li>
            <li>• Large swaps may impact token price</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
