/*
    (c) 2023 kanaaa224. All rights reserved.
*/

import * as utils from 'https://cdn.jsdelivr.net/gh/kanaaa224/web-common@master/web-app-sources/utils.js';

const { $, create } = utils.dom; utils.dom.extend();

import * as THREE        from 'https://esm.sh/three@0.152.2';
import { OrbitControls } from 'https://esm.sh/three@0.152.2/examples/jsm/controls/OrbitControls.js';

export default class App {

    constructor() {
        this.initialize();
    }

    async initialize() {
        let manifest = $('link[rel="manifest"]');

        const response = await fetch(manifest.href);
        const data     = await response.json();

        manifest = data;

        const link = create('link');

        link.rel  = 'icon';
        link.href = new URL(manifest.icons[0].src, response.url).href;

        document.head.appendChild(link);

        const title = document.title = manifest.name;

        await $('body').setHTMLWithFade(`
            <main></main>
            <footer>
                <p>© 2023 <a href="https://kanaaa224.github.io" target="_blank">kanaaa224</a>. All rights reserved.</p>
            </footer>
        `);

        await $('main').setHTMLWithFade('<canvas></canvas>');

        this.start();
    }

    start() {
        const canvas = $('main canvas');

        const width  = canvas.clientWidth;
        const height = canvas.clientHeight;

        const renderer = new THREE.WebGLRenderer({ canvas });
        const scene    = new THREE.Scene();
        const camera   = new THREE.PerspectiveCamera(45, width / height);

        renderer.setSize(width, height);

        camera.position.set(0, 0, 1000);

        const controls = new OrbitControls(camera, renderer.domElement);

        // 滑らかにカメラコントローラーを制御
        controls.enableDamping = true;
        controls.dampingFactor = 0.2;

        const mesh = new THREE.Mesh(new THREE.BoxGeometry(300, 300, 300), new THREE.MeshNormalMaterial());

        scene.add(mesh);

        const createStarField = () => {
            const vertices = [];

            for(let i = 0; i < 1000; i++) {
                const x = 3000 * (Math.random() - 0.5);
                const y = 3000 * (Math.random() - 0.5);
                const z = 3000 * (Math.random() - 0.5);

                vertices.push(x, y, z);
            }

            const geometry = new THREE.BufferGeometry();

            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

            const material = new THREE.PointsMaterial({ size: 10, color: 0xffffff });
            const mesh     = new THREE.Points(geometry, material);

            scene.add(mesh);
        };

        const tick = () => {
            mesh.rotation.y += 0.001;

            controls.update();

            renderer.render(scene, camera);

            requestAnimationFrame(tick);
        };

        createStarField(); tick();
    }

}