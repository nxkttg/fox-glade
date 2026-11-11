uniform float uTime;
uniform float uPixelRatio;
uniform float uSize;

attribute float aScale;
attribute float aPhase;

varying float vAlpha;

void main() {
    vec3 pos = position;

    // Кожен світлячок літає по своїй траєкторії (фаза aPhase)
    pos.y += sin(uTime * 0.6 + aPhase * 6.2831) * 0.4;
    pos.x += cos(uTime * 0.4 + aPhase * 12.0) * 0.35;
    pos.z += sin(uTime * 0.5 + aPhase * 9.0) * 0.35;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Перспективне зменшення: далі — менший
    gl_PointSize = uSize * aScale * uPixelRatio * (1.0 / -mvPosition.z);

    // Мерехтіння
    vAlpha = 0.45 + 0.55 * sin(uTime * 2.0 + aPhase * 20.0);
}
