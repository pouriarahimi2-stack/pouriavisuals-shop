"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function Hero3DCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const container = containerRef.current;
    if (!container) return;

    // ۱. ساخت صحنه و رندرر WebGL
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 6.2);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    container.appendChild(renderer.domElement);

    // ۲. نورپردازی استودیویی اپل (Studio Lighting Rig)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const keySpot = new THREE.SpotLight(0x0284c7, 24, 35, Math.PI / 3, 0.4);
    keySpot.position.set(6, 6, 6);
    scene.add(keySpot);

    const fillCyan = new THREE.PointLight(0x38bdf8, 16, 25);
    fillCyan.position.set(-6, -3, 4);
    scene.add(fillCyan);

    const rimLight = new THREE.DirectionalLight(0x818cf8, 6);
    rimLight.position.set(0, 8, -5);
    scene.add(rimLight);

    // ۳. گروه اصلی هسته سه‌بعدی (3D Core Group)
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // کره شیشه‌ای شکست نور کوانتومی (Optical Glass Icosahedron)
    const coreGeo = new THREE.IcosahedronGeometry(1.65, 4);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      emissive: 0x071529,
      emissiveIntensity: 0.4,
      roughness: 0.08,
      metalness: 0.15,
      transmission: 0.9,
      ior: 1.52,
      thickness: 1.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    // وایرفریم نئونی هندسی
    const wireGeo = new THREE.IcosahedronGeometry(1.68, 2);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    coreGroup.add(wireMesh);

    // ۴. حلقه‌های تیتانیومی مداری چرخشی (Orbital Gyro Rings)
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.1,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });
    const ringGeo1 = new THREE.TorusGeometry(2.35, 0.03, 16, 120);
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    scene.add(ring1);

    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      metalness: 0.95,
      roughness: 0.2,
      transparent: true,
      opacity: 0.5,
    });
    const ringGeo2 = new THREE.TorusGeometry(2.75, 0.025, 16, 120);
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    scene.add(ring2);

    // ۵. ماتریس ذرات نئونی معلق (Quantum Particle Matrix)
    const particleCount = 180;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 12;
      particlePositions[i + 1] = (Math.random() - 0.5) * 8;
      particlePositions[i + 2] = (Math.random() - 0.5) * 6;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ۶. رهگیری تعاملی حرکت ماوس و لمس
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      mouseX = (x / rect.width) * 2;
      mouseY = -(y / rect.height) * 2;
    };

    window.addEventListener("pointermove", handlePointerMove);

    // ۷. حلقه رندرینگ ۶۰ فریم
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      coreMesh.rotation.y = elapsedTime * 0.3;
      coreMesh.rotation.x = Math.sin(elapsedTime * 0.25) * 0.25;
      wireMesh.rotation.y = -elapsedTime * 0.35;
      wireMesh.rotation.z = elapsedTime * 0.2;

      ring1.rotation.z = elapsedTime * 0.25;
      ring1.rotation.y = Math.sin(elapsedTime * 0.35) * 0.5;

      ring2.rotation.x = -elapsedTime * 0.2;
      ring2.rotation.z = Math.cos(elapsedTime * 0.3) * 0.4;

      particles.rotation.y = elapsedTime * 0.08;

      targetX += (mouseX - targetX) * 0.06;
      targetY += (mouseY - targetY) * 0.06;

      coreGroup.rotation.y = targetX * 0.7;
      coreGroup.rotation.x = -targetY * 0.7;
      camera.position.x = targetX * 0.35;
      camera.position.y = targetY * 0.35;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      coreGeo.dispose();
      coreMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[300px] sm:min-h-[360px] relative flex items-center justify-center select-none"
    />
  );
}
