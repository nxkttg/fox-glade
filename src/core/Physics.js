import * as CANNON from 'cannon-es'

/**
 * Обгортка над світом cannon-es.
 * Фізика рахується з фіксованим кроком 1/60 с (стабільно на будь-якому FPS),
 * після кожного кроку позиції/обертання тіл копіюються в меші Three.js.
 */
export class Physics {
    constructor(gravity) {
        this.world = new CANNON.World({ gravity: new CANNON.Vec3(0, gravity, 0) })
        this.world.broadphase = new CANNON.SAPBroadphase(this.world) // швидший пошук пар зіткнень
        this.world.allowSleep = true // тіла, що не рухаються, «засинають» і не рахуються

        this.world.defaultContactMaterial.friction = 0.4
        this.world.defaultContactMaterial.restitution = 0.3

        /** @type {{body: CANNON.Body, mesh: import('three').Object3D}[]} */
        this.links = []
    }

    /** Додає тіло; якщо передано mesh — він слідуватиме за тілом */
    add(body, mesh = null) {
        this.world.addBody(body)
        if (mesh) this.links.push({ body, mesh })
        return body
    }

    remove(body) {
        this.world.removeBody(body)
        this.links = this.links.filter((link) => link.body !== body)
    }

    setGravity(y) {
        this.world.gravity.set(0, y, 0)
        this.world.bodies.forEach((b) => b.wakeUp())
    }

    update(dt) {
        this.world.step(1 / 60, dt, 3)
        for (const { body, mesh } of this.links) {
            mesh.position.copy(body.position)
            mesh.quaternion.copy(body.quaternion)
        }
    }
}
