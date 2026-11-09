"use client";

import { useEffect, useRef, useState } from "react";
import { getLenis } from "./SmoothScroll";

/**
 * A slim scroll indicator in the theme's accent, replacing the browser's bar and its white track.
 * It fades in while you scroll or hover it, and the thumb can be dragged or the rail clicked.
 * Wheel, keys and touch scrolling are unchanged; on touch screens it is hidden.
 */
export default function ScrollRail() {
  const rail = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let hideTimer = 0;
    let frame = 0;

    const layout = () => {
      frame = 0;
      const r = rail.current;
      const t = thumb.current;
      if (!r || !t) return;
      const doc = document.documentElement;
      const total = doc.scrollHeight;
      const view = window.innerHeight;
      const track = r.clientHeight;
      if (total <= view + 1) {
        t.style.display = "none";
        return;
      }
      t.style.display = "block";
      const size = Math.max(36, (view / total) * track);
      const top = (window.scrollY / (total - view)) * (track - size);
      t.style.height = `${size}px`;
      t.style.transform = `translateY(${top}px)`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(layout);
    };
    const onScroll = () => {
      schedule();
      setVisible(true);
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setVisible(false), 900);
    };

    layout();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", schedule);
    const ro = new ResizeObserver(schedule);
    ro.observe(document.body);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", schedule);
      ro.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(hideTimer);
    };
  }, []);

  function scrollToRatio(ratio: number, immediate: boolean) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const y = Math.min(max, Math.max(0, ratio * max));
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { immediate });
    else window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
  }

  function onThumbDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    const r = rail.current;
    const t = thumb.current;
    if (!r || !t) return;
    t.setPointerCapture(e.pointerId);
    setDragging(true);
    // Keep the grab point under the pointer.
    const grab = e.clientY - t.getBoundingClientRect().top;
    const move = (ev: PointerEvent) => {
      const rect = r.getBoundingClientRect();
      const free = rect.height - t.offsetHeight;
      scrollToRatio((ev.clientY - rect.top - grab) / free, true);
    };
    const up = () => {
      setDragging(false);
      t.removeEventListener("pointermove", move);
      t.removeEventListener("pointerup", up);
      t.removeEventListener("pointercancel", up);
    };
    t.addEventListener("pointermove", move);
    t.addEventListener("pointerup", up);
    t.addEventListener("pointercancel", up);
  }

  function onRailDown(e: React.PointerEvent<HTMLDivElement>) {
    const r = rail.current;
    const t = thumb.current;
    if (!r || !t) return;
    const rect = r.getBoundingClientRect();
    scrollToRatio((e.clientY - rect.top - t.offsetHeight / 2) / (rect.height - t.offsetHeight), false);
  }

  return (
    <div ref={rail} className={`scroll-rail${visible || dragging ? " is-visible" : ""}`} onPointerDown={onRailDown} aria-hidden="true">
      <div ref={thumb} className={`scroll-thumb${dragging ? " is-dragging" : ""}`} onPointerDown={onThumbDown} />
    </div>
  );
}
