import { useState, useCallback } from "react";
import { marketService } from "../services/marketService";
import { MarketListing } from "../types";

export function useMarket({ walletAddress }: { walletAddress: string | null }) {
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [selectedListing, setSelectedListing] = useState<MarketListing | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [marketRefreshKey, setMarketRefreshKey] = useState(0);

  const handlePurchase = useCallback(async (listingId: string, shares: number, chain: string) => {
    if (!walletAddress) return;
    setIsPurchasing(true);
    try {
      await marketService.purchaseShares(listingId, shares, walletAddress, chain);
      setSelectedListing(marketService.getListing(listingId) || null);
      setMarketRefreshKey(prev => prev + 1);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Purchase failed");
    } finally {
      setIsPurchasing(false);
    }
  }, [walletAddress]);

  const handleSelectListing = useCallback((listing: MarketListing) => {
    setSelectedListing(listing);
    setShowPurchaseModal(true);
  }, []);

  return {
    showMarketplace,
    setShowMarketplace,
    selectedListing,
    setSelectedListing,
    showPurchaseModal,
    setShowPurchaseModal,
    isPurchasing,
    marketRefreshKey,
    handlePurchase,
    handleSelectListing,
  };
}
