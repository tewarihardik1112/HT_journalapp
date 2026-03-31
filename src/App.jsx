import { useState, useEffect, useRef } from "react";

/* ─── palette & constants ─── */
const TEAL = "#2dd4bf";
const MINT = "#6ee7b7";
const AMBER = "#f59e0b";
const BLUE = "#3b82f6";
const BG = "#09090b";

/* ─── reusable hooks ─── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
}

function useMouseParallax(factor = 0.02) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      setOffset({
        x: (e.clientX - cx) * factor,
        y: (e.clientY - cy) * factor,
      });
    };

    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [factor]);

  return offset;
}

/* ─── advanced hooks ─── */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  return reduced;
}

function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      const next = total > 0 ? window.scrollY / total : 0;
      setProgress(next);
      raf = 0;
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return progress;
}

function useMagnetic(strength = 0.22) {
  const ref = useRef(null);
  const [transform, setTransform] = useState("translate3d(0,0,0)");

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    setTransform(`translate3d(${x * strength}px, ${y * strength}px, 0)`);
  };

  const onLeave = () => setTransform("translate3d(0,0,0)");

  return { ref, transform, onMove, onLeave };
}

/* ─── top progress ─── */
function ScrollProgressBar() {
  const progress = useScrollProgress();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: 3,
        zIndex: 200,
        pointerEvents: "none",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div
        style={{
          width: `${progress * 100}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${TEAL}, ${MINT}, ${BLUE}, ${AMBER})`,
          boxShadow: `0 0 20px ${TEAL}80, 0 0 40px ${BLUE}40`,
          transition: "width 0.08s linear",
        }}
      />
    </div>
  );
}

/* ─── spotlight ─── */
function Spotlight() {
  const reduced = usePrefersReducedMotion();
  const [pos, setPos] = useState({ x: -500, y: -500 });

  useEffect(() => {
    if (reduced) return;
    let raf = 0;

    const move = (e) => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setPos({ x: e.clientX, y: e.clientY });
      });
    };

    window.addEventListener("mousemove", move, { passive: true });
    return () => {
      window.removeEventListener("mousemove", move);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
        background: `radial-gradient(320px circle at ${pos.x}px ${pos.y}px, rgba(45,212,191,0.09), rgba(59,130,246,0.05) 30%, transparent 65%)`,
        transition: "background 0.08s linear",
      }}
    />
  );
}

/* ─── starfield / particles ─── */
function Starfield() {
  const canvasRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let w = 0;
    let h = 0;
    let raf = 0;
    let t = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 1.8);
    const mouse = { x: 0, y: 0 };

    const particles = [];
    const count = 85;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      particles.length = 0;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: Math.random() * 1.8 + 0.5,
          hue: [170, 210, 38, 45][Math.floor(Math.random() * 4)],
        });
      }
    };

    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const draw = () => {
      t += 0.008;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = Math.max(0, 120 - dist) / 120;

        p.x += p.vx + (dx / dist) * force * 0.08 + Math.sin(t + i) * 0.02;
        p.y += p.vy + (dy / dist) * force * 0.08 + Math.cos(t + i) * 0.02;

        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, 0.35)`;
        ctx.shadowBlur = 18;
        ctx.shadowColor = `hsla(${p.hue}, 90%, 65%, 0.45)`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255,255,255,${(1 - d / 120) * 0.08})`;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove, { passive: true });

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.55,
      }}
    />
  );
}

/* ─── animated background orbs ─── */
function Orbs() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {[
        { color: TEAL, size: 600, top: "10%", left: "-10%", dur: "18s", delay: "0s" },
        { color: AMBER, size: 500, top: "60%", left: "70%", dur: "22s", delay: "2s" },
        { color: BLUE, size: 450, top: "30%", left: "50%", dur: "20s", delay: "4s" },
        { color: MINT, size: 350, top: "80%", left: "20%", dur: "16s", delay: "1s" },
      ].map((o, i) => (
        <div
          key={i}
          className="orb-element"
          style={{
            position: "absolute",
            top: o.top,
            left: o.left,
            width: o.size,
            height: o.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${o.color}18 0%, transparent 70%)`,
            filter: "blur(80px)",
            animation: `orbFloat ${o.dur} ease-in-out infinite alternate`,
            animationDelay: o.delay,
          }}
        />
      ))}
    </div>
  );
}

/* ─── noise overlay ─── */
function NoiseOverlay() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
        opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

/* ─── subtle grid ─── */
function GridBg() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }}
    />
  );
}

/* ─── ambient beam separators ─── */
function AmbientBeam({ top = "auto", bottom = "auto", rotate = -8, color = TEAL, opacity = 0.08 }) {
  return (
    <div
      style={{
        position: "absolute",
        left: "-10%",
        right: "-10%",
        top,
        bottom,
        height: 140,
        transform: `rotate(${rotate}deg)`,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        filter: "blur(70px)",
        opacity,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

/* ─── top lens flare ─── */
function TopLensFlare() {
  return (
    <div
      style={{
        position: "fixed",
        top: -120,
        left: "50%",
        transform: "translateX(-50%)",
        width: 900,
        height: 300,
        pointerEvents: "none",
        zIndex: 0,
        background:
          "radial-gradient(ellipse at center, rgba(255,255,255,0.08) 0%, rgba(45,212,191,0.06) 18%, rgba(59,130,246,0.04) 30%, transparent 70%)",
        filter: "blur(40px)",
      }}
    />
  );
}

/* ─── glass card ─── */
function GlassCard({ children, style = {}, hover = true, className = "" }) {
  const [hovered, setHovered] = useState(false);
  const [transform, setTransform] = useState("perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0)");
  const [glare, setGlare] = useState({ x: 50, y: 50, o: 0 });

  const handleMove = (e) => {
    if (!hover) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateY = ((x / rect.width) - 0.5) * 14;
    const rotateX = ((y / rect.height) - 0.5) * -14;

    setTransform(`perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.01)`);
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      o: 1,
    });
  };

  const reset = () => {
    setHovered(false);
    setTransform("perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0)");
    setGlare((g) => ({ ...g, o: 0 }));
  };

  return (
    <div
      onMouseEnter={() => hover && setHovered(true)}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className={className}
      style={{
        background: hovered
          ? "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.012) 100%)",
        backdropFilter: "blur(22px) saturate(1.3)",
        WebkitBackdropFilter: "blur(22px) saturate(1.3)",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 22,
        transition:
          "transform 0.18s ease, box-shadow 0.25s ease, background 0.25s ease, border 0.25s ease",
        transform,
        transformStyle: "preserve-3d",
        boxShadow: hovered
          ? `0 30px 80px rgba(0,0,0,0.48), 0 0 60px ${TEAL}12, inset 0 1px 0 rgba(255,255,255,0.10)`
          : "0 8px 32px rgba(0,0,0,0.3)",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.16), transparent 38%)`,
          opacity: glare.o,
          transition: "opacity 0.2s ease",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(255,255,255,0.06), transparent 35%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ transform: "translateZ(26px)", position: "relative" }}>{children}</div>
    </div>
  );
}

