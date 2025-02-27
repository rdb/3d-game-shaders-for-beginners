[:arrow_backward:](outlining.md)
[:arrow_double_up:](../README.md)
[:arrow_up_small:](#)
[:arrow_down_small:](#copyright)
[:arrow_forward:](bloom.md)

# 3D Game Shaders For Beginners

## Fog

![Fog](https://i.imgur.com/r39BCkt.gif)

Fog (or mist as it's called in Blender) adds atmospheric haze to a scene, providing mystique and softening pop-ins.
A pop-in occurs when some geometry suddenly enters into the camera's frustum.

```c
// ...

uniform vec4 color;

uniform vec2 nearFar;

// ...
```

To calculate the fog, you'll need its color, near distance, and far distance.

```c
// ...

uniform sampler2D positionTexture;

  // ...

  vec2 texSize  = textureSize(positionTexture, 0).xy;
  vec2 texCoord = gl_FragCoord.xy / texSize;

  vec4 position = texture(positionTexture, texCoord);

  // ...
```

In addition to the fog's attributes, you'll also need the fragment's vertex `position`.

```c
  float fogMin = 0.00;
  float fogMax = 0.97;
```

`fogMax` controls how much of the scene is still visible when the fog is most intense.
`fogMin` controls how much of the fog is still visible when the fog is least intense.

```c
  // ...

  float near = nearFar.x;
  float far  = nearFar.y;

  float intensity =
    clamp
      (   (position.y - near)
        / (far        - near)
      , fogMin
      , fogMax
      );

  // ...
```

The example code uses a linear model for calculating the fog's intensity.
There's also an exponential model you could use.

The fog's intensity is `fogMin` before or at the start of the fog's `near` distance.
As the vertex `position` gets closer to the end of the fog's `far` distance, the `intensity` moves closer to `fogMax`.
For any vertexes after the end of the fog, the `intensity` is clamped to `fogMax`.

```c
  // ...

  fragColor =
    mix
      ( vec4(0)
      , color
      , intensity
      );

  // ...
```

Based on the fog intensity, mix the fog color with the scene's color.
As `intensity` gets closer to one, you'll have less of the scene's color and more of the fog color.
When `intensity` reaches one, you'll have all fog color and nothing else.

```c
// ...

uniform sampler2D baseTexture;
uniform sampler2D fogTexture;

  // ...

  vec2 texSize  = textureSize(baseTexture, 0).xy;
  vec2 texCoord = gl_FragCoord.xy / texSize;

  vec4 baseColor             = texture(baseTexture,             texCoord);
  vec4 fogColor              = texture(fogTexture,              texCoord);

  fragColor      = baseColor;

  // ...

  fragColor      = mix(fragColor, fogColor, min(fogColor.a, 1));

  // ...
```

Normally you calculate the fog in the same shader that does the lighting calculations.
However, you can also break it out into its own framebuffer texture.
Here you see the fog color being applied to the rest of the scene much like you would apply a layer in GIMP.
This allows you to calculate the fog once instead calculating it in every shader that eventually needs it.

### Source

- [main.cxx](../demo/src/main.cxx)
- [basic.vert](../demo/shaders/vertex/basic.vert)
- [position.frag](../demo/shaders/fragment/position.frag)
- [normal.frag](../demo/shaders/fragment/normal.frag)
- [fog.frag](../demo/shaders/fragment/fog.frag)
- [outline.frag](../demo/shaders/fragment/outline.frag)
- [scene-combine.frag](../demo/shaders/fragment/scene-combine.frag)

## Copyright

(C) 2019 David Lettier
<br>
[lettier.com](https://www.lettier.com)

[:arrow_backward:](outlining.md)
[:arrow_double_up:](../README.md)
[:arrow_up_small:](#)
[:arrow_down_small:](#copyright)
[:arrow_forward:](bloom.md)
