// WebGPU client compute: runs heavy level math (crowd/physics/particles) on the
// visitor's own GPU so hosting and backend limits are not hit. Falls back to CPU.
let devicePromise: Promise<any | null> | null = null;

export function getGPUDevice(): Promise<any | null> {
  if (devicePromise) return devicePromise;
  devicePromise = (async () => {
    try {
      const gpu = (navigator as any).gpu;
      if (!gpu) return null;
      const adapter = await gpu.requestAdapter({ powerPreference: "high-performance" });
      return adapter ? await adapter.requestDevice() : null;
    } catch { return null; }
  })();
  return devicePromise;
}

/** Runs a WGSL compute shader over a Float32Array (binding 0, read_write). */
export async function runCompute(wgsl: string, data: Float32Array, workgroups: number): Promise<Float32Array | null> {
  const device = await getGPUDevice();
  if (!device) return null;
  const G = (globalThis as any).GPUBufferUsage, M = (globalThis as any).GPUMapMode;
  const buf = device.createBuffer({ size: data.byteLength, usage: G.STORAGE | G.COPY_SRC | G.COPY_DST });
  device.queue.writeBuffer(buf, 0, data);
  const read = device.createBuffer({ size: data.byteLength, usage: G.MAP_READ | G.COPY_DST });
  const pipeline = device.createComputePipeline({ layout: "auto", compute: { module: device.createShaderModule({ code: wgsl }), entryPoint: "main" } });
  const bind = device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: buf } }] });
  const enc = device.createCommandEncoder();
  const pass = enc.beginComputePass();
  pass.setPipeline(pipeline); pass.setBindGroup(0, bind); pass.dispatchWorkgroups(workgroups); pass.end();
  enc.copyBufferToBuffer(buf, 0, read, 0, data.byteLength);
  device.queue.submit([enc.finish()]);
  await read.mapAsync(M.READ);
  const out = new Float32Array(read.getMappedRange().slice(0));
  read.unmap(); buf.destroy(); read.destroy();
  return out;
}

if (typeof window !== "undefined") {
  (window as any).__IEGPU = { getGPUDevice, runCompute, supported: () => !!(navigator as any).gpu };
}
