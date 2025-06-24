import React, { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadStarsPreset } from "tsparticles-preset-stars";

export default function StarfieldBackground() {
  const initStars = useCallback(async (engine) => {
    await loadStarsPreset(engine);
  }, []);

  return (
    <>
      {/* Nebula Glow Clouds */}
      <Particles
  id="nebula"
  options={{
    fullScreen: { enable: true, zIndex: 0 },
    background: { color: "black" },
    particles: {
      number: {
        value: 10,
        density: { enable: false },
      },
      color: {
        value: ["#0b0c40", "#1b1b5e", "#301934"], // darker blues and purples
      },
      opacity: {
        value: 0.20, // reduced from 0.35
        random: { enable: true, minimumValue: 0.1 },
        animation: {
          enable: true,
          speed: 0.1,
          minimumValue: 0.1,
          sync: false,
        },
      },
      size: {
        value: 450, // smaller for tighter glow
        random: { enable: true, minimumValue: 250 },
        animation: {
          enable: true,
          speed: 0.8,
          minimumValue: 250,
          sync: false,
        },
      },
      move: {
        enable: true,
        speed: 0.1,
        direction: "none",
        outModes: { default: "out" },
        random: true,
        straight: false,
      },
      shape: {
        type: "circle",
      },
    },
    detectRetina: true,
  }}
  style={{
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 0,
    filter: "blur(45px)",
    pointerEvents: "none",
  }}
/>


      {/* Starfield */}
      <Particles
        id="tsparticles"
        init={initStars}
        options={{
          preset: "stars",
          fullScreen: { enable: true, zIndex: 1 },
          background: { color: "black" },
          detectRetina: true,
          interactivity: {
            detectsOn: "canvas",
            events: {
              onHover: {
                enable: true,
                mode: "parallax",
              },
              resize: true,
            },
            modes: {
              parallax: {
                enable: true,
                force: 30,
                smooth: 10,
              },
            },
          },
          particles: {
            number: {
              value: 150,
              density: { enable: true, area: 800 },
            },
            color: {
              value: ["#ffffff", "#a3c9ff", "#0f52ba", "#6ec1e4", "#7f00ff"],
            },
            opacity: {
              value: 1,
              random: { enable: true, minimumValue: 0.3 },
              animation: {
                enable: true,
                speed: 2,
                minimumValue: 0.3,
                sync: false,
              },
            },
            size: {
              value: { min: 0.5, max: 2 },
            },
            move: {
              enable: true,
              speed: 0.6,
              direction: "none",
              outModes: "out",
            },
            rotate: {
              value: 0,
              random: true,
              direction: "clockwise",
              animation: {
                enable: true,
                speed: 2,
              },
            },
            twinkle: {
              particles: {
                enable: true,
                frequency: 0.3,
                color: "#ffffff",
                opacity: 1,
              },
            },
          },
        }}
        style={{ position: "fixed", top: 0, left: 0, zIndex: 1 }}
      />

      {/* Foreground Stars */}
      <Particles
        id="foreground-stars"
        options={{
          fullScreen: { enable: true, zIndex: 2 },
          background: { color: "black" },
          detectRetina: true,
          particles: {
            number: {
              value: 80,
              density: { enable: true, area: 600 },
            },
            color: { value: "#ffffff" },
            size: {
              value: { min: 0.3, max: 1.2 },
            },
            move: {
              enable: true,
              speed: 1.2,
              direction: "none",
              outModes: "out",
            },
            opacity: {
              value: 0.9,
              random: true,
            },
          },
        }}
        style={{ position: "fixed", top: 0, left: 0, zIndex: 2 }}
      />

      {/* Occasional Comets */}
      <Particles
        id="comets"
        options={{
          fullScreen: { enable: true, zIndex: 3 },
          background: { color: "black" },
          detectRetina: true,
          particles: {
            number: { value: 2 },
            shape: { type: "triangle" },
            size: { value: 2 },
            move: {
              enable: true,
              speed: 2,
              direction: "right",
              straight: true,
              outModes: "out",
            },
            opacity: {
              value: 0.8,
              animation: {
                enable: true,
                speed: 0.3,
                minimumValue: 0.2,
                sync: false,
              },
            },
            life: {
              duration: {
                value: 2,
                sync: false,
              },
              count: 1,
            },
            color: {
              value: ["#ffffff", "#a3c9ff"]
            },
          },
        }}
        style={{ position: "fixed", top: 0, left: 0, zIndex: 3 }}
      />
    </>
  );
}