/* ─── reveal wrapper ─── */
function Reveal({ children, delay = 0, direction = "up", style = {} }) {
  const [ref, visible] = useInView(0.1);

  const transforms = {
    up: "translateY(40px)",
    down: "translateY(-40px)",
    left: "translateX(40px)",
    right: "translateX(-40px)",
    scale: "scale(0.95)",
  };

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : transforms[direction],
        transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── section wrapper ─── */
function Section({ children, id, style = {}, className = "" }) {
  return (
    <section
      id={id}
      className={`section-wrapper ${className}`}
      style={{
        position: "relative",
        zIndex: 2,
        maxWidth: 1200,
        margin: "0 auto",
        padding: "100px 24px",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 24,
          right: 24,
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
          pointerEvents: "none",
        }}
      />
      {children}
    </section>
  );
}

/* ─── section label ─── */
function SectionLabel({ children }) {
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: 3,
        textTransform: "uppercase",
        color: AMBER,
        display: "inline-block",
        marginBottom: 12,
      }}
    >
      {children}
    </span>
  );
}

/* ─── CTA button ─── */
function CTAButton({ children, primary = true, style = {}, className = "", ...props }) {
  const [hovered, setHovered] = useState(false);
  const { ref, transform, onMove, onLeave } = useMagnetic(primary ? 0.18 : 0.12);

  return (
    <button
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseMove={onMove}
      onMouseLeave={(e) => {
        setHovered(false);
        onLeave(e);
      }}
      className={className}
      {...props}
      style={{
        fontFamily: "'Outfit', sans-serif",
        fontSize: 15,
        fontWeight: 600,
        padding: primary ? "14px 32px" : "14px 28px",
        borderRadius: 14,
        border: primary ? "none" : "1px solid rgba(255,255,255,0.15)",
        background: primary
          ? hovered
            ? `linear-gradient(135deg, ${TEAL}, ${MINT})`
            : `linear-gradient(135deg, ${TEAL}dd, ${MINT}cc)`
          : hovered
          ? "rgba(255,255,255,0.08)"
          : "transparent",
        color: primary ? "#09090b" : "#e4e4e7",
        cursor: "pointer",
        transition: "transform 0.2s ease, box-shadow 0.3s ease, background 0.3s ease",
        transform: `${transform} ${hovered ? "scale(1.02)" : "scale(1)"}`,
        boxShadow: primary
          ? hovered
            ? `0 16px 40px ${TEAL}40, 0 0 30px ${MINT}22`
            : `0 10px 24px ${TEAL}22`
          : hovered
          ? "0 8px 24px rgba(255,255,255,0.08)"
          : "none",
        letterSpacing: 0.3,
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      <span style={{ position: "relative", zIndex: 2 }}>{children}</span>

      {hovered && (
        <span
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.25) 40%, transparent 70%)",
            animation: "btnShine 0.9s ease forwards",
          }}
        />
      )}
    </button>
  );
}

