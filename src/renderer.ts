export class Renderer {
  private canvas: HTMLCanvasElement;
  private adapter!: GPUAdapter;
  private device!: GPUDevice;
  private context!: GPUCanvasContext;
  private format!: GPUTextureFormat;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

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

    console.log("[Renderer.initialize] Renderer initialized successfully.");

    return true;
  }

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
    passEncoder.end();

    // Submit the recorded commands to the GPU queue.
    this.device.queue.submit([commandEncoder.finish()]);
  }
}
