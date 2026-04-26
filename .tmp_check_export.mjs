import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

console.log('three ok', typeof THREE.Mesh === 'function');
console.log('exporter ok', typeof GLTFExporter === 'function');

const g = new THREE.BoxGeometry(1, 1, 1);
const m = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const mesh = new THREE.Mesh(g, m);
mesh.name = 'Body';

const exporter = new GLTFExporter();
exporter.parse(
  mesh,
  (res) => {
    console.log('binary', res instanceof ArrayBuffer, res.byteLength || 0);
  },
  (err) => {
    console.error('ERR', err);
    process.exitCode = 1;
  },
  { binary: true }
);
