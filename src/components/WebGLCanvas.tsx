import React, { useEffect, useRef, useState } from 'react';

// Define the configuration interface required by the webgl application
interface Config {
  shockwaveWaveSpeed: number;
  shockwaveWaveThickness: number;
  shockwaveWaveGlow: number;
  shockwaveParticleSpeed: number;
}

interface WebGLCanvasProps {
  config: Config;
}

export const WebGLCanvas: React.FC<WebGLCanvasProps> = ({ config }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Create a ref to store the shockwave triggering function
  const triggerShockwaveRef = useRef<(x: number, y: number) => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // Set canvas dimensions
    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    setSize();
    window.addEventListener('resize', setSize);

    // Vertex Shader
    const vsSource = `
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = position * 0.5 + 0.5;
        vUv.y = 1.0 - vUv.y; // Flip Y for standard texture coordinates
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment Shader
    const fsSource = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform vec2 shockwaveCenter;
      uniform float shockwaveTime;

      // Configuration Uniforms
      uniform float u_waveSpeed;
      uniform float u_waveThickness;
      uniform float u_waveGlow;
      uniform float u_particleSpeed;

      // Color Palette (matching Loki Prime aesthetic)
      vec3 color1 = vec3(0.0, 1.0, 0.8); // Cyan
      vec3 color2 = vec3(0.8, 0.0, 1.0); // Purple
      vec3 color3 = vec3(1.0, 0.5, 0.0); // Orange

      // Noise function for particles
      float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        float aspect = resolution.x / resolution.y;

        // Correct aspect ratio for circular distance calculations
        vec2 center = shockwaveCenter;
        vec2 delta = uv - center;
        delta.x *= aspect;

        float dist = length(delta);

        vec3 finalColor = vec3(0.0);

        // 1. Core Shockwave
        if (shockwaveTime > 0.0) {
            // Apply speed setting
            float currentRadius = shockwaveTime * 1.5 * u_waveSpeed;

            // Calculate distance to the expanding ring
            float ringDist = abs(dist - currentRadius);

            // Apply thickness and glow settings
            float thickness = 0.05 * u_waveThickness;
            float waveAlpha = smoothstep(thickness, 0.0, ringDist);

            // Core bright ring
            float core = smoothstep(0.01 * u_waveThickness, 0.0, ringDist);

            // Mix colors based on distance and time
            vec3 waveColor = mix(color1, color2, sin(dist * 10.0 - time * 2.0) * 0.5 + 0.5);
            waveColor = mix(waveColor, color3, core);

            // Apply intensity/glow
            finalColor += waveColor * waveAlpha * u_waveGlow * (1.0 - (currentRadius * 0.3)); // Fade out as it expands
        }

        // 2. Ambient Particles
        // Create a grid for particles
        vec2 gridUv = fract(uv * 20.0);
        vec2 gridId = floor(uv * 20.0);

        // Randomize particle position within grid cell
        vec2 particleOffset = vec2(
            random(gridId) * 0.8 + 0.1,
            random(gridId + 10.0) * 0.8 + 0.1
        );

        // Move particles
        particleOffset.y += sin(time * u_particleSpeed * random(gridId) + gridId.x) * 0.5;
        particleOffset.y = fract(particleOffset.y);

        float particleDist = length(gridUv - particleOffset);
        float particleAlpha = smoothstep(0.1, 0.0, particleDist) * (0.3 + 0.7 * random(gridId + 20.0));

        // Color particles based on grid ID
        vec3 particleColor = mix(color1, color3, random(gridId + 30.0));

        finalColor += particleColor * particleAlpha;

        gl_FragColor = vec4(finalColor, 1.0); // Additive blending handled by WebGL context setup if needed, but here we just output the color.
      }
    `;

    // Compile Shader
    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fsSource);

    if (!vertexShader || !fragmentShader) return;

    // Create Program
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Set up geometry (full screen quad)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const resolutionLoc = gl.getUniformLocation(program, 'resolution');
    const timeLoc = gl.getUniformLocation(program, 'time');
    const shockwaveCenterLoc = gl.getUniformLocation(program, 'shockwaveCenter');
    const shockwaveTimeLoc = gl.getUniformLocation(program, 'shockwaveTime');

    // Config uniform locations
    const waveSpeedLoc = gl.getUniformLocation(program, 'u_waveSpeed');
    const waveThicknessLoc = gl.getUniformLocation(program, 'u_waveThickness');
    const waveGlowLoc = gl.getUniformLocation(program, 'u_waveGlow');
    const particleSpeedLoc = gl.getUniformLocation(program, 'u_particleSpeed');

    // Enable alpha blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Additive blending for glowing effect

    let animationFrameId: number;
    let startTime = performance.now();

    // Shockwave state
    let swCenter = [0.5, 0.5];
    let swStartTime = -1;

    // The rendering loop
    const render = (time: number) => {
      // Calculate elapsed time in seconds
      const elapsedTime = (time - startTime) * 0.001;

      // Update uniforms
      gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
      gl.uniform1f(timeLoc, elapsedTime);
      gl.uniform2f(shockwaveCenterLoc, swCenter[0], swCenter[1]);

      // Calculate shockwave progress
      let currentSwTime = 0.0;
      if (swStartTime > 0) {
          currentSwTime = (time - swStartTime) * 0.001;
          // Optional: Reset shockwave after a certain duration to allow triggering again
          // if (currentSwTime > 5.0) swStartTime = -1;
      }
      gl.uniform1f(shockwaveTimeLoc, currentSwTime);

      // Update config uniforms
      gl.uniform1f(waveSpeedLoc, config.shockwaveWaveSpeed);
      gl.uniform1f(waveThicknessLoc, config.shockwaveWaveThickness);
      gl.uniform1f(waveGlowLoc, config.shockwaveWaveGlow);
      gl.uniform1f(particleSpeedLoc, config.shockwaveParticleSpeed);

      // Draw
      gl.clearColor(0.0, 0.0, 0.0, 0.0); // Transparent background
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    // Start rendering
    animationFrameId = requestAnimationFrame(render);

    // Expose trigger function
    triggerShockwaveRef.current = (x: number, y: number) => {
        swCenter = [x, y];
        swStartTime = performance.now();
    };

    // Auto trigger on mount at center
    setTimeout(() => {
        if (triggerShockwaveRef.current) {
            triggerShockwaveRef.current(0.5, 0.5);
        }
    }, 100);

    // Cleanup
    return () => {
      window.removeEventListener('resize', setSize);
      cancelAnimationFrame(animationFrameId);
      triggerShockwaveRef.current = undefined;
    };
  }, [config]); // Re-run effect if config changes, or we can handle it dynamically if we pass config differently, but re-init is safer for now or we could use refs for config to avoid re-init.

  // Optimization: Use refs for config to avoid re-initializing WebGL on slider changes
  const configRef = useRef(config);
  useEffect(() => {
      configRef.current = config;
  }, [config]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[998]"
      style={{ width: '100%', height: '100%' }}
    />
  );
};
