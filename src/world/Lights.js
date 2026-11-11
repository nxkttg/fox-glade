import * as THREE from 'three'

/**
 * Освітлення сцени:
 *  - HDR-карта оточення (PMREM) — реалістичні відбиття та непряме світло (IBL);
 *  - HemisphereLight — небо/земля;
 *  - DirectionalLight — низьке вечірнє сонце з м'якими тінями.
 */
export class Lights {
    constructor(scene, envMap, sunDirection) {
        scene.environment = envMap
        scene.environmentIntensity = 0.45

        this.hemisphere = new THREE.HemisphereLight('#ffc9a8', '#2a3a2c', 0.7)

        this.sun = new THREE.DirectionalLight('#ffb27a', 3.2)
        this.sun.position.copy(sunDirection).normalize().multiplyScalar(25)
        this.sun.castShadow = true
        this.sun.shadow.mapSize.set(2048, 2048)
        this.sun.shadow.radius = 3
        this.sun.shadow.normalBias = 0.03 // прибирає «shadow acne»
        // Камера тіні охоплює лише галявину — вища щільність тексселів = чіткіші тіні
        Object.assign(this.sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 60 })
        this.sun.shadow.camera.updateProjectionMatrix()

        scene.add(this.hemisphere, this.sun)
        this.scene = scene
    }

    dispose() {
        this.sun.shadow.map?.dispose()
        this.scene.environment = null
    }
}
