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
export interface ChainGardenMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: MetadataAttribute[];
  dna?: PlantDNA; // 保留完整 DNA 数据供后续使用
  background_color?: string;
  animation_url?: string;
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

/**
 * 上传图片到 IPFS
 * @param dataUrl - 图片的 Data URL（base64 格式）
 * @param fileName - 文件名（可选，默认为 chaingarden.png）
 * @returns IPFS 上传结果
 */
export const uploadImageToIPFS = async (
  dataUrl: string,
  fileName: string = 'chaingarden.png'
): Promise<IpfsUploadResult> => {
  ensurePinataJwt();

  // 解码 Data URL
  const { mime, bytes } = decodeDataUrl(dataUrl);
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: mime });

  // 创建 FormData
  const formData = new FormData();
  formData.append('file', blob, fileName);
  formData.append(
    'pinataMetadata',
    JSON.stringify({
      name: fileName,
      keyvalues: {
        app: 'ChainGarden',
        type: 'specimen-image',
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
      payload?.error?.details || payload?.error || 'Pinata 图片上传失败';
    throw new Error(message);
  }

  const cid = payload?.IpfsHash || payload?.cid || payload?.Hash;
  return toIpfsResult(cid);
};

/**
 * 从 Specimen 生成符合 OpenSea 标准的元数据
 * @param specimen - 植物标本数据
 * @param imageUri - 图片的 IPFS URI（ipfs://...）
 * @returns OpenSea 标准元数据
 */
export const createMetadataFromSpecimen = (
  specimen: Specimen,
  imageUri: string
): ChainGardenMetadata => {
  const { dna, prompt, timestamp } = specimen;

  // 构建属性数组（OpenSea 标准）
  const attributes: MetadataAttribute[] = [
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

  // 从颜色调色板提取背景色（取第一个颜色，去掉 #）
  const background_color = dna.colorPalette?.[0]?.replace('#', '').slice(0, 6);

  return {
    name: dna.speciesName,
    description: dna.description || 'A unique botanical specimen grown in Chain Garden.',
    image: imageUri,
    external_url: 'https://chaingarden.xyz', // 可选：项目网站
    attributes,
    background_color,
    animation_url: specimen.imageData, // 可选：使用原始图片作为动画 URL
    dna, // 保留完整 DNA 供后续使用
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
 * 完整流程：上传标本到 IPFS（图片 + 元数据）
 * @param specimen - 植物标本数据
 * @returns 包含图片和元数据上传结果的完整对象
 */
export const uploadSpecimenToIPFS = async (
  specimen: Specimen
): Promise<UploadSpecimenResult> => {
  // 1. 上传图片
  const fileName = `chain-garden-${specimen.id || Date.now()}.png`;
  const image = await uploadImageToIPFS(specimen.imageData, fileName);

  // 2. 生成元数据
  const payload = createMetadataFromSpecimen(specimen, image.uri);

  // 3. 上传元数据
  const metadata = await uploadMetadataToIPFS(payload);

  return {
    image,
    metadata,
    payload,
  };
};
