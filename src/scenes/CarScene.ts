import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import * as THREE from 'three'
import { Tween, Easing } from '@tweenjs/tween.js'
import type { Clock, Lifecycle, Viewport } from '~/core'

export interface MainSceneParamaters {
    clock: Clock
    camera: THREE.PerspectiveCamera
    viewport: Viewport
    renderer: THREE.WebGLRenderer
}

export class CarScene extends THREE.Scene implements Lifecycle {
    private model: THREE.Group
    private title: HTMLDivElement
    private discoverButton: HTMLAnchorElement
    public clock: Clock
    public camera: THREE.PerspectiveCamera
    public viewport: Viewport
    public light1: THREE.PointLight
    public renderer: THREE.WebGLRenderer
    private cameraTween: Tween<{ x: number, y: number, z: number }>

    private initialCameraZ = 2.8
    private initialCameraY = 0.1
    private maxElevation = 3
    private maxScrollDistance = 7
    private currentScroll = 0
    private boundOnWheel: (event: WheelEvent) => void

    public constructor({ clock, camera, viewport, renderer }: MainSceneParamaters) {
        super()
        this.clock = clock
        this.camera = camera
        this.viewport = viewport
        this.renderer = renderer

        this.light1 = new THREE.PointLight(0xffffff, 100, 0, 2)
        this.light1.position.set(0, 5, 0)
        this.add(this.light1)

        this.setInitialCameraPosition()
        this.load()
        this.boundOnWheel = this.onWheel.bind(this)
        window.addEventListener('wheel', this.boundOnWheel)
        this.setupEnvMap()
        this.createTitle()
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

        if (this.currentScroll >= this.maxScrollDistance) {
            this.showTitle()
        } else {
            this.hideTitle()
        }
    }

    public load(): void {
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

    private createTitle(): void {
        const title = document.createElement('div')
        title.style.position = 'absolute'
        title.style.top = '100px'
        title.style.left = '50%'
        title.style.transform = 'translateX(-50%)'
        title.style.color = 'black'
        title.style.fontSize = '24px'
        title.style.fontFamily = "'Roboto', sans-serif"
        title.style.pointerEvents = 'none'
        title.style.opacity = '0'
        title.style.transition = 'opacity 0.5s ease-in-out'
        title.innerText = 'BMW M5 Touring'
        document.body.appendChild(title)
        this.title = title

        const discoverButton = document.createElement('a')
        discoverButton.style.position = 'absolute'
        discoverButton.style.top = '150px'
        discoverButton.style.left = '50%'
        discoverButton.style.transform = 'translateX(-50%)'
        discoverButton.style.color = 'black'
        discoverButton.style.fontSize = '18px'
        discoverButton.style.fontFamily = "'Roboto', sans-serif"
        discoverButton.style.textDecoration = 'none'
        discoverButton.style.cursor = 'default'
        discoverButton.style.border = '1px solid black'
        discoverButton.style.borderRadius = '10px'
        discoverButton.style.padding = '10px'
        discoverButton.style.opacity = '0'
        discoverButton.style.transition = 'opacity 0.5s ease-in-out'
        discoverButton.innerText = 'Découvrir'
        discoverButton.href = '#'
        discoverButton.addEventListener('click', (event) => {
            event.preventDefault()
            this.moveCameraToLeftSide()
            this.removeWheelListener()
        })
        document.body.appendChild(discoverButton)
        this.discoverButton = discoverButton
    }

    private moveCameraToLeftSide(): void {
        if (this.model) {
            this.hideTitle()
            const leftSidePosition = { x: 10, y: 2, z: 0 }
            this.cameraTween = new Tween(this.camera.position)
                .to(leftSidePosition, 2000)
                .easing(Easing.Quadratic.Out)
                .onUpdate(() => {
                    this.camera.lookAt(this.model.position)
                })
                .start()
        }
    }

    private removeWheelListener(): void {
        window.removeEventListener('wheel', this.boundOnWheel)
    }

    private showTitle(): void {
        this.discoverButton.style.cursor = 'pointer'
        this.title.style.opacity = '1'
        this.discoverButton.style.opacity = '1'
    }

    private hideTitle(): void {
        this.discoverButton.style.cursor = 'default'
        this.title.style.opacity = '0'
        this.discoverButton.style.opacity = '0'
    }

    public update(): void {
        this.cameraTween?.update()
    }

    public resize(): void {
        this.camera.aspect = this.viewport.ratio
        this.camera.updateProjectionMatrix()
    }

    public dispose() {
        window.removeEventListener('wheel', this.boundOnWheel)
    }
}
