uniform sampler2D tDiffuse;
uniform float h;
uniform float v;
varying vec2 vUv;

void main() {
    vec4 color = vec4(0.0);
    float total = 0.0;

    for (float i = -4.0; i <= 4.0; i++) {
        float weight = exp(-i * i / (2.0 * h * h));
        color += texture2D(tDiffuse, vec2(vUv.x + i * h, vUv.y)) * weight;
        total += weight;
    }

    for (float j = -4.0; j <= 4.0; j++) {
        float weight = exp(-j * j / (2.0 * v * v));
        color += texture2D(tDiffuse, vec2(vUv.x, vUv.y + j * v)) * weight;
        total += weight;
    }

    gl_FragColor = color / total;
}
