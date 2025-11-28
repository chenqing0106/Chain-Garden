import { Specimen, PlantDNA } from '../types';

// Pinata API 配置
const PINATA_API_BASE = import.meta.env.VITE_PINATA_API_BASE || 'https://api.pinata.cloud';
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_GATEWAY_BASE = import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';

// 调试：检查环境变量是否被正确加载（开发环境）
if (import.meta.env.DEV) {
  console.log('[IPFS Service] 环境变量检查:', {
    hasJWT: !!PINATA_JWT,
    jwtLength: PINATA_JWT?.length || 0,
    apiBase: PINATA_API_BASE,
    gatewayBase: PINATA_GATEWAY_BASE,
  });
}

// Pinata API 端点
const PIN_FILE_ENDPOINT = `${PINATA_API_BASE}/pinning/pinFileToIPFS`;
const PIN_JSON_ENDPOINT = `${PINATA_API_BASE}/pinning/pinJSONToIPFS`;

// 数据 URL 正则表达式
const DATA_URL_REGEX = /^data:(.+);base64,(.+)$/;

/**
 * OpenSea 标准的元数据属性接口
 */
export interface MetadataAttribute {
  trait_type: string;
  value: string | number;
  display_type?: 'number' | 'boost_number' | 'boost_percentage' | 'date';
}

/**
 * OpenSea 标准的 NFT 元数据接口
 */
export interface MetadataMediaLink {
  uri: string;
  gateway: string;
}

export interface ChainGardenMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: MetadataAttribute[];
  dna?: PlantDNA; // 保留完整 DNA 数据供后续使用
  background_color?: string;
  generative_audio?: MetadataMediaLink;
  reflection_audio?: MetadataMediaLink;
  reflection_question?: string;
  captured_at?: string;
}

/**
 * IPFS 上传结果
 */
export interface IpfsUploadResult {
  cid: string;
  uri: string; // ipfs://Qm...
  gatewayUrl: string; // https://gateway.pinata.cloud/ipfs/Qm...
}

/**
 * 完整上传结果（包含图片和元数据）
 */
export interface UploadSpecimenResult {
  image: IpfsUploadResult;
  generativeAudio?: IpfsUploadResult;
  reflectionAudio?: IpfsUploadResult;
  metadata: IpfsUploadResult;
  payload: ChainGardenMetadata;
}

/**
 * 检查 Pinata JWT 是否配置
 */
const ensurePinataJwt = () => {
  if (!PINATA_JWT) {
    throw new Error(
      '缺少 Pinata JWT。请在 .env 文件中配置 VITE_PINATA_JWT 后再试。'
    );
  }
};

/**
 * 将 Pinata 返回的 CID 转换为标准格式
 */
const toIpfsResult = (cid: string): IpfsUploadResult => {
  if (!cid) {
    throw new Error('Pinata 返回结果缺少 CID。');
  }
  return {
    cid,
    uri: `ipfs://${cid}`,
    gatewayUrl: `${PINATA_GATEWAY_BASE}/${cid}`,
  };
};

/**
 * 将 Data URL 解码为二进制数据
 */
const decodeDataUrl = (dataUrl: string): { mime: string; bytes: Uint8Array } => {
  const matches = dataUrl.match(DATA_URL_REGEX);
  if (!matches) {
    throw new Error('图片数据格式无效，期望 dataURL 格式。');
  }

  const [, mime, base64String] = matches;
  const binary = atob(base64String);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return { mime, bytes };
};

type UploadableContent = string | Blob;

const ensureFileName = (provided: string | undefined, mime: string) => {
  if (provided && provided.includes('.')) return provided;
  const extension = mime.split('/')[1] || 'bin';
  const safeBase = (provided || 'chaingarden-asset').replace(/\s+/g, '-');
  return `${safeBase}.${extension}`;
};

const normalizeUploadContent = (
  source: UploadableContent,
  fileName?: string
): { blob: Blob; fileName: string; mime: string } => {
  if (typeof source === 'string') {
    const { mime, bytes } = decodeDataUrl(source);
    const arrayBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: mime });
    return {
      blob,
      mime,
      fileName: ensureFileName(fileName, mime),
    };
  }

  const mime = source.type || 'application/octet-stream';
  return {
    blob: source,
    mime,
    fileName: ensureFileName(fileName, mime),
  };
};

