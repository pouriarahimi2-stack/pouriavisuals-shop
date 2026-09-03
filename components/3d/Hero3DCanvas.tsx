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

    // ۱. ایجاد صحنه، دوربین و رندرر WebGL
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // ۲. سیستم نورپردازی استودیویی ۳ گانه (Apple Studio Lighting Rig)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keySpot = new THREE.SpotLight(0x0284c7, 18, 30, Math.PI / 3, 0.4);
    keySpot.position.set(6, 6, 6);
    scene.add(keySpot);

    const fillCyan = new THREE.PointLight(0x38bdf8, 12, 25);
    fillCyan.position.set(-6, -3, 4);
    scene.add(fillCyan);

    const rimIndigo = new THREE.DirectionalLight(0x818cf8, 5);
    rimIndigo.position.set(0, 8, -5);
    scene.add(rimIndigo);

    // ۳. هسته اپتیکال شیشه‌ای مواج (Procedural Quantum Glass Core)
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    const coreGeo = new THREE.IcosahedronGeometry(1.65, 4);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      emissive: 0x071529,
      roughness: 0.08,
      metalness: 0.1,
      transmission: 0.92,
      ior: 1.52,
      thickness: 1.6,
      specularIntensity: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    // وایرفریم نئونی هندسی
    const wireGeo = new THREE.IcosahedronGeometry(1.67, 2);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    coreGroup.add(wireMesh);

    // ۴. حلقه‌های تیتانیومی مداری (Orbital Gyro Rings)
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.85,
      roughness: 0.15,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    });
    const ringGeo1 = new THREE.TorusGeometry(2.4, 0.025, 16, 120);
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    scene.add(ring1);

    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      metalness: 0.9,
      roughness: 0.25,
      transparent: true,
      opacity: 0.45,
    });
    const ringGeo2 = new THREE.TorusGeometry(2.85, 0.02, 16, 120);
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    scene.add(ring2);

    // ۵. ماتریس ذرات درخشان موجی (Quantum Particle Field)
    const particleCount = 200;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 14;
      particlePositions[i + 1] = (Math.random() - 0.5) * 9;
      particlePositions[i + 2] = (Math.random() - 0.5) * 7;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.045,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ۶. رهگیری لمس و حرکت ماوس با اینرسی نرم (Parallax Tilt)
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

    // ۷. حلقه رندرینگ ۶۰ تا ۱۲۰ فریم
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      coreMesh.rotation.y = elapsedTime * 0.28;
      coreMesh.rotation.x = Math.sin(elapsedTime * 0.2) * 0.25;
      wireMesh.rotation.y = -elapsedTime * 0.32;
      wireMesh.rotation.z = elapsedTime * 0.18;

      ring1.rotation.z = elapsedTime * 0.22;
      ring1.rotation.y = Math.sin(elapsedTime * 0.3) * 0.45;

      ring2.rotation.x = -elapsedTime * 0.18;
      ring2.rotation.z = Math.cos(elapsedTime * 0.25) * 0.35;

      particles.rotation.y = elapsedTime * 0.06;

      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      coreGroup.rotation.y = targetX * 0.6;
      coreGroup.rotation.x = -targetY * 0.6;
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
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
      style={{ opacity: 0.9 }}
    />
  );
}
