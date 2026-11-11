/**
 * DOM-інтерфейс: екран завантаження, панель керування, лічильники, підказки.
 * Не залежить від Three.js — лише показує дані й викликає колбеки.
 */
export class HUD {
    /**
     * @param {object} h
     * @param {(mode: string) => void} h.onFoxMode
     * @param {() => void} h.onResetCrates
     * @param {() => void} h.onClearBalls
     * @param {() => boolean} h.onToggleSound — повертає новий стан
     * @param {() => void} h.onShoot
     */
    constructor(h) {
        this.abort = new AbortController()
        const opts = { signal: this.abort.signal }
        const $ = (id) => document.getElementById(id)

        this.el = {
            loader: $('loader'),
            bar: $('loader-bar'),
            percent: $('loader-percent'),
            balls: $('stat-balls'),
            teleports: $('stat-teleports'),
            foxButtons: document.querySelectorAll('[data-fox]'),
            sound: $('btn-sound'),
            toast: $('toast')
        }

        this.el.foxButtons.forEach((b) => b.addEventListener('click', () => h.onFoxMode(b.dataset.fox), opts))
        $('btn-reset').addEventListener('click', h.onResetCrates, opts)
        $('btn-clear').addEventListener('click', h.onClearBalls, opts)
        this.el.sound.addEventListener('click', () => this.setSound(h.onToggleSound()), opts)

        window.addEventListener('keydown', (e) => {
            if (e.target instanceof HTMLInputElement) return
            const actions = {
                Space: h.onShoot,
                KeyR: h.onResetCrates,
                KeyC: h.onClearBalls,
                Digit1: () => h.onFoxMode('Survey'),
                Digit2: () => h.onFoxMode('Walk'),
                Digit3: () => h.onFoxMode('Run')
            }
            if (actions[e.code]) {
                e.preventDefault()
                actions[e.code]()
            }
        }, opts)
    }

    setProgress(value) {
        const pct = Math.round(value * 100)
        this.el.bar.style.transform = `scaleX(${value})`
        this.el.percent.textContent = `${pct}%`
    }

    hideLoader() {
        this.el.loader.classList.add('hidden')
        document.body.classList.add('ready')
    }

    setFoxMode(mode) {
        this.el.foxButtons.forEach((b) => b.classList.toggle('active', b.dataset.fox === mode))
    }

    setSound(on) {
        this.el.sound.textContent = on ? '🔊 Звук' : '🔇 Звук'
        this.el.sound.classList.toggle('active', on)
    }

    updateStats({ balls, teleports }) {
        this.el.balls.textContent = balls
        this.el.teleports.textContent = teleports
    }

    toast(text) {
        this.el.toast.textContent = text
        this.el.toast.classList.remove('show')
        void this.el.toast.offsetWidth // перезапуск CSS-анімації
        this.el.toast.classList.add('show')
    }

    dispose() {
        this.abort.abort()
    }
}