/* ─── phone mockup ─── */
function PhoneMockup({ screen, style = {}, tilt = false, className = "" }) {
  const [transform, setTransform] = useState(
    tilt
      ? "perspective(1600px) rotateY(-10deg) rotateX(6deg) scale(1)"
      : "perspective(1600px) rotateY(0deg) rotateX(0deg) scale(1)"
  );
  const [shine, setShine] = useState({ x: 50, y: 0, o: 0.4 });

  const handleMove = (e) => {
    if (!tilt) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateY = ((x / rect.width) - 0.5) * 22;
    const rotateX = ((y / rect.height) - 0.5) * -18;

    setTransform(`perspective(1600px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale(1.04)`);
    setShine({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      o: 0.9,
    });
  };

  const reset = () => {
    setTransform(
      tilt
        ? "perspective(1600px) rotateY(-10deg) rotateX(6deg) scale(1)"
        : "perspective(1600px) rotateY(0deg) rotateX(0deg) scale(1)"
    );
    setShine({ x: 50, y: 0, o: 0.45 });
  };

  return (
    <div
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className={`phone-mockup ${className}`}
      style={{
        width: 280,
        height: 560,
        borderRadius: 38,
        background: "linear-gradient(145deg, #1a1a1e 0%, #0b0b0d 100%)",
        border: "1.5px solid rgba(255,255,255,0.09)",
        padding: 8,
        boxShadow: `
          0 60px 120px rgba(0,0,0,0.72),
          0 0 80px ${TEAL}10,
          inset 0 1px 0 rgba(255,255,255,0.08)
        `,
        transition: "transform 0.16s ease, box-shadow 0.25s ease",
        transform,
        transformStyle: "preserve-3d",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 38,
          background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.18), transparent 32%)`,
          opacity: shine.o,
          pointerEvents: "none",
          transition: "opacity 0.2s ease",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 1,
          borderRadius: 37,
          border: "1px solid rgba(255,255,255,0.05)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 12,
          left: 20,
          right: 20,
          height: 40,
          borderRadius: 20,
          background: "linear-gradient(180deg, rgba(255,255,255,0.08), transparent)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%) translateZ(50px)",
          width: 92,
          height: 24,
          borderRadius: 999,
          background: "#050506",
          border: "1px solid rgba(255,255,255,0.05)",
          zIndex: 3,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      />

      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 30,
          overflow: "hidden",
          background: "#111113",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "translateZ(40px)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
          position: "relative",
        }}
      >
        {screen}
      </div>
    </div>
  );
}

/* ─── mock screens ─── */
function TasksScreen() {
  const tasks = [
    { text: "Morning workout", done: true, color: TEAL },
    { text: "Review lecture notes", done: true, color: MINT },
    { text: "Complete assignment", done: true, color: AMBER },
    { text: "Read 20 pages", done: true, color: BLUE },
    { text: "Evening meditation", done: true, color: TEAL },
  ];

  return (
    <div style={{ padding: 20, width: "100%", fontFamily: "'Outfit', sans-serif" }}>
      <div
        style={{
          fontSize: 10,
          color: AMBER,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: 2,
          marginBottom: 4,
        }}
      >
        SUNDAY, MAR 29
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Tasks</div>
        <div
          style={{
            fontSize: 10,
            color: TEAL,
            background: `${TEAL}15`,
            padding: "4px 10px",
            borderRadius: 8,
          }}
        >
          + New
        </div>
      </div>

      <div
        style={{
          background: `linear-gradient(135deg, ${TEAL}12, ${MINT}08)`,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          textAlign: "center",
          border: `1px solid ${TEAL}20`,
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 800, color: TEAL }}>100%</div>
        <div style={{ fontSize: 10, color: "#a1a1aa" }}>daily goals</div>
      </div>

      {tasks.map((t, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 0",
            borderBottom: i < tasks.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 6,
              background: t.done ? t.color : "transparent",
              border: t.done ? "none" : "1.5px solid rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              color: "#09090b",
              flexShrink: 0,
            }}
          >
            {t.done && "✓"}
          </div>

          <span
            style={{
              fontSize: 12,
              color: t.done ? "#a1a1aa" : "#e4e4e7",
              textDecoration: t.done ? "line-through" : "none",
            }}
          >
            {t.text}
          </span>
        </div>
      ))}
    </div>
  );
}

function JournalScreen() {
  return (
    <div style={{ padding: 20, width: "100%", fontFamily: "'Outfit', sans-serif" }}>
      <div
        style={{
          fontSize: 10,
          color: AMBER,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: 2,
          marginBottom: 4,
        }}
      >
        MY JOURNAL
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
        Reflections
      </div>
      <div style={{ fontSize: 11, color: "#71717a", marginBottom: 20 }}>1 entry written</div>
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          borderRadius: 14,
          padding: 16,
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 16 }}>😊</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>My day</div>
            <div style={{ fontSize: 10, color: "#71717a" }}>Sun, Mar 29 · 1:31 PM</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#a1a1aa", lineHeight: 1.6 }}>
          Today I am feeling good because I have done workout on time and completed my
          college work also.
        </div>
      </div>
    </div>
  );
}

function InsightsScreen() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div style={{ padding: 20, width: "100%", fontFamily: "'Outfit', sans-serif" }}>
      <div
        style={{
          fontSize: 10,
          color: AMBER,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: 2,
          marginBottom: 4,
        }}
      >
        THIS WEEK
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
        Insights
      </div>
      <div style={{ fontSize: 11, color: "#71717a", marginBottom: 16 }}>Mar 23 – Mar 29</div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginBottom: 16,
        }}
      >
        {[
          { label: "Completion", value: "100%", icon: "◎", color: TEAL },
          { label: "Streak", value: "1", icon: "🔥", color: AMBER },
          { label: "Tasks Done", value: "5", icon: "↗", color: MINT },
          { label: "Best Day", value: "Sun", icon: "🏆", color: BLUE },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: 12,
              padding: 12,
              textAlign: "center",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div
              style={{
                fontSize: 8,
                color: "#71717a",
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {s.label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, color: "#e4e4e7", marginBottom: 10 }}>
        Weekly Progress
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
        {days.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                height: i === 6 ? 50 : 6,
                background:
                  i === 6
                    ? `linear-gradient(to top, ${AMBER}, ${AMBER}cc)`
                    : "rgba(255,255,255,0.06)",
                borderRadius: 4,
                marginBottom: 4,
                transition: "height 0.5s ease",
              }}
            />
            <div style={{ fontSize: 8, color: "#52525b" }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileScreen() {
  return (
    <div style={{ padding: 20, width: "100%", fontFamily: "'Outfit', sans-serif" }}>
      <div
        style={{
          fontSize: 10,
          color: AMBER,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: 2,
          marginBottom: 16,
        }}
      >
        MY ACCOUNT
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          background: "rgba(255,255,255,0.04)",
          borderRadius: 14,
          padding: 14,
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${AMBER}40, ${AMBER}20)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 700,
            color: AMBER,
            flexShrink: 0,
          }}
        >
          H
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>John Doe</div>
          <div style={{ fontSize: 10, color: "#71717a", overflow: "hidden", textOverflow: "ellipsis" }}>
            johndoe@gmail.abc
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8,
          marginBottom: 20,
        }}
      >
        {[
          { label: "Total Tasks", value: "5" },
          { label: "Completed", value: "5" },
          { label: "Streak", value: "1 🔥" },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: 12,
              padding: 10,
              textAlign: "center",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{s.value}</div>
            <div style={{ fontSize: 8, color: "#71717a", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          fontSize: 10,
          color: AMBER,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: 2,
          marginBottom: 12,
        }}
      >
        PREFERENCES
      </div>

      {["Dark Mode", "Notifications", "Daily Reminder"].map((p, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 0",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <span style={{ fontSize: 12, color: "#e4e4e7" }}>{p}</span>
          <div
            style={{
              width: 36,
              height: 20,
              borderRadius: 10,
              background: i === 0 ? TEAL : "rgba(255,255,255,0.1)",
              position: "relative",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#fff",
                position: "absolute",
                top: 2,
                left: i === 0 ? 18 : 2,
                transition: "left 0.2s ease",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── floating UI card ─── */
function FloatingCard({ children, style = {}, className = "" }) {
  return (
    <div
      className={`floating-card ${className}`}
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 16,
        padding: "12px 16px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.42)",
        animation: "floatDepth 4.5s ease-in-out infinite alternate",
        transform: "perspective(1000px) rotateX(8deg) rotateY(-10deg)",
        transformStyle: "preserve-3d",
        ...style,
      }}
    >
      <div style={{ transform: "translateZ(18px)" }}>{children}</div>
    </div>
  );
}

/* ─── hero rings ─── */
function HeroRings() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 320 + i * 90,
            height: 320 + i * 90,
            borderRadius: "50%",
            border: `1px solid rgba(255,255,255,${0.08 - i * 0.015})`,
            boxShadow: i === 0 ? `0 0 40px ${TEAL}12 inset` : "none",
            transform: `rotateX(74deg) rotateZ(${i * 18}deg)`,
            animation: `ringSpin${i} ${18 + i * 6}s linear infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── nav ─── */
function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      if (window.innerWidth > 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const links = ["Features", "Showcase", "Why", "FAQ"];

  return (
    <header
      style={{
        position: "fixed",
        top: 18,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: "0 16px",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          borderRadius: 24,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: scrolled
            ? "linear-gradient(135deg, rgba(15,15,20,0.82), rgba(15,15,20,0.65))"
            : "linear-gradient(135deg, rgba(15,15,20,0.55), rgba(15,15,20,0.35))",
          backdropFilter: "blur(24px) saturate(1.4)",
          WebkitBackdropFilter: "blur(24px) saturate(1.4)",
          border: scrolled
            ? "1px solid rgba(255,255,255,0.10)"
            : "1px solid rgba(255,255,255,0.07)",
          boxShadow: scrolled
            ? "0 20px 60px rgba(0,0,0,0.35)"
            : "0 12px 40px rgba(0,0,0,0.22)",
          transition: "all 0.35s ease",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            minWidth: 0,
            flex: "0 1 auto",
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              minWidth: 42,
              borderRadius: 14,
              background: `linear-gradient(135deg, ${TEAL}30, ${MINT}18)`,
              border: `1px solid ${TEAL}35`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 18,
              fontWeight: 700,
              boxShadow: `0 0 30px ${TEAL}18, inset 0 1px 0 rgba(255,255,255,0.10)`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.12), transparent 45%, transparent)",
                pointerEvents: "none",
              }}
            />
            ✓
          </div>

          <div
            className="header-logo-text"
            style={{ display: "flex", flexDirection: "column", lineHeight: 1, minWidth: 0 }}
          >
            <span
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 16,
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "-0.03em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Smart Tasks · Liquid Glass
            </span>
            <span
              className="header-subtitle"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: "#71717a",
                marginTop: 4,
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              productivity system
            </span>
          </div>
        </div>

        <nav
          className="nav-desktop"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "6px",
            borderRadius: 18,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {links.map((l, i) => {
            const active = hoveredLink === i;

            return (
              <a
                key={l}
                href={`#${l.toLowerCase()}`}
                onMouseEnter={() => setHoveredLink(i)}
                onMouseLeave={() => setHoveredLink(null)}
                style={{
                  position: "relative",
                  padding: "12px 18px",
                  borderRadius: 14,
                  textDecoration: "none",
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  color: active ? "#fff" : "#a1a1aa",
                  background: active
                    ? "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))"
                    : "transparent",
                  border: active
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "1px solid transparent",
                  boxShadow: active ? `0 0 24px ${TEAL}10` : "none",
                  transition: "all 0.25s ease",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ position: "relative", zIndex: 2 }}>{l}</span>

                {active && (
                  <>
                    <span
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.10) 50%, transparent 100%)",
                        transform: "translateX(-100%)",
                        animation: "navShine 0.8s ease forwards",
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        left: 16,
                        right: 16,
                        bottom: 8,
                        height: 2,
                        borderRadius: 999,
                        background: `linear-gradient(90deg, ${TEAL}, ${MINT})`,
                        boxShadow: `0 0 12px ${TEAL}60`,
                      }}
                    />
                  </>
                )}
              </a>
            );
          })}
        </nav>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flex: "0 0 auto",
          }}
        >
          <CTAButton
            className="header-cta"
            style={{
              padding: "13px 26px",
              fontSize: 14,
              borderRadius: 16,
              boxShadow: `0 14px 30px ${TEAL}28`,
            }}
          >
            Join the Beta
          </CTAButton>

          <button
            className="nav-mobile-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              display: "none",
              width: 42,
              height: 42,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              color: "#fff",
              fontSize: 20,
              cursor: "pointer",
              backdropFilter: "blur(12px)",
              flexShrink: 0,
            }}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="mobile-menu"
          style={{
            maxWidth: 1280,
            margin: "12px auto 0",
            borderRadius: 24,
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            background: "linear-gradient(135deg, rgba(15,15,20,0.88), rgba(15,15,20,0.72))",
            backdropFilter: "blur(24px) saturate(1.4)",
            WebkitBackdropFilter: "blur(24px) saturate(1.4)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.3)",
          }}
        >
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              onClick={() => setMobileOpen(false)}
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 15,
                color: "#e4e4e7",
                textDecoration: "none",
                padding: "14px 16px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {l}
            </a>
          ))}
          <CTAButton style={{ marginTop: 8, width: "100%" }}>Join the Beta</CTAButton>
        </div>
      )}
    </header>
  );
}

