import uitoolkit from "@zoom/videosdk-ui-toolkit";
import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Physics } from "@react-three/rapier";
import {
  Environment,
  KeyboardControls,
  Loader,
  OrbitControls,
  Preload,
  Stats,
} from "@react-three/drei";
import { insertCoin, onPlayerJoin } from "playroomkit";
import { useStore } from "./components/store";
import * as THREE from "three";

export const Controls = {
  up: "up",
  down: "down",
  left: "left",
  right: "right",
  boost: "boost",
  shoot: "shoot",
  slow: "slow",
  reset: "reset",
  escape: "escape",
};

function App() {
  const zoomRef = useRef(false);
  const map = useMemo(
    () => [
      { name: Controls.up, keys: ["KeyW", "ArrowUp"] },
      { name: Controls.down, keys: ["KeyS", "ArrowDown"] },
      { name: Controls.left, keys: ["KeyA", "ArrowLeft"] },
      { name: Controls.right, keys: ["KeyD", "ArrowRight"] },
      { name: Controls.jump, keys: ["Space"] },
      { name: Controls.slow, keys: ["Shift"] },
      { name: Controls.shoot, keys: ["KeyE", "Click"] },
      { name: Controls.reset, keys: ["KeyR"] },
      { name: Controls.escape, keys: ["Escape"] },
    ],
    []
  );

  const { actions } = useStore();

  const startCall = async (name) => {
    const topic = new URL(window.location.href).hash.replace("#r=", "");
    if (zoomRef.current) return;
    zoomRef.current = true;
    const token = await generateSignature(topic, 1, sdkKey, sdkSecret);
    uitoolkit.joinSession(document.getElementById("sessionContainer"), {
      videoSDKJWT: token,
      sessionName: topic,
      userName: name,
      sessionPasscode: "",
      features: ["video", "audio"],
    });
  };
  const start = async () => {
    await insertCoin();

    onPlayerJoin(async (state) => {
      actions.addPlayer(state);

      actions.setId(state.id);

      state.onQuit(() => {
        actions.removePlayer(state);
      });
      await startCall(state.getProfile().name);
    });
  };

  useEffect(() => {
    start();
  }, []);

  return (
    <>
      <Loader />
      <Canvas
        // shadows
        dpr={1}
        gl={{
          antialias: false,
          stencil: false,
          depth: false,
          powerPreference: "high-performance",
        }}
        mode="concurrent"
        onCreated={({ gl, camera }) => {
          gl.toneMapping = THREE.AgXToneMapping;
          gl.setClearColor(0x000000, 0);
        }}
      >
        <Suspense fallback={null}>
          <Preload all />
          <Physics gravity={[0, -90, 0]} timeStep={"vary"}>
            <KeyboardControls map={map}>
              <Experience />
            </KeyboardControls>
          </Physics>
        </Suspense>
      </Canvas>
      <div
        id="sessionContainer"
        className="absolute w-[400px] h-[600px]"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          zIndex: 1000,
          width: 200,
          height: 850,
        }}
      />
    </>
  );
}

async function generateSignature(sessionName, role) {
  try {
    const request = await fetch("https://", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionName,
        role,
      }),
    });
    const json = await request.json();
    const sdkJWT = json.signature;
    return sdkJWT;
  } catch (e) {
    return null;
  }
}

export default App;
