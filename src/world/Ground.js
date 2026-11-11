import * as THREE from 'three'
import * as CANNON from 'cannon-es'

/** Трав'яна земля: текстура + normal map, і нескінченна фізична площина */
export class Ground {
    constructor(textures, physics) {
        const { grassColor, grassNormal } = textures
        for (const t of [grassColor, grassNormal]) {
            t.wrapS = t.wrapT = THREE.RepeatWrapping
            t.repeat.set(28, 28)
        }

        this.material = new THREE.MeshStandardMaterial({
            map: grassColor,
            normalMap: grassNormal,
            normalScale: new THREE.Vector2(0.6, 0.6),
            roughness: 0.95,
            color: '#c9d6a8' // приглушуємо насиченість текстури під вечірнє світло
        })
        this.mesh = new THREE.Mesh(new THREE.CircleGeometry(70, 64), this.material)
        this.mesh.rotation.x = -Math.PI / 2
        this.mesh.receiveShadow = true

        const body = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Plane() })
        body.quaternion.setFromEuler(-Math.PI / 2, 0, 0) // площина в cannon дивиться вздовж +Z
        physics.add(body)
    }

    dispose() {
        this.mesh.geometry.dispose()
        this.material.dispose()
    }
}
