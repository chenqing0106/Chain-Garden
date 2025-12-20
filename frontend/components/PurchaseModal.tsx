import React, { useState, useEffect } from 'react';
import {
  X, Zap, Users, Music, Check, Loader, ChevronDown,
  TrendingUp, Wallet, ArrowRight, Play, Pause
} from 'lucide-react';
import { MarketListing, ChainOption } from '../types';
import { CHAIN_OPTIONS } from '../services/marketService';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: MarketListing | null;
  walletAddress: string | null;
  onConnectWallet: () => void;
  onPurchase: (listingId: string, shares: number, chain: string) => Promise<void>;
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  listing,
  walletAddress,
  onConnectWallet,
  onPurchase,
}) => {
  const [shares, setShares] = useState(1);
  const [selectedChain, setSelectedChain] = useState<ChainOption>(CHAIN_OPTIONS[0]);
  const [showChainDropdown, setShowChainDropdown] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseStep, setPurchaseStep] = useState<0 | 1 | 2 | 3>(0);
  // 0: Select, 1: Processing, 2: Confirming, 3: Success
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isOpen && listing) {
      setShares(1);
      setPurchaseStep(0);
      setIsPurchasing(false);
    }
  }, [isOpen, listing]);

  if (!isOpen || !listing) return null;

  const { specimen, creatorName, pricePerShare, totalShares, soldShares, genre } = listing;
  const availableShares = totalShares - soldShares;
  const totalPrice = shares * pricePerShare;
  const maxShares = Math.min(availableShares, 100); // 单次最多购买100份

  const handlePurchase = async () => {
    if (!walletAddress) {
      onConnectWallet();
      return;
    }

    setIsPurchasing(true);
    setPurchaseStep(1);

    try {
      // 模拟跨链处理
      await new Promise(r => setTimeout(r, 1500));
      setPurchaseStep(2);
      
      await onPurchase(listing.id, shares, selectedChain.id);
      setPurchaseStep(3);
    } catch (e) {
      console.error('Purchase failed:', e);
      setPurchaseStep(0);
      setIsPurchasing(false);
    }
  };

  const incrementShares = () => setShares(s => Math.min(s + 1, maxShares));
  const decrementShares = () => setShares(s => Math.max(s - 1, 1));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-riso-paper w-full max-w-2xl border-4 border-riso-black shadow-[16px_16px_0px_0px_rgba(0,166,81,1)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-riso-black text-white p-4 flex justify-between items-center border-b-4 border-riso-green">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5" />
            <h2 className="font-bold font-mono text-lg tracking-widest">
              PURCHASE_RIGHTS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="hover:text-riso-pink transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {purchaseStep === 3 ? (
            // Success State
            <div className="p-8 text-center space-y-6">
              <div className="w-24 h-24 bg-riso-green rounded-full mx-auto flex items-center justify-center border-4 border-black animate-bounce">
                <Check className="w-12 h-12 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-riso-black mb-2">
                  PURCHASE COMPLETE!
                </h3>
                <p className="text-sm text-gray-600 font-mono">
                  You now own {shares} shares of "{specimen.dna.speciesName}"
                </p>
              </div>
              <div className="bg-riso-green/10 border-2 border-riso-green p-4 text-left font-mono text-xs">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Shares Acquired:</span>
                  <span className="font-bold">{shares}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Total Paid:</span>
                  <span className="font-bold">{totalPrice.toFixed(4)} {selectedChain.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Chain:</span>
                  <span className="font-bold">{selectedChain.icon} {selectedChain.name}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Royalties from this track will be distributed to your wallet proportionally.
              </p>
              <button
                onClick={onClose}
                className="w-full py-3 bg-riso-black text-white font-bold hover:bg-riso-green transition-colors"
              >
                DONE
              </button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row">
              {/* Left: Preview */}
              <div className="w-full md:w-1/2 border-b-4 md:border-b-0 md:border-r-4 border-black p-4 bg-gray-50">
                <div className="relative aspect-square border-2 border-black overflow-hidden bg-white">
                  <img
                    src={specimen.imageData}
                    alt={specimen.dna.speciesName}
                    className="w-full h-full object-cover"
                  />
                  {/* Play overlay */}
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-white border-2 border-black 
                               flex items-center justify-center shadow-md hover:bg-riso-pink hover:text-white transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                  </button>
                  {genre && (
                    <div className="absolute top-2 left-2 bg-riso-blue text-white text-[10px] font-bold px-2 py-1">
                      {genre}
                    </div>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  <h3 className="font-bold text-lg">{specimen.dna.speciesName}</h3>
                  <p className="text-xs text-gray-500 font-mono">by {creatorName || 'Anonymous'}</p>
                  <div className="flex gap-2 text-xs">
                    <span className="bg-riso-pink/20 text-riso-pink px-2 py-1 font-bold uppercase">
                      {specimen.dna.mood}
                    </span>
                    <span className="bg-riso-blue/20 text-riso-blue px-2 py-1 font-bold">
                      {specimen.dna.growthArchitecture.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Purchase Form */}
              <div className="w-full md:w-1/2 p-6 space-y-6 font-mono">
                {/* Shares Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">SELECT SHARES</label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={decrementShares}
                      disabled={shares <= 1}
                      className="w-10 h-10 border-2 border-black bg-white hover:bg-gray-100 
                                 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xl"
                    >
                      -
                    </button>
                    <div className="flex-1 text-center">
                      <input
                        type="number"
                        value={shares}
                        onChange={(e) => setShares(Math.min(Math.max(1, parseInt(e.target.value) || 1), maxShares))}
                        className="w-full text-center text-2xl font-bold border-2 border-black p-2 bg-white"
                      />
                    </div>
                    <button
                      onClick={incrementShares}
                      disabled={shares >= maxShares}
                      className="w-10 h-10 border-2 border-black bg-white hover:bg-gray-100 
                                 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xl"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 text-center">
                    {availableShares} shares available • Max {maxShares} per transaction
                  </p>
                </div>

                {/* Chain Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">PAY WITH</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowChainDropdown(!showChainDropdown)}
                      className="w-full p-3 border-2 border-black bg-white flex items-center justify-between
                                 hover:bg-gray-50 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-xl">{selectedChain.icon}</span>
                        <span className="font-bold">{selectedChain.name}</span>
                        <span className="text-gray-500">({selectedChain.symbol})</span>
                      </span>
                      <ChevronDown className={`w-5 h-5 transition-transform ${showChainDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showChainDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 border-2 border-black bg-white z-10 shadow-lg">
                        {CHAIN_OPTIONS.map((chain) => (
                          <button
                            key={chain.id}
                            disabled={chain.disabled}
                            onClick={() => {
                              if (!chain.disabled) {
                                setSelectedChain(chain);
                                setShowChainDropdown(false);
                              }
                            }}
                            className={`w-full p-3 flex items-center justify-between border-b border-gray-200 last:border-0
                                       ${chain.disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:bg-riso-yellow/20'}
                                       ${selectedChain.id === chain.id ? 'bg-riso-green/10' : ''}`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-xl">{chain.icon}</span>
                              <span className="font-bold">{chain.name}</span>
                            </span>
                            {chain.disabled ? (
                              <span className="text-[10px] text-gray-400">{chain.tooltip}</span>
                            ) : selectedChain.id === chain.id ? (
                              <Check className="w-4 h-4 text-riso-green" />
                            ) : null}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500">
                    ⚡ Cross-chain payments powered by ZetaChain
                  </p>
                </div>

                {/* Price Summary */}
                <div className="bg-riso-black text-white p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Price per share</span>
                    <span>{pricePerShare.toFixed(4)} ZETA</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Shares</span>
                    <span>× {shares}</span>
                  </div>
                  <div className="border-t border-gray-600 pt-2 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-riso-green flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      {totalPrice.toFixed(4)} {selectedChain.symbol}
                    </span>
                  </div>
                </div>

                {/* Purchase Button */}
                {purchaseStep === 0 ? (
                  <button
                    onClick={handlePurchase}
                    disabled={isPurchasing}
                    className="w-full py-4 bg-riso-green text-white font-bold text-lg border-2 border-black
                               shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1
                               transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {walletAddress ? (
                      <>
                        <Zap className="w-5 h-5" />
                        CONFIRM PURCHASE
                      </>
                    ) : (
                      <>
                        <Wallet className="w-5 h-5" />
                        CONNECT WALLET
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className={`flex items-center gap-3 p-3 border-2 ${purchaseStep >= 1 ? 'border-riso-blue bg-riso-blue/10' : 'border-gray-300'}`}>
                      {purchaseStep === 1 ? (
                        <Loader className="w-5 h-5 animate-spin text-riso-blue" />
                      ) : purchaseStep > 1 ? (
                        <Check className="w-5 h-5 text-riso-green" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                      )}
                      <span className="text-sm font-bold">Processing cross-chain payment...</span>
                    </div>
                    <div className={`flex items-center gap-3 p-3 border-2 ${purchaseStep >= 2 ? 'border-riso-blue bg-riso-blue/10' : 'border-gray-300'}`}>
                      {purchaseStep === 2 ? (
                        <Loader className="w-5 h-5 animate-spin text-riso-blue" />
                      ) : purchaseStep > 2 ? (
                        <Check className="w-5 h-5 text-riso-green" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                      )}
                      <span className="text-sm font-bold">Confirming on ZetaChain...</span>
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="text-[10px] text-gray-500 text-center space-y-1">
                  <p>By purchasing, you acquire royalty rights to this music NFT.</p>
                  <p>Revenue will be distributed proportionally to all shareholders.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseModal;

