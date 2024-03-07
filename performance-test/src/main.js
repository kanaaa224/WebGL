import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';

import { GUI           } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

let stats, gui, guiStatsEl;
let camera, controls, scene, renderer, material;

const Method = {
    INSTANCED: 'INSTANCED',
    MERGED: 'MERGED',
    NAIVE: 'NAIVE'
};

const api = {
    method: Method.INSTANCED,
    count: 1000
};

function clean() {
    const meshes = [];

    scene.traverse(function(object) {
        if(object.isMesh) meshes.push(object);
    });

    for(let i = 0; i < meshes.length; i ++) {
        const mesh = meshes[ i ];
        mesh.material.dispose();
        mesh.geometry.dispose();

        scene.remove(mesh);
    }
}

const randomizeMatrix = function() {
    const position   = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale      = new THREE.Vector3();

    return function(matrix) {
        position.x = Math.random() * 40 - 20;
        position.y = Math.random() * 40 - 20;
        position.z = Math.random() * 40 - 20;

        quaternion.random();

        scale.x = scale.y = scale.z = Math.random() * 1;

        matrix.compose(position, quaternion, scale);
    }
}();

function initMesh() {
    clean();

    let url = '//raw.githubusercontent.com/mrdoob/three.js/refs/heads/master/examples/'

    new THREE.BufferGeometryLoader()
        .setPath(url + 'models/json/')
        .load('suzanne_buffergeometry.json', function(geometry) {
            material = new THREE.MeshNormalMaterial();

            geometry.computeVertexNormals();

            console.time(api.method + ' (build)');

            switch(api.method) {
                case Method.INSTANCED:
                    makeInstanced(geometry);
                    break;

                case Method.MERGED:
                    makeMerged(geometry);
                    break;

                case Method.NAIVE:
                    makeNaive(geometry);
                    break;
            }

            console.timeEnd(api.method + ' (build)');
        });
}

function makeInstanced(geometry) {
    const matrix = new THREE.Matrix4();
    const mesh = new THREE.InstancedMesh(geometry, material, api.count);

    for(let i = 0; i < api.count; i ++) {
        randomizeMatrix(matrix);
        mesh.setMatrixAt(i, matrix);
    }

    scene.add(mesh);

    const geometryByteLength = getGeometryByteLength(geometry);

    guiStatsEl.innerHTML = [
        '<i>GPU draw calls</i>: 1',
        '<i>GPU memory</i>: ' + formatBytes(api.count * 16 + geometryByteLength, 2)
    ].join('<br/>');
}

function makeMerged(geometry) {
    const geometries = [];
    const matrix = new THREE.Matrix4();

    for(let i = 0; i < api.count; i ++) {
        randomizeMatrix(matrix);

        const instanceGeometry = geometry.clone();
        instanceGeometry.applyMatrix4(matrix);

        geometries.push(instanceGeometry);
    }

    const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);

    scene.add(new THREE.Mesh(mergedGeometry, material));

    guiStatsEl.innerHTML = [
        '<i>GPU draw calls</i>: 1',
        '<i>GPU memory</i>: ' + formatBytes(getGeometryByteLength(mergedGeometry), 2)
    ].join('<br/>');
}

function makeNaive(geometry) {
    const matrix = new THREE.Matrix4();

    for(let i = 0; i < api.count; i ++) {
        randomizeMatrix(matrix);

        const mesh = new THREE.Mesh(geometry, material);
        mesh.applyMatrix4(matrix);

        scene.add(mesh);
    }

    const geometryByteLength = getGeometryByteLength(geometry);

    guiStatsEl.innerHTML = [
        '<i>GPU draw calls</i>: ' + api.count,
        '<i>GPU memory</i>: ' + formatBytes(api.count * 16 + geometryByteLength, 2)
    ].join('<br/>');
}

function init() {
    const width  = window.innerWidth;
    const height = window.innerHeight;

    camera = new THREE.PerspectiveCamera(70, width / height, 1, 100);
    camera.position.z = 30;

    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#canvas'),
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true;

    stats = new Stats();
    document.querySelector('#canvas').insertAdjacentElement('afterend', stats.dom);

    gui = new GUI();
    gui.add(api, 'method', Method).onChange(initMesh);
    gui.add(api, 'count', 1, 10000).step(1).onChange(initMesh);

    const perfFolder = gui.addFolder('Performance');

    guiStatsEl = document.createElement('div');
    guiStatsEl.classList.add('gui-stats');

    perfFolder.$children.appendChild(guiStatsEl);
    perfFolder.open();

    window.addEventListener('resize', onWindowResize);

    Object.assign(window, { scene });
}

function onWindowResize() {
    const width  = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}

function animate() {
    requestAnimationFrame(animate);

    controls.update();
    stats.update();

    render();
}

function render() {
    renderer.render(scene, camera);
}

function getGeometryByteLength(geometry) {
    let total = 0;

    if(geometry.index) total += geometry.index.array.byteLength;

    for(const name in geometry.attributes) {
        total += geometry.attributes[ name ].array.byteLength;
    }

    return total;
}

function formatBytes(bytes, decimals) {
    if(bytes === 0) return '0 bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = [ 'bytes', 'KB', 'MB' ];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[ i ];
}

window.addEventListener('DOMContentLoaded', () => {
    init();
    initMesh();
    animate();
});