//=========== Copyright Grant Abernathy, All rights reserved. ================//
//
// Purpose: The entry point for the engine.
//
//============================================================================//

import './style.css';
import { Renderer } from './renderer.ts';

/**
 * Initializes the engine.
 * @returns void
 */
async function initEngine()
{
  const app = document.getElementById('app');

  if (!app) {
    console.error('[initEngine] Failed to find app element.');
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  app.appendChild(canvas);

  const renderer = new Renderer(canvas);
  const isInitialized = await renderer.initialize();

  if (!isInitialized) {
    console.error('[initEngine] Failed to initialize the renderer.');
    return;
  }

  function frame()
  {
    renderer.draw();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

// Entry point
initEngine().catch((error) =>
{
  console.error('[initEngine] An error occurred during initialization:', error);
});
