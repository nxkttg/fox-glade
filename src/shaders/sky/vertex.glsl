varying vec3 vDirection;

void main() {
    // Напрямок від центру купола — від нього залежить колір неба
    vDirection = normalize(position);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
