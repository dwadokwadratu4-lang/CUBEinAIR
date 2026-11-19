import * as THREE from 'three';
import { createCubeMaterials } from './createCubeMaterials';

export const CUBE_SIZE = 1.1;
const HIDDEN_CLEARANCE = 0.004;

export interface ArStage {
  root: THREE.Group;
  cubeGroup: THREE.Group;
  setEmergence: (normalized: number) => void;
  getCubeTargetY: (normalized: number) => number;
  dispose: () => void;
}

export function createArStage(maxAnisotropy: number): ArStage {
  const root = new THREE.Group();

  // 1. Invisible floor occlusion mask (colorWrite: false)
  // Rendered first (renderOrder = 0) so any cube geometry below y = 0
  // fails the depth test and is completely masked out over the AR camera feed.
  const occluderGeo = new THREE.PlaneGeometry(24, 24);
  occluderGeo.rotateX(-Math.PI / 2);
  const occluderMat = new THREE.MeshBasicMaterial({
    colorWrite: false,
    depthWrite: true,
    depthTest: true,
    side: THREE.FrontSide,
  });
  const occluderMesh = new THREE.Mesh(occluderGeo, occluderMat);
  occluderMesh.position.y = 0;
  occluderMesh.renderOrder = 0;
  root.add(occluderMesh);

  // 2. Transparent shadow-catcher plane right above the occluder
  const shadowGeo = new THREE.PlaneGeometry(10, 10);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.ShadowMaterial({
    opacity: 0.38,
    transparent: true,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.position.y = 0.001;
  shadowMesh.receiveShadow = true;
  shadowMesh.renderOrder = 1;
  root.add(shadowMesh);

  // 3. Subtle virtual plane reticle so the user can always feel plane rotation
  // even when the cube is 0% emerged under the floor mask.
  const reticleGroup = new THREE.Group();
  reticleGroup.position.y = 0.002;

  const outerRingGeo = new THREE.RingGeometry(0.98, 1.01, 64);
  outerRingGeo.rotateX(-Math.PI / 2);
  const outerRingMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
  outerRing.renderOrder = 2;
  reticleGroup.add(outerRing);

  const innerRingGeo = new THREE.RingGeometry(0.76, 0.775, 64);
  innerRingGeo.rotateX(-Math.PI / 2);
  const innerRingMat = new THREE.MeshBasicMaterial({
    color: 0x2dd4bf,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
  innerRing.renderOrder = 2;
  reticleGroup.add(innerRing);

  // Four subtle cardinal floor tick marks
  const tickGeo = new THREE.PlaneGeometry(0.03, 0.16);
  tickGeo.rotateX(-Math.PI / 2);
  const tickMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const tickOffsets: Array<[number, number, number]> = [
    [0, 1.12, 0],
    [0, -1.12, 0],
    [1.12, 0, Math.PI / 2],
    [-1.12, 0, Math.PI / 2],
  ];
  tickOffsets.forEach(([x, z, rotY]) => {
    const tick = new THREE.Mesh(tickGeo, tickMat);
    tick.position.set(x, 0, z);
    tick.rotation.y = rotY;
    tick.renderOrder = 2;
    reticleGroup.add(tick);
  });

  root.add(reticleGroup);

  // 4. 6-Color 3D Cube Assembly
  const cubeGroup = new THREE.Group();
  const cubeGeo = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
  const materialBundle = createCubeMaterials(maxAnisotropy);
  const cubeMesh = new THREE.Mesh(cubeGeo, materialBundle.materials);
  cubeMesh.castShadow = true;
  cubeMesh.receiveShadow = true;
  cubeMesh.renderOrder = 3;
  cubeGroup.add(cubeMesh);

  const edgesGeo = new THREE.EdgesGeometry(cubeGeo);
  const edgesMat = new THREE.LineBasicMaterial({
    color: 0x0f172a,
    transparent: true,
    opacity: 0.35,
  });
  const cubeEdges = new THREE.LineSegments(edgesGeo, edgesMat);
  cubeEdges.renderOrder = 4;
  cubeGroup.add(cubeEdges);

  root.add(cubeGroup);

  const getCubeTargetY = (normalized: number): number => {
    const t = THREE.MathUtils.clamp(normalized, 0, 1);
    const minY = -CUBE_SIZE / 2 - HIDDEN_CLEARANCE;
    const maxY = CUBE_SIZE / 2;
    return THREE.MathUtils.lerp(minY, maxY, t);
  };

  const setEmergence = (normalized: number): void => {
    cubeGroup.position.y = getCubeTargetY(normalized);
  };

  setEmergence(1);

  const dispose = (): void => {
    occluderGeo.dispose();
    occluderMat.dispose();
    shadowGeo.dispose();
    shadowMat.dispose();
    outerRingGeo.dispose();
    outerRingMat.dispose();
    innerRingGeo.dispose();
    innerRingMat.dispose();
    tickGeo.dispose();
    tickMat.dispose();
    cubeGeo.dispose();
    edgesGeo.dispose();
    edgesMat.dispose();
    materialBundle.dispose();
  };

  return {
    root,
    cubeGroup,
    setEmergence,
    getCubeTargetY,
    dispose,
  };
}
