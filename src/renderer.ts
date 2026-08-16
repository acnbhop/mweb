import { ShaderSystem } from './shadersystem';

/**
 * Renderer class.
 */
export class Renderer {
  private canvas: HTMLCanvasElement;
  private adapter!: GPUAdapter;
  private device!: GPUDevice;
  private context!: GPUCanvasContext;
  private format!: GPUTextureFormat;

  public shaderSystem!: ShaderSystem;
  private pipeline!: GPURenderPipeline;

  /**
   * Renderer constructor, initializes the renderer with a canvas element.
   * @param canvas The HTML canvas element where the rendering will take place.
   */
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  /**
   * Initializes the WebGPU renderer by requesting an adapter and device, and configuring the canvas context.
   * @returns A promise that resolves to true if the renderer is initialized successfully, otherwise false.
   */
  public async initialize(): Promise<boolean> {
    if (!navigator.gpu) {
      console.error('[Renderer.initialize] WebGPU not supported on this browser.');
      return false;
    }

    const adapter = await navigator.gpu.requestAdapter();

    if (!adapter) {
      console.error('[Renderer.initialize] Failed to get GPU adapter. This means that WebGPU is supported, however, no suitable GPU hardware was found.');
      return false;
    }

    this.adapter = adapter;

    const device = await this.adapter.requestDevice();

    if (!device) {
      console.error('[Renderer.initialize] Failed to acquire the logical GPU device.');
      return false;
    }

    this.device = device;

    const context = this.canvas.getContext('webgpu');

    if (!context) {
      console.error('[Renderer.initialize] Failed to get the WebGPU context from the canvas element.');
      return false;
    }

    this.context = context;
    this.format = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: device,
      format: this.format,
      alphaMode: 'premultiplied',
    });

    this.shaderSystem = new ShaderSystem(this.device);

    const testShader = await this.shaderSystem.load('testShader', '/shaders/test.wgsl');

    if (!testShader) {
      console.error('[Renderer.initialize] Failed to load the test shader.');
      return false;
    }

    this.pipeline = device.createRenderPipeline({
      label: 'Test Pipeline',
      layout: 'auto',
      vertex: {
        module: testShader,
        entryPoint: 'vs_main',
      },
      fragment: {
        module: testShader,
        entryPoint: 'fs_main',
        targets: [
          {
            format: this.format
          }
        ],
      },
      primitive: {
        topology: 'triangle-list',
      },
    });

    console.log("[Renderer.initialize] Renderer initialized successfully.");

    return true;
  }

  /**
   * Draws a frame using the WebGPU device and context. If the device or context is not initialized, logs an error and returns early.
   * @returns void
   */
  public draw(): void {
    if (!this.device || !this.context) {
      // What is specifically missing?
      var deviceMissing = false;
      var contextMissing = false;

      if (!this.device) {
        deviceMissing = true;
      }

      if (!this.context) {
        contextMissing = true;
      }

      console.error(`[Renderer.draw] Cannot draw because ${deviceMissing ? 'device is missing' : ''}${deviceMissing && contextMissing ? ' and ' : ''}${contextMissing ? 'context is missing' : ''}.`);
      return;
    }

    // Create command encoder to record GPU commands.
    const commandEncoder = this.device.createCommandEncoder();

    // Get the current texture from the canvas context to draw into.
    const textureView = this.context.getCurrentTexture().createView();

    // Define the render pass.
    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store'
        },
      ],
    };

    // Begin pass, record commands and end the pass.
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(this.pipeline);
    passEncoder.draw(3);
    passEncoder.end();

    // Submit the recorded commands to the GPU queue.
    this.device.queue.submit([commandEncoder.finish()]);
  }
}
