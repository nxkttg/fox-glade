import './style.css'
import { Experience } from './core/Experience.js'

const experience = new Experience(document.querySelector('canvas.webgl'))

// HMR у режимі розробки: знищуємо старий екземпляр перед заміною модуля
if (import.meta.hot) {
    import.meta.hot.dispose(() => experience.dispose())
}