/* ─── hero ─── */
function Hero() {
  const mouse = useMouseParallax(0.018);

  return (
    <Section
      id="hero"
      className="hero-section"
      style={{
        paddingTop: 150,
        paddingBottom: 80,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div className="hero-grid">
        <div style={{ position: "relative", zIndex: 2 }}>
          <Reveal delay={0}>
            <div
              className="hero-badge"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 999,
                padding: "8px 18px",
                marginBottom: 28,
                boxShadow: `0 0 30px ${TEAL}12`,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: TEAL,
                  boxShadow: `0 0 14px ${TEAL}`,
                  animation: "pulseDot 2s ease-in-out infinite",
                  flexShrink: 0,
                }}
              />
              <span
                className="hero-badge-text"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: "#d4d4d8",
                  letterSpacing: 1.5,
                }}
              >
                ANDROID APP · TASKS · JOURNAL · INSIGHTS
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1
              className="hero-title"
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "clamp(36px, 7vw, 82px)",
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1.02,
                letterSpacing: "-0.05em",
                marginBottom: 24,
                maxWidth: 760,
              }}
            >
              Tasks, Journaling,
              <br />
              and Insights —
              <br />
              <span
                style={{
                  background: `linear-gradient(135deg, ${TEAL}, ${MINT})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: `0 0 30px ${TEAL}25`,
                }}
              >
                All in one place.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "clamp(15px, 2vw, 20px)",
                color: "#a1a1aa",
                maxWidth: 580,
                lineHeight: 1.8,
                marginBottom: 34,
              }}
            >
              Plan your day, reflect on your thoughts, and track your progress with a
              single app designed to keep you organized, consistent, and aware.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div
              className="hero-buttons"
              style={{
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
                alignItems: "center",
                marginBottom: 28,
              }}
            >
              <CTAButton
                style={{
                  padding: "16px 34px",
                  fontSize: 15,
                  boxShadow: `0 16px 40px ${TEAL}35`,
                }}
              >
                Get Beta Access
              </CTAButton>

              <CTAButton
                primary={false}
                style={{
                  padding: "16px 30px",
                  fontSize: 15,
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                Explore Features →
              </CTAButton>
            </div>
          </Reveal>

          <Reveal delay={0.4}>
            <div
              className="hero-stats"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 22,
                alignItems: "center",
              }}
            >
              {[
                { value: "Tasks", label: "Daily planning" },
                { value: "Journal", label: "Thought tracking" },
                { value: "Insights", label: "Weekly progress" },
              ].map((item, i) => (
                <div key={i}>
                  <div
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#fff",
                      marginBottom: 2,
                    }}
                  >
                    {item.value}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 12,
                      color: "#71717a",
                    }}
                  >
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.35} direction="scale">
          <div
            className="hero-visual"
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 700,
              transform: `translate(${mouse.x}px, ${mouse.y}px)`,
              transition: "transform 0.25s ease-out",
              perspective: 1800,
              transformStyle: "preserve-3d",
            }}
          >
            <HeroRings />

            <div
              style={{
                position: "absolute",
                width: 520,
                height: 520,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.05)",
                transform: "rotateX(75deg) translateZ(-40px)",
                boxShadow: `0 0 120px ${TEAL}10`,
                zIndex: 0,
                pointerEvents: "none",
              }}
            />

            <div
              className="hero-glow"
              style={{
                position: "absolute",
                width: 560,
                height: 560,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${TEAL}14 0%, transparent 65%)`,
                filter: "blur(50px)",
                animation: "heroGlow 7s ease-in-out infinite alternate",
              }}
            />
            <div
              className="hero-glow"
              style={{
                position: "absolute",
                width: 420,
                height: 420,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${AMBER}10 0%, transparent 68%)`,
                filter: "blur(55px)",
                top: 80,
                right: 0,
                animation: "heroGlow 6s ease-in-out infinite alternate-reverse",
              }}
            />
            <div
              className="hero-glow"
              style={{
                position: "absolute",
                width: 320,
                height: 320,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${BLUE}10 0%, transparent 68%)`,
                filter: "blur(45px)",
                bottom: 60,
                left: 10,
                animation: "heroGlow 5.5s ease-in-out infinite alternate",
              }}
            />

            <div
              className="hero-depth-card"
              style={{
                position: "absolute",
                width: 240,
                height: 500,
                borderRadius: 34,
                background: "linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                border: "1px solid rgba(255,255,255,0.05)",
                transform: "perspective(1200px) rotateY(28deg) translateX(80px) scale(0.92)",
                right: 20,
                zIndex: 1,
                opacity: 0.7,
              }}
            />

            <PhoneMockup
              screen={<TasksScreen />}
              tilt
              className="hero-phone"
              style={{
                position: "relative",
                zIndex: 3,
              }}
            />

            <FloatingCard
              className="hero-floating-card"
              style={{
                position: "absolute",
                top: 75,
                right: -10,
                zIndex: 4,
                animationDelay: "0.4s",
                minWidth: 180,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 10,
                    background: `${TEAL}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: TEAL,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#fff",
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    5 / 5 tasks completed
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: TEAL,
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    100% completion today
                  </div>
                </div>
              </div>
            </FloatingCard>

            <FloatingCard
              className="hero-floating-card"
              style={{
                position: "absolute",
                bottom: 110,
                left: -20,
                zIndex: 4,
                animationDelay: "1.2s",
                minWidth: 170,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>🔥</span>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#fff",
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    7 day streak
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#71717a",
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    Consistency is building
                  </div>
                </div>
              </div>
            </FloatingCard>

            <FloatingCard
              className="hero-floating-card"
              style={{
                position: "absolute",
                top: 270,
                left: -30,
                zIndex: 4,
                animationDelay: "1.8s",
                minWidth: 155,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>😊</span>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#fff",
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    Mood captured
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#71717a",
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    Feeling productive
                  </div>
                </div>
              </div>
            </FloatingCard>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

/* ─── features ─── */
function Features() {
  const features = [
    {
      icon: "☑",
      title: "Tasks",
      desc: "Organize your day with focused task lists. Track completion, set priorities, and build momentum one task at a time.",
      color: TEAL,
    },
    {
      icon: "✎",
      title: "Journal",
      desc: "Capture reflections, moods, and thoughts. Build a personal archive of your daily experiences and growth.",
      color: AMBER,
    },
    {
      icon: "◎",
      title: "Insights",
      desc: "Visualize your weekly progress with completion rates, streaks, mood patterns, and focus analytics.",
      color: BLUE,
    },
    {
      icon: "↻",
      title: "Routines",
      desc: "Design daily routines that stick. Build habits through consistency tracking and gentle reminders.",
      color: MINT,
    },
  ];

  return (
    <Section id="features">
      <Reveal>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <SectionLabel>Core Features</SectionLabel>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.02em",
              marginBottom: 12,
            }}
          >
            Everything you need, <span style={{ color: "#71717a" }}>nothing you don't</span>
          </h2>
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 16,
              color: "#52525b",
              maxWidth: 500,
              margin: "0 auto",
            }}
          >
            Four thoughtfully crafted modules that work together to help you plan,
            reflect, and grow.
          </p>
        </div>
      </Reveal>

      <div
        className="features-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 20,
        }}
      >
        {features.map((f, i) => (
          <Reveal key={i} delay={i * 0.1}>
            <GlassCard style={{ padding: 32, height: "100%" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: `${f.color}12`,
                  border: `1px solid ${f.color}25`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  color: f.color,
                  marginBottom: 20,
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: 10,
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 14,
                  color: "#71717a",
                  lineHeight: 1.7,
                }}
              >
                {f.desc}
              </p>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ─── showcase 3d carousel ─── */
function Showcase3DCarousel() {
  const items = [
    { label: "Tasks", screen: <TasksScreen /> },
    { label: "Journal", screen: <JournalScreen /> },
    { label: "Insights", screen: <InsightsScreen /> },
    { label: "Profile", screen: <ProfileScreen /> },
  ];

  const [angle, setAngle] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let last = performance.now();

    const loop = (now) => {
      const dt = now - last;
      last = now;
      setAngle((a) => a + dt * 0.006);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const onWheel = (e) => {
    setAngle((a) => a + e.deltaY * 0.08);
  };

  return (
    <div
      onWheel={onWheel}
      style={{
        position: "relative",
        height: 700,
        perspective: 1800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 600,
          height: 600,
          transformStyle: "preserve-3d",
          transform: `rotateY(${angle}deg)`,
          transition: reduced ? "none" : "transform 0.1s linear",
        }}
      >
        {items.map((item, i) => {
          const step = 360 / items.length;
          const a = i * step;
          const radius = 300;
          return (
            <div
              key={item.label}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transformStyle: "preserve-3d",
                transform: `translate(-50%, -50%) rotateY(${a}deg) translateZ(${radius}px)`,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <PhoneMockup
                  screen={item.screen}
                  tilt
                  style={{
                    width: 220,
                    height: 440,
                  }}
                />
                <div
                  style={{
                    marginTop: 14,
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13,
                    color: "#71717a",
                    fontWeight: 600,
                  }}
                >
                  {item.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── app showcase ─── */
function Showcase() {
  return (
    <Section id="showcase">
      <Reveal>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <SectionLabel>App Showcase</SectionLabel>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.02em",
              marginBottom: 12,
            }}
          >
            Crafted with{" "}
            <span
              style={{
                background: `linear-gradient(135deg, ${AMBER}, ${AMBER}cc)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              intention
            </span>
          </h2>
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 16,
              color: "#52525b",
              maxWidth: 480,
              margin: "0 auto",
            }}
          >
            Every screen is designed to feel calm, focused, and purposeful.
          </p>
        </div>
      </Reveal>

      <div className="showcase-desktop-3d">
        <Reveal delay={0.1} direction="scale">
          <Showcase3DCarousel />
        </Reveal>
      </div>

      <div
        className="showcase-mobile-row"
        style={{
          display: "none",
        }}
      >
        <div
          className="showcase-phones"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "clamp(10px, 3vw, 30px)",
            perspective: 1200,
          }}
        >
          {[
            { label: "Tasks", screen: <TasksScreen />, rotate: -8 },
            { label: "Journal", screen: <JournalScreen />, rotate: -3 },
            { label: "Insights", screen: <InsightsScreen />, rotate: 3 },
            { label: "Profile", screen: <ProfileScreen />, rotate: 8 },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 0.12} direction="scale">
              <div style={{ textAlign: "center" }}>
                <PhoneMockup
                  screen={s.screen}
                  className="showcase-phone"
                  style={{
                    transform: `rotate(${s.rotate}deg)`,
                  }}
                />
                <div
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13,
                    color: "#52525b",
                    marginTop: 16,
                    fontWeight: 500,
                  }}
                >
                  {s.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ─── why section ─── */
function WhySection() {
  const points = [
    {
      icon: "◇",
      title: "Planning + Reflection",
      desc: "Most apps separate tasks from journals. Liquid Glass connects them — what you plan and what you feel live in one unified space.",
    },
    {
      icon: "△",
      title: "Clarity Over Chaos",
      desc: "No overwhelming dashboards. No feature bloat. Just the essential tools you need to stay focused, aware, and growing.",
    },
    {
      icon: "○",
      title: "Built for Growth",
      desc: "Weekly insights and mood tracking turn your daily habits into patterns you can learn from. Progress becomes visible.",
    },
  ];

  return (
    <Section id="why">
      <div
        className="why-grid"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}
      >
        <Reveal direction="right">
          <div>
            <SectionLabel>Why Liquid Glass</SectionLabel>
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "clamp(28px, 3.5vw, 40px)",
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "-0.02em",
                marginBottom: 20,
                lineHeight: 1.15,
              }}
            >
              Where productivity meets <span style={{ color: TEAL }}>clarity</span>
            </h2>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 15,
                color: "#52525b",
                lineHeight: 1.8,
                marginBottom: 32,
              }}
            >
              Liquid Glass is designed for people who want more than a to-do list —
              who believe that how you reflect on your day is just as important as how
              you plan it.
            </p>

            {points.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    minWidth: 40,
                    borderRadius: 12,
                    background: `${TEAL}10`,
                    border: `1px solid ${TEAL}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    color: TEAL,
                    flexShrink: 0,
                  }}
                >
                  {p.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#e4e4e7",
                      marginBottom: 4,
                    }}
                  >
                    {p.title}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 13,
                      color: "#52525b",
                      lineHeight: 1.7,
                    }}
                  >
                    {p.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.2} direction="left">
          <div className="why-phone-wrap" style={{ display: "flex", justifyContent: "center" }}>
            <PhoneMockup
              screen={<InsightsScreen />}
              tilt
              className="why-phone"
              style={{ transform: "perspective(800px) rotateY(8deg)" }}
            />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

/* ─── craftsmanship ─── */
function Craftsmanship() {
  const items = [
    {
      label: "Beautifully Structured",
      desc: "Every flow, every screen, and every transition is thoughtfully composed to feel natural, intuitive, and effortlessly clear.",
      icon: "⬡",
      color: TEAL,
    },
    {
      label: "Performance-Conscious",
      desc: "Lightweight architecture ensures instant responsiveness with smooth interactions, fast rendering, and zero unnecessary friction.",
      icon: "⚡",
      color: AMBER,
    },
    {
      label: "Thoughtful Workflows",
      desc: "From task creation to journal reflection, every workflow is designed around how people actually think, plan, and improve.",
      icon: "↬",
      color: BLUE,
    },
    {
      label: "Elegant Interactions",
      desc: "Subtle motion, layered depth, and refined transitions make the interface feel responsive, alive, and premium without distraction.",
      icon: "✦",
      color: MINT,
    },
  ];

  return (
    <Section id="craftsmanship">
      <Reveal>
        <div style={{ textAlign: "center", marginBottom: 70 }}>
          <SectionLabel>Engineering Quality</SectionLabel>

          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "clamp(30px, 4.4vw, 56px)",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.04em",
              marginBottom: 14,
              lineHeight: 1.05,
            }}
          >
            Not just designed. <span style={{ color: "#5b5b67" }}>Engineered.</span>
          </h2>

          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 17,
              color: "#666672",
              maxWidth: 680,
              margin: "0 auto",
              lineHeight: 1.8,
            }}
          >
            Built with the precision of a product that respects your time,
            attention, and intelligence — where every interaction is intentional,
            fast, and beautifully structured.
          </p>
        </div>
      </Reveal>

      <div
        className="craft-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 24,
          maxWidth: 1120,
          margin: "0 auto",
        }}
      >
        {items.map((item, i) => (
          <Reveal key={i} delay={i * 0.08}>
            <GlassCard
              style={{
                padding: "34px 30px",
                minHeight: 240,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  width: 180,
                  height: 180,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${item.color}10, transparent 70%)`,
                  filter: "blur(30px)",
                  top: -40,
                  right: -30,
                  pointerEvents: "none",
                }}
              />

              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: `linear-gradient(135deg, ${item.color}18, ${item.color}08)`,
                  border: `1px solid ${item.color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  color: item.color,
                  marginBottom: 22,
                  boxShadow: `0 0 30px ${item.color}12`,
                }}
              >
                {item.icon}
              </div>

              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "clamp(18px, 2.5vw, 24px)",
                  fontWeight: 700,
                  color: "#f4f4f5",
                  marginBottom: 14,
                  letterSpacing: "-0.02em",
                }}
              >
                {item.label}
              </div>

              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 15,
                  color: "#7b7b86",
                  lineHeight: 1.9,
                  maxWidth: 480,
                }}
              >
                {item.desc}
              </div>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ─── testimonials ─── */
function Testimonials() {
  const reviews = [
    {
      name: "Hardik Tewari",
      role: "CSE Student",
      text: "Liquid Glass replaced three apps for me. The journal + tasks combo is exactly what I needed — no clutter, just clarity.",
      avatar: "H",
    },
    {
      name: "Piyush Singh",
      role: "Software Developer",
      text: "Finally a task manager that doesn't overwhelm. The insights page keeps me honest about my productivity without being judgmental.",
      avatar: "P",
    },
    {
      name: "Himanshu Yadav",
      role: "CSE Student",
      text: "The mood tracking and reflections have genuinely changed how I think about my days. Beautiful app with real substance.",
      avatar: "H",
    },
  ];

  return (
    <Section>
      <Reveal>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <SectionLabel>Testimonials</SectionLabel>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.02em",
            }}
          >
            Loved by{" "}
            <span
              style={{
                background: `linear-gradient(135deg, ${AMBER}, ${AMBER}cc)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              real people
            </span>
          </h2>
        </div>
      </Reveal>

      <div
        className="testimonials-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        {reviews.map((r, i) => (
          <Reveal key={i} delay={i * 0.1}>
            <GlassCard style={{ padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${[TEAL, AMBER, BLUE][i]}30, ${
                      [TEAL, AMBER, BLUE][i]
                    }10)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 700,
                    color: [TEAL, AMBER, BLUE][i],
                    fontFamily: "'Outfit', sans-serif",
                    flexShrink: 0,
                  }}
                >
                  {r.avatar}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#e4e4e7",
                    }}
                  >
                    {r.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 11,
                      color: "#52525b",
                    }}
                  >
                    {r.role}
                  </div>
                </div>
              </div>
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 14,
                  color: "#a1a1aa",
                  lineHeight: 1.7,
                  fontStyle: "italic",
                }}
              >
                &ldquo;{r.text}&rdquo;
              </p>
              <div style={{ marginTop: 12, color: AMBER, fontSize: 12, letterSpacing: 2 }}>
                ★★★★★
              </div>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ─── FAQ ─── */
