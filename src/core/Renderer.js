import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

/**
 * Рендерер + пост-обробка.
 *
 * Конвеєр: RenderPass (HDR, HalfFloat, MSAA×4) → UnrealBloom → OutputPass
 * OutputPass наприкінці виконує tone mapping (ACES) і перетворення в sRGB —
 * тож bloom працює з «чесними» лінійними HDR-значеннями.
 */
export class Renderer {
    constructor(canvas, scene, camera, settings) {
        this.scene = scene
        this.camera = camera
        this.settings = settings

        this.instance = new THREE.WebGLRenderer({
            canvas,
            antialias: false, // згладжування робить MSAA-таргет композитора
            powerPreference: 'high-performance'
        })
        this.instance.outputColorSpace = THREE.SRGBColorSpace
        this.instance.toneMapping = THREE.ACESFilmicToneMapping
        this.instance.toneMappingExposure = settings.exposure
        this.instance.shadowMap.enabled = settings.shadows
        this.instance.shadowMap.type = THREE.PCFShadowMap

        const target = new THREE.WebGLRenderTarget(1, 1, {
            type: THREE.HalfFloatType, // HDR: кольори > 1 не обрізаються до bloom
            samples: 4                 // MSAA для пост-обробки
        })
        this.composer = new EffectComposer(this.instance, target)
        this.composer.addPass(new RenderPass(scene, camera))

        this.bloom = new UnrealBloomPass(
            new THREE.Vector2(1, 1),
            settings.bloomStrength,
            settings.bloomRadius,
            settings.bloomThreshold
        )
        this.composer.addPass(this.bloom)
        this.composer.addPass(new OutputPass())

        this.resize()
    }

    get pixelRatio() {
        return Math.min(window.devicePixelRatio, 2)
    }

    /** Застосовує значення з settings (викликається з GUI) */
    applySettings() {
        const s = this.settings
        this.instance.toneMappingExposure = s.exposure
        this.bloom.strength = s.bloomStrength
        this.bloom.radius = s.bloomRadius
        this.bloom.threshold = s.bloomThreshold
        if (this.instance.shadowMap.enabled !== s.shadows) {
            this.instance.shadowMap.enabled = s.shadows
            // матеріали треба перекомпілювати, бо змінюється шейдерний код
            this.scene.traverse((o) => {
                if (o.material) [].concat(o.material).forEach((m) => (m.needsUpdate = true))
            })
        }
    }

    resize() {
        const { innerWidth: w, innerHeight: h } = window
        this.instance.setPixelRatio(this.pixelRatio)
        this.instance.setSize(w, h)
        this.composer.setPixelRatio(this.pixelRatio)
        this.composer.setSize(w, h)
    }

    render() {
        this.composer.render()
    }

    dispose() {
        this.composer.dispose()
        this.instance.dispose()
    }
}
