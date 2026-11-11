import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'lil-gui'

import { ASSETS, RENDER, FOX, PHYSICS, PORTAL, FIREFLIES, SKY, FOG, SUN_DIRECTION, CLEARING_RADIUS } from '../config.js'
import { Renderer } from './Renderer.js'
import { Resources } from './Resources.js'
import { Physics } from './Physics.js'
import { Pointer } from './Pointer.js'
import { Sound } from './Sound.js'
import { Sky } from '../world/Sky.js'
import { World } from '../world/World.js'
import { HUD } from '../ui/HUD.js'

const MAX_DELTA = 1 / 20

/**
 * Точка збору всього застосунку: сцена, камера, рендер, фізика, ресурси,
 * взаємодія та головний цикл. World створюється, коли завантажаться ресурси.
 */
export class Experience {
    /** @param {HTMLCanvasElement} canvas */
    constructor(canvas) {
        this.canvas = canvas
        this.teleports = 0
        this.hudTimer = 0

        this.scene = new THREE.Scene()
        this.scene.fog = new THREE.Fog(FOG.color, FOG.near, FOG.far)

        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 250)
        this.camera.position.set(6.5, 4.2, 8.5)

        this.controls = new OrbitControls(this.camera, canvas)
        this.controls.target.set(0, 1, -1)
        this.controls.enableDamping = true
        this.controls.minDistance = 4
        this.controls.maxDistance = CLEARING_RADIUS - 1 // камера лишається на галявині
        this.controls.maxPolarAngle = Math.PI / 2 - 0.08 // не під землю
        this.controls.enablePan = false

        this.renderer = new Renderer(canvas, this.scene, this.camera, RENDER)
        this.physics = new Physics(PHYSICS.gravity)
        this.sound = new Sound()

        // Небо — одразу (видно на фоні екрана завантаження)
        this.sky = new Sky(SKY, SUN_DIRECTION)
        this.scene.add(this.sky.mesh)

        this.hud = new HUD({
            onFoxMode: (mode) => this.world?.fox.setMode(mode),
            onResetCrates: () => {
                this.world?.crates.reset()
                this.hud.toast('Ящики повернуто на місце')
            },
            onClearBalls: () => this.world?.balls.clear(),
            onToggleSound: () => this.sound.toggle(),
            onShoot: () => this.shoot(new THREE.Vector2(0, 0))
        })

        this.pointer = new Pointer(canvas)
        this.pointer.addEventListener('click', () => this.onClick())
        this.raycaster = new THREE.Raycaster()

        const maxAnisotropy = this.renderer.instance.capabilities.getMaxAnisotropy()
        this.resources = new Resources(ASSETS, maxAnisotropy)
        this.resources.addEventListener('progress', (e) => this.hud.setProgress(e.detail))
        this.resources.addEventListener('ready', () => this.onReady())

        this.onResize = this.onResize.bind(this)
        window.addEventListener('resize', this.onResize)

