import { useEffect, useRef } from "react"
import * as THREE from "three"

/**
 * 21st.dev "Shader Lines" Caustic Ripples Animation.
 * Features:
 * - Concentric expanding ripple loops with 45-degree caustic slats
 * - Rich warm amber & golden bronze body (#C7994D / #E0BD6B)
 * - Luminous champagne shine highlights (#FFF5D1)
 * - Subtle trailing ribbon drop-shadows for 3D depth
 * - Alpha compositing seamlessly over the warm sandstone canvas
 */
export function ShaderAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    camera: THREE.Camera
    scene: THREE.Scene
    renderer: THREE.WebGLRenderer
    uniforms: any
    animationId: number
  } | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    const vertexShader = `
      void main() {
        gl_Position = vec4( position, 1.0 );
      }
    `

    const fragmentShader = `
      #define TWO_PI 6.2831853072
      #define PI 3.14159265359

      precision highp float;
      uniform vec2 resolution;
      uniform float time;

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float t = time * 0.048;
        float lineWidth = 0.0028;

        vec3 glowAcc = vec3(0.0);
        float shineAcc = 0.0;
        float shadowAcc = 0.0;

        for(int j = 0; j < 3; j++){
          for(int i = 0; i < 5; i++){
            // Wave distance calculation maintaining the exact ripple & slat geometry
            float wavePhase = fract(t - 0.012 * float(j) + float(i) * 0.01) * 4.5 - length(uv) + mod(uv.x + uv.y, 0.2);
            float dist = abs(wavePhase);

            // 1. Broad soft ambient golden glow
            glowAcc[j] += lineWidth * float(i * i) / (dist + 0.001);

            // 2. Specular shine: concentrated brilliant crest gleam
            float crest = max(1.0 - dist * 15.0, 0.0);
            shineAcc += pow(crest, 3.5) * float(i + 1) * 0.12;

            // 3. Subtle trailing drop-shadow giving 3D ribbon depth
            if (wavePhase < 0.0 && wavePhase > -0.25) {
              shadowAcc += smoothstep(0.0, -0.06, wavePhase) * smoothstep(-0.25, -0.09, wavePhase) * 0.14;
            }
          }
        }

        // Palette definitions:
        vec3 shadowColor = vec3(0.65, 0.54, 0.40); // soft warm cast shadow (#A68A66)
        vec3 bodyBronze  = vec3(0.78, 0.60, 0.30); // warm amber bronze (#C7994D)
        vec3 bodyGold    = vec3(0.88, 0.74, 0.42); // radiant warm gold (#E0BD6B)
        vec3 shineColor  = vec3(1.00, 0.96, 0.82); // luminous champagne shine (#FFF5D1)

        float totalGlow = glowAcc[0] + glowAcc[1] + glowAcc[2];
        vec3 goldenBody = (glowAcc[0] * bodyBronze + glowAcc[1] * bodyGold + glowAcc[2] * bodyGold) / max(totalGlow, 0.001);

        // Normalize intensities
        float glowIntensity   = smoothstep(0.08, 0.95, totalGlow * 0.40);
        float shineIntensity  = clamp(shineAcc * 0.80, 0.0, 0.95);
        float shadowIntensity = clamp(shadowAcc, 0.0, 0.45);

        // Composite: warm golden body -> blend subtle shadow -> overlay specular shine
        vec3 color = goldenBody;
        color = mix(color, shadowColor, shadowIntensity * 0.60);
        color = mix(color, shineColor, shineIntensity * 0.75);

        // Compute alpha for natural WebGL compositing over the warm sandstone canvas
        float alpha = clamp(max(glowIntensity * 0.65 + shineIntensity * 0.85, shadowIntensity * 0.55), 0.0, 0.85);

        gl_FragColor = vec4(color, alpha);
      }
    `

    const camera = new THREE.Camera()
    camera.position.z = 1

    const scene = new THREE.Scene()
    const geometry = new THREE.PlaneGeometry(2, 2)

    const uniforms = {
      time: { type: "f", value: 1.0 },
      resolution: { type: "v2", value: new THREE.Vector2() },
    }

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
    })

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.style.position = "absolute"
    renderer.domElement.style.inset = "0"
    renderer.domElement.style.width = "100%"
    renderer.domElement.style.height = "100%"
    renderer.domElement.style.pointerEvents = "none"
    container.appendChild(renderer.domElement)

    const onWindowResize = () => {
      const width = container.clientWidth || window.innerWidth
      const height = container.clientHeight || window.innerHeight
      renderer.setSize(width, height)
      uniforms.resolution.value.x = renderer.domElement.width
      uniforms.resolution.value.y = renderer.domElement.height
    }

    onWindowResize()
    window.addEventListener("resize", onWindowResize, false)

    // Also trigger resize check after layout settles
    const resizeTimer = setTimeout(onWindowResize, 100)

    const animate = () => {
      const animationId = requestAnimationFrame(animate)
      uniforms.time.value += 0.045
      renderer.render(scene, camera)

      if (sceneRef.current) {
        sceneRef.current.animationId = animationId
      }
    }

    sceneRef.current = { camera, scene, renderer, uniforms, animationId: 0 }
    animate()

    return () => {
      clearTimeout(resizeTimer)
      window.removeEventListener("resize", onWindowResize)

      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId)
        if (container && sceneRef.current.renderer.domElement) {
          container.removeChild(sceneRef.current.renderer.domElement)
        }
        sceneRef.current.renderer.dispose()
        geometry.dispose()
        material.dispose()
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 h-full w-full overflow-hidden pointer-events-none"
    />
  )
}
