/**
 * Процедурні звуки через Web Audio API — без аудіофайлів.
 * AudioContext створюється лише після дії користувача (вимога браузерів).
 */
export class Sound {
    constructor() {
        this.enabled = false
        this.ctx = null
        this.noise = null
        this.lastHit = 0
    }

    toggle() {
        this.enabled = !this.enabled
        if (this.enabled) {
            this.ctx ??= new AudioContext()
            this.ctx.resume()
            this.noise ??= this.#createNoiseBuffer()
        }
        return this.enabled
    }

    #createNoiseBuffer() {
        const length = Math.floor(this.ctx.sampleRate * 0.3)
        const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
        return buffer
    }

    /** Глухий удар; гучність і «яскравість» залежать від сили зіткнення */
    hit(strength) {
        if (!this.enabled) return
        const now = this.ctx.currentTime
        if (now - this.lastHit < 0.03) return // не більше ~30 ударів/с
        this.lastHit = now

        const source = this.ctx.createBufferSource()
        source.buffer = this.noise
        const filter = this.ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 300 + Math.min(strength, 15) * 120
        const gain = this.ctx.createGain()
        gain.gain.setValueAtTime(Math.min(strength / 12, 1) * 0.5, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

        source.connect(filter).connect(gain).connect(this.ctx.destination)
        source.start(now)
        source.stop(now + 0.2)
    }

    /** «Вжух» порталу — синусоїда з падінням частоти */
    whoosh() {
        if (!this.enabled) return
        const now = this.ctx.currentTime
        const osc = this.ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(900, now)
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.45)
        const gain = this.ctx.createGain()
        gain.gain.setValueAtTime(0.18, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
        osc.connect(gain).connect(this.ctx.destination)
        osc.start(now)
        osc.stop(now + 0.5)
    }

    dispose() {
        this.ctx?.close()
    }
}
