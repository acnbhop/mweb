/**
 * ShaderSystem class for managing shader modules in the engine.
 */
export class ShaderSystem {
  private device: GPUDevice;
  
  /**
   * Cache for storing compiled shader modules, they are keyed by the name provided during loading.
   */
  private cache: Map<string, GPUShaderModule>;

  /**
   * ShaderSystem constructor, initializes the shader system with a GPU device and an empty cache for shader modules.
   * @param device The GPU device used to create shader modules.
   */
  constructor(device: GPUDevice) {
    this.device = device;
    this.cache = new Map();
  }

  /**
   * Fetches a WGSL file from the specified URL, compiles it, and caches the result.
   * @param name The name to associate with the shader module in the cache.
   * @param urlPath The URL path to the WGSL file to fetch and compile.
   */
  public async load(name: string, urlPath: string): Promise<GPUShaderModule | null> {
    if (this.cache.has(name)) {
      console.log(`[ShaderSystem.load] Shader module '${name}' is already cached.`);
      return this.cache.get(name)!;
    }

    try {
      const response = await fetch(urlPath);

      if (!response.ok) {
        console.error(`[ShaderSystem.load] Failed to load shader payload from '${urlPath}'. Status: ${response.status}`);
        return null;
      }

      const code = await response.text();

      const module = this.device.createShaderModule({
        label: name,
        code: code,
      });

      this.cache.set(name, module);

      console.log(`[ShaderSystem.load] Shader module '${name}' compiled and cached.`);

      return module;
    } catch (error) {
      console.error(`[ShaderSystem.load] Exception caught while loading shader '${name}':`, error);
      return null;
    }
  }

  /**
   * Gets a cached shader module by name. If the shader module is not found, logs an error and returns null.
   * @param name The name of the shader module to retrieve from the cache.
   * @returns The cached GPUShaderModule if found, otherwise null.
   */
  public get(name: string): GPUShaderModule | null {
    const module = this.cache.get(name);

    if (!module) {
      console.error(`[ShaderSystem.get] Shader '${name}' not found in cache. Was it loaded?`);
      return null;
    }

    return module;
  }

  /**
   * Clears a specific shader or the entire cache to free GPU memory.
   * @param name Optional name of the shader module to clear. If not provided, clears all cached shader modules.
   */
  public clear(name?: string): void {
    if (name) {
      console.log(`[ShaderSystem.clear] Clearing cached shader module '${name}'.`);
      this.cache.delete(name);
    } else {
      console.log('[ShaderSystem.clear] Clearing all cached shader modules.');
      this.cache.clear();
    }
  }
}
