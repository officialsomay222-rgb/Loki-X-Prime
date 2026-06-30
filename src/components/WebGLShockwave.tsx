import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const vertexShaderSource = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// Standard WebGL fragment shader for the shockwave effect
const fragmentShaderSource = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec3 u_shockwaves[10]; // x, y, startTime
  uniform float u_waveSpeed;
  uniform float u_waveThickness;
  uniform float u_waveGlow;
  uniform float u_particleSpeed;

  float sdInfinity(vec2 p, float a) {
    float x2 = p.x * p.x;
    float y2 = p.y * p.y;
    float r2 = x2 + y2;
    float f = r2 * r2 - a * a * (x2 - y2);
    vec2 grad = vec2(4.0 * p.x * r2 - 2.0 * a * a * p.x,
                     4.0 * p.y * r2 + 2.0 * a * a * p.y);
    return abs(f) / (length(grad) + 0.0001);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 pos = uv;
    float aspect = u_resolution.x / u_resolution.y;
    pos.x *= aspect;

    vec3 color = vec3(0.0); // Transparent background
    float alpha = 0.0;

    // Google official brand colors
    vec3 cBlue = vec3(0.259, 0.522, 0.957);
    vec3 cRed = vec3(0.918, 0.263, 0.208);
    vec3 cYellow = vec3(0.984, 0.737, 0.020);
    vec3 cGreen = vec3(0.204, 0.659, 0.325);

    for (int i = 0; i < 10; i++) { // Max 10 simultaneous shockwaves
      float startTime = u_shockwaves[i].z;
      if (startTime <= 0.0) continue;

      float age = u_time - startTime;
      if (age > 0.0 && age < 4.0) {
        vec2 center = u_shockwaves[i].xy;
        center.x *= aspect; // apply aspect ratio to center

        float dist = distance(pos, center);
        float currentRadius = age * 0.7 * u_waveSpeed; // Speed of expansion
        float thickness = (0.02 + (age * 0.025)) * u_waveThickness; // Gets thicker as it expands

        // Loop over the 4 Google colors to make a rainbow wave
        for(int j = 0; j < 4; j++) {
          float offset = float(j) * (0.06 + age * 0.015);
          float r = currentRadius - offset;

          if (r > 0.0) {
            float ring = smoothstep(r - thickness, r, dist) - smoothstep(r, r + thickness, dist);

            vec3 ringColor;
            if (j == 0) ringColor = cBlue;
            else if (j == 1) ringColor = cRed;
            else if (j == 2) ringColor = cYellow;
            else ringColor = cGreen;

            // Fade out smoothly at end of life and fade in quickly at start
            float fade = smoothstep(4.0, 0.0, age) * smoothstep(0.0, 0.1, age);

            // Add a soft glow effect alongside the hard ring
            float glow = exp(-abs(dist - r) * 8.0) * 0.8 * u_waveGlow;

            color += ringColor * (ring + glow) * fade;
            alpha += (ring + glow) * fade;
          }
        }
      }
    }

    // Render central animated infinity loop
    vec2 centeredPos = uv - 0.5;
    centeredPos.x *= aspect;

    // Subtle wavy distortion based on time to make it feel alive
    centeredPos += vec2(sin(u_time * 2.0 + centeredPos.y * 10.0) * 0.005, cos(u_time * 1.5 + centeredPos.x * 10.0) * 0.005);

    float infA = min(aspect, 1.0) * 0.35;
    float dInf = sdInfinity(centeredPos, infA);

    // Animate the thickness and add colorful gradients
    float thicknessBase = 0.005 + 0.002 * sin(u_time * 3.0);
    float infLine = smoothstep(thicknessBase, 0.0, dInf);

    // Colorful shifting glow for the track
    float colorShift = u_time * 0.8 + length(centeredPos) * 3.0;
    vec3 baseInfColor = vec3(
      0.5 + 0.5 * sin(colorShift),
      0.5 + 0.5 * sin(colorShift + 2.094),
      0.5 + 0.5 * sin(colorShift + 4.188)
    ) * 0.2;

    // Pulsing glow
    float glowSize = 0.001 + 0.0005 * sin(u_time * 4.0);
    float infGlow = glowSize / (abs(dInf) + 0.001);

    color += baseInfColor * infLine * 1.5 + baseInfColor * infGlow * 2.0;
    alpha += (infLine + infGlow * 0.5);

    float walkTime = u_time * 1.5 * u_particleSpeed;
    for(int k = 0; k < 4; k++) {
      float tk = walkTime - float(k) * 1.5707963268;
      float denom = 1.0 + sin(tk) * sin(tk);
      vec2 pt = vec2(infA * cos(tk) / denom, infA * sin(tk) * cos(tk) / denom);

      float distToPt = length(centeredPos - pt);
      // Brighter cores
      float pCore = smoothstep(0.015, 0.0, distToPt);
      float pGlow = 0.0025 / (distToPt + 0.002);

      vec3 ptColor;
      if (k == 0) ptColor = cBlue;
      else if (k == 1) ptColor = cRed;
      else if (k == 2) ptColor = cYellow;
      else ptColor = cGreen;

      color += ptColor * (pCore * 2.0 + pGlow * 2.0);
      alpha += (pCore + pGlow);

      // Longer and smoother trail
      for(int m = 1; m <= 8; m++) {
        float tailTk = tk - float(m) * 0.06;
        float tailDenom = 1.0 + sin(tailTk) * sin(tailTk);
        vec2 tailPt = vec2(infA * cos(tailTk) / tailDenom, infA * sin(tailTk) * cos(tailTk) / tailDenom);
        float tailDist = length(centeredPos - tailPt);
        float tailGlow = 0.0008 / (tailDist + 0.001) * (1.0 - float(m)/8.0);
        color += ptColor * tailGlow * 1.5;
        alpha += tailGlow * 0.5;
      }
    }

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export interface WebGLCanvasRef {
  triggerShockwave: (normalizedX: number, normalizedY: number) => void;
}

export interface ShockwaveConfig {
  waveSpeed: number;
  waveThickness: number;
  waveGlow: number;
  particleSpeed: number;
}

export const WebGLCanvas = forwardRef<WebGLCanvasRef, { config?: ShockwaveConfig }>(({ config }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const configRef = useRef(config || {
    waveSpeed: 1.0,
    waveThickness: 1.0,
    waveGlow: 1.0,
    particleSpeed: 1.0
  });

  useEffect(() => {
    if (config) {
      configRef.current = config;
    }
  }, [config]);

  // Store up to 10 shockwaves: x, y, startTime
  const shockwavesRef = useRef<Float32Array>(new Float32Array(30));
  const currentIdxRef = useRef(0);

  const triggerShockwave = (normalizedX: number, normalizedY: number) => {
    const idx = (currentIdxRef.current % 10) * 3;
    shockwavesRef.current[idx] = normalizedX;
    shockwavesRef.current[idx + 1] = normalizedY;
    shockwavesRef.current[idx + 2] = performance.now() / 1000.0;
    currentIdxRef.current += 1;
  };

  useImperativeHandle(ref, () => ({
    triggerShockwave
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return;

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return;

    const positionAttributeLocation = gl.getAttribLocation(program, 'position');
    const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeUniformLocation = gl.getUniformLocation(program, 'u_time');
    const shockwavesUniformLocation = gl.getUniformLocation(program, 'u_shockwaves[0]') || gl.getUniformLocation(program, 'u_shockwaves');
    const waveSpeedLocation = gl.getUniformLocation(program, 'u_waveSpeed');
    const waveThicknessLocation = gl.getUniformLocation(program, 'u_waveThickness');
    const waveGlowLocation = gl.getUniformLocation(program, 'u_waveGlow');
    const particleSpeedLocation = gl.getUniformLocation(program, 'u_particleSpeed');

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Initial resize
    const resizeCanvas = () => {
      const displayWidth = window.innerWidth;
      const displayHeight = window.innerHeight;

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      }
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    let animationFrameId: number;

    const render = (time: number) => {
      // time is in ms, convert to seconds
      const timeSecs = time * 0.001;

      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

      // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
      const size = 2;          // 2 components per iteration
      const type = gl.FLOAT;   // the data is 32bit floats
      const normalize = false; // don't normalize the data
      const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
      const offset = 0;        // start at the beginning of the buffer
      gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

      // Set uniforms
      gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
      gl.uniform1f(timeUniformLocation, timeSecs);
      gl.uniform3fv(shockwavesUniformLocation, shockwavesRef.current);
      gl.uniform1f(waveSpeedLocation, configRef.current.waveSpeed);
      gl.uniform1f(waveThicknessLocation, configRef.current.waveThickness);
      gl.uniform1f(waveGlowLocation, configRef.current.waveGlow);
      gl.uniform1f(particleSpeedLocation, configRef.current.particleSpeed);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  useEffect(() => {
    // Trigger a single shockwave immediately when the component mounts
    triggerShockwave(0.5, 0.5);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[998] overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{
          transform: 'translateZ(0)',
          willChange: 'transform, opacity'
        }}
      />
    </div>
  );
});

WebGLCanvas.displayName = 'WebGLShockwave';

export default WebGLCanvas;
