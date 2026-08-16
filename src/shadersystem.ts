/**
 * Interface that describes the properties of a shader.
 */
export interface ShaderDescriptor {
  name: string;
  urlPath: string;
  vertexEntryPoint?: string;
  fragmentEntryPoint?: string;
  vertexLayouts?: GPUVertexBufferLayout[];
}

/**
 * Interface that represents the state of a rendering pipeline.
 */
export interface PipelineState {
  format: GPUTextureFormat;
  topology?: GPUPrimitiveTopology;
  depthFormat?: GPUTextureFormat;
  cullMode?: GPUCullMode;
}

/**
 * ShaderProgram class that represents a compiled shader program.
 */
export class ShaderProgram {
  private device: GPUDevice;
  private pipelineRegistry: Map<string, GPURenderPipeline>;

  public readonly module: GPUShaderModule;
  public readonly name: string;

  public readonly vertexEntryPoint: string;
  public readonly fragmentEntryPoint: string;
  public readonly vertexLayouts: GPUVertexBufferLayout[];

  /**
   * ShaderProgram constructor, initializes the shader program with a GPU device, shader module, and descriptor.
   * @param device The GPU device used to create the shader program.
   * @param module The compiled GPUShaderModule associated with this shader program.
   * @param desc The ShaderDescriptor that provides metadata about the shader program, including its name and entry points.
   */
  constructor(device: GPUDevice, module: GPUShaderModule, desc: ShaderDescriptor) {
    this.device = device;
    this.module = module;
    this.name = desc.name;
    this.vertexEntryPoint = desc.vertexEntryPoint ?? 'vs_main';
    this.fragmentEntryPoint = desc.fragmentEntryPoint ?? 'fs_main';
    this.vertexLayouts = desc.vertexLayouts ?? [];
    this.pipelineRegistry = new Map();
  }

  /**
   * Retrieves a cached pipeline matching the requested state, or builds and caches a new pipeline if one does not exist for the given state.
   * @param state The PipelineState that describes the desired configuration for the rendering pipeline.
   */
  public getPipeline(state: PipelineState): GPURenderPipeline {
    const topology = state.topology ?? 'triangle-list';
    const cullMode = state.cullMode ?? 'none';
    const depthFormat = state.depthFormat ?? 'none';

    const cacheKey = `${state.format}_${topology}_${cullMode}_${depthFormat}`;

    if (this.pipelineRegistry.has(cacheKey)) {
      return this.pipelineRegistry.get(cacheKey)!;
    }

    const pipelineDescriptor: GPURenderPipelineDescriptor = {
      label: `${this.name}_pipeline_${cacheKey}`,
      layout: 'auto',
      vertex: {
        module: this.module,
        entryPoint: this.vertexEntryPoint,
        buffers: this.vertexLayouts,
      },
      fragment: {
        module: this.module,
        entryPoint: this.fragmentEntryPoint,
        targets: [
          {
            format: state.format
          }
        ],
      },
      primitive: {
        topology: topology,
        cullMode: cullMode,
      },
    };

    if (state.depthFormat) {
      pipelineDescriptor.depthStencil = {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: state.depthFormat,
      };
    }

    const pipeline = this.device.createRenderPipeline(pipelineDescriptor);
    this.pipelineRegistry.set(cacheKey, pipeline);

    console.log(`[ShaderProgram.getPipeline] Created and cached new pipeline for shader '${this.name}' with key '${cacheKey}'.`);

    return pipeline;
  }
}

/**
 * ShaderSystem class for managing shader modules in the engine.
 */
export class ShaderSystem {
  private device: GPUDevice;
  
  /**
   * Cache that stores compiled shader programs, keyed by their names.
   */
  private programs: Map<string, ShaderProgram>;

  /**
   * ShaderSystem constructor, initializes the shader system with a GPU device and prepares the cache for shader programs.
   * @param device The GPU device used to create and manage shader programs.
   */
  constructor(device: GPUDevice) {
    this.device = device;
    this.programs = new Map();
  }

  /**
   * Loads a shader program from a specified URL path and caches it for future use. If the shader program is already cached, it returns the cached instance. If the shader program cannot be loaded or compiled, it logs an error and returns null.
   * @param desc The ShaderDescriptor that provides metadata about the shader program, including its name and URL path.
   * @returns The loaded ShaderProgram if successful, otherwise null.
   */
  public async load(desc: ShaderDescriptor): Promise<ShaderProgram | null> {
    if (this.programs.has(desc.name)) {
      console.log(`[ShaderSystem.load] Shader program '${desc.name}' is already cached.`);
      return this.programs.get(desc.name)!;
    }

    try {
      const response = await fetch(desc.urlPath);

      if (!response.ok) {
        console.error(`[ShaderSystem.load] Failed to ingest shader payload from '${desc.urlPath}'. HTTP ${response.status}`);
        return null;
      }

      const code = await response.text();

      const module = this.device.createShaderModule({
        label: desc.name,
        code: code,
      });

      const program = new ShaderProgram(this.device, module, desc);
      this.programs.set(desc.name, program);
      console.log(`[ShaderSystem.load] ShaderProgram '${desc.name}' loaded and cached successfully.`);

      return program;
    } catch (error) {
      console.error(`[ShaderSystem.load] Unhandled exception during shader ingestion for '${desc.name}':`, error);
      return null;
    }
  }

  /**
   * Gets a cached shader program by name. If the shader program is not found in the cache, logs an error and returns null.
   * @param name The name of the shader program to retrieve from the cache.
   * @returns The cached ShaderProgram if found, otherwise null.
   */
  public get(name: string): ShaderProgram | null {
    const program = this.programs.get(name);

    if (!program) {
      console.error(`[ShaderSystem.get] Shader program '${name}' not found in cache.`);
      return null;
    }

    return program;
  }

  /**
   * Clears cached shader programs. If a name is provided, it clears the specific shader program from the cache; otherwise, it clears all cached shader programs.
   * @param name Optional name of the shader program to clear from the cache. If not provided, all cached shader programs will be cleared.
   */
  public clear(name?: string): void {
    if (name) {
      console.log(`[ShaderSystem.clear] Clearing cached shader program '${name}'.`);
      this.programs.delete(name);
    } else {
      console.log('[ShaderSystem.clear] Clearing all cached shader programs.');
      this.programs.clear();
    }
  }
}
