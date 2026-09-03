"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { soundEngine } from "@/lib/soundEngine";

export type ProductArchetype =
  | "studio_display"
  | "macbook"
  | "watch"
  | "ipad"
  | "capture_card"
  | "calibrator"
  | "generic_gear";

export interface DraftlyLayerInfo {
  id: string;
  depthIndex: number;
  nameEn: string;
  nameFa: string;
  category: "optics" | "display" | "logicboard" | "power" | "audio" | "chassis";
  role: string;
  engineeringHighlight: string;
  metallurgyMaterial: string;
  specifications: Record<string, string>;
  meshZOffset: number;
  meshScale: [number, number, number];
  colorHex: number;
  metalness: number;
  roughness: number;
  transmission?: number;
}

// ۱. تولید بافت پروسیدورال مادربرد با لحیم‌کاری طلایی و مدارات مجتمع
function createProceduralPCBTexture(chipName: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#091c15";
  ctx.fillRect(0, 0, 1024, 1024);

  // خطوط رسانای مدار چاپی طلایی
  ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 1024; i += 40) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(i * 0.8, i);
    ctx.lineTo(i * 0.8 + 80, i + 80);
    ctx.lineTo(1024, i + 80);
    ctx.stroke();
  }

  // چیپست پردازنده مرکزی ۳ نانومتری
  ctx.fillStyle = "#0c111c";
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 4;
  ctx.fillRect(362, 362, 300, 300);
  ctx.strokeRect(362, 362, 300, 300);

  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 32px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("APPLE SILICON", 512, 490);
  ctx.fillStyle = "#34d399";
  ctx.font = "bold 26px monospace";
  ctx.fillText(chipName, 512, 535);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// ۲. تولید بافت پروسیدورال پنل اولد تاندم
