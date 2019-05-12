[:arrow_backward:](fog.md)
[:arrow_double_up:](../README.md)
[:arrow_up_small:](#)
[:arrow_down_small:](#copyright)
[:arrow_forward:](ssao.md)

# 3D Game Shaders For Beginners

## Bloom

![Window Bloom](https://i.imgur.com/pv2pQjO.gif)

Adding bloom to a scene can really sell the illusion of the lighting model.
Light emitting objects are more believable and specular highlights get an extra dose of shimmer.

```c
  //...

  float separation = 3;
  int   samples    = 15;
  float threshold  = 0.5;
  float amount     = 1;

  // ...
```

Feel free to tweak these parameters to your liking.
Separation increases the size of the blur.
Samples determines how blurred the effect is.
Threshold controls what does and does not get picked up by the effect.
Amount controls how much bloom is outputted.

```c
  // ...

  int size  = samples;
  int size2 = size * size;

  int x = 0;
  int y = 0;

  // ...

  float value = 0;

  vec4 result = vec4(0);
  vec4 color = vec4(0);

  // ...

  for (int i = 0; i < size2; ++i) {
    // ...
  }

  // ...
```

The technique starts off by running through a `samples` by `samples` window centered over the current fragment.
This is similar to the window used for outlining.

```c
    // ...

    color =
      texture
        ( bloomTexture
        ,   ( gl_FragCoord.xy
            + vec2(x * separation, y * separation)
            )
          / texSize
        );

    value = ((0.3 * color.r) + (0.59 * color.g) + (0.11 * color.b));
    if (value < threshold) { color = vec4(0); }

    result += color;

    // ...
```

It retrieves the color from the input texture and turns the red, green, and blue values into a greyscale value.
If this greyscale value is less than the threshold, it discards this color by making it solid black.

As it loops through all the samples in the window, it accumulates all of their values into `result`.

```c
  // ...

  result = result / size2;

  // ...
```

After it's done gathering up the samples, it divides the sum of the color samples by the number of samples taken.
The result is the average color of itself and its neighbors.
By doing this for every fragment, you end up with a blurred image.
This form of blurring is known as box blur.

![Bloom progresssion.](https://i.imgur.com/m4yedrM.gif)

Here you see the progression of the bloom algorithm.

### Source

- [main.cxx](main.cxx)
- [basic.vert](shaders/vertex/basic.vert)
- [bloom.frag](shaders/fragment/outline.frag)

## Copyright

(C) 2019 David Lettier
<br>
[lettier.com](https://www.lettier.com)

[:arrow_backward:](fog.md)
[:arrow_double_up:](../README.md)
[:arrow_up_small:](#)
[:arrow_down_small:](#copyright)
[:arrow_forward:](ssao.md)
