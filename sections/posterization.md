[:arrow_backward:](depth-of-field.md)
[:arrow_double_up:](../README.md)
[:arrow_up_small:](#)
[:arrow_down_small:](#copyright)
[:arrow_forward:](pixelization.md)

# 3D Game Shaders For Beginners

## Posterization

![Posterization](https://i.imgur.com/QjtPYp8.gif)

Posterization or color quantization is the process of reducing the number of unique colors in an image.
You can use this shader to give your game a comic book or retro look.
Combine it with outlining for a true cartoon look.

```c
  // ...

  float levels = 8;

  // ...
```

Feel free to tweak this parameter.
The higher it is, the more colors you'll end up with.
The lower it is, the less colors you'll end up with.

```c
  // ...

  vec4 texColor = texture(posterizeTexture, texCoord);

  // ...
```

You'll need the input color.

```c
    // ...

    vec3 grey  = vec3((texColor.r + texColor.g + texColor.b) / 3.0);
    vec3 grey1 = grey;

    grey = floor(grey * levels) / levels;

    texColor.rgb += (grey - grey1);

    // ...
```

This method of posterization I haven't seen before.
After having come up with it, I found it produced a nicer result than the typical methods.

To reduce the color palette, first convert the color to a greyscale value.
Quantize the color by mapping it to one of the levels.
Calculate the difference between the quantized greyscale value with the non-quantized greyscale value.
Add this difference to the input color.
This difference is the amount the color has to go up or down to reach the quantized greyscale value.

```c
  // ...

  fragColor = texColor;

  // ...
```

Be sure to assign the input color to the fragment color.

### Cel Shading

![Cel Shaded](https://i.imgur.com/xN3VQ0P.gif)

Posterization can give you that cel shaded look
as cel shading is the process of quantizing the diffuse and specular colors into discrete shades.
You'll want to use only solid diffuse colors, no to subtle normal mapping, and a small value for `levels`.

### Source

- [main.cxx](../demo/src/main.cxx)
- [basic.vert](../demo/shaders/vertex/basic.vert)
- [posterize.frag](../demo/shaders/fragment/posterize.frag)

## Copyright

(C) 2019 David Lettier
<br>
[lettier.com](https://www.lettier.com)

[:arrow_backward:](depth-of-field.md)
[:arrow_double_up:](../README.md)
[:arrow_up_small:](#)
[:arrow_down_small:](#copyright)
[:arrow_forward:](pixelization.md)
