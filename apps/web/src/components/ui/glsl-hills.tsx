import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface GLSLHillsProps {
  width?: string;
  height?: string;
  cameraZ?: number;
  planeSize?: number;
  speed?: number;
  className?: string;
}

const GLSLHills = ({
  width = '100%',
  height = '100%',
  cameraZ = 125,
  planeSize = 256,
  speed = 0.5,
  className,
}: GLSLHillsProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animId: number;

    const vertexShader = `
      #define GLSLIFY 1
      attribute vec3 position;
      uniform mat4 projectionMatrix;
      uniform mat4 modelViewMatrix;
      uniform float time;
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying float vElevation;
      varying float vSin;

      mat4 rotateMatrixX(float radian) {
        return mat4(
          1.0, 0.0, 0.0, 0.0,
          0.0, cos(radian), -sin(radian), 0.0,
          0.0, sin(radian), cos(radian), 0.0,
          0.0, 0.0, 0.0, 1.0
        );
      }

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      vec3 fade(vec3 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

      float cnoise(vec3 P) {
        vec3 Pi0 = floor(P);
        vec3 Pi1 = Pi0 + vec3(1.0);
        Pi0 = mod289(Pi0);
        Pi1 = mod289(Pi1);
        vec3 Pf0 = fract(P);
        vec3 Pf1 = Pf0 - vec3(1.0);
        vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
        vec4 iy = vec4(Pi0.yy, Pi1.yy);
        vec4 iz0 = Pi0.zzzz;
        vec4 iz1 = Pi1.zzzz;

        vec4 ixy = permute(permute(ix) + iy);
        vec4 ixy0 = permute(ixy + iz0);
        vec4 ixy1 = permute(ixy + iz1);

        vec4 gx0 = ixy0 * (1.0 / 7.0);
        vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
        gx0 = fract(gx0);
        vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
        vec4 sz0 = step(gz0, vec4(0.0));
        gx0 -= sz0 * (step(0.0, gx0) - 0.5);
        gy0 -= sz0 * (step(0.0, gy0) - 0.5);

        vec4 gx1 = ixy1 * (1.0 / 7.0);
        vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
        gx1 = fract(gx1);
        vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
        vec4 sz1 = step(gz1, vec4(0.0));
        gx1 -= sz1 * (step(0.0, gx1) - 0.5);
        gy1 -= sz1 * (step(0.0, gy1) - 0.5);

        vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
        vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
        vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
        vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
        vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
        vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
        vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
        vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

        vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
        g000 *= norm0.x;
        g010 *= norm0.y;
        g100 *= norm0.z;
        g110 *= norm0.w;
        vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
        g001 *= norm1.x;
        g011 *= norm1.y;
        g101 *= norm1.z;
        g111 *= norm1.w;

        float n000 = dot(g000, Pf0);
        float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
        float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
        float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
        float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
        float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
        float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
        float n111 = dot(g111, Pf1);

        vec3 fade_xyz = fade(Pf0);
        vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
        vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
        float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
        return 2.2 * n_xyz;
      }

      float computeElevation(vec2 pos, float t) {
        float sin1 = sin(radians(pos.x / 128.0 * 90.0));
        vec3 noisePosition = vec3(pos.x, 0.0, pos.y) + vec3(0.0, 0.0, t * -24.0);
        float noise1 = cnoise(noisePosition * 0.07);
        float noise2 = cnoise(noisePosition * 0.05);
        float noise3 = cnoise(noisePosition * 0.35);

        // Continuous rolling terrain across the valley ground (active even at x=0)
        float valleyGround = cnoise(noisePosition * 0.035) * 4.0
                           + cnoise(noisePosition * 0.10) * 2.0
                           + 3.5;

        // Elevated rolling hill ranges flanking left and right
        float mountainHills = (noise1 * 8.0 + noise2 * 6.0 + noise3 * 2.0 + 26.0) * pow(abs(sin1), 1.6);

        return valleyGround + mountainHills;
      }

      void main(void) {
        vec3 updatePosition = (rotateMatrixX(radians(90.0)) * vec4(position, 1.0)).xyz;
        vec2 p = updatePosition.xz;
        float elevation = computeElevation(p, time);
        vec3 lastPosition = updatePosition + vec3(0.0, elevation, 0.0);

        // Smooth analytical surface normal for 3D mountain lighting
        float eps = 1.0;
        float elevX = computeElevation(p + vec2(eps, 0.0), time);
        float elevZ = computeElevation(p + vec2(0.0, eps), time);
        vec3 tangentX = vec3(eps, elevX - elevation, 0.0);
        vec3 tangentZ = vec3(0.0, elevZ - elevation, eps);
        vec3 norm = normalize(cross(tangentZ, tangentX));

        vPosition = lastPosition;
        vElevation = elevation;
        vNormal = norm;
        vSin = abs(sin(radians(updatePosition.x / 128.0 * 90.0)));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(lastPosition, 1.0);
      }
    `;

    // Textured Mountain & Continuous Valley Ground Shader
    // Light, subtle sandstone, pale sage, and soft champagne tints matching the app
    const fragmentShader = `
      precision highp float;
      #define GLSLIFY 1
      uniform float time;
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying float vElevation;
      varying float vSin;

      void main(void) {
        // Distance fade at the edges
        float dist = length(vPosition.xz);
        float edgeFade = smoothstep(185.0, 50.0, dist);

        // Normalized elevation: 0.0 at valley base, 1.0 at highest peaks
        float t = clamp((vElevation - 1.0) / 38.0, 0.0, 1.0);

        // Light, subtle palette tailored to Land Stack design system:
        // Warm Sandstone ground (#F6F3ED) -> Pale Sage Mist (#E6EFE7) -> Celadon Sandstone (#D9E5D9) -> Soft Champagne (#EAE1CF)
        vec3 valleyGround  = vec3(0.965, 0.953, 0.929); // Warm Sandstone ground
        vec3 sageMist      = vec3(0.902, 0.937, 0.906); // Pale Sage Mist
        vec3 celadonSlope  = vec3(0.835, 0.886, 0.839); // Soft Celadon Sandstone
        vec3 champagnePeak = vec3(0.918, 0.882, 0.812); // Luminous Champagne Sandstone

        vec3 terrainColor;
        if (t < 0.25) {
          terrainColor = mix(valleyGround, sageMist, t / 0.25);
        } else if (t < 0.65) {
          terrainColor = mix(sageMist, celadonSlope, (t - 0.25) / 0.40);
        } else {
          terrainColor = mix(celadonSlope, champagnePeak, (t - 0.65) / 0.35);
        }

        // Soft organic topographical relief & terrain texture across entire ground and hills
        float groundTexture = (sin(vPosition.x * 0.10 + vPosition.z * 0.07) * 0.5 + 0.5) * 0.025
                            + (sin(vElevation * 1.3 + vPosition.x * 0.05) * 0.5 + 0.5) * 0.025;
        terrainColor += vec3(groundTexture * 0.6, groundTexture * 0.7, groundTexture * 0.5);

        // High-key soft studio illumination: keeps all terrain bright and readable
        vec3 sunDir = normalize(vec3(0.4, 1.2, 0.5));
        float diffuse = max(dot(vNormal, sunDir), 0.0);
        float lighting = diffuse * 0.12 + 0.88;

        // Subtle warm highlight on crests
        float crestHighlight = pow(max(dot(vNormal, sunDir), 0.0), 6.0) * 0.10 * smoothstep(0.5, 1.0, t);

        vec3 finalColor = terrainColor * lighting + vec3(1.0, 0.96, 0.90) * crestHighlight;

        // Continuous valley floor opacity: visible across entire ground, gently rising on the hills
        float valleyOpacity = 0.42;
        float hillPresence = smoothstep(3.0, 24.0, vElevation) * 0.38;
        float opacity = (valleyOpacity + hillPresence) * edgeFade;

        gl_FragColor = vec4(finalColor, opacity);
      }
    `;

    // Plane class managing the continuous textured ground & mountain surface
    class Plane {
      uniforms: { time: { value: number } };
      mesh: THREE.Mesh;
      geometry: THREE.PlaneGeometry;
      material: THREE.RawShaderMaterial;
      time: number;

      constructor() {
        this.uniforms = {
          time: { value: 0 },
        };
        this.time = speed;

        this.geometry = new THREE.PlaneGeometry(planeSize, planeSize, planeSize, planeSize);

        // Smooth mountain surface with procedural texture and 3D illumination
        this.material = new THREE.RawShaderMaterial({
          uniforms: this.uniforms,
          vertexShader,
          fragmentShader,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
      }

      render(timeDelta: number) {
        this.uniforms.time.value += timeDelta * this.time;
      }

      dispose() {
        this.geometry.dispose();
        this.material.dispose();
      }
    }

    // Three.js setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      10000
    );
    const clock = new THREE.Clock();
    const plane = new Plane();

    const resize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const render = () => {
      plane.render(clock.getDelta());
      renderer.render(scene, camera);
    };

    const renderLoop = () => {
      render();
      animId = requestAnimationFrame(renderLoop);
    };

    const init = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      renderer.setSize(w, h);
      renderer.setClearColor(0x000000, 0);
      camera.position.set(0, 18, cameraZ);
      camera.lookAt(new THREE.Vector3(0, 12, 0));
      scene.add(plane.mesh);
      window.addEventListener('resize', resize);
      resize();
      renderLoop();
    };

    init();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      plane.dispose();
      renderer.dispose();
    };
  }, [cameraZ, planeSize, speed]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', width, height }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          zIndex: 1,
        }}
      />
    </div>
  );
};

export { GLSLHills };
