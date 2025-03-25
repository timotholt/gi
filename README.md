# gi

## Renderers

Now you can test all three renderers using these URLs:

Default (RC): http://localhost:xxxx/
Classic (RC): http://localhost:xxxx/?classic=true
Volumetric: http://localhost:xxxx/?volumetric=true
Naive: http://localhost:xxxx/?naive=true

Let me explain the different renderers in this WebGL-based global illumination (GI) system:

### Default/Classic (RC) Renderer (/?classic=true or just /)
- Main production renderer using the RC (Radiance Cascades) class
- Uses a cascaded approach to compute global illumination
- Most stable and performant option (~119 FPS)
- GPU timings showing efficient passes:
```
seedPass: 0.13ms
jfaPass: 2.45ms
dfPass: 0.09ms
gfPass: 0.11ms
rcPass-5: 0.66ms
rcPass-4: 1.58ms
rcPass-3: 1.00ms
rcPass-2: 0.66ms
rcPass-1: 0.60ms
rcPass-0: 0.58ms
Total: ~7.86ms
```

### Volumetric Renderer (/?volumetric=true)
- Uses VolumetricRC class for volumetric light transport
- More experimental and potentially more physically accurate
- About 3.3x slower than Classic (~59 FPS)
- GPU timings showing heavier computation:
```
rcPass-5: 1.21ms
rcPass-4: 6.00ms
rcPass-3: 4.19ms
rcPass-2: 2.63ms
rcPass-1: 1.59ms
rcPass-0: 1.16ms
Total: ~16.78ms
```
- Requires more UI controls (sun angle, probe spacing, ray counts, etc.)
- Middle passes (4,3,2) are most impacted due to volumetric scattering calculations

### Naive Renderer (/?naive=true)
- Uses NaiveRaymarchGi class
- As noted in the comments: "This renderer looks bad and is very slow"
- Uses a simple raymarch approach without optimizations
- Mainly kept for testing/comparison purposes
- Not recommended for production use

### Architecture
The inheritance hierarchy is:
```
Drawing (base)
└── GradientField
    ├── RC (Classic)
    ├── VolumetricRC
    └── NaiveRaymarchGi
```

Each renderer builds on the previous one:
1. Drawing provides basic canvas/WebGL setup
2. GradientField adds gradient computation for light transport
3. Each specific renderer (RC, VolumetricRC, NaiveRaymarchGi) implements its own approach to computing global illumination

Currently, the Classic RC renderer is the most stable and efficient option, while the others are either experimental (Volumetric) or for testing purposes (Naive).
