/**
 * Storage Service - Wallet-based persistent storage
 * Stores collection data keyed by wallet address for cross-session persistence
 */

import { Specimen } from '../types';

const STORAGE_PREFIX = 'chainGarden_';
const GLOBAL_COLLECTION_KEY = `${STORAGE_PREFIX}global_collection`;
const WALLET_MAPPING_KEY = `${STORAGE_PREFIX}wallet_mapping`;

export interface WalletMapping {
  [walletAddress: string]: string[]; // wallet -> specimen IDs
}

export class StorageService {
  
  /**
   * Get all specimens for a specific wallet address
   */
  static getWalletCollection(walletAddress: string | null): Specimen[] {
    try {
      if (!walletAddress) {
        // Return anonymous collection if no wallet connected
        return this.getAnonymousCollection();
      }

      const normalizedAddress = walletAddress.toLowerCase();
      const mapping = this.getWalletMapping();
      const specimenIds = mapping[normalizedAddress] || [];
      
      const globalCollection = this.getGlobalCollection();
      
      // Filter specimens that belong to this wallet
      return globalCollection.filter(s => specimenIds.includes(s.id));
    } catch (e) {
      console.error('Failed to load wallet collection:', e);
      return [];
    }
  }

  /**
   * Save a new specimen and associate it with the wallet
   */
  static saveSpecimen(specimen: Specimen, walletAddress: string | null): void {
    try {
      // 1. Add to global collection
      const globalCollection = this.getGlobalCollection();
      const updatedGlobal = [specimen, ...globalCollection];
      localStorage.setItem(GLOBAL_COLLECTION_KEY, JSON.stringify(updatedGlobal));

      // 2. Associate with wallet if connected
      if (walletAddress) {
        const normalizedAddress = walletAddress.toLowerCase();
        const mapping = this.getWalletMapping();
        
        if (!mapping[normalizedAddress]) {
          mapping[normalizedAddress] = [];
        }
        
        mapping[normalizedAddress].unshift(specimen.id);
        localStorage.setItem(WALLET_MAPPING_KEY, JSON.stringify(mapping));
      } else {
        // Track anonymous specimens
        this.addToAnonymousCollection(specimen.id);
      }
    } catch (e) {
      console.error('Storage limit exceeded:', e);
      throw new Error('Storage limit reached! Please delete some specimens.');
    }
  }

  /**
   * Update an existing specimen (e.g., after minting)
   */
  static updateSpecimen(specimen: Specimen): void {
    try {
      const globalCollection = this.getGlobalCollection();
      const updatedGlobal = globalCollection.map(s => 
        s.id === specimen.id ? specimen : s
      );
      localStorage.setItem(GLOBAL_COLLECTION_KEY, JSON.stringify(updatedGlobal));
    } catch (e) {
      console.error('Failed to update specimen:', e);
    }
  }

  /**
   * Delete a specimen
   */
  static deleteSpecimen(specimenId: string, walletAddress: string | null): void {
    try {
      // 1. Remove from global collection
      const globalCollection = this.getGlobalCollection();
      const updatedGlobal = globalCollection.filter(s => s.id !== specimenId);
      localStorage.setItem(GLOBAL_COLLECTION_KEY, JSON.stringify(updatedGlobal));

      // 2. Remove from wallet mapping
      if (walletAddress) {
        const normalizedAddress = walletAddress.toLowerCase();
        const mapping = this.getWalletMapping();
        
        if (mapping[normalizedAddress]) {
          mapping[normalizedAddress] = mapping[normalizedAddress].filter(id => id !== specimenId);
          localStorage.setItem(WALLET_MAPPING_KEY, JSON.stringify(mapping));
        }
      } else {
        this.removeFromAnonymousCollection(specimenId);
      }
    } catch (e) {
      console.error('Failed to delete specimen:', e);
    }
  }

  /**
   * Clear all specimens for a wallet
   */
  static clearWalletCollection(walletAddress: string | null): void {
    try {
      if (!walletAddress) {
        this.clearAnonymousCollection();
        return;
      }

      const normalizedAddress = walletAddress.toLowerCase();
      const mapping = this.getWalletMapping();
      const specimenIds = mapping[normalizedAddress] || [];
      
      // Remove specimens from global collection
      const globalCollection = this.getGlobalCollection();
      const updatedGlobal = globalCollection.filter(s => !specimenIds.includes(s.id));
      localStorage.setItem(GLOBAL_COLLECTION_KEY, JSON.stringify(updatedGlobal));
      
      // Clear wallet mapping
      delete mapping[normalizedAddress];
      localStorage.setItem(WALLET_MAPPING_KEY, JSON.stringify(mapping));
    } catch (e) {
      console.error('Failed to clear collection:', e);
    }
  }

