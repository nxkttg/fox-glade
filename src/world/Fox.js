import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { fitToSize } from '../utils/fitToSize.js'

/**
 * Лисиця — складна glTF-модель зі скелетом (SkinnedMesh) і трьома анімаціями.
 * Бігає колом навколо багаття; має кінематичне фізичне тіло,
 * тому розштовхує ящики та м'ячі.
 *
 * Події: 'mode' (detail: назва анімації)
 */
export class Fox extends EventTarget {
    constructor(gltf, params, physics) {
        super()
        this.params = params

        this.model = gltf.scene
        fitToSize(this.model, 1.7)
        this.model.traverse((o) => {
            if (o.isMesh) {
                o.castShadow = true
                o.receiveShadow = true
                o.userData.fox = true
            }
        })
        this.group = new THREE.Group()
        this.group.add(this.model)

        // --- Анімації
        this.mixer = new THREE.AnimationMixer(this.model)
        this.actions = Object.fromEntries(gltf.animations.map((clip) => [clip.name, this.mixer.clipAction(clip)]))
        this.mode = 'Walk'
        this.current = this.actions[this.mode]
        this.current.play()

        // --- Рух
        this.angle = params.startAngle
        this.speed = 0
        this.petTimer = 0
        this.resumeMode = null

        // --- Фізика: KINEMATIC — рухаємо ми, але воно штовхає динамічні тіла
        this.body = new CANNON.Body({
            type: CANNON.Body.KINEMATIC,
            shape: new CANNON.Box(new CANNON.Vec3(0.3, 0.45, 0.75)),
            position: new CANNON.Vec3(0, 0.45, 0)
        })
        physics.add(this.body)
        this.#placeOnPath()
        this.body.position.set(this.group.position.x, 0.45, this.group.position.z)
    }

    /** Плавний перехід між анімаціями (cross-fade) */
    setMode(name) {
        const next = this.actions[name]
        if (!next || next === this.current) return
        next.reset().setEffectiveWeight(1).fadeIn(0.4).play()
        this.current.fadeOut(0.4)
        this.current = next
        this.mode = name
        this.dispatchEvent(new CustomEvent('mode', { detail: name }))
    }

    /** Клік по лисиці — вона зупиняється «озирнутися» на кілька секунд */
    pet() {
        if (this.petTimer <= 0) this.resumeMode = this.mode
        this.petTimer = this.params.petDuration
        this.setMode('Survey')
    }

    #placeOnPath() {
        const r = this.params.pathRadius
        const x = Math.cos(this.angle) * r
        const z = Math.sin(this.angle) * r
        this.group.position.set(x, 0, z)
        // дотична до кола = напрямок руху
        this.group.rotation.y = Math.atan2(-Math.sin(this.angle), Math.cos(this.angle))
    }

    update(dt) {
        if (this.petTimer > 0) {
            this.petTimer -= dt
            if (this.petTimer <= 0 && this.resumeMode) this.setMode(this.resumeMode)
        }

        const target = this.params.speeds[this.mode] * this.params.speedMultiplier
        this.speed = THREE.MathUtils.damp(this.speed, target, 3, dt)
        this.angle += (this.speed * dt) / this.params.pathRadius
        this.#placeOnPath()

        // швидкість анімації кроків відповідає швидкості руху
        this.current.timeScale = this.mode === 'Survey' ? 1 : Math.max(0.3, this.params.speedMultiplier)
        this.mixer.update(dt)

        // Кінематичне тіло рухаємо ШВИДКІСТЮ, а не телепортом позиції:
        // фізичний крок сам перемістить його в цільову точку, і при зіткненні
        // ящики отримають правильний імпульс.
        const p = this.group.position
        const dx = p.x - this.body.position.x
        const dz = p.z - this.body.position.z
        if (dx * dx + dz * dz > 1) {
            this.body.position.set(p.x, 0.45, p.z) // розсинхрон (напр., після паузи) — вирівнюємо
            this.body.velocity.setZero()
        } else if (dt > 0) {
            this.body.velocity.set(dx / dt, 0, dz / dt)
        }
        this.body.quaternion.setFromEuler(0, this.group.rotation.y, 0)
    }

    dispose() {
        this.mixer.stopAllAction()
        this.group.removeFromParent()
    }
}
