# gi

## Renderers

Now you can test all three renderers using these URLs:

Default (RC): http://localhost:xxxx/
Classic (RC): http://localhost:xxxx/?classic=true
Volumetric: http://localhost:xxxx/?volumetric=true
Naive: http://localhost:xxxx/?naive=true

Let me explain the different renderers in this WebGL-based global illumination (GI) system:

Default/Classic (RC) Renderer (/?classic=true or just /)
This is the main production renderer using the RC (Radiance Cascades) class
Uses a cascaded approach to compute global illumination
Most stable and performant option (as we saw earlier, running at ~119 FPS)
The one we were looking at earlier with the GPU timings showing efficient passes:

seedPass: 0.13ms
jfaPass: 2.45ms
dfPass: 0.09ms
gfPass: 0.11ms
rcPass-0 through rcPass-5: ~5.5ms total



Volumetric Renderer (/?volumetric=true)
Uses VolumetricRC class for volumetric light transport
Currently having initialization issues with missing UI elements
More experimental and potentially more physically accurate
Requires more UI controls (sun angle, probe spacing, ray counts, etc.)
Might be slower than the classic renderer but could produce better quality


Naive Renderer (/?naive=true)
Uses NaiveRaymarchGi class
As noted in the comments: "This renderer looks bad and is very slow"
Uses a simple raymarch approach without optimizations
Mainly kept for testing/comparison purposes
Not recommended for production use
The inheritance hierarchy is:

CopyInsert
Drawing (base)
└── GradientField
    ├── RC (Classic)
    ├── VolumetricRC
    └── NaiveRaymarchGi
Each renderer builds on the previous one:

Drawing provides basic canvas/WebGL setup

GradientField adds gradient computation for light transport
Each specific renderer (RC, VolumetricRC, NaiveRaymarchGi) implements its own approach to computing global illumination

Currently, the Classic RC renderer is the most stable and efficient option, while the others are either experimental (Volumetric) or for testing purposes (Naive).
