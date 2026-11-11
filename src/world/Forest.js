import * as THREE from 'three'
import * as CANNON from 'cannon-es'

/**
 * Ліс із примітивів: дерева (циліндр + 2 конуси), каміння (деформовані ікосаедри)
 * та кущики трави. Повторювані об'єкти — InstancedMesh: сотні копій за один draw call.
 */
export class Forest {
    constructor(physics, avoid, clearingRadius) {
        this.group = new THREE.Group()
        this.disposables = []
        this.physics = physics
        this.avoid = avoid // функція (x, z) => true, якщо місце зайняте
        this.clearingRadius = clearingRadius

        this.#createTrees(70)
        this.#createRocks(10)
        this.#createGrass(1800)
    }

    #track(...resources) {
        this.disposables.push(...resources)
    }

    /** Випадкова точка в кільці [min, max], що не перетинає зайняті місця */
    #randomSpot(min, max) {
        for (let tries = 0; tries < 100; tries++) {
            const angle = Math.random() * Math.PI * 2
            const r = THREE.MathUtils.randFloat(min, max)
            const x = Math.cos(angle) * r
            const z = Math.sin(angle) * r
            if (!this.avoid(x, z)) return { x, z }
        }
        return null
    }

    #createTrees(count) {
        const trunkGeo = new THREE.CylinderGeometry(0.15, 0.28, 2, 7).translate(0, 1, 0)
        const crownGeo = new THREE.ConeGeometry(1.5, 3.2, 8).translate(0, 3.2, 0)
        const topGeo = new THREE.ConeGeometry(1.05, 2.4, 8).translate(0, 4.7, 0)
        const trunkMat = new THREE.MeshStandardMaterial({ color: '#4a3226', roughness: 0.9 })
        const crownMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8, flatShading: true })
        this.#track(trunkGeo, crownGeo, topGeo, trunkMat, crownMat)

        const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count)
        const crowns = new THREE.InstancedMesh(crownGeo, crownMat, count)
        const tops = new THREE.InstancedMesh(topGeo, crownMat, count)

        const dummy = new THREE.Object3D()
        const color = new THREE.Color()
        let placed = 0
        for (let i = 0; i < count; i++) {
            const spot = this.#randomSpot(this.clearingRadius, 34)
            if (!spot) continue
            const scale = THREE.MathUtils.randFloat(0.8, 1.6)
            dummy.position.set(spot.x, 0, spot.z)
            dummy.rotation.set(0, Math.random() * Math.PI, (Math.random() - 0.5) * 0.06)
            dummy.scale.setScalar(scale)
            dummy.updateMatrix()
            trunks.setMatrixAt(placed, dummy.matrix)
            crowns.setMatrixAt(placed, dummy.matrix)
            tops.setMatrixAt(placed, dummy.matrix)

            // кожне дерево — свій відтінок зеленого
            color.setHSL(THREE.MathUtils.randFloat(0.25, 0.36), 0.45, THREE.MathUtils.randFloat(0.16, 0.28))
            crowns.setColorAt(placed, color)
            tops.setColorAt(placed, color.offsetHSL(0, 0, 0.04))

            // фізичні стовбури лише для ближніх дерев (далекі м'ячі не дістануть)
            if (Math.hypot(spot.x, spot.z) < 20) {
                const body = new CANNON.Body({
                    type: CANNON.Body.STATIC,
                    shape: new CANNON.Cylinder(0.25 * scale, 0.3 * scale, 4 * scale, 8),
                    position: new CANNON.Vec3(spot.x, 2 * scale, spot.z)
                })
                this.physics.add(body)
            }
            placed++
        }
        for (const mesh of [trunks, crowns, tops]) {
            mesh.count = placed
            mesh.castShadow = true
            mesh.receiveShadow = true
            this.group.add(mesh)
        }
    }

    #createRocks(count) {
        const material = new THREE.MeshStandardMaterial({ color: '#7d7a80', roughness: 0.85, flatShading: true })
        this.#track(material)
        for (let i = 0; i < count; i++) {
            const spot = this.#randomSpot(7.5, this.clearingRadius - 0.5)
            if (!spot) continue
            const geometry = new THREE.IcosahedronGeometry(1, 1)
            // деформуємо вершини — кожен камінь унікальний
            const pos = geometry.attributes.position
            for (let v = 0; v < pos.count; v++) {
                const k = 0.75 + Math.random() * 0.4
                pos.setXYZ(v, pos.getX(v) * k, pos.getY(v) * k * 0.7, pos.getZ(v) * k)
            }
            geometry.computeVertexNormals()
            this.#track(geometry)

            const size = THREE.MathUtils.randFloat(0.35, 0.9)
            const rock = new THREE.Mesh(geometry, material)
            rock.scale.setScalar(size)
            rock.position.set(spot.x, size * 0.25, spot.z)
            rock.rotation.y = Math.random() * Math.PI
            rock.castShadow = rock.receiveShadow = true
            this.group.add(rock)

            this.physics.add(new CANNON.Body({
                type: CANNON.Body.STATIC,
                shape: new CANNON.Sphere(size * 0.8),
                position: new CANNON.Vec3(spot.x, 0, spot.z)
            }))
        }
    }

    #createGrass(count) {
        const geometry = new THREE.ConeGeometry(0.06, 0.45, 3).translate(0, 0.22, 0)
        const material = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1 })
        this.#track(geometry, material)
        const grass = new THREE.InstancedMesh(geometry, material, count)
        const dummy = new THREE.Object3D()
        const color = new THREE.Color()
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2
            const r = 2 + Math.sqrt(Math.random()) * 26
            dummy.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r)
            dummy.rotation.set((Math.random() - 0.5) * 0.5, Math.random() * Math.PI, (Math.random() - 0.5) * 0.5)
            dummy.scale.setScalar(THREE.MathUtils.randFloat(0.6, 1.5))
            dummy.updateMatrix()
            grass.setMatrixAt(i, dummy.matrix)
            grass.setColorAt(i, color.setHSL(THREE.MathUtils.randFloat(0.2, 0.3), 0.5, THREE.MathUtils.randFloat(0.18, 0.3)))
        }
        grass.receiveShadow = true
        this.group.add(grass)
    }

    dispose() {
        this.group.removeFromParent()
        this.disposables.forEach((r) => r.dispose())
    }
}
