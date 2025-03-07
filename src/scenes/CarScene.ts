import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'
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
    private model: THREE.Group = new THREE.Group()
    private title: HTMLDivElement = document.createElement('div')
    private discoverButton: HTMLAnchorElement = document.createElement('a')
    private infoButtons: HTMLButtonElement[] = []
    public clock: Clock
    public camera: THREE.PerspectiveCamera
    public viewport: Viewport
    public light1: THREE.PointLight
    public renderer: THREE.WebGLRenderer
    private cameraTween: Tween<{ x: number, y: number, z: number }> | null = null

    private initialCameraZ = 2.8
    private initialCameraY = 0.1
    private maxElevation = 3
    private maxScrollDistance = 7
    private currentScroll = 0
    private boundOnWheel: (event: WheelEvent) => void
    private composer: EffectComposer
    private renderPass: RenderPass
    private blurPass: ShaderPass | null
    private baseUrl = 'https://clementttn.github.io'

    public constructor({ clock, camera, viewport, renderer }: MainSceneParamaters) {
        super()
        this.clock = clock
        this.camera = camera
        this.viewport = viewport
        this.renderer = renderer
        this.blurPass = null

        this.light1 = new THREE.PointLight(0xffffff, 100, 0, 2)
        this.light1.position.set(0, 5, 0)
        this.add(this.light1)

        this.setInitialCameraPosition()
        this.loadShaders().then(() => {
            this.load()
            this.setupEnvMap()
            this.createTitle()
            this.createInfoButtons()
        })

        this.boundOnWheel = this.onWheel.bind(this)
        window.addEventListener('wheel', this.boundOnWheel)

        this.composer = new EffectComposer(renderer)
        this.renderPass = new RenderPass(this, this.camera)
        this.composer.addPass(this.renderPass)
    }

    private async loadShaders() {
        const [blurVertexShader, blurFragmentShader] = await Promise.all([
            fetch(this.baseUrl + '/src/shaders/blur.vert').then(r => r.text()),
            fetch(this.baseUrl + '/src/shaders/blur.frag').then(r => r.text())
        ])

        this.blurPass = new ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                h: { value: 0.005 }
            },
            vertexShader: blurVertexShader,
            fragmentShader: blurFragmentShader
        })
        this.blurPass.renderToScreen = true
        this.composer.addPass(this.blurPass)

        const fxaaPass = new ShaderPass(FXAAShader)
        fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight)
        this.composer.addPass(fxaaPass)

        const ssaoPass = new SSAOPass(this, this.camera, window.innerWidth, window.innerHeight)
        ssaoPass.kernelRadius = 8
        ssaoPass.minDistance = 0.005
        ssaoPass.maxDistance = 0.1
        this.composer.addPass(ssaoPass)
    }

    private setInitialCameraPosition(): void {
        this.camera.position.set(0, this.initialCameraY, this.initialCameraZ)
        this.camera.lookAt(0, 0.1, 0)
    }

    private setupEnvMap(): void {
        const rgbeLoader = new RGBELoader()
        rgbeLoader.load(this.baseUrl + '/assets/studio.hdr', (texture) => {
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

    public async load(): Promise<void> {
        const loader = new GLTFLoader()
        const modelPath = this.baseUrl + '/assets/models/bmw.glb'

        loader.load(modelPath, (gltf) => {
                this.model = gltf.scene
                this.add(this.model)
            },
            undefined,
            (error) => {
                console.error('Erreur lors du chargement du modèle', error)
            })
    }

    private createTitle(): void {
        const title = this.title
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

        const discoverButton = this.discoverButton
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
    }

    private createInfoButtons(): void {
        const infoPositions = [
            { top: '32%', left: '35%', info: 'Un gros moteur', zoomPosition: { x: 0, y: 1, z: 8 } },
            { top: '48%', left: '33%', info: 'Des gros freins', zoomPosition: { x: 3, y: 1, z: 2.5 } },
            { top: '30%', left: '70%', info: 'Un grand coffre', zoomPosition: { x: 0, y: 2, z: -8 } },
        ]

        infoPositions.forEach((pos) => {
            const button = document.createElement('button')
            button.className = 'info-button'
            button.style.top = pos.top
            button.style.left = pos.left
            button.style.transform = 'translate(-50%, -50%)'
            button.innerText = ''
            button.addEventListener('click', () => {
                this.zoomCameraToPosition(pos.info, pos.zoomPosition)
            })
            document.body.appendChild(button)
            this.infoButtons.push(button)
        })
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
                .onComplete(() => {
                    this.showButtons()
                })
                .start()
        }
    }

    private zoomCameraToPosition(info: string, zoomPosition: { x: number, y: number, z: number }): void {
        if (this.model) {
            const initialCameraPosition = { ...this.camera.position }
            this.cameraTween = new Tween(this.camera.position)
                .to(zoomPosition, 2000)
                .easing(Easing.Quadratic.Out)
                .onUpdate(() => {
                    this.camera.lookAt(this.model.position)
                })
                .onStart(() => {
                    this.hideButtons()
                })
                .onComplete(() => {
                    if (this.blurPass instanceof ShaderPass) {
                        this.blurPass.uniforms.h.value = 0.005
                    }
                    const backButton = document.createElement('button')
                    backButton.className = 'back-button'
                    backButton.style.position = 'absolute'
                    backButton.style.top = '10px'
                    backButton.style.left = '10px'
                    backButton.style.padding = '10px'
                    backButton.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'
                    backButton.style.border = '1px solid black'
                    backButton.style.borderRadius = '5px'
                    backButton.style.cursor = 'pointer'
                    backButton.innerText = '←'
                    backButton.addEventListener('click', () => {
                        document.body.removeChild(backButton)
                        document.body.removeChild(text)
                        this.cameraTween = new Tween(this.camera.position)
                            .to(initialCameraPosition, 2000)
                            .easing(Easing.Quadratic.Out)
                            .onUpdate(() => {
                                this.camera.lookAt(this.model.position)
                            })
                            .onComplete(() => {
                                this.showButtons()
                            })
                            .start()
                    })
                    document.body.appendChild(backButton)

                    const text = document.createElement('div')
                    text.className = 'info-text'
                    text.style.position = 'absolute'
                    text.style.bottom = '20px'
                    text.style.right = '20px'
                    text.style.padding = '10px'
                    text.style.borderRadius = '5px'
                    text.style.color = 'black'
                    text.style.fontSize = '24px'
                    text.style.fontFamily = "'Roboto', sans-serif"
                    text.innerText = info
                    document.body.appendChild(text)
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

    private showButtons(): void {
        this.infoButtons.forEach((button) => {
            button.style.cursor = 'pointer'
            button.style.opacity = '1'
        })
    }

    private hideButtons(): void {
        this.infoButtons.forEach((button) => {
            button.style.cursor = 'default'
            button.style.opacity = '0'
        })
    }

    public update(): void {
        this.composer?.render()
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
