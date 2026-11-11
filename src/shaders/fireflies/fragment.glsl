uniform vec3 uColor;

varying float vAlpha;

void main() {
    // gl_PointCoord — координати всередині квадрата частинки (0..1)
    float d = distance(gl_PointCoord, vec2(0.5));
    float glow = clamp(0.05 / d - 0.1, 0.0, 1.0); // яскраве ядро + м'яке сяйво

    gl_FragColor = vec4(uColor * 3.0, glow * vAlpha);
}
