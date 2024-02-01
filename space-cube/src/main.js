import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const init = () => {
    const width  = window.innerWidth;
    const height = window.innerHeight;

    // レンダラーを作成
    const renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#canvas')
    });

    renderer.setSize(width, height);

    // シーンを作成
    const scene = new THREE.Scene();

    // カメラを作成
    const camera = new THREE.PerspectiveCamera(45, width / height);

    // カメラの初期座標を設定
    camera.position.set(0, 0, 1000);

    // カメラコントローラーを作成
    const controls = new OrbitControls(camera, renderer.domElement);

    // 滑らかにカメラコントローラーを制御
    controls.enableDamping = true;
    controls.dampingFactor = 0.2;

    // 箱のメッシュ
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(300, 300, 300), new THREE.MeshNormalMaterial());
    scene.add(mesh);

    let createStarField = () => {
        // 頂点情報を格納
        const vertices = [];

        // 1000 個の頂点を作成
        for(let i = 0; i < 1000; i++) {
            const x = 3000 * (Math.random() - 0.5);
            const y = 3000 * (Math.random() - 0.5);
            const z = 3000 * (Math.random() - 0.5);

            vertices.push(x, y, z);
        }

        // 形状データを作成
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        // マテリアルを作成
        const material = new THREE.PointsMaterial({
            size: 10,
            color: 0xffffff,
        });

        // 物体を作成
        const mesh = new THREE.Points(geometry, material);
        scene.add(mesh);
    }

    let tick = () => {
        // 箱を常に回転
        mesh.rotation.y += 0.001;

        // カメラコントローラーを更新
        controls.update();

        // レンダリング
        renderer.render(scene, camera);

        requestAnimationFrame(tick);
    };

    // 星を作成
    createStarField();

    // 毎フレーム時に実行されるループイベント
    tick();
};

window.addEventListener('DOMContentLoaded', init);