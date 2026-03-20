"use client";
import { useEffect, useRef } from "react";

export default function OverlayScrollbar() {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartScroll = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return;

    // Hide on touch devices (mobile/tablet)
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
      track.style.display = "none";
      return;
    }

    const TRACK_OFFSET = 85;
    const update = () => {
      const { scrollHeight, clientHeight, scrollTop } = document.documentElement;
      if (scrollHeight <= clientHeight) {
        track.style.display = "none";
        return;
      }
      track.style.display = "block";
      const trackH = clientHeight - TRACK_OFFSET;
      const ratio = trackH / scrollHeight;
      const thumbH = Math.max(30, trackH * ratio);
      const maxScroll = scrollHeight - clientHeight;
      const thumbTop = (scrollTop / maxScroll) * (trackH - thumbH);
      thumb.style.height = `${thumbH}px`;
      thumb.style.top = `${thumbTop}px`;
    };

    const show = () => {
      track.style.opacity = "1";
      clearTimeout(hideTimer.current);
    };

    const hide = () => {
      if (isDragging.current) return;
      hideTimer.current = setTimeout(() => {
        track.style.opacity = "0";
      }, 800);
    };

    const onScroll = () => {
      update();
      show();
      hide();
    };

    const onTrackEnter = () => show();
    const onTrackLeave = () => hide();

    const onThumbDown = (e: MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      dragStartY.current = e.clientY;
      dragStartScroll.current = document.documentElement.scrollTop;
      thumb.style.background = "rgba(0,0,0,0.2)";
      document.addEventListener("mousemove", onDrag);
      document.addEventListener("mouseup", onDragEnd);
    };

    const onDrag = (e: MouseEvent) => {
      const { scrollHeight, clientHeight } = document.documentElement;
      const maxScroll = scrollHeight - clientHeight;
      const visibleTrackH = clientHeight - TRACK_OFFSET;
      const ratio = visibleTrackH / scrollHeight;
      const thumbH = Math.max(30, visibleTrackH * ratio);
      const trackH = visibleTrackH - thumbH;
      const dy = e.clientY - dragStartY.current;
      const scrollDelta = (dy / trackH) * maxScroll;
      document.documentElement.scrollTop = dragStartScroll.current + scrollDelta;
    };

    const onDragEnd = () => {
      isDragging.current = false;
      thumb.style.background = "rgba(0,0,0,0.2)";
      document.removeEventListener("mousemove", onDrag);
      document.removeEventListener("mouseup", onDragEnd);
      hide();
    };

    const onTrackClick = (e: MouseEvent) => {
      if (e.target === thumb) return;
      const { scrollHeight, clientHeight } = document.documentElement;
      const clickRatio = (e.clientY - TRACK_OFFSET) / (clientHeight - TRACK_OFFSET);
      document.documentElement.scrollTop = clickRatio * (scrollHeight - clientHeight);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    track.addEventListener("mouseenter", onTrackEnter);
    track.addEventListener("mouseleave", onTrackLeave);
    track.addEventListener("click", onTrackClick);
    thumb.addEventListener("mousedown", onThumbDown);
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      track.removeEventListener("mouseenter", onTrackEnter);
      track.removeEventListener("mouseleave", onTrackLeave);
      track.removeEventListener("click", onTrackClick);
      thumb.removeEventListener("mousedown", onThumbDown);
      document.removeEventListener("mousemove", onDrag);
      document.removeEventListener("mouseup", onDragEnd);
    };
  }, []);

  return (
    <div
      ref={trackRef}
      style={{
        position: "fixed",
        top: 85,
        right: 0,
        width: 14,
        height: "calc(100vh - 85px)",
        zIndex: 90,
        opacity: 0,
        transition: "opacity 0.3s",
        cursor: "pointer",
      }}
    >
      <div
        ref={thumbRef}
        style={{
          position: "absolute",
          right: 3,
          width: 6,
          borderRadius: 3,
          background: "rgba(0,0,0,0.2)",
          transition: "background 0.2s",
          cursor: "grab",
        }}
      />
    </div>
  );
}