  /**
   * Transfer anonymous specimens to a wallet when connecting
   */
  static transferAnonymousToWallet(walletAddress: string): void {
    try {
      const anonymousSpecimens = this.getAnonymousCollection();
      if (anonymousSpecimens.length === 0) return;

      const anonymousIds = anonymousSpecimens.map(s => s.id);
      const normalizedAddress = walletAddress.toLowerCase();
      const mapping = this.getWalletMapping();
      
      if (!mapping[normalizedAddress]) {
        mapping[normalizedAddress] = [];
      }
      
      // Transfer ownership
      mapping[normalizedAddress] = [...anonymousIds, ...mapping[normalizedAddress]];
      localStorage.setItem(WALLET_MAPPING_KEY, JSON.stringify(mapping));
      
      // Clear anonymous collection
      this.clearAnonymousCollection();
    } catch (e) {
      console.error('Failed to transfer anonymous specimens:', e);
    }
  }

  /**
   * Get total specimen count across all wallets
   */
  static getTotalSpecimenCount(): number {
    return this.getGlobalCollection().length;
  }

  // --- Private Helper Methods ---

  private static getGlobalCollection(): Specimen[] {
    try {
      const data = localStorage.getItem(GLOBAL_COLLECTION_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  private static getWalletMapping(): WalletMapping {
    try {
      const data = localStorage.getItem(WALLET_MAPPING_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  private static getAnonymousCollection(): Specimen[] {
    try {
      const anonymousKey = `${STORAGE_PREFIX}anonymous`;
      const data = localStorage.getItem(anonymousKey);
      const anonymousIds: string[] = data ? JSON.parse(data) : [];
      
      const globalCollection = this.getGlobalCollection();
      return globalCollection.filter(s => anonymousIds.includes(s.id));
    } catch (e) {
      return [];
    }
  }

  private static addToAnonymousCollection(specimenId: string): void {
    try {
      const anonymousKey = `${STORAGE_PREFIX}anonymous`;
      const data = localStorage.getItem(anonymousKey);
      const anonymousIds: string[] = data ? JSON.parse(data) : [];
      anonymousIds.unshift(specimenId);
      localStorage.setItem(anonymousKey, JSON.stringify(anonymousIds));
    } catch (e) {
      console.error('Failed to add to anonymous collection:', e);
    }
  }

  private static removeFromAnonymousCollection(specimenId: string): void {
    try {
      const anonymousKey = `${STORAGE_PREFIX}anonymous`;
      const data = localStorage.getItem(anonymousKey);
      const anonymousIds: string[] = data ? JSON.parse(data) : [];
      const updated = anonymousIds.filter(id => id !== specimenId);
      localStorage.setItem(anonymousKey, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to remove from anonymous collection:', e);
    }
  }

  private static clearAnonymousCollection(): void {
    try {
      const anonymousKey = `${STORAGE_PREFIX}anonymous`;
      const anonymousIds = this.getAnonymousCollection().map(s => s.id);
      
      // Remove from global collection
      const globalCollection = this.getGlobalCollection();
      const updatedGlobal = globalCollection.filter(s => !anonymousIds.includes(s.id));
      localStorage.setItem(GLOBAL_COLLECTION_KEY, JSON.stringify(updatedGlobal));
      
      // Clear anonymous list
      localStorage.removeItem(anonymousKey);
    } catch (e) {
      console.error('Failed to clear anonymous collection:', e);
    }
  }

  /**
   * Migrate old storage format to new wallet-based format
   */
  static migrateOldStorage(walletAddress: string | null): void {
    try {
      const oldKey = 'chainGarden_collection';
      const oldData = localStorage.getItem(oldKey);
      
      if (!oldData) return;
      
      const oldCollection: Specimen[] = JSON.parse(oldData);
      
      if (oldCollection.length === 0) {
        localStorage.removeItem(oldKey);
        return;
      }

      // Save to new format
      localStorage.setItem(GLOBAL_COLLECTION_KEY, JSON.stringify(oldCollection));
      
      const specimenIds = oldCollection.map(s => s.id);
      
      if (walletAddress) {
        const normalizedAddress = walletAddress.toLowerCase();
        const mapping = this.getWalletMapping();
        mapping[normalizedAddress] = specimenIds;
        localStorage.setItem(WALLET_MAPPING_KEY, JSON.stringify(mapping));
      } else {
        const anonymousKey = `${STORAGE_PREFIX}anonymous`;
        localStorage.setItem(anonymousKey, JSON.stringify(specimenIds));
      }
      
      // Remove old key
      localStorage.removeItem(oldKey);
      
      console.log(`Migrated ${oldCollection.length} specimens to new storage format`);
    } catch (e) {
      console.error('Migration failed:', e);
    }
  }
}
