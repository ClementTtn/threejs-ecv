import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import * as THREE from 'three'
import type {Clock, Lifecycle, Viewport} from '~/core'

export interface MainSceneParamaters {
    clock: Clock
    camera: THREE.PerspectiveCamera
    viewport: Viewport
    renderer: THREE.WebGLRenderer
}

export class CarScene extends THREE.Scene implements Lifecycle {
    private model: THREE.Group | null = null
    public clock: Clock
    public camera: THREE.PerspectiveCamera
    public viewport: Viewport
    public light1: THREE.PointLight
    public renderer: THREE.WebGLRenderer

    private initialCameraZ = 2.8
    private initialCameraY = 0.1
    private maxElevation = 3
    private maxScrollDistance = 7
    private currentScroll = 0

    public constructor({ clock, camera, viewport, renderer }: MainSceneParamaters) {
        super()
        this.clock = clock
        this.camera = camera
        this.viewport = viewport
        this.renderer = renderer

        this.light1 = new THREE.PointLight(0xffffff, 100, 0, 2)
        this.light1.position.set(0, 5, 0)

        this.add(
            this.light1
        )

        this.setInitialCameraPosition()
        this.load()
        window.addEventListener('wheel', this.onWheel.bind(this))
        this.setupEnvMap()
    }

    private setInitialCameraPosition(): void {
        this.camera.position.set(0, this.initialCameraY, this.initialCameraZ)
        this.camera.lookAt(0, 0.1, 0)
    }

    private setupEnvMap(): void {
        const rgbeLoader = new RGBELoader()
        rgbeLoader.load('assets/studio.hdr', (texture) => {
            const pmremGenerator = new THREE.PMREMGenerator(this.renderer)
            pmremGenerator.compileEquirectangularShader()

            const envMap = pmremGenerator.fromEquirectangular(texture).texture
            this.environment = envMap
            this.background = envMap
        },
        undefined,
        (error) => {
            console.error('Erreur lors du chargement de la texture HDR', error)
        })
    }

    private onWheel(event: WheelEvent): void {
        this.currentScroll += event.deltaY * 0.01
        this.currentScroll = Math.max(0, Math.min(this.currentScroll, this.maxScrollDistance))

        const newCameraY = this.initialCameraY + (this.currentScroll / this.maxScrollDistance) * this.maxElevation
        const newCameraZ = this.initialCameraZ + this.currentScroll
        this.camera.position.set(0, newCameraY, newCameraZ)
        this.camera.lookAt(0, 1, 0)
    }

    public async load(): Promise<void> {
        const loader = new GLTFLoader()
        const modelPath = 'assets/models/bmw.glb'

        loader.load(modelPath, (gltf) => {
                this.model = gltf.scene
                this.add(this.model)
            },
            (xhr) => {},
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

    public dispose() {
        window.removeEventListener('wheel', this.onWheel.bind(this))
    }
}
