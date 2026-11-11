import * as THREE from 'three'
import vertexShader from '../shaders/fireflies/vertex.glsl?raw'
import fragmentShader from '../shaders/fireflies/fragment.glsl?raw'

/** Світлячки: THREE.Points + власний шейдер (рух і мерехтіння рахуються на GPU) */
export class Fireflies {
    constructor(params, pixelRatio) {
        this.params = params
        const { count } = params

        const positions = new Float32Array(count * 3)
        const scales = new Float32Array(count)
        const phases = new Float32Array(count)
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2
            const r = 1.5 + Math.random() * 13
            positions[i * 3] = Math.cos(angle) * r
            positions[i * 3 + 1] = 0.4 + Math.random() * 3
            positions[i * 3 + 2] = Math.sin(angle) * r
            scales[i] = 0.4 + Math.random() * 0.8
            phases[i] = Math.random()
        }

        this.geometry = new THREE.BufferGeometry()
        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        this.geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
        this.geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))

        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending, // частинки «додають» світло
            uniforms: {
                uTime: { value: 0 },
                uPixelRatio: { value: pixelRatio },
                uSize: { value: params.size },
                uColor: { value: new THREE.Color(params.color) }
            }
        })

        this.points = new THREE.Points(this.geometry, this.material)
    }

    applyParams() {
        this.material.uniforms.uSize.value = this.params.size
        this.material.uniforms.uColor.value.set(this.params.color)
    }

    setPixelRatio(ratio) {
        this.material.uniforms.uPixelRatio.value = ratio
    }

    update(elapsed) {
        this.material.uniforms.uTime.value = elapsed
    }

    dispose() {
        this.points.removeFromParent()
        this.geometry.dispose()
        this.material.dispose()
    }
}
