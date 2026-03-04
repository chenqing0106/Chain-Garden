import { useState, useEffect, useCallback } from "react";
import { storageService } from "../services/storageService";
import { marketService } from "../services/marketService";
import { uploadSpecimenToIPFS } from "../services/ipfsService";
import { Web3Service } from "../services/web3Service";
import { Specimen } from "../types";
import { AssetSelection, ListingOptions } from "../components/MintModal";
import { useLanguage } from "../contexts/LanguageContext";

export function useSpecimenCollection({
  walletAddress,
  walletInitialized,
  web3Service,
  connectWallet,
}: {
  walletAddress: string | null;
  walletInitialized: boolean;
  web3Service: Web3Service;
  connectWallet: () => Promise<void>;
}) {
  const { t } = useLanguage();
  const [collection, setCollection] = useState<Specimen[]>([]);
  const [triggerSnapshot, setTriggerSnapshot] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const [showMintModal, setShowMintModal] = useState(false);
  const [mintTargetSpecimen, setMintTargetSpecimen] = useState<Specimen | null>(null);
  const [isMinting, setIsMinting] = useState(false);

  // Reload collection when wallet changes (after initialization completes)
  useEffect(() => {
    if (!walletInitialized) return;
    const updated = storageService.getWalletCollection(walletAddress);
    setCollection(updated);
  }, [walletAddress, walletInitialized]);

  // Save a specimen and reload the collection; throws if save fails
  const saveAndReload = useCallback((specimen: Specimen) => {
    storageService.saveSpecimen(specimen, walletAddress);
    const updated = storageService.getWalletCollection(walletAddress);
    setCollection(updated);
    setLastSavedId(specimen.id);
    setTimeout(() => setLastSavedId(null), 3000);
  }, [walletAddress]);

  const handleStartMinting = useCallback((specimen: Specimen) => {
    if (!walletAddress) {
      connectWallet();
      return;
    }
    setMintTargetSpecimen(specimen);
    setShowMintModal(true);
  }, [walletAddress, connectWallet]);

  const confirmMint = useCallback(async (
    selection: AssetSelection,
    listingOptions?: ListingOptions,
  ) => {
    if (!mintTargetSpecimen || !walletAddress) return;
    setIsMinting(true);
    try {
      if (!selection.dna) {
        console.warn("DNA exclusion not yet supported; proceeding with DNA included.");
      }
      const uploadResult = await uploadSpecimenToIPFS(mintTargetSpecimen, {
        includeDNA: selection.dna,
        includeAudio: selection.audio,
        includeVoice: selection.voice,
      });
      const result = await web3Service.mintNFT(uploadResult.metadata.uri);
      const updatedSpecimen: Specimen = {
        ...mintTargetSpecimen,
        txHash: result.txHash,
        tokenId: result.tokenId,
        owner: walletAddress,
        isListed: listingOptions?.listOnMarket || false,
        pricePerShare: listingOptions?.pricePerShare,
        totalShares: listingOptions?.totalShares,
        soldShares: 0,
      };
      storageService.updateSpecimen(updatedSpecimen);
      const updatedCollection = storageService.getWalletCollection(walletAddress);
      setCollection(updatedCollection);
      setMintTargetSpecimen(updatedSpecimen);
      if (listingOptions?.listOnMarket) {
        marketService.listSpecimen(
          updatedSpecimen,
          listingOptions.pricePerShare,
          listingOptions.totalShares,
          walletAddress,
          web3Service.shortenAddress(walletAddress),
        );
      }
    } catch (e) {
      console.error(e);
      alert("Minting failed.");
    } finally {
      setIsMinting(false);
    }
  }, [mintTargetSpecimen, walletAddress, web3Service]);

  const deleteSpecimen = useCallback((id: string) => {
    storageService.deleteSpecimen(id, walletAddress);
    const updated = storageService.getWalletCollection(walletAddress);
    setCollection(updated);
  }, [walletAddress]);

  const clearCollection = useCallback(() => {
    if (confirm(t("burn_confirm"))) {
      storageService.clearWalletCollection(walletAddress);
      setCollection([]);
    }
  }, [walletAddress, t]);

  return {
    collection,
    triggerSnapshot,
    setTriggerSnapshot,
    showGallery,
    setShowGallery,
    lastSavedId,
    showMintModal,
    setShowMintModal,
    mintTargetSpecimen,
    isMinting,
    saveAndReload,
    handleStartMinting,
    confirmMint,
    deleteSpecimen,
    clearCollection,
  };
}
