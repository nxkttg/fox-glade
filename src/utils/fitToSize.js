import * as THREE from 'three'

const _box = new THREE.Box3()
const _size = new THREE.Vector3()

/**
 * Масштабує модель так, щоб її найбільший вимір дорівнював `size`,
 * центрує по X/Z і ставить «ногами» на y = 0.
 * Потрібно, бо моделі з різних джерел мають різні одиниці виміру.
 */
export function fitToSize(object, size) {
    _box.setFromObject(object)
    _box.getSize(_size)
    object.scale.multiplyScalar(size / Math.max(_size.x, _size.y, _size.z))

    _box.setFromObject(object)
    const center = _box.getCenter(new THREE.Vector3())
    object.position.x -= center.x
    object.position.z -= center.z
    object.position.y -= _box.min.y
    return object
}