function FAQ() {
  const [open, setOpen] = useState(null);

  const items = [
    {
      q: "Is Liquid Glass free to use?",
      a: "Yes — the core experience including tasks, journal, and insights is completely free. We believe personal productivity tools should be accessible to everyone.",
    },
    {
      q: "Which platforms does it support?",
      a: "Liquid Glass is currently available on Android. iOS and web versions are in development and coming soon.",
    },
    {
      q: "Can I export my journal entries?",
      a: "Yes, you can export your reflections and task history anytime. Your data belongs to you — we make it easy to take it with you.",
    },
    {
      q: "How does the streak system work?",
      a: "Complete at least one task each day to maintain your streak. The insights page tracks your consistency and shows your best days and patterns over time.",
    },
    {
      q: "Is my data private and secure?",
      a: "Absolutely. Your journal entries, tasks, and personal data are encrypted and never shared with third parties. Privacy is foundational to our design.",
    },
  ];

  return (
    <Section id="faq">
      <Reveal>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <SectionLabel>FAQ</SectionLabel>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.02em",
            }}
          >
            Questions & answers
          </h2>
        </div>
      </Reveal>

      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {items.map((item, i) => (
          <Reveal key={i} delay={i * 0.06}>
            <div
              onClick={() => setOpen(open === i ? null : i)}
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                cursor: "pointer",
                padding: "20px 0",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                <span
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "clamp(14px, 2vw, 16px)",
                    fontWeight: 500,
                    color: open === i ? "#fff" : "#a1a1aa",
                    transition: "color 0.2s",
                  }}
                >
                  {item.q}
                </span>
                <span
                  style={{
                    fontSize: 18,
                    color: "#52525b",
                    transform: open === i ? "rotate(45deg)" : "none",
                    transition: "transform 0.3s ease",
                    flexShrink: 0,
                  }}
                >
                  +
                </span>
              </div>

              <div
                style={{
                  maxHeight: open === i ? 200 : 0,
                  overflow: "hidden",
                  transition: "max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <p
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 14,
                    color: "#52525b",
                    lineHeight: 1.7,
                    paddingTop: 12,
                  }}
                >
                  {item.a}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ─── final CTA ─── */
function FinalCTA() {
  return (
    <Section style={{ paddingBottom: 60 }}>
      <Reveal direction="scale">
        <GlassCard
          hover={false}
          style={{
            padding: "clamp(40px, 6vw, 80px) clamp(20px, 4vw, 80px)",
            textAlign: "center",
            background:
              "linear-gradient(135deg, rgba(45,212,191,0.06) 0%, rgba(255,255,255,0.03) 50%, rgba(245,158,11,0.04) 100%)",
            border: "1px solid rgba(45,212,191,0.12)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -100,
              right: -100,
              width: 300,
              height: 300,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${TEAL}10, transparent)`,
              filter: "blur(60px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -80,
              left: -80,
              width: 250,
              height: 250,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${AMBER}10, transparent)`,
              filter: "blur(60px)",
            }}
          />
          <SectionLabel>Get Started</SectionLabel>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "clamp(24px, 4vw, 48px)",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.03em",
              marginBottom: 16,
              position: "relative",
            }}
          >
            A smarter, calmer system <br />
            <span style={{ color: "#52525b" }}>for your day</span>
          </h2>
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "clamp(14px, 2vw, 16px)",
              color: "#52525b",
              maxWidth: 440,
              margin: "0 auto 32px",
              lineHeight: 1.7,
              position: "relative",
            }}
          >
            Start planning, reflecting, and improving — all in one beautifully
            engineered experience.
          </p>
          <div
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              flexWrap: "wrap",
              position: "relative",
            }}
          >
            <CTAButton>Join the Beta</CTAButton>
            <CTAButton primary={false}>Learn More</CTAButton>
          </div>
        </GlassCard>
      </Reveal>
    </Section>
  );
}

