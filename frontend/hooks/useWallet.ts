import { useState, useEffect, useRef, useCallback } from "react";
import { Web3Service } from "../services/web3Service";
import { storageService } from "../services/storageService";
import { useLanguage } from "../contexts/LanguageContext";

export function useWallet() {
  const { t } = useLanguage();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletInitialized, setWalletInitialized] = useState(false);
  const web3ServiceRef = useRef<Web3Service>(new Web3Service());

  // Silent init: try to reconnect existing session, migrate storage
  useEffect(() => {
    const initWeb3 = async () => {
      try {
        const addr = await web3ServiceRef.current.connectWallet(true);
        if (addr) {
          storageService.migrateOldStorage(addr);
          setWalletAddress(addr);
        } else {
          storageService.migrateOldStorage(null);
        }
      } catch (e) {
        storageService.migrateOldStorage(null);
      } finally {
        setWalletInitialized(true);
      }
    };
    setTimeout(initWeb3, 500);
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      const addr = await web3ServiceRef.current.connectWallet(false);
      if (!addr) {
        console.log("No wallet address returned");
        return;
      }
      setWalletAddress(addr);
      await web3ServiceRef.current.switchNetworkToZetaChain();
      storageService.transferAnonymousToWallet(addr);
    } catch (e: any) {
      console.error("Wallet connection error:", e);
      if (e.code === 4001) {
        console.log("User rejected wallet connection");
        return;
      }
      if (e.code === -32002) {
        alert(t("meta_request_pending"));
        return;
      }
      const msg = e.message || "";
      if (
        msg.includes("MetaMask not found") ||
        msg.includes("extension") ||
        msg.includes("install")
      ) {
        const install = confirm(t("meta_not_found"));
        if (install) window.open("https://metamask.io/download/", "_blank");
      } else {
        alert(t("connect_wallet") + " failed: " + msg);
      }
    }
  }, [t]);

  const disconnectWallet = useCallback(() => {
    web3ServiceRef.current.disconnectWallet();
    setWalletAddress(null);
    console.log("Wallet disconnected");
  }, []);

  const reconnectWallet = useCallback(async () => {
    try {
      disconnectWallet();
      await new Promise(resolve => setTimeout(resolve, 1000));
      const addr = await web3ServiceRef.current.connectWallet(false, true);
      if (!addr) {
        console.log("No wallet address returned");
        return;
      }
      setWalletAddress(addr);
      await web3ServiceRef.current.switchNetworkToZetaChain();
      storageService.transferAnonymousToWallet(addr);
    } catch (e: any) {
      console.error("Reconnection error:", e);
      if (e.code === 4001) {
        console.log("User rejected wallet reconnection");
        return;
      }
      if (e.code === -32002 || e.message?.includes("待处理的连接请求")) {
        alert(
          "请检查 MetaMask - 已有待处理的连接请求。\n\n" +
          "如果 MetaMask 中没有弹窗，请：\n" +
          "1. 刷新页面后重试\n" +
          "2. 或者在 MetaMask 中手动切换账户"
        );
        return;
      }
      const msg = e.message || "";
      alert("重新连接失败: " + msg);
    }
  }, [disconnectWallet]);

  const handleWalletButtonClick = useCallback(async () => {
    if (walletAddress) {
      const action = confirm(t("reconnect_wallet_msg", { address: walletAddress }));
      if (action) {
        await reconnectWallet();
      } else {
        disconnectWallet();
      }
    } else {
      await connectWallet();
    }
  }, [walletAddress, t, reconnectWallet, disconnectWallet, connectWallet]);

  return {
    walletAddress,
    walletInitialized,
    web3Service: web3ServiceRef.current,
    connectWallet,
    disconnectWallet,
    handleWalletButtonClick,
  };
}
