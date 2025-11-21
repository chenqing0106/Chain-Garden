
export interface PlantDNA {
  speciesName: string;
  description: string;
  // Structural Logic
  growthArchitecture: 'fractal_tree' | 'organic_vine' | 'radial_succulent' | 'fern_frond';
  branchingFactor: number; // 2 to 5
  angleVariance: number; // How much angles deviate
  
  // Visuals
  colorPalette: string[]; // [Stem, Leaf_Main, Leaf_Highlight]
  leafShape: 'fern' | 'round' | 'needle' | 'abstract' | 'heart';
  leafArrangement: 'alternate' | 'opposite' | 'whorled';
  
  growthSpeed: number;
}

export interface Specimen {
  id: string;
  dna: PlantDNA;
  prompt: string; // User input or "Manual"
  timestamp: number;
  imageData: string; // Base64 of the snapshot
  // Blockchain Data
  txHash?: string;
  owner?: string;
  tokenId?: string;
}

export interface AudioSource {
  getFrequencyData(): { bass: number; mid: number; treble: number; raw: Uint8Array };
  cleanup?(): void;
}