function createProceduralOLEDTexture(title: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createRadialGradient(512, 512, 50, 512, 512, 500);
  grad.addColorStop(0, "#0284c7");
  grad.addColorStop(0.5, "#091e3a");
  grad.addColorStop(1, "#020617");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  ctx.strokeStyle = "rgba(56, 189, 248, 0.15)";
  ctx.lineWidth = 1;
  for (let x = 0; x < 1024; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("5K ULTRA RETINA XDR", 512, 480);
  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 24px monospace";
  ctx.fillText(title.slice(0, 30), 512, 530);

  return new THREE.CanvasTexture(canvas);
}

// ۳. تشخیص هوشمند آرکتایپ کالا
export function classifyProductArchetype(title: string, category: string = ""): ProductArchetype {
  const norm = (title + " " + category).toLowerCase();
  if (norm.includes("studio") || norm.includes("display") || norm.includes("xdr") || norm.includes("مانیتور")) return "studio_display";
  if (norm.includes("macbook") || norm.includes("مک‌بوک") || norm.includes("مک بوک") || norm.includes("laptop")) return "macbook";
  if (norm.includes("watch") || norm.includes("ساعت") || norm.includes("ultra")) return "watch";
  if (norm.includes("ipad") || norm.includes("آیپد") || norm.includes("tablet")) return "ipad";
  if (norm.includes("decklink") || norm.includes("کپچر") || norm.includes("blackmagic")) return "capture_card";
  if (norm.includes("calibrite") || norm.includes("کالیبرایت") || norm.includes("sensor")) return "calibrator";
  return "generic_gear";
}

// ۴. تولید پروسیدورال ۶ لایه مهندسی
export function generateDraftlyLayers(archetype: ProductArchetype, title: string): DraftlyLayerInfo[] {
  return [
    {
      id: "layer-1",
      depthIndex: 1,
      nameEn: "Nano-Texture Front Optical Glass",
      nameFa: "شیشه نوری نانوتکستچر با فیلتر پولاریزه آنتی‌رفلکت",
      category: "optics",
      role: "حذف ۹۹.۴٪ بازتاب‌های محیطی و عبور دقیق طیف نور بدون اعوجاج رنگی",
      engineeringHighlight: "حکاکی مستقیم شیشه در مقیاس نانومتری جهت تثبیت کنتراست",
      metallurgyMaterial: "شیشه سیلیکات تقویت‌شده با پوشش اولئوفوبیک",
      specifications: { "ضریب بازتاب": "۰.۲٪", "شفافیت": "۹۸.۶٪", "سختی سطحی": "9H" },
      meshZOffset: 1.8,
      meshScale: [3.4, 2.0, 0.04],
      colorHex: 0x38bdf8,
      metalness: 0.1,
      roughness: 0.08,
      transmission: 0.92,
    },
    {
      id: "layer-2",
      depthIndex: 2,
      nameEn: "5K Retina IPS Precision Active Matrix Panel",
      nameFa: "پنل ۵K رتینا با ماتریس رنگ ۱۰ بیتی و مناطق نوردهی موضعی",
      category: "display",
      role: "تولید تصویر با وضوح ۲۱۸ PPI و پوشش ۹۹٪ گاموت رنگی DCI-P3",
      engineeringHighlight: "کالیبراسیون سخت‌افزاری با جدول رنگ ۳D LUT داخلی",
      metallurgyMaterial: "زیرلایه نیمه‌هادی ایندیوم گالیوم زینک اکسید (IGZO)",
      specifications: { "تراکم": "218 PPI", "تفکیک رنگ": "1.07 میلیارد رنگ", "روشنایی": "600 Nits" },
      meshZOffset: 1.1,
      meshScale: [3.35, 1.95, 0.06],
      colorHex: 0x0284c7,
      metalness: 0.3,
      roughness: 0.2,
    },
    {
      id: "layer-3",
      depthIndex: 3,
      nameEn: "Main Logic Board & Neural Processor Die",
      nameFa: "مادربرد مرکزی ۱۲ لایه با پردازشگر عصبی تصویر (Neural Engine)",
      category: "logicboard",
      role: "مدیریت لحظه‌ای Center Stage، پردازش صدای فراگیر و کنترل تاندربولت",
      engineeringHighlight: "تبدیل بلادرنگ فضای رنگ Rec.709 به Rec.2020 در ۰.۱ میلی‌ثانیه",
      metallurgyMaterial: "فایبرگلاس نظامی FR-4 با روکش طلای غوطه‌ور ENIG",
      specifications: { "پهنای باند": "40Gbps Thunderbolt 3", "تعداد لایه‌ها": "PCB دوازده لایه", "پردازنده": "Neural Display Core" },
      meshZOffset: 0.4,
      meshScale: [2.8, 1.4, 0.08],
      colorHex: 0x047857,
      metalness: 0.8,
      roughness: 0.3,
    },
    {
      id: "layer-4",
      depthIndex: 4,
      nameEn: "Integrated GaN High-Efficiency Power Subsystem",
      nameFa: "ماژول تغذیه یکپارچه نیترید گالیوم و هیت‌پایپ‌های مسی خنک‌کاری",
      category: "power",
      role: "تامین ولتاژ پایدار ۲۴۰ وات با راندمان ۹۶٪ و شارژ همزمان مک‌بوک",
      engineeringHighlight: "کاهش ۶۰ درصدی ابعاد نسبت به منابع تغذیه متداول",
      metallurgyMaterial: "نیمه‌هادی‌های GaNFast با خازن‌های جامد ژاپنی و مس C1100",
      specifications: { "توان خروجی": "240W پیوسته", "شارژ تاندربولت": "96W Power Delivery", "راندمان": "96%" },
      meshZOffset: -0.3,
      meshScale: [2.2, 0.9, 0.12],
      colorHex: 0xd97706,
      metalness: 0.75,
      roughness: 0.35,
    },
    {
      id: "layer-5",
      depthIndex: 5,
      nameEn: "Six-Speaker Acoustic Chamber with Force-Cancelling",
      nameFa: "محفظه آکوستیک استودیویی با ۶ اسپیکر لغوکننده لرزش",
      category: "audio",
      role: "تولید صدای سه‌بعدی Dolby Atmos بدون انتقال کوچک‌ترین ارتعاش به پنل",
      engineeringHighlight: "چیدمان متقارن جفت درایورها جهت خنثی‌سازی کامل گشتاور مکانیکی",
      metallurgyMaterial: "محفظه رزین کربن فشرده با مگنت‌های نئودیمیوم N52",
      specifications: { "تعداد درایور": "۴ ووفر + ۲ توییتر", "فرکانس": "45Hz تا 22kHz", "پشتیبانی": "Spatial Audio" },
      meshZOffset: -1.0,
      meshScale: [3.1, 0.7, 0.15],
      colorHex: 0x4f46e5,
      metalness: 0.5,
      roughness: 0.5,
    },
    {
      id: "layer-6",
      depthIndex: 6,
      nameEn: "Unibody CNC Billet Aluminum Structural Chassis",
      nameFa: "شاسی یکپارچه آلومینیوم سری ۶۰۰۰ با شبکه خنک‌کاری Laminar",
      category: "chassis",
      role: "پایداری ساختار فیزیکی، جذب نویز الکترومغناطیسی و تخلیه یکنواخت گرما",
      engineeringHighlight: "تراشکاری تمام اتوماتیک ۵ محوره CNC با خطای کمتر از ۰.۰۱ میلی‌متر",
      metallurgyMaterial: "آلومینیوم هوافضایی گرید ۶۰۶۳-T6 بازیافتی ۱۰۰٪",
      specifications: { "روش ساخت": "5-Axis CNC Milling", "دفع حرارت": "تا 70W بدون فن", "آلیاژ": "Alloy 6063-T6" },
      meshZOffset: -1.7,
      meshScale: [3.45, 2.05, 0.18],
      colorHex: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.2,
    },
  ];
}

interface DraftlyTeardownProps {
  productTitle: string;
  productCategory?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DraftlyProceduralTeardown({
  productTitle,
  productCategory = "",
  isOpen,
  onClose,
}: DraftlyTeardownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [explosionDistance, setExplosionDistance] = useState<number>(65);
  const [selectedLayer, setSelectedLayer] = useState<DraftlyLayerInfo | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [lightPreset, setLightPreset] = useState<"studio" | "cyber" | "blueprint">("studio");

  const archetype = classifyProductArchetype(productTitle, productCategory);
  const layers = generateDraftlyLayers(archetype, productTitle);

  const meshesRef = useRef<THREE.Mesh[]>([]);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);

  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0.35, y: -0.65 });

  useEffect(() => {
    if (!isOpen) return;
    setSelectedLayer(layers[0]);
    setExplosionDistance(0);
    soundEngine.playExplodeShift(1.2);
    const t = setTimeout(() => setExplosionDistance(65), 150);
    return () => clearTimeout(t);
  }, [isOpen, productTitle]);

  useEffect(() => {
    if (!isOpen) return;
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 7.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const mainSpot = new THREE.SpotLight(0x0284c7, 18, 30, Math.PI / 3, 0.5);
    mainSpot.position.set(6, 8, 6);
    scene.add(mainSpot);

    const rimCyan = new THREE.PointLight(0x38bdf8, 12, 25);
    rimCyan.position.set(-6, -4, 4);
    scene.add(rimCyan);

    const mainGroup = new THREE.Group();
    groupRef.current = mainGroup;
    scene.add(mainGroup);

    // تولید بافت‌های اختصاصی Draftly
    const pcbTexture = createProceduralPCBTexture("M4 MAX DIE");
    const oledTexture = createProceduralOLEDTexture(productTitle);

    meshesRef.current = [];
    layers.forEach((layer) => {
      const geo = new THREE.BoxGeometry(
        layer.meshScale[0],
        layer.meshScale[1],
        layer.meshScale[2]
      );

      let mat: THREE.Material;

      if (layer.category === "logicboard") {
        mat = new THREE.MeshStandardMaterial({
          map: pcbTexture,
          metalness: 0.8,
          roughness: 0.3,
        });
      } else if (layer.category === "display") {
        mat = new THREE.MeshStandardMaterial({
          map: oledTexture,
          metalness: 0.2,
          roughness: 0.2,
          emissive: 0x0284c7,
          emissiveIntensity: 0.15,
        });
      } else {
        mat = new THREE.MeshPhysicalMaterial({
          color: layer.colorHex,
          metalness: layer.metalness,
          roughness: layer.roughness,
          transmission: layer.transmission || 0,
          ior: 1.5,
          transparent: Boolean(layer.transmission),
          opacity: layer.transmission ? 0.75 : 1.0,
          clearcoat: 0.85,
          clearcoatRoughness: 0.08,
        });
      }

      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { layerId: layer.id, baseZ: layer.meshZOffset };
      mesh.position.set(0, 0, layer.meshZOffset);

      const edges = new THREE.EdgesGeometry(geo);
      const lineMat = new THREE.LineBasicMaterial({
        color: layer.colorHex,
        transparent: true,
        opacity: 0.45,
      });
      const wireframe = new THREE.LineSegments(edges, lineMat);
      mesh.add(wireframe);

      mainGroup.add(mesh);
      meshesRef.current.push(mesh);
    });

    const handlePointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      setAutoRotate(false);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - lastMousePosRef.current.x;
      const deltaY = e.clientY - lastMousePosRef.current.y;
      rotationRef.current.y += deltaX * 0.008;
      rotationRef.current.x = Math.max(-1.0, Math.min(1.2, rotationRef.current.x - deltaY * 0.008));
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    container.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (autoRotate) {
        rotationRef.current.y += 0.005;
      }

      if (mainGroup) {
        mainGroup.rotation.x = rotationRef.current.x;
        mainGroup.rotation.y = rotationRef.current.y;
      }

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
      container.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);

      meshesRef.current.forEach((m) => {
        m.geometry.dispose();
        if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
        else m.material.dispose();
      });

      pcbTexture.dispose();
      oledTexture.dispose();
      renderer.dispose();

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isOpen, productTitle]);

  useEffect(() => {
    const factor = explosionDistance / 50;
    meshesRef.current.forEach((mesh) => {
      const baseZ = mesh.userData.baseZ || 0;
      mesh.position.z = baseZ * factor;
    });
  }, [explosionDistance]);

  const handleSelectLayer = (layer: DraftlyLayerInfo) => {
    soundEngine.playExplodeShift(layer.depthIndex * 0.35);
    setSelectedLayer(layer);

    meshesRef.current.forEach((mesh) => {
      const isTarget = mesh.userData.layerId === layer.id;
      const mat = mesh.material as any;
      if (mat.emissive) {
        if (isTarget) {
          mat.emissive.setHex(0x0284c7);
          mat.emissiveIntensity = 0.6;
          mesh.scale.set(1.06, 1.06, 1.06);
        } else {
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
          mesh.scale.set(1.0, 1.0, 1.0);
        }
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-950/95 backdrop-blur-3xl font-sans select-none animate-fadeIn text-slate-100"
      dir="rtl"
    >
      <div className="relative w-full max-w-7xl h-[92vh] max-h-[860px] bg-slate-900/95 border border-slate-700/60 rounded-[2.8rem] shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col justify-between overflow-hidden backdrop-blur-3xl">
        
        <header className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/40 text-white flex items-center justify-center text-xl shadow-lg shadow-blue-500/30 animate-pulse">
              🧬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-white">
                  موتور کالبدشکافی هوشمند ۳D آکسون (Draftly Autonomous 3D Teardown)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-[10px]">
                  PBR Shaders Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                تشخیص هوشمند آرکتایپ: <strong className="text-blue-400 font-mono uppercase">{archetype}</strong> | کالا: <strong className="text-white">{productTitle}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                soundEngine.playClick();
                setAutoRotate(!autoRotate);
              }}
              className={
                "px-4 py-2.5 rounded-2xl text-xs font-bold transition border cursor-pointer flex items-center gap-1.5 " +
                (autoRotate
                  ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white")
              }
            >
              <span>{autoRotate ? "توقف چرخش ⏸️" : "چرخش ۳۶۰ درجه ▶️"}</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-rose-600 hover:text-white border border-slate-700 flex items-center justify-center text-sm font-black transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          <div
            ref={containerRef}
            className="md:col-span-8 h-[380px] md:h-full relative flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden bg-radial from-blue-950/40 via-slate-950 to-slate-950 border-b md:border-b-0 md:border-l border-slate-800/80 touch-none"
          >
            <div className="absolute top-4 right-4 z-20 bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-xl text-[10px] font-mono text-slate-400 backdrop-blur-md">
              🖱️ درگ کنید تا زاویه چرخش تغییر کند
            </div>

            <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 bg-slate-950/90 border border-slate-800 p-4 rounded-3xl backdrop-blur-2xl space-y-2 z-30 sm:w-80 shadow-2xl">
              <div className="flex justify-between items-center text-xs">
                <span className="font-black text-white flex items-center gap-1.5">
                  <span>💥</span><span>انفصال و بازسازی سه‌بعدی:</span>
                </span>
                <span className="font-mono font-black text-blue-400 text-sm">
                  {explosionDistance}٪
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={explosionDistance}
                onChange={(e) => {
                  setExplosionDistance(Number(e.target.value));
                  soundEngine.playExplodeShift(Number(e.target.value) / 100);
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          <div className="md:col-span-4 p-4 sm:p-6 space-y-4 overflow-y-auto bg-slate-950/70 flex flex-col justify-between text-xs">
            
            <div className="space-y-2">
              <span className="font-bold text-slate-400 text-[11px] block">لایه‌های ساختاری تفکیک‌شده:</span>
              <div className="grid grid-cols-2 gap-1.5">
                {layers.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => handleSelectLayer(l)}
                    className={
                      "p-2.5 rounded-xl border text-right transition cursor-pointer flex items-center gap-2 " +
                      (selectedLayer?.id === l.id
                        ? "bg-blue-600/20 border-blue-500 text-white font-black shadow-md"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white")
                    }
                  >
                    <span className="w-5 h-5 rounded-lg bg-black/40 flex items-center justify-center font-mono text-[10px] text-blue-400 font-bold">
                      {l.depthIndex}
                    </span>
                    <span className="truncate text-[11px]">{l.nameFa}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedLayer ? (
              <div className="space-y-3.5 border-t border-slate-800/80 pt-3">
                <div className="space-y-1 border-b border-slate-800 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-black">
                      لایه {selectedLayer.depthIndex} از {layers.length}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px] uppercase">
                      {selectedLayer.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white leading-snug">{selectedLayer.nameFa}</h4>
                  <p className="text-slate-400 font-mono text-[10px]">{selectedLayer.nameEn}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="font-black text-blue-400 block text-[11px]">🎯 نقش کلیدی در معماری:</span>
                  <p className="text-slate-300 leading-relaxed font-medium text-[11px]">{selectedLayer.role}</p>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                  <span className="font-black text-emerald-400 block text-[11px]">💡 نوآوری و هایلایت مهندسی:</span>
                  <p className="text-emerald-300 leading-relaxed font-medium text-[11px]">{selectedLayer.engineeringHighlight}</p>
                </div>

                <div className="space-y-1.5">
                  <span className="font-black text-slate-300 block text-[11px]">⚙️ مشخصات فنی و متالورژی:</span>
                  <div className="space-y-1">
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">متریال ساخت:</span>
                      <span className="font-bold text-slate-200">{selectedLayer.metallurgyMaterial}</span>
                    </div>
                    {Object.entries(selectedLayer.specifications || {}).map(([k, v]) => (
                      <div key={k} className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">{k}:</span>
                        <span className="font-mono font-bold text-blue-400">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
              <span>امتیاز مهندسی ماژولار:</span>
              <span className="font-mono font-black text-emerald-400 text-sm">10 / 10 Apple Tier</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
