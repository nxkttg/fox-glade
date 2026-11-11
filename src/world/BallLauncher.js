import * as THREE from 'three'
import * as CANNON from 'cannon-es'

const PALETTE = ['#ff5964', '#35a7ff', '#ffe74c', '#6bf178', '#c77dff', '#ff9f1c']

/**
 * Стрільба м'ячами з камери. М'ячі — MeshPhysicalMaterial з clearcoat
 * (лакове покриття, гарно ловить HDR-відбиття).
 * Події: 'change' (кількість м'ячів), 'teleport'
 */
export class BallLauncher extends EventTarget {
    constructor(physics, sound, params) {
        super()
        this.physics = physics
        this.sound = sound
        this.params = params
        this.group = new THREE.Group()
        this.balls = []

        this.geometry = new THREE.SphereGeometry(params.ballRadius, 32, 16)
        this.materials = PALETTE.map((color) => new THREE.MeshPhysicalMaterial({
            color,
            roughness: 0.25,
            metalness: 0,
            clearcoat: 1,
            clearcoatRoughness: 0.05
        }))
        this.shape = new CANNON.Sphere(params.ballRadius) // одна форма на всі тіла
    }

    get count() {
        return this.balls.length
    }

    /**
     * @param {THREE.Vector3} origin
     * @param {THREE.Vector3} direction — нормалізований
     */
    shoot(origin, direction) {
        if (this.balls.length >= this.params.maxBalls) this.#removeBall(this.balls[0])

        const material = this.materials[Math.floor(Math.random() * this.materials.length)]
        const mesh = new THREE.Mesh(this.geometry, material)
        mesh.castShadow = mesh.receiveShadow = true

        const body = new CANNON.Body({
            mass: 1.5,
            shape: this.shape,
            position: new CANNON.Vec3().copy(origin),
            linearDamping: 0.05,
            angularDamping: 0.2
        })
        // невеликий розкид — однакові м'ячі не летять «у ту саму точку»
        const spread = new THREE.Vector3().randomDirection().multiplyScalar(0.015)
        body.velocity.copy(direction.clone().add(spread).normalize().multiplyScalar(this.params.ballSpeed))
        body.addEventListener('collide', (e) => {
            const v = Math.abs(e.contact.getImpactVelocityAlongNormal())
            if (v > 1.2) this.sound.hit(v)
        })

        this.physics.add(body, mesh)
        this.group.add(mesh)
        this.balls.push({ mesh, body, prev: body.position.clone() })
        this.dispatchEvent(new Event('change'))
    }

    #removeBall(ball) {
        this.physics.remove(ball.body)
        this.group.remove(ball.mesh)
        this.balls.splice(this.balls.indexOf(ball), 1)
    }

    clear() {
        while (this.balls.length) this.#removeBall(this.balls[0])
        this.dispatchEvent(new Event('change'))
    }

    /** @param {import('./Portal.js').Portal} portal */
    update(portal) {
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i]
            if (portal.tryTeleport(ball.body, ball.prev)) {
                this.sound.whoosh()
                this.dispatchEvent(new Event('teleport'))
            }
            ball.prev.copy(ball.body.position)
            if (ball.body.position.y < -10) this.#removeBall(ball) // випав за межі світу
        }
    }

    dispose() {
        this.clear()
        this.group.removeFromParent()
        this.geometry.dispose()
        this.materials.forEach((m) => m.dispose())
    }
}
