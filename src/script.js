import { step } from 'three/webgpu';
import * as THREE from '../node_modules/three/build/three.module.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';


class Game {
    constructor(numDisks) {
        this.numDisks = numDisks;
        this.isAnimating = true;
        this.disks = [];
        this.moveList = [];
        this.controller = new AbortController();
        this.counter = 0;

        this.pegDisks = { 0: [], 1: [], 2: [] }; // Discos em cada haste
        this.fov = 50;
        this.aspect = 2.25; // the canvas default
        this.near = 0.1;
        this.far = 100;
        this.baseHeight = -8;
        this.diskHeight = 1.2;
        this.camera = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
        this.camera.position.set(0, 0, 30);
        this.camera.lookAt(0, 0, 0); // Garanta que a câmera esteja olhando para o centro da cena

        this.fromPeg = document.querySelector('#fromPeg');
        this.fromPeg.addEventListener('change', () => {
            this.pegDisks = { 0: [], 1: [], 2: [] };
            this.clearDisks();
            this.addDisksToScene(parseInt(this.fromPeg.value));
            this.addPegsToScene();
            this.createPlatform();
        })

        this.toPeg = document.querySelector('#toPeg');
        this.toPeg.addEventListener('change', () => {
        })

        this.numMoves = document.querySelector('#total');
        this.numMoves.innerText = '';

        this.count = document.querySelector('#count');

        this.inputDisks = document.querySelector('#numberDisks');
        this.inputDisks.value = this.numDisks;
        this.inputDisks.addEventListener('change', () => {
            if (this.inputDisks.value > 8) {
                document.getElementById('numberDisks').value = 8;
                this.inputDisks.value = 8;
            }
            else if (this.inputDisks.value < 1) {
                document.getElementById('numberDisks').value = 1;
                this.inputDisks.value = 1;
            }

            this.clearDisks();
            this.numDisks = this.inputDisks.value;
            this.pegDisks = { 0: [], 1: [], 2: [] };
            this.addDisksToScene(parseInt(this.fromPeg.value));
        })

        this.buttonReset = document.querySelector('#reset');
        this.buttonReset.addEventListener('click', async () => {
            this.reset();
        })

        this.buttonSolve = document.querySelector('#solve');
        this.buttonSolve.addEventListener('click', async () => {
            if (this.abort.signal) this.renewAbort();
            this.clearMovementsList();
            await this.solve();
        })

        this.movementsList = document.querySelector('#movementsList');

        this.canvas = document.querySelector('#canvas');
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas
        });
        this.renderer.setSize((window.innerWidth * 0.8), (window.innerWidth * .4))
        this.scene = new THREE.Scene();


        // Adicionando OrbitControls para navegação
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true; // Suavização nos movimentos da câmera
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false; // Impede que a câmera vá para cima/baixo
        this.controls.minDistance = 10; // Distância mínima do zoom
        this.controls.maxDistance = 50; // Distância máxima do zoom

        this.colors = ['hsl(0, 100%, 50%)',
            'hsl(120, 100%, 50%)',
            'hsl(240, 100%, 50%)',
            'hsl(60, 100%, 50%)',
            'hsl(180, 100%, 50%)',
            'hsl(300, 100%, 50%)',
            'hsl(30, 100%, 50%)',
            'hsl(270, 100%, 50%)'
        ]
    }

    resetSelects() {
        document.getElementById('fromPeg').selectedIndex = 1;
        document.getElementById('toPeg').selectedIndex = 2;
        document.getElementById('numberDisks').value = 8;
    }

    startAnimation() {
        this.isAnimating = true;
        this.stop = false;
        this.render();
    }

    // Função para parar a animação
    stopAnimation() {
        this.isAnimating = false;
        this.stop = true;
    }

    abort() {
        this.controller.abort();
    }

    renewAbort() {
        this.controller = new AbortController();
    }

    reset() {
        this.stopAnimation();
        this.abort();

        this.resetSelects();
        this.numDisks = 8;
        this.counter = 0;
        this.count.innerText = '';
        this.numMoves.innerText = '';

        // Limpa a cena atual
        this.clearDisks();
        this.clearMovementsList();

        this.pegDisks = { 0: [], 1: [], 2: [] }; // Reinicializa as hastes

        // Adiciona discos e hastes novamente
        this.addDisksToScene(parseInt(this.fromPeg.value));
        this.addPegsToScene();
        this.createPlatform();

        // Reinicia a animação
        this.renewAbort();
        this.startAnimation();
    }

    clearMovementsList() {
        this.moveList.forEach(m => {
            this.movementsList.removeChild(m);
        })
        this.moveList = [];
    }

    clearDisks() {
        this.disks.forEach(disk => {
            this.scene.remove(disk);
        });

        this.disks = [];
    }

    addDisksToScene(peg = 1) {
        const baseDiskSize = 6;  // Tamanho do maior disco
        const sizeDecrement = 0.5;  // Redução de tamanho para cada disco menor

        for (let i = 0; i < this.numDisks; i++) {
            const size = baseDiskSize - (i * sizeDecrement);
            const y = this.baseHeight + 0.5 + (i * this.diskHeight);  // Empilhando os discos na base
            const color = new THREE.Color(`${this.colors[i]}`);
            const disk = this.createDisk(size, color, (peg - 1) * 14, y, parseInt(this.fromPeg.value));
            this.scene.add(disk);
        }
    }

    createDisk(size, color, x, y, pegIndex) {
        const geometry = new THREE.CylinderGeometry(size, size, this.diskHeight, 32);
        const material = new THREE.MeshBasicMaterial({ color: color });
        const disk = new THREE.Mesh(geometry, material);
        disk.position.x = x;
        disk.position.y = y;
        disk.position.z = 0; // Alinhar discos no eixo Z
        this.pegDisks[pegIndex].push(disk); // Adiciona o disco à haste correspondente

        this.disks.push(disk);
        return disk;
    }

    async solve() {
        let steps = [];
        function h(numDisks, from, to) {
            let other = 3 - (from + to);
            if (numDisks != 0) {
                h(numDisks - 1, from, other);
                steps.push([from, to]);
                h(numDisks - 1, other, to);
            }
        }
        if (parseInt(this.fromPeg.value) !== parseInt(this.toPeg.value)) {
            h(this.numDisks, parseInt(this.fromPeg.value), parseInt(this.toPeg.value));
            this.numMoves.innerText = ` / ${2**this.numDisks - 1}`;
            for (let i = 0; i < steps.length; i++) {
                await this.moveDisk(steps[i][0], steps[i][1]);
            }
        }

    }

    async moveDisk(fromPeg, toPeg) {
        const disk = this.pegDisks[fromPeg].pop(); // Retira o último disco da haste de origem
        if (!disk) return;
        const targetY = this.baseHeight + .5 + (this.pegDisks[toPeg].length * this.diskHeight);

        // Movimento 1: Levantar o disco
        await this.animateMovement(disk, { y: 9 });
        this.addMovementToList(fromPeg, toPeg);

        // Movimento 2: Mover horizontalmente para a haste de destino
        const targetX = (toPeg - 1) * 14;
        await this.animateMovement(disk, { x: targetX });

        // Movimento 3: Descer o disco
        await this.animateMovement(disk, { y: targetY });

        this.pegDisks[toPeg].push(disk);
    }

    async animateMovement(disk, targetPosition) {
        const duration = 500; // Duration of the animation in milliseconds
        const signal = this.controller.signal;

        return new Promise((resolve, reject) => {
            const startPosition = { x: disk.position.x, y: disk.position.y, z: disk.position.z };
            const startTime = performance.now();

            const animate = (time) => {
                if (signal.aborted) {
                    return;
                }

                const elapsed = time - startTime;
                const t = Math.min(elapsed / duration, 1); // progresso da animação (0 to 1)

                if (targetPosition.x !== undefined) {
                    disk.position.x = startPosition.x + (targetPosition.x - startPosition.x) * t;
                }
                if (targetPosition.y !== undefined) {
                    disk.position.y = startPosition.y + (targetPosition.y - startPosition.y) * t;
                }
                if (targetPosition.z !== undefined) {
                    disk.position.z = startPosition.z + (targetPosition.z - startPosition.z) * t;
                }

                if (t < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }


    addMovementToList(from, to) {
        const letters = { 0: 'A', 1: 'B', 2: 'C' };
        const li = document.createElement('li');
        li.appendChild(document.createTextNode(`${letters[from]} → ${letters[to]}`))
        this.movementsList.appendChild(li);
        this.moveList.push(li);
        this.count.innerText = `${++this.counter}`;
    }

    createPeg(x) {
        const height = 15;
        const geometry = new THREE.CylinderGeometry(0.38, .38, height, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0x37251f });
        const peg = new THREE.Mesh(geometry, material);
        peg.position.x = x;
        peg.position.y = this.baseHeight + 7;
        peg.position.z = 0; // Alinhar hastes no eixo Z

        return peg;
    }

    addPegsToScene() {
        const peg1 = this.createPeg(-14);
        const peg2 = this.createPeg(0);
        const peg3 = this.createPeg(14);
        this.scene.add(peg1);
        this.scene.add(peg2);
        this.scene.add(peg3);
    }

    createPlatform() {
        const width = 44;  // Largura da plataforma
        const depth = 15;   // Profundidade da plataforma
        const height = 1;  // Altura da plataforma

        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshBasicMaterial({ color: 0x8B4513 }); // Cor marrom para a plataforma
        const platform = new THREE.Mesh(geometry, material);

        platform.position.y = this.baseHeight - height / 2 - 0.25; // Posicionar abaixo das hastes

        this.scene.add(platform);
    }

    render = (time) => {
        if (this.isAnimating) {

            this.controls.update();
            this.renderer.render(this.scene, this.camera);

            requestAnimationFrame(this.render);
        }
    }

}

function main() {
    let game = new Game(8);
    game.addDisksToScene();
    game.addPegsToScene();
    game.createPlatform();
    game.render();
}

main()