        this.timer = new THREE.Timer()
        this.timer.connect(document)
        this.renderer.instance.setAnimationLoop(() => this.tick())
    }

    onReady() {
        this.world = new World(this)

        this.world.fox.addEventListener('mode', (e) => this.hud.setFoxMode(e.detail))
        this.world.balls.addEventListener('teleport', () => {
            this.teleports++
            this.hud.toast('✨ Телепортація!')
        })
        this.hud.setFoxMode(this.world.fox.mode)

        // Компілюємо шейдери заздалегідь — без «підвисання» на першому кадрі
        this.renderer.instance.compile(this.scene, this.camera)
        this.#setupGUI()
        this.hud.hideLoader()
    }

    /** Постріл м'ячем у напрямку курсора */
    shoot(ndc) {
        if (!this.world) return
        this.raycaster.setFromCamera(ndc, this.camera)
        const dir = this.raycaster.ray.direction.clone()
        const origin = this.camera.position.clone().addScaledVector(dir, 1.2)
        this.world.balls.shoot(origin, dir)
    }

    onClick() {
        if (!this.world) return
        // клік по лисиці — «погладити»
        this.raycaster.setFromCamera(this.pointer.ndc, this.camera)
        const hit = this.raycaster.intersectObject(this.world.fox.group, true)[0]
        if (hit) {
            this.world.fox.pet()
            this.hud.toast('🦊 Лисиця зупинилась озирнутися')
            return
        }
        this.shoot(this.pointer.ndc)
    }

    #setupGUI() {
        this.gui = new GUI({ title: 'Налаштування' })
        this.gui.close()
        const applyRender = () => this.renderer.applySettings()

        const render = this.gui.addFolder('Рендер')
        render.add(RENDER, 'exposure', 0.3, 2.5, 0.01).name('Експозиція').onChange(applyRender)
        render.add(RENDER, 'bloomStrength', 0, 2, 0.01).name('Bloom: сила').onChange(applyRender)
        render.add(RENDER, 'bloomRadius', 0, 1, 0.01).name('Bloom: радіус').onChange(applyRender)
        render.add(RENDER, 'bloomThreshold', 0, 2, 0.01).name('Bloom: поріг').onChange(applyRender)
        render.add(RENDER, 'shadows').name('Тіні').onChange(applyRender)
        render.add(this.scene, 'environmentIntensity', 0, 2, 0.01).name('Сила HDR-оточення')

        const light = this.gui.addFolder('Світло')
        light.add(this.world.lights.sun, 'intensity', 0, 8, 0.05).name('Сонце')
        light.addColor(this.world.lights.sun, 'color').name('Колір сонця')
        light.add(this.world.lights.hemisphere, 'intensity', 0, 3, 0.05).name('Небо/земля')
        light.add(this.world.campfire.light, 'distance', 2, 30, 0.5).name('Радіус багаття')

        const fox = this.gui.addFolder('Лисиця')
        fox.add(FOX, 'speedMultiplier', 0.2, 3, 0.05).name('Множник швидкості')

        const physics = this.gui.addFolder('Фізика')
        physics.add(PHYSICS, 'gravity', -30, -1, 0.1).name('Гравітація').onChange((v) => this.physics.setGravity(v))
        physics.add(PHYSICS, 'ballSpeed', 5, 40, 0.5).name('Швидкість м\'яча')

        const shaders = this.gui.addFolder('Шейдери')
        const applyPortal = () => this.world.portal.applyParams()
        shaders.addColor(PORTAL, 'colorStart').name('Портал: колір 1').onChange(applyPortal)
        shaders.addColor(PORTAL, 'colorEnd').name('Портал: колір 2').onChange(applyPortal)
        shaders.add(PORTAL, 'intensity', 0.2, 4, 0.05).name('Портал: яскравість').onChange(applyPortal)
        shaders.add(FIREFLIES, 'size', 20, 600, 1).name('Світлячки: розмір').onChange(() => this.world.fireflies.applyParams())
        shaders.addColor(FIREFLIES, 'color').name('Світлячки: колір').onChange(() => this.world.fireflies.applyParams())
        const applySky = () => this.sky.applyParams()
        shaders.addColor(SKY, 'topColor').name('Небо: зеніт').onChange(applySky)
        shaders.addColor(SKY, 'horizonColor').name('Небо: горизонт').onChange(applySky)
        shaders.add(SKY, 'starDensity', 0, 0.03, 0.001).name('Небо: зірки').onChange(applySky)
        shaders.addColor(this.scene.fog, 'color').name('Колір туману')

        this.gui.folders.forEach((f) => f.close())
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()
        this.renderer.resize()
        this.world?.fireflies.setPixelRatio(this.renderer.pixelRatio)
    }

    tick() {
        this.timer.update()
        const dt = Math.min(this.timer.getDelta(), MAX_DELTA)
        const elapsed = this.timer.getElapsed()

        if (this.world) {
            this.world.update(dt, elapsed) // спершу лисиця задає швидкість свого тіла…
            this.physics.update(dt)       // …потім фізика рахує рух і зіткнення
        }

        this.sky.update(elapsed, this.camera)
        this.controls.update()

        this.hudTimer += dt
        if (this.world && this.hudTimer > 0.25) {
            this.hudTimer = 0
            this.hud.updateStats({ balls: this.world.balls.count, teleports: this.teleports })
        }

        this.renderer.render()
    }

    dispose() {
        this.renderer.instance.setAnimationLoop(null)
        window.removeEventListener('resize', this.onResize)
        this.timer.dispose()
        this.pointer.dispose()
        this.hud.dispose()
        this.gui?.destroy()
        this.controls.dispose()
        this.world?.dispose()
        this.sky.dispose()
        this.sound.dispose()
        this.renderer.dispose()
    }
}
