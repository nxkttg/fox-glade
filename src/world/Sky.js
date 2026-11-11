import * as THREE from 'three'
import vertexShader from '../shaders/sky/vertex.glsl?raw'
import fragmentShader from '../shaders/sky/fragment.glsl?raw'

/** Небесний купол на власному шейдері: градієнт заходу сонця, сонце, мерехтливі зірки */
export class Sky {
    constructor(params, sunDirection) {
        this.params = params
        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            side: THREE.BackSide, // дивимось на сферу зсередини
            depthWrite: false,
            uniforms: {
                uTopColor: { value: new THREE.Color(params.topColor) },
                uHorizonColor: { value: new THREE.Color(params.horizonColor) },
                uBottomColor: { value: new THREE.Color(params.bottomColor) },
                uSunColor: { value: new THREE.Color(params.sunColor) },
                uSunDirection: { value: new THREE.Vector3().copy(sunDirection).normalize() },
                uStarDensity: { value: params.starDensity },
                uTime: { value: 0 }
            }
        })
        this.mesh = new THREE.Mesh(new THREE.SphereGeometry(90, 48, 24), this.material)
        this.mesh.renderOrder = -1
    }

    /** Синхронізує uniforms з params (виклик з GUI) */
    applyParams() {
        const u = this.material.uniforms
        u.uTopColor.value.set(this.params.topColor)
        u.uHorizonColor.value.set(this.params.horizonColor)
        u.uBottomColor.value.set(this.params.bottomColor)
        u.uSunColor.value.set(this.params.sunColor)
        u.uStarDensity.value = this.params.starDensity
    }

    update(elapsed, camera) {
        this.material.uniforms.uTime.value = elapsed
        this.mesh.position.copy(camera.position) // купол «їде» з камерою — небо нескінченно далеко
    }

    dispose() {
        this.mesh.geometry.dispose()
        this.material.dispose()
    }
}
