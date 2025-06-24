import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadStarsPreset } from "tsparticles-preset-stars";

export default function StarfieldBackground() {
  const particlesInit = useCallback(async (engine) => {
    await loadStarsPreset(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={{
        preset: "stars",
        fullScreen: { enable: true, zIndex: 0 },
        background: { color: "#000000" },
        detectRetina: true,
        interactivity: {
          detectsOn: "canvas",
          events: {
            onHover: {
              enable: true,
              mode: ["parallax", "trail"], // 🔥 add trail
            },
            resize: true,
          },
          modes: {
            parallax: {
              enable: true,
              force: 30,
              smooth: 10,
            },
            trail: {
              delay: 0.1,
              quantity: 1,
              particles: {
                color: {
                  value: ["#ffffff", "#a3c9ff", "#0f52ba", "#6ec1e4", "#7f00ff"],
                },
                size: {
                  value: { min: 0.5, max: 2 },
                },
                move: {
                  speed: 0.6,
                  outModes: { default: "out" },
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
              },
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
    />
  );
}
