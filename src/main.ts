import './style.css';

async function initWebGPU() {
  const app = document.getElementById('app');

  if (!app) {
    console.error('App element not found.');
    return;
  }

  if (!navigator.gpu) {
    console.error('WebGPU not supported on this browser.');
    return;
  }

  const adapter = await navigator.gpu.requestAdapter();

  if (!adapter) {
    console.error('Failed to get GPU adapter. This means that WebGPU is supported, however, no suitable GPU hardware was found.');
    return;
  }

  console.log("WebGPU initialized successfully.");
}

initWebGPU().catch((error) => {
  console.error("WebGPU Initialization failed:", error);
});