/* ─── footer ─── */
function Footer() {
  return (
    <footer
      style={{
        position: "relative",
        zIndex: 2,
        maxWidth: 1200,
        margin: "0 auto",
        padding: "40px 24px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        className="footer-inner"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${TEAL}30, ${MINT}20)`,
              border: `1px solid ${TEAL}30`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            ✓
          </div>

          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <span
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 15,
                fontWeight: 600,
                color: "#71717a",
              }}
            >
              Smart Tasks - Liquid Glass
            </span>
            <a
              href="https://codepixelworks.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: TEAL,
                textDecoration: "none",
                marginTop: 4,
              }}
            >
              by Code Pixel Works
            </a>
          </div>
        </div>

        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {["Privacy", "Terms", "Contact", "Twitter"].map((l) => (
            <a
              key={l}
              href="#"
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13,
                color: "#3f3f46",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#71717a")}
              onMouseLeave={(e) => (e.target.style.color = "#3f3f46")}
            >
              {l}
            </a>
          ))}
        </div>

        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: "#27272a",
          }}
        >
          © 2026 Liquid Glass.
        </div>
      </div>
    </footer>
  );
}

/* ─── main app ─── */
export default function LiquidGlassLanding() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { background: ${BG}; overflow-x: hidden; -webkit-overflow-scrolling: touch; }

        @keyframes orbFloat {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.97); }
          100% { transform: translate(15px, -15px) scale(1.02); }
        }

        @keyframes heroGlow {
          0% { transform: scale(1) translateY(0px); opacity: 0.75; }
          100% { transform: scale(1.08) translateY(-12px); opacity: 1; }
        }

        @keyframes pulseDot {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.45); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes floatDepth {
          0% { transform: perspective(1000px) rotateX(8deg) rotateY(-10deg) translateY(0px); }
          100% { transform: perspective(1000px) rotateX(10deg) rotateY(-12deg) translateY(-12px); }
        }

        @keyframes navShine {
          0% { transform: translateX(-120%); opacity: 0; }
          40% { opacity: 1; }
          100% { transform: translateX(120%); opacity: 0; }
        }

        @keyframes btnShine {
          0% { transform: translateX(-120%); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateX(120%); opacity: 0; }
        }

        @keyframes ringSpin0 {
          from { transform: rotateX(74deg) rotateZ(0deg); }
          to { transform: rotateX(74deg) rotateZ(360deg); }
        }

        @keyframes ringSpin1 {
          from { transform: rotateX(74deg) rotateZ(0deg); }
          to { transform: rotateX(74deg) rotateZ(-360deg); }
        }

        @keyframes ringSpin2 {
          from { transform: rotateX(74deg) rotateZ(0deg); }
          to { transform: rotateX(74deg) rotateZ(360deg); }
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 40px;
          align-items: center;
          width: 100%;
        }

        .showcase-phone {
          width: clamp(160px, 18vw, 220px) !important;
          height: clamp(320px, 36vw, 440px) !important;
        }

        .showcase-desktop-3d {
          display: block;
        }

        .showcase-mobile-row {
          display: none;
        }

        .phone-mockup,
        .floating-card,
        .hero-phone,
        .showcase-phone,
        .why-phone {
          will-change: transform;
          backface-visibility: hidden;
        }

        @media (min-width: 769px) {
          .nav-mobile-btn { display: none !important; }
          .mobile-menu { display: none !important; }
        }

        @media (max-width: 900px) {
          .craft-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: flex !important; align-items: center; justify-content: center; }
          .header-cta { display: none !important; }
          .header-subtitle { display: none !important; }

          .section-wrapper {
            padding-top: 60px !important;
            padding-bottom: 60px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }

          .hero-section {
            padding-top: 120px !important;
            min-height: auto !important;
          }

          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }

          .hero-visual {
            min-height: 500px !important;
            max-width: 100% !important;
            overflow: visible;
          }

          .hero-phone {
            width: 240px !important;
            height: 480px !important;
          }

          .hero-floating-card {
            display: none !important;
          }

          .hero-depth-card {
            display: none !important;
          }

          .hero-glow {
            transform: scale(0.6) !important;
          }

          .hero-badge-text {
            font-size: 9px !important;
            letter-spacing: 1px !important;
          }

          .hero-badge {
            padding: 6px 14px !important;
          }

          .hero-buttons {
            flex-direction: column !important;
            align-items: stretch !important;
          }

          .hero-buttons button {
            width: 100% !important;
            text-align: center !important;
          }

          .why-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }

          .why-phone {
            width: 240px !important;
            height: 480px !important;
          }

          .showcase-desktop-3d {
            display: none !important;
          }

          .showcase-mobile-row {
            display: block !important;
          }

          .showcase-phones {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            scroll-snap-type: x mandatory;
            padding-bottom: 20px !important;
            justify-content: flex-start !important;
            gap: 16px !important;
            margin: 0 -16px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }

          .showcase-phones > div {
            flex: 0 0 auto;
            scroll-snap-align: center;
          }

          .showcase-phone {
            width: 180px !important;
            height: 360px !important;
          }

          .features-grid {
            grid-template-columns: 1fr !important;
          }

          .testimonials-grid {
            grid-template-columns: 1fr !important;
          }

          .footer-inner {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 16px !important;
          }

          .orb-element {
            transform: scale(0.5) !important;
          }
        }

        @media (max-width: 400px) {
          .hero-phone {
            width: 220px !important;
            height: 440px !important;
          }

          .hero-visual {
            min-height: 420px !important;
          }

          .showcase-phone {
            width: 150px !important;
            height: 300px !important;
          }

          .why-phone {
            width: 220px !important;
            height: 440px !important;
          }

          .hero-title {
            font-size: 32px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.001ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <div
        style={{
          background: BG,
          color: "#e4e4e7",
          minHeight: "100vh",
          position: "relative",
          overflowX: "hidden",
        }}
      >
        <Orbs />
        <GridBg />
        <Starfield />
        <TopLensFlare />
        <Spotlight />
        <NoiseOverlay />
        <AmbientBeam top={420} rotate={-10} color={TEAL} opacity={0.06} />
        <AmbientBeam top={1350} rotate={8} color={BLUE} opacity={0.05} />
        <AmbientBeam top={2300} rotate={-6} color={AMBER} opacity={0.05} />
        <AmbientBeam top={3400} rotate={7} color={MINT} opacity={0.05} />
        <ScrollProgressBar />
        <Header />
        <Hero />
        <Features />
        <Showcase />
        <WhySection />
        <Craftsmanship />
        <Testimonials />
        <FAQ />
        <FinalCTA />
        <Footer />
      </div>
    </>
  );
}