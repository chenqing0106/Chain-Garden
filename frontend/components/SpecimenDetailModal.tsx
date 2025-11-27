
import React from 'react';
import { X, Zap, Trash2, Share2, Activity, FileText, Hash, Download } from 'lucide-react';
import { Specimen } from '../types';

interface SpecimenDetailModalProps {
  specimen: Specimen | null;
  onClose: () => void;
  onMint: (specimen: Specimen) => void;
  onDelete: (id: string) => void;
  walletConnected: boolean;
}

const SpecimenDetailModal: React.FC<SpecimenDetailModalProps> = ({ 
  specimen, 
  onClose, 
  onMint, 
  onDelete,
  walletConnected 
}) => {
  if (!specimen) return null;

  // Helper to trigger audio download
  const handleDownloadAudio = () => {
      if (!specimen.audioData) return;
      
      const link = document.createElement('a');
      link.href = specimen.audioData;
      link.download = `${specimen.dna.speciesName.replace(/\s+/g, '_')}_${specimen.id}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-riso-paper w-full max-w-4xl h-[80vh] border-4 border-riso-black shadow-[12px_12px_0px_0px_rgba(0,166,81,1)] flex flex-col md:flex-row overflow-hidden relative animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-50 bg-white border-2 border-black p-1 hover:bg-riso-pink hover:text-white transition-colors"
        >
            <X className="w-6 h-6" />
        </button>

        {/* LEFT: Image */}
        <div className="w-full md:w-1/2 bg-gray-100 relative border-b-4 md:border-b-0 md:border-r-4 border-black p-4 flex items-center justify-center bg-grain">
            <div className="relative w-full h-full border-2 border-black bg-white shadow-md p-2 rotate-[-1deg]">
                <img 
                    src={specimen.imageData} 
                    alt={specimen.dna.speciesName} 
                    className="w-full h-full object-contain mix-blend-multiply" 
                />
                <div className="absolute bottom-4 left-4 bg-riso-black text-white px-2 py-1 text-xs font-mono">
                    ID: {specimen.id}
                </div>
            </div>
        </div>

        {/* RIGHT: Data Sheet */}
        <div className="w-full md:w-1/2 p-8 overflow-y-auto font-mono flex flex-col">
            
            <div className="border-b-4 border-double border-riso-black pb-4 mb-6">
                <h2 className="text-3xl font-bold text-riso-blue uppercase leading-tight">
                    {specimen.dna.speciesName}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                    DISCOVERED: {new Date(specimen.timestamp).toLocaleString()}
                </p>
            </div>

            {/* Prompt Section */}
            <div className="mb-6 bg-riso-yellow/20 border border-riso-black p-4 relative">
                <div className="absolute -top-3 left-2 bg-riso-paper px-1 text-xs font-bold text-riso-black flex items-center gap-1">
                    <FileText className="w-3 h-3" /> ORIGIN PROMPT (USER INPUT)
                </div>
                <p className="text-sm italic text-riso-black break-words">
                    "{specimen.prompt}"
                </p>
            </div>

            {/* DNA Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
                <div className="space-y-1">
                    <span className="block font-bold text-gray-400">ARCHITECTURE</span>
                    <span className="block text-lg uppercase border-b border-dashed border-gray-300 pb-1">
                        {specimen.dna.growthArchitecture.replace('_', ' ')}
                    </span>
                </div>
                <div className="space-y-1">
                    <span className="block font-bold text-gray-400">LEAF TYPE</span>
                    <span className="block text-lg uppercase border-b border-dashed border-gray-300 pb-1">
                        {specimen.dna.leafShape}
                    </span>
                </div>
                <div className="space-y-1">
                    <span className="block font-bold text-gray-400">GROWTH RATE</span>
                    <div className="w-full h-2 bg-gray-200 border border-black">
                        <div 
                            className="h-full bg-riso-green" 
                            style={{ width: `${(specimen.dna.growthSpeed / 3) * 100}%` }}
                        ></div>
                    </div>
                </div>
                <div className="space-y-1">
                    <span className="block font-bold text-gray-400">PALETTE</span>
                    <div className="flex gap-1">
                        {specimen.dna.colorPalette.map((c, i) => (
                            <div key={i} className="w-6 h-6 rounded-full border border-black" style={{backgroundColor: c}}></div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-auto space-y-3">
                {/* Audio Download */}
                {specimen.audioData && (
                    <button 
                        onClick={handleDownloadAudio}
                        className="w-full py-2 bg-riso-pink text-white font-bold border-2 border-black hover:bg-white hover:text-riso-pink transition-all flex items-center justify-center gap-2 mb-2"
                    >
                        <Download className="w-4 h-4" />
                        DOWNLOAD RECORDED AUDIO
                    </button>
                )}

                {/* Blockchain Status */}
                <div className={`p-3 border-2 ${specimen.txHash ? 'border-riso-green bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
                    <div className="flex justify-between items-center">
                        <span className="font-bold flex items-center gap-2">
                            <Hash className="w-4 h-4"/> BLOCKCHAIN STATUS
                        </span>
                        {specimen.txHash ? (
                            <span className="text-riso-green font-bold text-xs px-2 py-1 bg-green-100 border border-green-500">MINTED</span>
                        ) : (
                            <span className="text-gray-400 text-xs">NOT ON CHAIN</span>
                        )}
                    </div>
                    {specimen.txHash && (
                        <a 
                            href={`https://sepolia.etherscan.io/tx/${specimen.txHash}`} 
                            target="_blank"
                            className="text-[10px] text-riso-blue hover:underline block mt-1 truncate"
                        >
                            Tx: {specimen.txHash}
                        </a>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    {!specimen.txHash ? (
                        <button 
                            onClick={() => onMint(specimen)}
                            className="flex-1 py-3 bg-riso-black text-white font-bold border-2 border-transparent hover:bg-white hover:text-riso-black hover:border-riso-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
                        >
                            <Zap className="w-5 h-5" />
                            {walletConnected ? "MINT NFT" : "CONNECT TO MINT"}
                        </button>
                    ) : (
                         <button disabled className="flex-1 py-3 bg-gray-200 text-gray-400 font-bold border-2 border-transparent cursor-not-allowed flex items-center justify-center gap-2">
                            <Activity className="w-5 h-5" />
                            ALREADY MINTED
                        </button>
                    )}
                    
                    <button 
                        onClick={() => {
                            if(confirm("Permanently decompose this specimen?")) {
                                onDelete(specimen.id);
                                onClose();
                            }
                        }}
                        className="px-4 bg-white border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                        title="Delete Specimen"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default SpecimenDetailModal;
