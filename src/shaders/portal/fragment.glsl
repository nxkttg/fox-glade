// snoise() додається з noise.glsl у Portal.js

uniform float uTime;
uniform vec3 uColorStart;
uniform vec3 uColorEnd;
uniform float uIntensity;

varying vec2 vUv;

void main() {
    // Полярні координати відносно центру диска
    vec2 centered = vUv - 0.5;
    float dist = length(centered);
    float angle = atan(centered.y, centered.x);

    // Закручування: кут зсувається тим сильніше, чим далі від центру, і з часом
    float swirl = angle + dist * 7.0 - uTime * 0.9;
    vec2 p = vec2(cos(swirl), sin(swirl)) * dist;

    // Дві октави шуму = «енергетична» текстура
    float n = snoise(vec3(p * 4.0, uTime * 0.35));
    n += 0.5 * snoise(vec3(p * 9.0, uTime * 0.6));
    float strength = n * 0.5 + 0.5;

    // Яскравий обідок і світле «око» в центрі
    strength += smoothstep(0.32, 0.5, dist) * 1.4;
    strength += (1.0 - smoothstep(0.0, 0.12, dist)) * 0.8;

    vec3 color = mix(uColorStart, uColorEnd, clamp(strength, 0.0, 1.0));
    color *= uIntensity * (0.5 + strength); // значення > 1 — їх «підхоплює» bloom

    float alpha = 1.0 - smoothstep(0.47, 0.5, dist); // м'який край кола
    gl_FragColor = vec4(color, alpha);
}
