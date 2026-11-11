uniform vec3 uTopColor;
uniform vec3 uHorizonColor;
uniform vec3 uBottomColor;
uniform vec3 uSunColor;
uniform vec3 uSunDirection;
uniform float uStarDensity;
uniform float uTime;

varying vec3 vDirection;

// Простий псевдовипадковий хеш для зірок
float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

void main() {
    vec3 dir = normalize(vDirection);
    float h = dir.y;

    // Вертикальний градієнт: горизонт → зеніт / горизонт → низ
    vec3 color = h > 0.0
        ? mix(uHorizonColor, uTopColor, pow(h, 0.55))
        : mix(uHorizonColor, uBottomColor, pow(-h, 0.4));

    // Сонце: широке сяйво + яскравий диск
    float sun = max(dot(dir, normalize(uSunDirection)), 0.0);
    color += uSunColor * (pow(sun, 10.0) * 0.4 + pow(sun, 2500.0) * 3.0);

    // Зірки — лише високо в небі, з мерехтінням
    vec3 cell = floor(dir * 220.0);
    float star = step(1.0 - uStarDensity, hash(cell));
    float twinkle = 0.55 + 0.45 * sin(uTime * 2.5 + hash(cell + 7.0) * 60.0);
    color += vec3(star * twinkle * smoothstep(0.25, 0.7, h) * 2.0);

    gl_FragColor = vec4(color, 1.0);
}
