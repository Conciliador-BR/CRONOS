"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  applyOffset,
  DEFAULT_SEQUENCE,
  fragmentShader,
  getBoxPositions,
  getOrderedDelays,
  getScatteredPositions,
  getSphereDestinations,
  getTextPositions,
  getTorusPositions,
  vertexShader,
  type MagicDustProps,
} from "./magic-dust-geometry";

export function MagicDustCore({
  sequence = DEFAULT_SEQUENCE,
  particleCount = 10000,
  particleColor = "#ffffff",
  particleSize = 0.02,
  fontFamily = "sans-serif",
  holdDuration = 3.0,
  animationSpeed = 1.0,
  scatterRadius = 12,
}: MagicDustProps) {
  const colorObj = useState(() => new THREE.Color(particleColor))[0];

  const [{ origin, targets, sizes }] = useState(() => {
    const origin = getScatteredPositions(particleCount, scatterRadius);

    const sizes = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      sizes[i] = Math.random() * 0.8 + 0.4;
    }

    const targets = [];

    for (const item of sequence) {
      let dest: Float32Array;
      let isText = false;

      if (item.type === "text") {
        dest = getTextPositions(item.text, particleCount, 12, fontFamily);
        isText = true;
      } else {
        if (item.shape === "torus") dest = getTorusPositions(particleCount, 2.0);
        else if (item.shape === "sphere") dest = getSphereDestinations(particleCount, 4);
        else dest = getBoxPositions(particleCount, 5);
      }

      if (item.offset) {
        dest = applyOffset(dest, item.offset[0], item.offset[1], item.offset[2]);
      }

      targets.push({
        dest,
        delays: getOrderedDelays(dest, particleCount),
        isText,
      });
    }

    return { origin, targets, sizes };
  });

  const matRef = useRef<THREE.ShaderMaterial>(null);
  const geoRef = useRef<THREE.BufferGeometry>(null);
  const pointsGroupRef = useRef<THREE.Points>(null);

  const currentProgress = useRef(0);
  const targetProgress = useRef(0);
  const currentTargetIndex = useRef(0);

  const phase = useRef<"CONSTRUCTING" | "HOLDING" | "DECONSTRUCTING">("CONSTRUCTING");
  const timer = useRef(0);

  useFrame((state, delta) => {
    if (phase.current === "CONSTRUCTING") {
      targetProgress.current = Math.min(1.5, targetProgress.current + delta * 0.4 * animationSpeed);
      if (targetProgress.current === 1.5) {
        phase.current = "HOLDING";
        timer.current = 0;
      }
    } else if (phase.current === "HOLDING") {
      timer.current += delta;
      if (timer.current > holdDuration) {
        phase.current = "DECONSTRUCTING";
      }
    } else if (phase.current === "DECONSTRUCTING") {
      targetProgress.current = Math.max(0.0, targetProgress.current - delta * 0.6 * animationSpeed);
      if (targetProgress.current === 0.0) {
        const nextTarget = (currentTargetIndex.current + 1) % targets.length;
        currentTargetIndex.current = nextTarget;

        if (geoRef.current) {
          const targetData = targets[nextTarget];
          const targetAttr = geoRef.current.attributes.aTarget as THREE.BufferAttribute;
          const delayAttr = geoRef.current.attributes.aDelay as THREE.BufferAttribute;

          targetAttr.array.set(targetData.dest);
          targetAttr.needsUpdate = true;

          delayAttr.array.set(targetData.delays);
          delayAttr.needsUpdate = true;
        }

        phase.current = "CONSTRUCTING";
      }
    }

    currentProgress.current += (targetProgress.current - currentProgress.current) * 0.1;

    if (matRef.current) {
      matRef.current.uniforms.uProgress.value = currentProgress.current;
      matRef.current.uniforms.uSize.value = Math.min(window.innerWidth, window.innerHeight) * particleSize;
    }

    if (pointsGroupRef.current) {
      // Responsivo: mantém o conjunto dentro da tela segundo as unidades 3D.
      const maxComponentWidth = 15.0; // Largura máxima aproximada dos textos + offset.
      const scale = Math.min(1.0, state.viewport.width / maxComponentWidth);
      pointsGroupRef.current.scale.set(scale, scale, scale);

      const currentTarget = targets[currentTargetIndex.current];
      const currentY = pointsGroupRef.current.rotation.y;

      if (currentTarget.isText) {
        const targetY = Math.round(currentY / (Math.PI * 2)) * (Math.PI * 2);
        pointsGroupRef.current.rotation.y += (targetY - currentY) * 0.08;
      } else {
        pointsGroupRef.current.rotation.y += delta * 0.15;
      }

      pointsGroupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  if (!origin.length || !targets.length) return null;

  return (
    <points ref={pointsGroupRef}>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="attributes-position" args={[origin, 3]} />
        <bufferAttribute attach="attributes-aTarget" args={[targets[0].dest, 3]} />
        <bufferAttribute attach="attributes-aDelay" args={[targets[0].delays, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uProgress: { value: 0 },
          uSize: { value: 10.0 },
          uColor: { value: colorObj },
        }}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function MagicDust(props: MagicDustProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Respeita movimento reduzido: não anima nem monta o canvas.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!mounted) return null;

  return (
    <Canvas camera={{ position: [0, 0, 9], fov: 45 }} dpr={[1, 2]}>
      <MagicDustCore {...props} />
    </Canvas>
  );
}

export default MagicDust;
