/*
    (c) 2023 kanaaa224. All rights reserved.
*/

import * as utils from 'https://cdn.jsdelivr.net/gh/kanaaa224/web-common@master/web-app-sources/utils.js';

const { $, create } = utils.dom; utils.dom.extend();

import * as THREE                   from 'https://esm.sh/three@0.152.2';
import { OrbitControls }            from 'https://esm.sh/three@0.152.2/examples/jsm/controls/OrbitControls.js';
import { RectAreaLightHelper }      from 'https://esm.sh/three@0.152.2/examples/jsm/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'https://esm.sh/three@0.152.2/examples/jsm/lights/RectAreaLightUniformsLib.js';
import Stats                        from 'https://esm.sh/three@0.152.2/examples/jsm/libs/stats.module.js';

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
        let renderer, scene, camera, stats, meshKnot;

        let onWindowResize = () => {
            renderer.setSize(window.innerWidth, window.innerHeight);

            camera.aspect = (window.innerWidth / window.innerHeight);

            camera.updateProjectionMatrix();
        };

        let animation = (time) => {
            meshKnot.rotation.y = time / 1000;

            renderer.render(scene, camera);

            stats.update();
        };

        const init = () => {
            renderer = new THREE.WebGLRenderer({
                canvas: document.querySelector('main canvas'), antialias: true
            });

            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setAnimationLoop(animation);

            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);

            camera.position.set(0, 5, - 15);

            scene = new THREE.Scene();

            RectAreaLightUniformsLib.init();

            const colors     = Array.from({ length: (utils.url.params.get('w') ?? 5) }, () => Math.floor(Math.random() * 0xffffff));
            const groupCount = 1;
            const spacing    = 5;
            const totalCount = colors.length * groupCount;
            const startX     = -((totalCount - 1) / 2) * spacing;

            for(let i = 0; i < totalCount; i++) {
                const color     = colors[i % colors.length];
                const x         = startX + i * spacing;
                const rectLight = new THREE.RectAreaLight(color, 5, 4, 10);

                rectLight.position.set(x, 5, 5);

                scene.add(rectLight);

                const helper = new RectAreaLightHelper(rectLight);

                scene.add(helper);
            }

            const geoFloor    = new THREE.BoxGeometry(2000, 0.1, 2000);
            const matStdFloor = new THREE.MeshStandardMaterial({ color: 0xbcbcbc, roughness: 0.1, metalness: 0 });
            const mshStdFloor = new THREE.Mesh(geoFloor, matStdFloor);

            scene.add(mshStdFloor);

            const geoKnot = new THREE.TorusKnotGeometry(1.5, 0.5, 200, 16);
            const matKnot = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0, metalness: 0 });

            meshKnot = new THREE.Mesh(geoKnot, matKnot);

            meshKnot.position.set(0, 5, 0);

            scene.add(meshKnot);

            const controls = new OrbitControls(camera, renderer.domElement);

            controls.target.copy(meshKnot.position);
            controls.update();

            window.addEventListener('resize', onWindowResize);

            stats = new Stats();

            document.querySelector('main canvas').insertAdjacentElement('afterend', stats.dom);
        };

        init();
    }

}