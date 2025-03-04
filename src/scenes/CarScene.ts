import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import {
    Scene,
    PointLight,
    PerspectiveCamera,
    Color,
} from 'three'

import type {
    Viewport,
    Clock,
    Lifecycle
} from '~/core'

export interface MainSceneParamaters {
    clock: Clock
    camera: PerspectiveCamera
    viewport: Viewport
}

export class CarScene extends Scene implements Lifecycle {
    private model: THREE.Group | null = null
    public clock: Clock
    public camera: PerspectiveCamera
    public viewport: Viewport
    public light1: PointLight
    public light2: PointLight
    public light3: PointLight

    public constructor({ clock, camera, viewport }: MainSceneParamaters) {
        super()
        this.clock = clock
        this.camera = camera
        this.viewport = viewport
        this.background = new Color(0x0f0f0f)

        this.light1 = new PointLight(0xffffff, 100, 0, 2)
        this.light1.position.set(0, 5, 0)

        /*
        this.light2 = new PointLight(0xffffff, 100, 5, 0.5)
        this.light2.position.set(0, 3, 2)

        this.light3 = new PointLight(0xffffff, 100, 5, 2)
        this.light3.position.set(0, 0, 0)
         */

        this.add(
            this.light1,
            this.light2,
            this.light3,
        )
        this.load()
    }

    public async load(): Promise<void> {
        const loader = new GLTFLoader()
        const modelPath = 'assets/models/bmw.glb'

        loader.load(modelPath, (gltf) => {
                this.model = gltf.scene
                this.add(this.model)
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded')
            },
            (error) => {
                console.error('Erreur lors du chargement du modèle', error)
            })
    }

    public update(): void {
        /*
        const theta = Math.atan2(this.camera.position.x, this.camera.position.z)

        this.light1.position.x = Math.cos(theta + this.clock.elapsed * 0.001) * 2
        this.light1.position.z = Math.sin(theta + this.clock.elapsed * 0.0005) * 2
        this.light2.position.y = Math.sin(theta + this.clock.elapsed * 0.001) * 4
        this.light2.position.z = Math.cos(theta + this.clock.elapsed * 0.0005) * 2
        */
    }

    public resize(): void {
        this.camera.aspect = this.viewport.ratio
        this.camera.updateProjectionMatrix()
    }
}
