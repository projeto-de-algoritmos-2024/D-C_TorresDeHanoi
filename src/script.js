import * as THREE from 'three';
import { OrbitControls } from 'orbit';

class Game {
    constructor(numDisks) {
        this.numDisks = numDisks;
        this.disks = [];
        this.fov = 50;
        this.aspect = 2.25; // the canvas default
        this.near = 0.1;
        this.far = 100;
        this.camera = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
        this.camera.position.set(0, 0, 30); 
        this.camera.lookAt(0, 0, 0); // Garanta que a câmera esteja olhando para o centro da cena
        this.baseHeight = -8;
        this.canvas = document.querySelector('#canvas');
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas
        });
        this.diskHeight = 1.2;
        this.renderer.setSize((window.innerWidth*0.95), (window.innerWidth * .4))
        this.scene = new THREE.Scene();

        // Adicionando OrbitControls para navegação
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true; // Suavização nos movimentos da câmera
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false; // Impede que a câmera vá para cima/baixo
        this.controls.minDistance = 10; // Distância mínima do zoom
        this.controls.maxDistance = 50; // Distância máxima do zoom
    }


    createDisk(size, color, y) {
        const geometry = new THREE.CylinderGeometry(size, size, this.diskHeight, 32);
        const material = new THREE.MeshBasicMaterial({ color: color });
        const disk = new THREE.Mesh(geometry, material);
        disk.position.y = y;
        disk.position.z = 0; // Alinhar discos no eixo Z

        this.disks.push(disk);
        return disk;
    }

    addDisksToScene() {
        const baseDiskSize = 6;  // Tamanho do maior disco
        const sizeDecrement = 0.5;  // Redução de tamanho para cada disco menor

        for (let i = 0; i < this.numDisks; i++) {
            const size = baseDiskSize - (i * sizeDecrement);
            const y = this.baseHeight + (i * this.diskHeight);  // Empilhando os discos na base
            const color = new THREE.Color(`hsl(${(i * 360) / this.numDisks}, 100%, 50%)`);
            const disk = this.createDisk(size, color, y);
            this.scene.add(disk);
        }
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
        // const pegs =  [peg1, peg2, peg3]
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
        time *= 0.001;  // convert time to seconds
        this.controls.update();
        this.renderer.render(this.scene, this.camera);

        requestAnimationFrame(this.render);
    }

}

function main() {
    let game = new Game(10);
    game.addDisksToScene();
    game.addPegsToScene();
    game.createPlatform();
    game.render();
}

main()