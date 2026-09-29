import { useEffect, useRef } from "react"
import * as THREE from "three"

/**
 * Living Topographic Elevation & Contour Waves Mesh Shader.
 * Renders real-time cartographic elevation contours and gentle domain-warped terrain waves
 * in warm sandstone (#F5F2EB), rich golden amber (#D1A654), and heritage forest green (#183B2B).
 * Subtly deflects around the user's cursor while ensuring 100% legibility under hero typography.
 */
export function ShaderAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    camera: THREE.Camera
    scene: THREE.Scene
    renderer: THREE.WebGLRenderer
    uniforms: {
      time: { value: number }
      resolution: { value: THREE.Vector2 }
      mouse: { value: THREE.Vector2 }
    }
    animationId: number
  } | null>(null)

  const mousePos = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    const vertexShader = `
      void main() {
        gl_Position = vec4( position, 1.0 );
      }
    `

    const fragmentShader = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform vec2 mouse;

      // 2D pseudo-random hash
      vec2 hash(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
      }

      // Quintic Hermite interpolated gradient noise
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
        return mix(mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                       dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
                   mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                       dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
      }

      // 4-octave Fractional Brownian Motion (FBM) with rotation
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.52;
        mat2 rot = mat2(0.877, 0.479, -0.479, 0.877);
        for (int i = 0; i < 4; ++i) {
          v += a * noise(p);
          p = rot * p * 2.02 + vec2(100.0);
          a *= 0.49;
        }
        return v;
      }

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float t = time * 0.038;

        // Interactive mouse deflection: gentle terrain elevation swell near cursor
        float dMouse = length(uv - mouse);
        vec2 p = uv * 1.65;
        p += (uv - mouse) * exp(-dMouse * 3.2) * 0.18;

        // Multi-stage domain warping for natural geomorphology & river valley contours
        vec2 q = vec2(
          fbm(p + vec2(0.0, 0.0) + vec2(t * 0.28, t * 0.16)),
          fbm(p + vec2(5.2, 1.3) + vec2(t * -0.20, t * 0.24))
        );

        vec2 r = vec2(
          fbm(p + 3.0 * q + vec2(1.7, 9.2) + vec2(t * 0.12, t * -0.08)),
          fbm(p + 3.0 * q + vec2(8.3, 2.8) + vec2(t * -0.10, t * 0.14))
        );

        float elevation = fbm(p + 3.4 * r);
        float h = elevation * 0.5 + 0.5;

        // Topographic Contour Lines
        float contourFreq = 16.0;
        float contourVal = h * contourFreq;
        float fracVal = abs(fract(contourVal) - 0.5);

        // Minor contour lines: crisp, anti-aliased
        float minorLine = smoothstep(0.08, 0.004, fracVal);

        // Major index contours (every 4th line): bolder with luminous specular sheen
        float majorContourVal = h * (contourFreq / 4.0);
        float majorFrac = abs(fract(majorContourVal) - 0.5);
        float majorLine = smoothstep(0.10, 0.005, majorFrac);

        // Palette: Warm Sandstone substrate, Golden Amber crests, Heritage Forest depth
        vec3 sandstone = vec3(0.96, 0.95, 0.92);      // #F5F2EB
        vec3 sageLowland = vec3(0.86, 0.91, 0.88);     // subtle sage
        vec3 goldenAmber = vec3(0.82, 0.65, 0.33);     // #D1A654
        vec3 forestGreen = vec3(0.10, 0.26, 0.18);     // #183B2B
        vec3 specularChampagne = vec3(0.99, 0.95, 0.82); // luminous crest

        // Soft elevation-based hypsometric tinting
        vec3 terrainColor = mix(sandstone, sageLowland, smoothstep(0.20, 0.55, h));
        terrainColor = mix(terrainColor, goldenAmber, smoothstep(0.45, 0.85, h) * 0.40);

        // Subtle topographic hillshade
        float hillshade = clamp(0.80 + 0.30 * (q.x - r.y), 0.60, 1.15);
        terrainColor *= hillshade;

        // Composite contours
        vec3 minorLineColor = mix(goldenAmber, forestGreen, 0.40);
        vec3 finalColor = mix(terrainColor, minorLineColor, minorLine * 0.60);
        finalColor = mix(finalColor, specularChampagne, majorLine * 0.85);

        // Luminous alpha curve ensuring complete foreground legibility
        float lineAlpha = minorLine * 0.32 + majorLine * 0.52;
        float ridgeAlpha = smoothstep(0.38, 0.85, h) * 0.15;
        float alpha = clamp(lineAlpha + ridgeAlpha, 0.0, 0.72);

        // Soft radial vignette to fade contours seamlessly at screen edges
        float vignette = smoothstep(1.85, 0.60, length(uv * vec2(0.85, 1.0)));
        alpha *= vignette;

        gl_FragColor = vec4(finalColor, alpha);
      }
    `

    const camera = new THREE.Camera()
    camera.position.z = 1

    const scene = new THREE.Scene()
    const geometry = new THREE.PlaneGeometry(2, 2)

    const uniforms = {
      time: { value: 1.0 },
      resolution: { value: new THREE.Vector2() },
      mouse: { value: new THREE.Vector2(0, 0) },
    }

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
    })

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    const onWindowResize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      renderer.setSize(width, height)
      uniforms.resolution.value.x = renderer.domElement.width
      uniforms.resolution.value.y = renderer.domElement.height
    }

    onWindowResize()
    window.addEventListener("resize", onWindowResize, false)

    const handlePointerMove = (e: PointerEvent) => {
      if (!container) return
      const rect = container.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const x = ((e.clientX - rect.left) * 2.0 - rect.width) / Math.min(rect.width, rect.height)
      const y = -((e.clientY - rect.top) * 2.0 - rect.height) / Math.min(rect.width, rect.height)
      mousePos.current.targetX = x
      mousePos.current.targetY = y
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true })

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const animate = () => {
      const animationId = requestAnimationFrame(animate)

      if (!prefersReducedMotion) {
        uniforms.time.value += 0.035
      }

      // Smooth mouse lerping
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.06
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.06
      uniforms.mouse.value.set(mousePos.current.x, mousePos.current.y)

      renderer.render(scene, camera)

      if (sceneRef.current) {
        sceneRef.current.animationId = animationId
      }
    }

    sceneRef.current = { camera, scene, renderer, uniforms, animationId: 0 }
    animate()

    return () => {
      window.removeEventListener("resize", onWindowResize)
      window.removeEventListener("pointermove", handlePointerMove)

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

  return <div ref={containerRef} className="absolute inset-0 -z-10 h-full w-full overflow-hidden" />
}
