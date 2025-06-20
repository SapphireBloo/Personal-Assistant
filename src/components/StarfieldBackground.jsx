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
        background: { color: { value: "#000000" } },
        fullScreen: { enable: true, zIndex: 0 },
        detectRetina: true,
        interactivity: {
          detectsOn: "canvas",
          events: {
            onHover: { enable: true, mode: "repulse" },
            onClick: { enable: false },
            resize: true,
          },
          modes: {
            repulse: { distance: 200, duration: 0.5 },
          },
        },
        particles: {
          number: { value: 150, density: { enable: true, area: 800 } },
          color: { value: ["#ffffff", "#a3c9ff", "#0f52ba"] },
          opacity: {
            value: 1,
            random: { enable: true, minimumValue: 0.3 },
            animation: { enable: true, speed: 2, minimumValue: 0.3, sync: false }
          },
          size: {
            value: { min: 0.5, max: 2 },
            animation: { enable: false },
          },
          move: {
            enable: true,
            speed: 0.2,
            direction: "none",
            random: false,
            straight: false,
            outModes: "out"
          },
          twinkle: {
            particles: { enable: true, frequency: 0.3, color: "#ffffff" }
          }
        },
        emitters: {
          direction: "top-right",
          rate: { delay: 7, quantity: 1 },
          size: { width: 0, height: 0 },
          spawnColor: { value: "#ffffff", animation: { h: { enable: false } } },
          life: { duration: { sync: true, value: 1 }, count: 0 },
          particles: {
            shape: "star",
            size: { value: { min: 2, max: 4 }, animation: { enable: false } },
            move: {
              enable: true,
              gravity: { enable: true, acceleration: 9.81 },
              speed: { min: 10, max: 20 },
              decay: 0.3,
              direction: "bottom-left",
              outModes: "destroy"
            }
          }
        }
      }}
    />
  );
}

