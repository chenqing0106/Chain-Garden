import React, { useState, useEffect } from 'react';
import {
  Search, TrendingUp, Clock, Music, Grid, List,
  ChevronDown, Zap, Users, Sparkles, Filter, Leaf, ShoppingBag, Wallet
} from 'lucide-react';
import { MarketListing } from '../types';
import { marketService, GENRES } from '../services/marketService';
import MusicCard from './MusicCard';

interface MarketplaceProps {
  onSelectListing: (listing: MarketListing) => void;
  walletAddress: string | null;
  refreshKey?: number;  // 购买成功后递增，触发刷新
}

type SortOption = 'latest' | 'trending' | 'price_low' | 'price_high';
type ViewMode = 'grid' | 'list';
type TabMode = 'explore' | 'holdings';

interface HoldingItem {
  listing: MarketListing;
  shares: number;
}

const Marketplace: React.FC<MarketplaceProps> = ({ onSelectListing, walletAddress, refreshKey = 0 }) => {
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<MarketListing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // 新增：标签页和持仓
  const [activeTab, setActiveTab] = useState<TabMode>('explore');
  const [holdings, setHoldings] = useState<HoldingItem[]>([]);

  // 加载市场数据 (refreshKey 变化时也刷新)
  useEffect(() => {
    const data = marketService.getAllListings();
    setListings(data);
    setFilteredListings(data);
  }, [refreshKey]);

  // 加载用户持仓 (refreshKey 变化时也刷新)
  useEffect(() => {
    if (walletAddress) {
      const userHoldings = marketService.getUserHoldings(walletAddress);
      setHoldings(userHoldings);
    } else {
      setHoldings([]);
    }
  }, [walletAddress, listings, refreshKey]);

  // 搜索和筛选
  useEffect(() => {
    let result = [...listings];

    // 搜索
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l =>
        l.specimen.dna.speciesName.toLowerCase().includes(q) ||
        l.creatorName?.toLowerCase().includes(q) ||
        l.genre?.toLowerCase().includes(q)
      );
    }

    // 类型筛选
    if (selectedGenre !== 'All') {
      result = result.filter(l => l.genre === selectedGenre);
    }

    // 排序
    switch (sortBy) {
      case 'trending':
        result.sort((a, b) => b.soldShares - a.soldShares);
        break;
      case 'price_low':
        result.sort((a, b) => a.pricePerShare - b.pricePerShare);
        break;
      case 'price_high':
        result.sort((a, b) => b.pricePerShare - a.pricePerShare);
        break;
      case 'latest':
      default:
        result.sort((a, b) => b.listedAt - a.listedAt);
    }

    setFilteredListings(result);
  }, [listings, searchQuery, selectedGenre, sortBy]);

  // 统计数据
  const totalListings = listings.length;
  const totalVolume = listings.reduce((sum, l) => sum + l.soldShares * l.pricePerShare, 0);
  const totalOwners = new Set(listings.flatMap(l => l.creator)).size;

  return (
    <div className="w-full h-full overflow-y-auto bg-grain custom-scrollbar">
      {/* Hero Section */}
      <div className="bg-riso-black text-white px-8 py-12 border-b-4 border-riso-green">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-riso-green" />
            <h1 className="text-4xl font-bold tracking-tighter">
              BOTANICAL SPECIMEN MARKETPLACE
            </h1>
          </div>
          <p className="text-gray-400 max-w-2xl mb-8 font-mono text-sm">
            Discover unique digital plants generated from audio & emotions. 
            Each specimen includes DNA, visuals, and optional music. Purchase shares with any chain asset.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-lg">
            <div className="border-l-2 border-riso-green pl-4">
              <div className="text-2xl font-bold text-riso-green">{totalListings}</div>
              <div className="text-xs text-gray-500 font-mono">SPECIMENS</div>
            </div>
            <div className="border-l-2 border-riso-pink pl-4">
              <div className="text-2xl font-bold text-riso-pink">{totalVolume.toFixed(2)}</div>
              <div className="text-xs text-gray-500 font-mono">VOLUME (ZETA)</div>
            </div>
            <div className="border-l-2 border-riso-blue pl-4">
              <div className="text-2xl font-bold text-riso-blue">{totalOwners}</div>
              <div className="text-xs text-gray-500 font-mono">BOTANISTS</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-riso-paper border-b-2 border-black px-8">
        <div className="max-w-6xl mx-auto flex">
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-4 transition-colors
                       ${activeTab === 'explore' 
                         ? 'border-riso-green text-riso-green' 
                         : 'border-transparent text-gray-500 hover:text-riso-black'}`}
          >
            <Sparkles className="w-4 h-4" />
            EXPLORE
          </button>
          <button
            onClick={() => setActiveTab('holdings')}
            className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-4 transition-colors
                       ${activeTab === 'holdings' 
                         ? 'border-riso-pink text-riso-pink' 
                         : 'border-transparent text-gray-500 hover:text-riso-black'}`}
          >
            <ShoppingBag className="w-4 h-4" />
            MY COLLECTION
            {holdings.length > 0 && (
              <span className="bg-riso-pink text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {holdings.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search & Filters (only show in explore tab) */}
      {activeTab === 'explore' && (
      <div className="sticky top-0 z-40 bg-riso-paper border-b-2 border-black px-8 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search specimens, botanists, types..."
                className="w-full pl-10 pr-4 py-2 border-2 border-black font-mono text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-riso-blue"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="appearance-none px-4 py-2 pr-8 border-2 border-black font-mono text-sm bg-white cursor-pointer
                           focus:outline-none focus:ring-2 focus:ring-riso-blue"
              >
                <option value="All">All Types</option>
                {GENRES.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none px-4 py-2 pr-8 border-2 border-black font-mono text-sm bg-white cursor-pointer
                           focus:outline-none focus:ring-2 focus:ring-riso-blue"
              >
                <option value="latest">Latest</option>
                <option value="trending">Trending</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
            </div>

            {/* View Mode */}
            <div className="flex border-2 border-black">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-riso-black text-white' : 'bg-white hover:bg-gray-100'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 border-l-2 border-black ${viewMode === 'list' ? 'bg-riso-black text-white' : 'bg-white hover:bg-gray-100'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {(searchQuery || selectedGenre !== 'All') && (
            <div className="flex gap-2 mt-3">
              {searchQuery && (
                <span className="bg-riso-blue/20 text-riso-blue text-xs font-bold px-2 py-1 flex items-center gap-1">
                  Search: {searchQuery}
                  <button onClick={() => setSearchQuery('')} className="hover:text-red-500">×</button>
                </span>
              )}
              {selectedGenre !== 'All' && (
                <span className="bg-riso-pink/20 text-riso-pink text-xs font-bold px-2 py-1 flex items-center gap-1">
                  Genre: {selectedGenre}
                  <button onClick={() => setSelectedGenre('All')} className="hover:text-red-500">×</button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {/* MY COLLECTION TAB */}
      {activeTab === 'holdings' && (
        <div className="px-8 py-8">
          <div className="max-w-6xl mx-auto">
            {!walletAddress ? (
              // 未连接钱包
              <div className="text-center py-20">
                <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-bold text-gray-500 mb-2">Connect Your Wallet</h3>
                <p className="text-sm text-gray-400 font-mono mb-4">
                  Connect your wallet to view your collected specimens
                </p>
              </div>
            ) : holdings.length === 0 ? (
              // 没有持仓
              <div className="text-center py-20">
                <Leaf className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-bold text-gray-500 mb-2">No Specimens Collected</h3>
                <p className="text-sm text-gray-400 font-mono mb-4">
                  Start collecting by purchasing shares from the marketplace
                </p>
                <button
                  onClick={() => setActiveTab('explore')}
                  className="px-6 py-2 bg-riso-green text-white font-bold border-2 border-black
                             hover:bg-riso-black transition-colors"
                >
                  EXPLORE MARKETPLACE
                </button>
              </div>
            ) : (
              // 显示持仓
              <>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold">My Collection</h2>
                    <p className="text-sm text-gray-500 font-mono">
                      {holdings.length} specimen{holdings.length > 1 ? 's' : ''} • {holdings.reduce((sum, h) => sum + h.shares, 0)} total shares
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {holdings.map(({ listing, shares }) => (
                    <div
                      key={listing.id}
                      onClick={() => onSelectListing(listing)}
                      className="bg-white border-2 border-riso-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] 
                                 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px]
                                 transition-all cursor-pointer group overflow-hidden"
                    >
                      {/* 图片区域 */}
                      <div className="relative aspect-square overflow-hidden border-b-2 border-riso-black">
                        <img
                          src={listing.specimen.imageData}
                          alt={listing.specimen.dna.speciesName}
                          className="w-full h-full object-cover"
                        />
                        {/* 持有标签 */}
                        <div className="absolute top-2 left-2 bg-riso-pink text-white text-[10px] font-bold px-2 py-1 border border-black">
                          OWNED
                        </div>
                        <div className="absolute bottom-2 right-2 bg-riso-black text-white text-xs font-bold px-2 py-1">
                          {shares} shares
                        </div>
                      </div>
                      
                      {/* 信息区域 */}
                      <div className="p-4 space-y-2">
                        <h3 className="font-bold text-sm truncate">{listing.specimen.dna.speciesName}</h3>
                        <p className="text-xs text-gray-500 font-mono">by {listing.creatorName}</p>
                        
                        <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-300">
                          <span className="text-[10px] text-gray-400">Your ownership</span>
                          <span className="text-sm font-bold text-riso-green">
                            {((shares / listing.totalShares) * 100).toFixed(1)}%
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-gray-400">Value</span>
                          <span className="text-sm font-bold flex items-center gap-1">
                            <Zap className="w-3 h-3 text-riso-green" />
                            {(shares * listing.pricePerShare).toFixed(3)} ZETA
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* EXPLORE TAB - Results */}
      {activeTab === 'explore' && (
      <div className="px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Results Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm font-mono text-gray-500">
              Showing {filteredListings.length} of {listings.length} specimens
            </div>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredListings.map(listing => (
                <MusicCard
                  key={listing.id}
                  listing={listing}
                  onClick={onSelectListing}
                />
              ))}
            </div>
          ) : (
            // List View
            <div className="space-y-4">
              {filteredListings.map(listing => (
                <div
                  key={listing.id}
                  onClick={() => onSelectListing(listing)}
                  className="bg-white border-2 border-black p-4 flex items-center gap-4 cursor-pointer
                             hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1
                             transition-all"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 border-2 border-black overflow-hidden flex-shrink-0">
                    <img
                      src={listing.specimen.imageData}
                      alt={listing.specimen.dna.speciesName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate">{listing.specimen.dna.speciesName}</h3>
                    <p className="text-xs text-gray-500 font-mono">by {listing.creatorName}</p>
                    <div className="flex gap-2 mt-1">
                      {listing.genre && (
                        <span className="text-[10px] bg-riso-blue/20 text-riso-blue px-1">{listing.genre}</span>
                      )}
                      <span className="text-[10px] bg-riso-pink/20 text-riso-pink px-1 uppercase">
                        {listing.specimen.dna.mood}
                      </span>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-sm font-bold text-riso-green">
                      <Zap className="w-4 h-4" />
                      {listing.pricePerShare.toFixed(3)} ZETA
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {listing.soldShares}/{listing.totalShares} sold
                    </div>
                  </div>
                  
                  {/* Action */}
                  <button className="px-4 py-2 bg-riso-black text-white text-xs font-bold hover:bg-riso-green transition-colors">
                    BUY
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {filteredListings.length === 0 && (
            <div className="text-center py-20">
              <Music className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-bold text-gray-500 mb-2">No specimens found</h3>
              <p className="text-sm text-gray-400 font-mono">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Cross-chain Banner */}
      <div className="bg-gradient-to-r from-riso-blue to-riso-green text-white px-8 py-6 mt-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg mb-1">⚡ Powered by ZetaChain</h3>
            <p className="text-sm opacity-80 font-mono">
              Pay with ETH, BNB, MATIC, or BTC - seamlessly converted via cross-chain messaging
            </p>
          </div>
          <div className="flex gap-2 text-2xl">
            <span>🔷</span>
            <span>🟡</span>
            <span>🟣</span>
            <span>🟠</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;

