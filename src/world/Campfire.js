import * as THREE from 'three'
import * as CANNON from 'cannon-es'

/** Багаття: поліна та каміння (примітиви), анімоване полум'я та мерехтливе світло */
export class Campfire {
    constructor(physics) {
        this.group = new THREE.Group()
        this.disposables = []

        const logGeo = new THREE.CylinderGeometry(0.1, 0.12, 1.3, 8)
        const logMat = new THREE.MeshStandardMaterial({ color: '#5a3a24', roughness: 0.9 })
        for (let i = 0; i < 4; i++) {
            const log = new THREE.Mesh(logGeo, logMat)
            log.rotation.set(Math.PI / 2 - 0.35, (i / 4) * Math.PI * 2, 0)
            log.position.set(Math.sin((i / 4) * Math.PI * 2) * 0.25, 0.22, Math.cos((i / 4) * Math.PI * 2) * 0.25)
            log.castShadow = true
            this.group.add(log)
        }

        const stoneGeo = new THREE.DodecahedronGeometry(0.16, 0)
        const stoneMat = new THREE.MeshStandardMaterial({ color: '#8a8590', roughness: 0.8, flatShading: true })
        const stones = new THREE.InstancedMesh(stoneGeo, stoneMat, 12)
        const dummy = new THREE.Object3D()
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2
            dummy.position.set(Math.cos(a) * 0.75, 0.08, Math.sin(a) * 0.75)
            dummy.rotation.set(Math.random(), Math.random(), Math.random())
            dummy.scale.set(1.2, 0.8, 1)
            dummy.updateMatrix()
            stones.setMatrixAt(i, dummy.matrix)
        }
        stones.castShadow = stones.receiveShadow = true
        this.group.add(stones)

        // Полум'я: кольори > 1 (HDR) → потрапляють у bloom і «світяться»
        const flameGeo = new THREE.ConeGeometry(0.22, 0.9, 8, 1, true).translate(0, 0.45, 0)
        this.flames = [
            { color: new THREE.Color(6, 1.6, 0.3), scale: 1 },
            { color: new THREE.Color(5, 2.6, 0.5), scale: 0.7 },
            { color: new THREE.Color(4, 3.5, 1.2), scale: 0.45 }
        ].map(({ color, scale }, i) => {
            const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false })
            this.disposables.push(material)
            const mesh = new THREE.Mesh(flameGeo, material)
            mesh.position.y = 0.2
            mesh.scale.setScalar(scale)
            this.group.add(mesh)
            return { mesh, baseScale: scale, phase: i * 1.7 }
        })

        this.light = new THREE.PointLight('#ff8a3d', 12, 14, 1.6)
        this.light.position.y = 1
        this.group.add(this.light)

        this.disposables.push(logGeo, logMat, stoneGeo, stoneMat, flameGeo)

        // невисокий фізичний «бар'єр», щоб м'ячі відскакували від багаття
        physics.add(new CANNON.Body({
            type: CANNON.Body.STATIC,
            shape: new CANNON.Cylinder(0.85, 0.85, 0.4, 12),
            position: new CANNON.Vec3(0, 0.2, 0)
        }))
    }

    update(elapsed) {
        for (const f of this.flames) {
            const t = elapsed * 9 + f.phase
            const flick = 1 + Math.sin(t) * 0.12 + Math.sin(t * 2.3) * 0.08
            f.mesh.scale.set(f.baseScale * (2 - flick), f.baseScale * flick * 1.1, f.baseScale * (2 - flick))
            f.mesh.rotation.y = elapsed * 2 + f.phase
        }
        this.light.intensity = 10 + Math.sin(elapsed * 11) * 1.5 + Math.sin(elapsed * 23) * 1.2
    }

    dispose() {
        this.group.removeFromParent()
        this.disposables.forEach((r) => r.dispose())
    }
}
