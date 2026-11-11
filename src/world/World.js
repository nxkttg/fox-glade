import { FOX, PHYSICS, PORTAL, FIREFLIES, SKY, SUN_DIRECTION, CLEARING_RADIUS } from '../config.js'
import { Lights } from './Lights.js'
import { Ground } from './Ground.js'
import { Forest } from './Forest.js'
import { Campfire } from './Campfire.js'
import { Portal } from './Portal.js'
import { Fireflies } from './Fireflies.js'
import { Fox } from './Fox.js'
import { Birds } from './Birds.js'
import { CrateTower } from './CrateTower.js'
import { BallLauncher } from './BallLauncher.js'

/**
 * Збирає всі об'єкти світу після завантаження ресурсів
 * і оновлює їх у правильному порядку.
 */
export class World {
    /** @param {import('../core/Experience.js').Experience} experience */
    constructor(experience) {
        const { scene, physics, sound, resources, renderer } = experience
        const items = resources.items
        this.scene = scene

        this.lights = new Lights(scene, items.envMap, SUN_DIRECTION)
        this.ground = new Ground(items, physics)

        const towerX = Math.cos(FOX.towerAngle) * FOX.pathRadius
        const towerZ = Math.sin(FOX.towerAngle) * FOX.pathRadius

        // Зони, де не можна садити дерева/каміння: портал, шлях лисиці, вежа
        const avoid = (x, z) =>
            (Math.abs(x - PORTAL.position.x) < 4 && Math.abs(z - PORTAL.position.z) < 4) ||
            Math.abs(Math.hypot(x, z) - FOX.pathRadius) < 1.4 ||
            Math.hypot(x - towerX, z - towerZ) < 3

        this.forest = new Forest(physics, avoid, CLEARING_RADIUS)
        this.campfire = new Campfire(physics)
        this.portal = new Portal(PORTAL, physics)
        this.fireflies = new Fireflies(FIREFLIES, renderer.pixelRatio)
        this.fox = new Fox(items.fox, FOX, physics)
        this.birds = new Birds([
            { gltf: items.parrot, size: 1.1, radius: 13, height: 8, speed: 5 },
            { gltf: items.flamingo, size: 1.6, radius: 18, height: 11, speed: 6.5 }
        ])
        this.crates = new CrateTower(items, physics, sound, { radius: FOX.pathRadius, angle: FOX.towerAngle }, PHYSICS.crateSize)
        this.balls = new BallLauncher(physics, sound, PHYSICS)

        scene.add(
            this.ground.mesh,
            this.forest.group,
            this.campfire.group,
            this.portal.group,
            this.fireflies.points,
            this.fox.group,
            this.birds.group,
            this.crates.group,
            this.balls.group
        )

        this.skyParams = SKY
    }

    update(dt, elapsed) {
        this.fox.update(dt)
        this.birds.update(dt, elapsed)
        this.campfire.update(elapsed)
        this.portal.update(elapsed)
        this.fireflies.update(elapsed)
        this.balls.update(this.portal)
    }

    dispose() {
        for (const part of [this.lights, this.ground, this.forest, this.campfire, this.portal,
            this.fireflies, this.fox, this.birds, this.crates, this.balls]) {
            part.dispose()
        }
        this.scene.remove(this.ground.mesh)
    }
}
