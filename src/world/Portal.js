import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import noise from '../shaders/noise.glsl?raw'
import vertexShader from '../shaders/portal/vertex.glsl?raw'
import fragmentShader from '../shaders/portal/fragment.glsl?raw'

/**
 * Магічний портал: кам'яна арка (примітиви) + диск на власному шейдері.
 * М'ячі, що пролітають крізь диск, телепортуються в небо над галявиною.
 */
export class Portal {
    constructor(params, physics) {
        this.params = params
        this.center = new THREE.Vector3(params.position.x, params.position.y, params.position.z)
        this.group = new THREE.Group()
        this.group.position.copy(this.center)
        this.disposables = []

        // --- Шейдерний диск
        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader: `${noise}\n${fragmentShader}`,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            uniforms: {
                uTime: { value: 0 },
                uColorStart: { value: new THREE.Color(params.colorStart) },
                uColorEnd: { value: new THREE.Color(params.colorEnd) },
                uIntensity: { value: params.intensity }
            }
        })
        const disc = new THREE.Mesh(new THREE.CircleGeometry(params.radius, 64), this.material)
        this.group.add(disc)

        // --- Арка з примітивів
        const stone = new THREE.MeshStandardMaterial({ color: '#6f6a78', roughness: 0.75, flatShading: true })
        const ring = new THREE.Mesh(new THREE.TorusGeometry(params.radius + 0.2, 0.22, 10, 40), stone)
        const pillarGeo = new THREE.BoxGeometry(0.55, params.position.y + 0.2, 0.55)
        const pillars = [-1, 1].map((side) => {
            const p = new THREE.Mesh(pillarGeo, stone)
            p.position.set(side * (params.radius + 0.3), -(params.position.y + 0.2) / 2 + 0.1, 0)
            return p
        })
        ;[ring, ...pillars].forEach((m) => {
            m.castShadow = m.receiveShadow = true
            this.group.add(m)
        })
        this.disposables.push(disc.geometry, ring.geometry, pillarGeo, stone, this.material)

        // Світло порталу
        this.light = new THREE.PointLight(params.colorEnd, 6, 8, 1.5)
        this.light.position.z = 0.6
        this.group.add(this.light)

        // Фізика: стовпи та верхня частина арки
        for (const p of pillars) {
            physics.add(new CANNON.Body({
                type: CANNON.Body.STATIC,
                shape: new CANNON.Box(new CANNON.Vec3(0.28, (params.position.y + 0.2) / 2, 0.28)),
                position: new CANNON.Vec3(this.center.x + p.position.x, (params.position.y + 0.2) / 2, this.center.z)
            }))
        }
    }

    applyParams() {
        const u = this.material.uniforms
        u.uColorStart.value.set(this.params.colorStart)
        u.uColorEnd.value.set(this.params.colorEnd)
        u.uIntensity.value = this.params.intensity
        this.light.color.set(this.params.colorEnd)
    }

    /**
     * Перевіряє, чи перетнуло тіло площину диска між двома кадрами
     * (відрізок prev → current). Перевірка лише поточної позиції пропускала б
     * швидкі м'ячі, що за кадр пролітають крізь тонкий диск.
     * @param {CANNON.Body} body
     * @param {CANNON.Vec3} prev — позиція тіла в попередньому кадрі
     * @returns {boolean}
     */
    tryTeleport(body, prev) {
        const zNow = body.position.z - this.center.z
        const zPrev = prev.z - this.center.z
        if (zNow === zPrev || Math.sign(zNow) === Math.sign(zPrev)) return false

        // точка перетину площини (лінійна інтерполяція)
        const t = zPrev / (zPrev - zNow)
        const dx = prev.x + (body.position.x - prev.x) * t - this.center.x
        const dy = prev.y + (body.position.y - prev.y) * t - this.center.y
        if (dx * dx + dy * dy > this.params.radius * this.params.radius) return false

        body.position.set(THREE.MathUtils.randFloatSpread(6), 14, THREE.MathUtils.randFloatSpread(6))
        body.velocity.set(THREE.MathUtils.randFloatSpread(2), -2, THREE.MathUtils.randFloatSpread(2))
        return true
    }

    update(elapsed) {
        this.material.uniforms.uTime.value = elapsed
        this.light.intensity = 5 + Math.sin(elapsed * 3) * 1.5
    }

    dispose() {
        this.group.removeFromParent()
        this.disposables.forEach((r) => r.dispose())
    }
}
