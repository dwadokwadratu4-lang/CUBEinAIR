import * as THREE from 'three';

export interface CubeFaceSpec {
  id: string;
  label: string;
  hex: string;
  edgeHex: string;
  roughness: number;
}

/**
 * Six distinct face colors required for the AR cube:
 * +X: Czerwony, -X: Turkusowy, +Y: Pomarańczowy,
 * -Y: Granatowy, +Z: Niebieski, -Z: Żółty
 */
export const CUBE_FACE_SPECS: readonly CubeFaceSpec[] = [
  {
    id: 'right',
    label: 'Czerwony',
    hex: '#ef4444',
    edgeHex: '#b91c1c',
    roughness: 0.32,
  },
  {
    id: 'left',
    label: 'Turkusowy',
    hex: '#14b8a6',
    edgeHex: '#0f766e',
    roughness: 0.28,
  },
  {
    id: 'top',
    label: 'Pomarańczowy',
    hex: '#f97316',
    edgeHex: '#c2410c',
    roughness: 0.34,
  },
  {
    id: 'bottom',
    label: 'Granatowy',
    hex: '#172554',
    edgeHex: '#0f172a',
    roughness: 0.38,
  },
  {
    id: 'front',
    label: 'Niebieski',
    hex: '#3b82f6',
    edgeHex: '#1d4ed8',
    roughness: 0.3,
  },
  {
    id: 'back',
    label: 'Żółty',
    hex: '#facc15',
    edgeHex: '#ca8a04',
    roughness: 0.32,
  },
];

function createFaceTexture(
  spec: CubeFaceSpec,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Base vivid color
    ctx.fillStyle = spec.hex;
    ctx.fillRect(0, 0, size, size);

    // Subtle radial satin sheen so faces read richly under studio lighting
    const grad = ctx.createRadialGradient(
      size * 0.38,
      size * 0.34,
      size * 0.08,
      size * 0.5,
      size * 0.5,
      size * 0.75
    );
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.14)');
    grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Subtle darker edge bevel frame
    ctx.strokeStyle = spec.edgeHex;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, size - 10, size - 10);

    // Crisp inner architectural hairline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, size - 36, size - 36);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.max(1, maxAnisotropy);
  texture.needsUpdate = true;
  return texture;
}

export interface CubeMaterialBundle {
  materials: THREE.MeshStandardMaterial[];
  dispose: () => void;
}

export function createCubeMaterials(maxAnisotropy: number): CubeMaterialBundle {
  const textures: THREE.CanvasTexture[] = [];

  const materials = CUBE_FACE_SPECS.map((spec) => {
    const map = createFaceTexture(spec, maxAnisotropy);
    textures.push(map);

    return new THREE.MeshStandardMaterial({
      map,
      roughness: spec.roughness,
      metalness: 0.08,
      envMapIntensity: 0.9,
    });
  });

  return {
    materials,
    dispose: () => {
      materials.forEach((mat) => mat.dispose());
      textures.forEach((tex) => tex.dispose());
    },
  };
}
