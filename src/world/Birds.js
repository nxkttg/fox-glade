import * as THREE from 'three'
import { fitToSize } from '../utils/fitToSize.js'

/** Птахи — glTF-моделі з морф-анімацією (morph targets), кружляють над галявиною */
export class Birds {
    constructor(models) {
        this.group = new THREE.Group()
        this.birds = models.map(({ gltf, size, radius, height, speed }) => {
            const model = gltf.scene
            fitToSize(model, size)
            model.traverse((o) => (o.castShadow = o.isMesh))

            const pivot = new THREE.Group()
            pivot.add(model)
            this.group.add(pivot)

            const mixer = new THREE.AnimationMixer(model)
            const action = mixer.clipAction(gltf.animations[0])
            action.time = Math.random() * action.getClip().duration
            action.play()

            return { pivot, mixer, radius, height, speed, angle: Math.random() * Math.PI * 2 }
        })
    }

    update(dt, elapsed) {
        for (const b of this.birds) {
            b.angle += (b.speed / b.radius) * dt
            const x = Math.cos(b.angle) * b.radius
            const z = Math.sin(b.angle) * b.radius
            b.pivot.position.set(x, b.height + Math.sin(elapsed * 0.8 + b.radius) * 0.6, z)
            b.pivot.rotation.y = Math.atan2(-Math.sin(b.angle), Math.cos(b.angle))
            b.pivot.rotation.z = -0.25 // нахил у повороті
            b.mixer.update(dt)
        }
    }

    dispose() {
        this.birds.forEach((b) => b.mixer.stopAllAction())
        this.group.removeFromParent()
    }
}
