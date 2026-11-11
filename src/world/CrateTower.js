import * as THREE from 'three'
import * as CANNON from 'cannon-es'

/**
 * Піраміда дерев'яних ящиків на шляху лисиці (4-3-2-1). Динамічні тіла cannon-es.
 * Ряди вишикувані поперек шляху (уздовж радіуса), щоб лисиця врізалась у середину.
 */
export class CrateTower {
    constructor(textures, physics, sound, { radius, angle }, size) {
        this.physics = physics
        this.group = new THREE.Group()
        this.crates = []

        const { woodColor, woodRoughness, woodBump } = textures
        for (const t of [woodColor, woodRoughness, woodBump]) {
            t.wrapS = t.wrapT = THREE.RepeatWrapping
            t.repeat.set(0.5, 0.5) // крупніші дошки
        }
        this.geometry = new THREE.BoxGeometry(size, size, size)
        // кілька відтінків, щоб ящики не зливалися в один блок
        this.materials = ['#e8c9a0', '#c99a6e', '#b07d55'].map((color) => new THREE.MeshStandardMaterial({
            map: woodColor,
            roughnessMap: woodRoughness,
            bumpMap: woodBump,
            bumpScale: 2,
            color
        }))

        const shape = new CANNON.Box(new CANNON.Vec3(size / 2, size / 2, size / 2))
        const gap = size * 1.04
        const radial = { x: Math.cos(angle), z: Math.sin(angle) }
        const rotation = new CANNON.Quaternion().setFromEuler(0, -angle, 0) // локальна X = радіальний напрям
        this.rotation = rotation
        for (let level = 0; level < 4; level++) {
            const count = 4 - level
            for (let i = 0; i < count; i++) {
                const offset = (i - (count - 1) / 2) * gap
                const initial = new CANNON.Vec3(
                    (radius + offset) * radial.x,
                    size / 2 + level * size,
                    (radius + offset) * radial.z
                )
                const material = this.materials[(level + i) % this.materials.length]
                const mesh = new THREE.Mesh(this.geometry, material)
                mesh.castShadow = mesh.receiveShadow = true
                const body = new CANNON.Body({ mass: 1, shape, position: initial.clone(), quaternion: rotation.clone() })
                body.sleepSpeedLimit = 0.2
                body.addEventListener('collide', (e) => {
                    const v = Math.abs(e.contact.getImpactVelocityAlongNormal())
                    if (v > 1.5) sound.hit(v)
                })
                physics.add(body, mesh)
                this.group.add(mesh)
                this.crates.push({ body, initial })
            }
        }
    }

    /** Повертає ящики на початкові місця */
    reset() {
        for (const { body, initial } of this.crates) {
            body.position.copy(initial)
            body.quaternion.copy(this.rotation)
            body.velocity.setZero()
            body.angularVelocity.setZero()
            body.wakeUp()
        }
    }

    dispose() {
        this.crates.forEach(({ body }) => this.physics.remove(body))
        this.group.removeFromParent()
        this.geometry.dispose()
        this.materials.forEach((m) => m.dispose())
    }
}
