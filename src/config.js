/**
 * Центральна конфігурація проєкту.
 * Те, що змінює GUI, — звичайні об'єкти; незмінне — Object.freeze.
 */

/** Ресурси для завантаження (LoadingManager рахує прогрес по них) */
export const ASSETS = Object.freeze([
    { name: 'fox', type: 'gltf', path: './models/Fox.glb' },
    { name: 'parrot', type: 'gltf', path: './models/Parrot.glb' },
    { name: 'flamingo', type: 'gltf', path: './models/Flamingo.glb' },
    { name: 'envMap', type: 'hdr', path: './textures/env.hdr' },
    { name: 'grassColor', type: 'texture', path: './textures/grass.jpg', srgb: true },
    { name: 'grassNormal', type: 'texture', path: './textures/grass_normal.jpg' },
    { name: 'woodColor', type: 'texture', path: './textures/hardwood2_diffuse.jpg', srgb: true },
    { name: 'woodRoughness', type: 'texture', path: './textures/hardwood2_roughness.jpg' },
    { name: 'woodBump', type: 'texture', path: './textures/hardwood2_bump.jpg' }
])

/** Напрямок на сонце — спільний для неба (шейдер) і DirectionalLight */
export const SUN_DIRECTION = Object.freeze({ x: -0.55, y: 0.22, z: -0.8 })

export const RENDER = {
    exposure: 1.0,
    bloomStrength: 0.55,
    bloomRadius: 0.4,
    bloomThreshold: 0.85,
    shadows: true
}

export const FOX = {
    pathRadius: 5.5,
    startAngle: Math.PI / 4,
    towerAngle: (Math.PI * 3) / 4, // де на колі лисиці стоїть вежа з ящиків
    speedMultiplier: 1,
    speeds: { Survey: 0, Walk: 1.3, Run: 4.2 },
    petDuration: 3 // скільки секунд лисиця стоїть, якщо її «погладити»
}

export const PHYSICS = {
    gravity: -9.82,
    ballSpeed: 26,
    ballRadius: 0.3,
    maxBalls: 40,
    crateSize: 0.8
}

export const PORTAL = {
    position: Object.freeze({ x: 0, y: 2.1, z: -10 }),
    radius: 1.6,
    colorStart: '#2a00ff',
    colorEnd: '#ff4df0',
    intensity: 1.6
}

export const FIREFLIES = {
    count: 70,
    size: 220,
    color: '#ffd36b'
}

export const SKY = {
    topColor: '#0b1236',
    horizonColor: '#d9785e',
    bottomColor: '#2a1b2a',
    sunColor: '#ffb070',
    starDensity: 0.006
}

export const FOG = Object.freeze({ color: '#6d4a5a', near: 16, far: 58 })

/** Галявина: дерева ростуть лише за цим радіусом, камера не виходить за нього */
export const CLEARING_RADIUS = 13.5