const detectAssetType = (mime: string) => {
  if (mime.startsWith('image/')) return 'specimen-image';
  if (mime.startsWith('audio/')) return 'specimen-audio';
  if (mime.startsWith('video/')) return 'specimen-video';
  return 'specimen-asset';
};

/**
 * 上传二进制数据到 IPFS（支持图片/音频/视频等）
 */
export const uploadBlobToIPFS = async (
  content: UploadableContent,
  fileName?: string
): Promise<IpfsUploadResult> => {
  ensurePinataJwt();
  const { blob, fileName: resolvedName, mime } = normalizeUploadContent(
    content,
    fileName
  );

  // 创建 FormData
  const formData = new FormData();
  formData.append('file', blob, resolvedName);
  formData.append(
    'pinataMetadata',
    JSON.stringify({
      name: resolvedName,
      keyvalues: {
        app: 'ChainGarden',
        type: detectAssetType(mime),
      },
    })
  );
  formData.append(
    'pinataOptions',
    JSON.stringify({
      cidVersion: 1,
    })
  );

  // 上传到 Pinata
  const response = await fetch(PIN_FILE_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  });

  const payload = await response.json();

  if (!response.ok) {
    const message =
      payload?.error?.details || payload?.error || 'Pinata 文件上传失败';
    throw new Error(message);
  }

  const cid = payload?.IpfsHash || payload?.cid || payload?.Hash;
  return toIpfsResult(cid);
};

// 统一的上传选项接口
export interface UploadOptions {
  /** 控制是否包含 DNA 数据和所有相关属性 (attributes) */
  includeDNA?: boolean; 
  /** 控制是否上传 generativeAudio */
  includeAudio?: boolean; 
  /** 控制是否上传 reflectionAudio，同时影响 reflection_question */
  includeVoice?: boolean; 
}

// 统一的默认值
const DEFAULT_UPLOAD_OPTIONS: Required<UploadOptions> = {
  includeDNA: true,
  includeAudio: true,
  includeVoice: true,
};

/**
 * 从 Specimen 生成符合 OpenSea 标准的元数据
 * @param specimen - 植物标本数据
 * @param imageUri - 图片的 IPFS URI（ipfs://...）
 * @returns OpenSea 标准元数据
 */
interface MediaReferences {
  generativeAudio?: IpfsUploadResult;
  reflectionAudio?: IpfsUploadResult;
  options: UploadOptions; // 新增：传递上传选项
}

const toMetadataMediaLink = (
  result?: IpfsUploadResult
): MetadataMediaLink | undefined =>
  result
    ? {
        uri: result.uri,
        gateway: result.gatewayUrl,
      }
    : undefined;

export const createMetadataFromSpecimen = (
  specimen: Specimen,
  imageUri: string,
  media: MediaReferences
): ChainGardenMetadata => {
  const { dna, prompt, timestamp } = specimen;
  const { 
    includeDNA = true, 
    includeVoice = true,
  } = media.options;
  const generativeAudioLink = toMetadataMediaLink(media?.generativeAudio);
  const reflectionAudioLink = toMetadataMediaLink(media?.reflectionAudio);

  let attributes: MetadataAttribute[] = [];
  let dnaData = dna;
  let reflectionQuestion: string | undefined = specimen.reflectionQuestion;

  // 如果 includeDNA 为 false，attributes 和 dna 都为空
  if (includeDNA) {
    // 构建属性数组（OpenSea 标准）
    attributes = [
      {
        trait_type: 'Growth Architecture',
        value: dna.growthArchitecture,
      },
      {
        trait_type: 'Branching Factor',
        value: dna.branchingFactor,
        display_type: 'number',
      },
      {
        trait_type: 'Angle Variance',
        value: dna.angleVariance,
        display_type: 'number',
      },
      {
        trait_type: 'Leaf Shape',
        value: dna.leafShape,
      },
      {
        trait_type: 'Leaf Arrangement',
        value: dna.leafArrangement,
      },
      {
        trait_type: 'Growth Speed',
        value: dna.growthSpeed,
        display_type: 'number',
      },
      {
        trait_type: 'Mood',
        value: dna.mood,
      },
      {
        trait_type: 'Energy',
        value: dna.energy,
        display_type: 'number',
      },
      {
        trait_type: 'Prompt',
        value: prompt,
      },
    ];
  } else {
    // 不包含 DNA 时，清空 dnaData
    dnaData = {} as Specimen['dna']; // 赋值为空对象
    // attributes 保持空数组
  }

  if (!includeVoice) {
    reflectionQuestion = undefined;
  }

  // 从颜色调色板提取背景色（取第一个颜色，去掉 #）
  const background_color = dna.colorPalette?.[0]?.replace('#', '').slice(0, 6);

  return {
    name: dna.speciesName,
    description: dna.description || 'A unique botanical specimen grown in Chain Garden.',
    image: imageUri,
    external_url: 'https://chain-garden.vercel.app/', // 可选：项目网站
    attributes, // 可选：dna属性
    background_color,
    generative_audio: generativeAudioLink, // 可选：生成音频
    reflection_audio: reflectionAudioLink, // 可选：录音
    reflection_question: reflectionQuestion,
    captured_at: new Date(timestamp).toISOString(),
    dna: dnaData, // 可选：保留完整 DNA 供后续使用
  };
};

