import * as THREE from 'three'

const CLICK_MAX_DISTANCE = 6   // px — більше вважаємо перетягуванням камери
const CLICK_MAX_DURATION = 400 // ms

/**
 * Відстежує курсор у нормалізованих координатах (-1..1) та відрізняє
 * «клік» від перетягування (щоб OrbitControls і кліки не конфліктували).
 *
 * Події: 'click'
 */
export class Pointer extends EventTarget {
    /** @param {HTMLElement} element */
    constructor(element) {
        super()
        this.element = element
        this.ndc = new THREE.Vector2()
        this.isInside = false
        this.down = null
        this.abort = new AbortController()

        const options = { signal: this.abort.signal }
        element.addEventListener('pointermove', (e) => this.#onMove(e), options)
        element.addEventListener('pointerleave', () => (this.isInside = false), options)
        element.addEventListener('pointerdown', (e) => this.#onDown(e), options)
        element.addEventListener('pointerup', (e) => this.#onUp(e), options)
    }

    #onMove(event) {
        const rect = this.element.getBoundingClientRect()
        this.ndc.set(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        )
        this.isInside = true
    }

    #onDown(event) {
        if (event.button !== 0) return
        this.#onMove(event)
        this.down = { x: event.clientX, y: event.clientY, time: performance.now() }
    }

    #onUp(event) {
        if (!this.down || event.button !== 0) return
        const distance = Math.hypot(event.clientX - this.down.x, event.clientY - this.down.y)
        const duration = performance.now() - this.down.time
        this.down = null
        if (distance < CLICK_MAX_DISTANCE && duration < CLICK_MAX_DURATION) {
            this.#onMove(event)
            this.dispatchEvent(new Event('click'))
        }
    }

    dispose() {
        this.abort.abort() // знімає всі слухачі одним викликом
    }
}
