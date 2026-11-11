import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'

/**
 * Завантажує всі ресурси через один LoadingManager.
 * Події: 'progress' (detail: 0..1), 'ready'
 */
export class Resources extends EventTarget {
    /** @param {ReadonlyArray<{name:string,type:string,path:string,srgb?:boolean}>} assets */
    constructor(assets, maxAnisotropy = 1) {
        super()
        /** @type {Record<string, any>} */
        this.items = {}

        this.manager = new THREE.LoadingManager(
            () => this.dispatchEvent(new Event('ready')),
            (_url, loaded, total) => this.dispatchEvent(new CustomEvent('progress', { detail: loaded / total })),
            (url) => console.error(`Не вдалося завантажити: ${url}`)
        )

        const loaders = {
            gltf: new GLTFLoader(this.manager),
            hdr: new HDRLoader(this.manager),
            texture: new THREE.TextureLoader(this.manager)
        }

        for (const asset of assets) {
            loaders[asset.type].load(asset.path, (result) => {
                if (asset.type === 'texture') {
                    result.colorSpace = asset.srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
                    result.anisotropy = maxAnisotropy // чіткість текстур під кутом
                }
                if (asset.type === 'hdr') result.mapping = THREE.EquirectangularReflectionMapping
                this.items[asset.name] = result
            })
        }
    }
}