/**
 * 上传元数据 JSON 到 IPFS
 * @param metadata - OpenSea 标准元数据对象
 * @returns IPFS 上传结果
 */
export const uploadMetadataToIPFS = async (
  metadata: ChainGardenMetadata
): Promise<IpfsUploadResult> => {
  ensurePinataJwt();

  const response = await fetch(PIN_JSON_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pinataMetadata: {
        name: metadata.name,
        keyvalues: {
          app: 'ChainGarden',
          type: 'specimen-metadata',
        },
      },
      pinataOptions: {
        cidVersion: 1,
      },
      pinataContent: metadata,
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    const message =
      payload?.error?.details || payload?.error || 'Pinata 元数据上传失败';
    throw new Error(message);
  }

  const cid = payload?.IpfsHash || payload?.cid || payload?.Hash;
  return toIpfsResult(cid);
};

/**
 * 完整流程：上传标本到 IPFS（图片/音频 + 元数据）
 * @param specimen - 植物标本数据
 * @returns 包含图片，音频和元数据上传结果的完整对象
 */
export const uploadSpecimenToIPFS = async (
  specimen: Specimen,
  options?: UploadOptions // 新增可选参数
): Promise<UploadSpecimenResult> => {
  // 合并用户传入的 options 和默认值
  const resolvedOptions: Required<UploadOptions> = {
    ...DEFAULT_UPLOAD_OPTIONS,
    ...options,
    includeAudio: options?.includeAudio ?? DEFAULT_UPLOAD_OPTIONS.includeAudio,
    includeVoice: options?.includeVoice ?? DEFAULT_UPLOAD_OPTIONS.includeVoice,
  };

  const {
    includeDNA,
    includeAudio,
    includeVoice,
  } = resolvedOptions;

  // 1. 上传图片
  const baseName = `chain-garden-${specimen.id || Date.now()}`;
  const image = await uploadBlobToIPFS(
    specimen.imageData,
    `${baseName}.png`
  );

  // 可选：上传音频
  let generativeAudio: IpfsUploadResult | undefined = undefined;
  if (includeAudio && specimen.audioData) {
    generativeAudio = await uploadBlobToIPFS(
      specimen.audioData,
      `${baseName}-generative`
    );
  }
  // const generativeAudio = specimen.audioData
  //   ? await uploadBlobToIPFS(
  //       specimen.audioData,
  //       `${baseName}-generative`
  //     )
  //   : undefined;

  // 可选：上传录音
  let reflectionAudio: IpfsUploadResult | undefined = undefined;
  if (includeVoice && specimen.reflectionAudioData) {
    reflectionAudio = await uploadBlobToIPFS(
      specimen.reflectionAudioData,
      `${baseName}-reflection`
    );
  }

  // const reflectionAudio = specimen.reflectionAudioData
  //   ? await uploadBlobToIPFS(
  //       specimen.reflectionAudioData,
  //       `${baseName}-reflection`
  //     )
  //   : undefined;

  // 2. 生成元数据
  const payload = createMetadataFromSpecimen(specimen, image.uri, {
    generativeAudio,
    reflectionAudio,
    options: resolvedOptions, // 传递完整的选项
  });

  // 3. 上传元数据
  const metadata = await uploadMetadataToIPFS(payload);

  return {
    image,
    generativeAudio,
    reflectionAudio,
    metadata,
    payload,
  };
};
