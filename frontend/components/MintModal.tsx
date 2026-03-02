import React, { useEffect, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import {
  X,
  Check,
  Loader,
  Wallet,
  Database,
  Music,
  Dna,
  FileImage,
  MessageCircle,
  Cpu,
  Lock,
  Store,
  Zap,
  Users,
} from "lucide-react";
import { Specimen } from "../types";

export interface AssetSelection {
  image: boolean;
  dna: boolean;
  audio: boolean;
  voice: boolean;
}

export interface ListingOptions {
  listOnMarket: boolean;
  pricePerShare: number;
  totalShares: number;
}

interface MintModalProps {
  isOpen: boolean;
  onClose: () => void;
  specimen: Specimen | null;
  onConfirmMint: (selection: AssetSelection, listingOptions?: ListingOptions) => Promise<void>;
  walletAddress: string;
  isMinting: boolean;
}

const MintModal: React.FC<MintModalProps> = ({
  isOpen,
  onClose,
  specimen,
  onConfirmMint,
  walletAddress,
  isMinting,
}) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  // 0: Curate, 1: Uploading IPFS, 2: Signing Wallet, 3: Success

  const [selection, setSelection] = useState<AssetSelection>({
    image: true,
    dna: true,
    audio: true,
    voice: true,
  });

  // 市场上架选项
  const [listingOptions, setListingOptions] = useState<ListingOptions>({
    listOnMarket: false,
    pricePerShare: 0.1,
    totalShares: 100,
  });

  useEffect(() => {
    if (isOpen && specimen) {
      setStep(0);
      // Reset defaults based on availability
      setSelection({
        image: true,
        dna: true,
        audio: !!specimen.audioData,
        voice: !!specimen.reflectionAudioData,
      });
      setListingOptions({
        listOnMarket: false,
        pricePerShare: 0.1,
        totalShares: 100,
      });
    }
  }, [isOpen, specimen]);

  useEffect(() => {
    if (isMinting) {
      setStep(1);
      const t1 = setTimeout(() => setStep(2), 2500); // Wait for "IPFS"
      return () => clearTimeout(t1);
    }
  }, [isMinting]);

  if (!isOpen || !specimen) return null;

  const handleMintClick = async () => {
    await onConfirmMint(selection, listingOptions.listOnMarket ? listingOptions : undefined);
    setStep(3);
  };

  const toggleSelection = (key: keyof AssetSelection) => {
    if (key === "image") return; // Locked
    setSelection((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleListOnMarket = () => {
    setListingOptions(prev => ({ ...prev, listOnMarket: !prev.listOnMarket }));
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      data-oid="5mdq:hd"
    >
      <div
        className="bg-riso-paper w-full max-w-md border-4 border-riso-black shadow-[16px_16px_0px_0px_rgba(26,26,26,1)] relative flex flex-col max-h-[90vh]"
        data-oid="vh1nrze"
      >
        {/* Modal Header */}
        <div
          className="bg-riso-black text-white p-3 flex justify-between items-center border-b-4 border-white"
          data-oid="ym5mp5m"
        >
          <div className="flex items-center gap-2" data-oid="x3_7w3k">
            <Cpu className="w-5 h-5" data-oid="xu7ibox" />
            <h2
              className="font-bold font-mono text-lg tracking-widest uppercase"
              data-oid="a_:7dyx"
            >
              {t("mint_title")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="hover:text-riso-pink transition-colors"
            data-oid="lq0shew"
          >
            <X className="w-6 h-6" data-oid="cxt-tug" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto font-mono" data-oid="2huq8w3">
          {step === 3 ? (
            <div
              className="text-center space-y-6 animate-in fade-in zoom-in duration-300"
              data-oid="qh_mx8v"
            >
              <div
                className="w-24 h-24 bg-riso-green rounded-full mx-auto flex items-center justify-center border-4 border-black"
                data-oid=":t6_fwt"
              >
                <Check className="w-12 h-12 text-white" data-oid="7bucp-p" />
              </div>
              <div data-oid="q-wrm0v">
                <h3
                  className="text-2xl font-bold text-riso-black mb-2"
                  data-oid="lj5h3ox"
                >
                  {t("mint_success")}
                </h3>
                <p className="text-xs text-gray-600" data-oid="pe:1bee">
                  {t("mint_success_desc", { id: Math.floor(Math.random() * 9999).toString() })}
                </p>
              </div>
              <div
                className="bg-gray-100 p-4 border-2 border-dashed border-gray-400 text-left text-xs break-all font-mono"
                data-oid=":m9-r1k"
              >
                <span
                  className="block font-bold text-gray-500 mb-1"
                  data-oid="t3m6zj:"
                >
                  {t("mint_tx_hash")}
                </span>
                {specimen.txHash ? (
                  <a
                    href={`https://testnet.zetascan.com/tx/${specimen.txHash}`}
                    target="_blank"
                    className="text-riso-blue hover:underline break-all"
                  >
                    {specimen.txHash}
                  </a>
                ) : (
                  "0x712..."
                )}
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 bg-riso-black text-white font-bold hover:bg-riso-green border-2 border-transparent hover:border-black transition-all"
                data-oid="e.loxhw"
              >
                {t("return_to_lab")}
              </button>
            </div>
          ) : (
            <div className="space-y-6" data-oid="s:.hu4h">
              {/* Image Preview */}
              <div
                className="relative w-full aspect-square border-2 border-black p-2 bg-white rotate-1 shadow-md"
                data-oid="6z77hue"
              >
                <img
                  src={specimen.imageData}
                  className="w-full h-full object-cover mix-blend-multiply"
                  data-oid=":5n-jp9"
                />

                <div
                  className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 text-xs font-bold border border-black"
                  data-oid="a483f1d"
                >
                  {specimen.dna.speciesName}
                </div>
              </div>

              {/* Step 0: Curate Assets */}
              {step === 0 && (
                <div className="space-y-3" data-oid="yddx1:7">
                  <div
                    className="text-sm font-bold border-b-2 border-black pb-1 mb-2"
                    data-oid="-_y.tc_"
                  >
                    {t("mint_curate")}
                  </div>

                  {/* Option 1: Visuals */}
                  <div
                    onClick={() => toggleSelection("image")}
                    className={`flex items-center justify-between p-3 border-2 border-black transition-all cursor-not-allowed bg-gray-100`}
                    data-oid="p283hg9"
                  >
                    <div className="flex items-center gap-3" data-oid=".g1-:7e">
                      <FileImage
                        className="w-5 h-5 text-riso-blue"
                        data-oid="8dj6:wi"
                      />

                      <div data-oid="-ddwdrt">
                        <div className="text-xs font-bold uppercase" data-oid="itf7-1b">
                          {t("mint_image")}
                        </div>
                        <div
                          className="text-[10px] text-gray-500 uppercase"
                          data-oid="mkvpeya"
                        >
                          {t("mint_image_desc")}
                        </div>
                      </div>
                    </div>
                    <Lock
                      className="w-4 h-4 text-gray-400"
                      data-oid="4cbud99"
                    />
                  </div>

                  {/* Option 2: DNA */}
                  <div
                    onClick={() => toggleSelection("dna")}
                    className={`flex items-center justify-between p-3 border-2 border-black transition-all cursor-pointer hover:translate-x-1
                                ${selection.dna ? "bg-riso-yellow/30" : "bg-white hover:bg-gray-50"}`}
                    data-oid="o78i3z:"
                  >
                    <div className="flex items-center gap-3" data-oid=":qzdyiu">
                      <Dna
                        className="w-5 h-5 text-riso-green"
                        data-oid="p8mr_m-"
                      />

                      <div data-oid="9ka_7c.">
                        <div className="text-xs font-bold uppercase" data-oid="t1-.u62">
                          {t("mint_dna")}
                        </div>
                        <div
                          className="text-[10px] text-gray-500 uppercase"
                          data-oid="tiupc0b"
                        >
                          {t("mint_dna_desc")}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 border-2 border-black flex items-center justify-center ${selection.dna ? "bg-riso-black" : "bg-white"}`}
                      data-oid="ofy4f_w"
                    >
                      {selection.dna && (
                        <Check
                          className="w-3 h-3 text-white"
                          data-oid="v2e5nn1"
                        />
                      )}
                    </div>
                  </div>

                  {/* Option 3: Music */}
                  <div
                    onClick={() =>
                      specimen.audioData && toggleSelection("audio")
                    }
                    className={`flex items-center justify-between p-3 border-2 border-black transition-all 
                                ${!specimen.audioData ? "opacity-50 cursor-not-allowed bg-gray-100" : "cursor-pointer hover:translate-x-1"}
                                ${selection.audio ? "bg-riso-pink/20" : ""}`}
                    data-oid="t60ynn5"
                  >
                    <div className="flex items-center gap-3" data-oid="n.hmtvb">
                      <Music
                        className="w-5 h-5 text-riso-pink"
                        data-oid="xr-jpxw"
                      />

                      <div data-oid=":mevg5-">
                        <div className="text-xs font-bold uppercase" data-oid="p:gjori">
                          {t("mint_music")}
                        </div>
                        <div
                          className="text-[10px] text-gray-500 uppercase"
                          data-oid="-hiuac_"
                        >
                          {specimen.audioData
                            ? t("mint_music_desc")
                            : t("no_specimens")}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 border-2 border-black flex items-center justify-center ${selection.audio ? "bg-riso-black" : "bg-white"}`}
                      data-oid="3.4ubnu"
                    >
                      {selection.audio && (
                        <Check
                          className="w-3 h-3 text-white"
                          data-oid="thaf_ju"
                        />
                      )}
                    </div>
                  </div>

                  {/* Option 4: Voice */}
                  <div
                    onClick={() =>
                      specimen.reflectionAudioData && toggleSelection("voice")
                    }
                    className={`flex items-center justify-between p-3 border-2 border-black transition-all 
                                ${!specimen.reflectionAudioData ? "opacity-50 cursor-not-allowed bg-gray-100" : "cursor-pointer hover:translate-x-1"}
                                ${selection.voice ? "bg-riso-blue/20" : ""}`}
                    data-oid="l0emwt4"
                  >
                    <div className="flex items-center gap-3" data-oid="7c63i76">
                      <MessageCircle
                        className="w-5 h-5 text-riso-blue"
                        data-oid="1fla-1l"
                      />

                      <div data-oid="n2fk93k">
                        <div className="text-xs font-bold uppercase" data-oid="3chtqe4">
                          {t("mint_voice")}
                        </div>
                        <div
                          className="text-[10px] text-gray-500 uppercase"
                          data-oid="o4jc:7:"
                        >
                          {specimen.reflectionAudioData
                            ? t("mint_voice_desc")
                            : t("no_specimens")}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 border-2 border-black flex items-center justify-center ${selection.voice ? "bg-riso-black" : "bg-white"}`}
                      data-oid="04cf7a0"
                    >
                      {selection.voice && (
                        <Check
                          className="w-3 h-3 text-white"
                          data-oid="qyfb_:9"
                        />
                      )}
                    </div>
                  </div>

                  {/* Market Listing Section */}
                  <div className="border-t-2 border-dashed border-gray-300 pt-3 mt-3">
                    <div
                      className="text-sm font-bold border-b-2 border-black pb-1 mb-3 flex items-center gap-2 uppercase"
                    >
                      <Store className="w-4 h-4 text-riso-green" />
                      {t("mint_market_list")}
                    </div>

                    {/* Toggle Market Listing */}
                    <div
                      onClick={toggleListOnMarket}
                      className={`flex items-center justify-between p-3 border-2 border-black transition-all cursor-pointer hover:translate-x-1
                                  ${listingOptions.listOnMarket ? "bg-riso-green/20 border-riso-green" : "bg-white hover:bg-gray-50"}`}
                    >
                      <div className="flex items-center gap-3">
                        <Zap className={`w-5 h-5 ${listingOptions.listOnMarket ? "text-riso-green" : "text-gray-400"}`} />
                        <div>
                          <div className="text-xs font-bold uppercase">
                            {t("mint_sell_shares")}
                          </div>
                          <div className="text-[10px] text-gray-500 uppercase">
                            {t("mint_sell_shares_desc")}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 border-2 border-black flex items-center justify-center ${listingOptions.listOnMarket ? "bg-riso-green" : "bg-white"}`}
                      >
                        {listingOptions.listOnMarket && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Pricing Options (shown when listing is enabled) */}
                    {listingOptions.listOnMarket && (
                      <div className="mt-3 p-3 bg-gray-50 border-2 border-dashed border-gray-300 space-y-3 animate-in slide-in-from-top duration-200">
                        <div className="grid grid-cols-2 gap-3">
                          {/* Price per Share */}
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">
                              {t("mint_price_per_share")}
                            </label>
                            <div className="relative">
                              <Zap className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-riso-green" />
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={listingOptions.pricePerShare}
                                onChange={(e) => setListingOptions(prev => ({
                                  ...prev,
                                  pricePerShare: parseFloat(e.target.value) || 0.01
                                }))}
                                className="w-full pl-7 pr-2 py-2 border-2 border-black text-sm font-mono"
                              />
                            </div>
                          </div>

                          {/* Total Shares */}
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">
                              {t("mint_total_shares")}
                            </label>
                            <div className="relative">
                              <Users className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-riso-blue" />
                              <select
                                value={listingOptions.totalShares}
                                onChange={(e) => setListingOptions(prev => ({
                                  ...prev,
                                  totalShares: parseInt(e.target.value)
                                }))}
                                className="w-full pl-7 pr-2 py-2 border-2 border-black text-sm font-mono appearance-none bg-white"
                              >
                                <option value={100}>100</option>
                                <option value={500}>500</option>
                                <option value={1000}>1,000</option>
                                <option value={5000}>5,000</option>
                                <option value={10000}>10,000</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-riso-black text-white p-2 text-xs font-mono flex justify-between uppercase">
                          <span>{t("mint_total_value")}</span>
                          <span className="text-riso-green font-bold">
                            {(listingOptions.pricePerShare * listingOptions.totalShares).toFixed(2)} ZETA
                          </span>
                        </div>

                        <p className="text-[9px] text-gray-500 text-center uppercase">
                          {t("mint_zeta_cross_chain")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Progress / Action Area */}
              <div
                className="border-t-4 border-double border-black pt-4"
                data-oid="q--z1m5"
              >
                {step === 0 && (
                  <button
                    onClick={handleMintClick}
                    disabled={isMinting}
                    className="w-full py-4 bg-riso-pink text-white font-bold text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all flex items-center justify-center gap-3 uppercase"
                    data-oid="5p2wvby"
                  >
                    <Database className="w-5 h-5" data-oid="dpo2boi" />
                    {t("mint_initiate")}
                  </button>
                )}

                {step === 1 && (
                  <div
                    className="flex flex-col gap-2 text-riso-blue animate-pulse uppercase"
                    data-oid="q7zqg52"
                  >
                    <div
                      className="flex items-center gap-2 font-bold"
                      data-oid="xrwg6lw"
                    >
                      <Loader
                        className="animate-spin w-4 h-4"
                        data-oid="zn_wqjb"
                      />
                      {t("mint_uploading_ipfs")}
                    </div>
                    <div
                      className="text-[10px] font-mono text-gray-500"
                      data-oid="kwenwj0"
                    >
                      {t("mint_metadata_desc")}
                    </div>
                    <div
                      className="h-2 w-full bg-gray-200 border border-black overflow-hidden"
                      data-oid="9wjior7"
                    >
                      <div
                        className="h-full bg-riso-blue w-2/3 animate-pulse"
                        data-oid="8odtek3"
                      ></div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div
                    className="flex flex-col gap-2 text-riso-green uppercase"
                    data-oid="po:qv.c"
                  >
                    <div
                      className="flex items-center gap-2 font-bold"
                      data-oid="n74din9"
                    >
                      <Wallet
                        className="animate-bounce w-4 h-4"
                        data-oid=".av84.z"
                      />
                      {t("mint_awaiting_sig")}
                    </div>
                    <p className="text-xs text-gray-500" data-oid="-utrnsk">
                      {t("mint_sig_desc")}
                    </p>
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
