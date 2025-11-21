import React, { useEffect, useState } from 'react';
import { X, Check, Loader, Wallet, Database, ExternalLink, Cpu } from 'lucide-react';
import { Specimen } from '../types';

interface MintModalProps {
  isOpen: boolean;
  onClose: () => void;
  specimen: Specimen | null;
  onConfirmMint: () => Promise<void>;
  walletAddress: string;
  isMinting: boolean;
}

const MintModal: React.FC<MintModalProps> = ({ isOpen, onClose, specimen, onConfirmMint, walletAddress, isMinting }) => {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0); 
  // 0: Review, 1: Uploading IPFS, 2: Signing Wallet, 3: Success

  useEffect(() => {
    if (isOpen) setStep(0);
  }, [isOpen]);

  useEffect(() => {
      if (isMinting) {
          // Simulate step progression for visual flair
          setStep(1);
          const t1 = setTimeout(() => setStep(2), 2500); // Wait for "IPFS"
          return () => clearTimeout(t1);
      }
  }, [isMinting]);

  if (!isOpen || !specimen) return null;

  const handleMintClick = async () => {
      await onConfirmMint();
      setStep(3);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-riso-paper w-full max-w-md border-4 border-riso-black shadow-[16px_16px_0px_0px_rgba(26,26,26,1)] relative flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-riso-black text-white p-3 flex justify-between items-center border-b-4 border-white">
            <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5" />
                <h2 className="font-bold font-mono text-lg tracking-widest">MINT_TERMINAL_v1</h2>
            </div>
            <button onClick={onClose} className="hover:text-riso-pink transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto font-mono">
            
            {step === 3 ? (
                <div className="text-center space-y-6 animate-in fade-in zoom-in duration-300">
                    <div className="w-24 h-24 bg-riso-green rounded-full mx-auto flex items-center justify-center border-4 border-black">
                        <Check className="w-12 h-12 text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-riso-black mb-2">SPECIMEN ON-CHAIN</h3>
                        <p className="text-xs text-gray-600">Token ID #{Math.floor(Math.random()*9999)} successfully minted to Sepolia.</p>
                    </div>
                    <div className="bg-gray-100 p-4 border-2 border-dashed border-gray-400 text-left text-xs break-all font-mono">
                        <span className="block font-bold text-gray-500 mb-1">TRANSACTION HASH:</span>
                        {specimen.txHash || "0x712..."}
                    </div>
                    <button onClick={onClose} className="w-full py-3 bg-riso-black text-white font-bold hover:bg-riso-green border-2 border-transparent hover:border-black transition-all">
                        RETURN TO LAB
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Image Preview */}
                    <div className="relative w-full aspect-square border-2 border-black p-2 bg-white rotate-1 shadow-md">
                        <img src={specimen.imageData} className="w-full h-full object-cover mix-blend-multiply" />
                        <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 text-xs font-bold border border-black">
                            ORIGINAL
                        </div>
                    </div>

                    {/* Metadata Table */}
                    <div className="text-xs border-2 border-black">
                        <div className="grid grid-cols-3 border-b border-black p-2 bg-gray-100 font-bold">
                            <span>ATTR</span>
                            <span className="col-span-2">VALUE</span>
                        </div>
                        <div className="grid grid-cols-3 border-b border-dashed border-gray-300 p-2">
                            <span className="font-bold">Species</span>
                            <span className="col-span-2 text-riso-blue">{specimen.dna.speciesName}</span>
                        </div>
                        <div className="grid grid-cols-3 border-b border-dashed border-gray-300 p-2">
                            <span className="font-bold">Arch</span>
                            <span className="col-span-2">{specimen.dna.growthArchitecture}</span>
                        </div>
                        <div className="grid grid-cols-3 p-2">
                            <span className="font-bold">Owner</span>
                            <span className="col-span-2 truncate">{walletAddress}</span>
                        </div>
                    </div>

                    {/* Progress / Action Area */}
                    <div className="border-t-4 border-double border-black pt-4">
                        {step === 0 && (
                             <button 
                                onClick={handleMintClick}
                                disabled={isMinting}
                                className="w-full py-4 bg-riso-pink text-white font-bold text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all flex items-center justify-center gap-3"
                             >
                                <Database className="w-5 h-5" />
                                MINT TO ETHEREUM
                             </button>
                        )}

                        {step === 1 && (
                            <div className="flex flex-col gap-2 text-riso-blue animate-pulse">
                                <div className="flex items-center gap-2 font-bold">
                                    <Loader className="animate-spin w-4 h-4" />
                                    UPLOADING TO IPFS...
                                </div>
                                <div className="h-2 w-full bg-gray-200 border border-black overflow-hidden">
                                    <div className="h-full bg-riso-blue w-2/3 animate-pulse"></div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="flex flex-col gap-2 text-riso-green">
                                <div className="flex items-center gap-2 font-bold">
                                    <Wallet className="animate-bounce w-4 h-4" />
                                    AWAITING SIGNATURE...
                                </div>
                                <p className="text-xs text-gray-500">Please confirm transaction in your wallet.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default MintModal;