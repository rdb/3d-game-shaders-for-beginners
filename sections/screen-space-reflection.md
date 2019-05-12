[:arrow_backward:](ssao.md)
[:arrow_double_up:](../README.md)
[:arrow_up_small:](#)
[:arrow_down_small:](#copyright)
[:arrow_forward:](screen-space-refraction.md)

# 3D Game Shaders For Beginners

## Screen Space Reflection (SSR)

![Screen Space Reflections](https://i.imgur.com/a73tj8h.gif)

Adding reflections can really ground your scene.
Wet and shiny objects spring to life as nothing makes
something look wet or shiny quite like reflections.
With reflections, you can really sell the illusion of water and metallic objects.

In the [lighting](lighting.md) section, you simulated the reflected, mirror-like image of the light source.
This was the process of rendering the specular reflection.
Recall that the specular light was computed using the reflected light direction.
Similarly, using screen space reflection or SSR, you can simulate the reflection of
other objects in the scene instead of just the light source.
Instead of the light ray coming from the source and bouncing off into the camera,
the light ray comes from some object in the scene and bounces off into the camera.

SSR works by reflecting the screen image onto itself using only itself.
Compare this to cube mapping which uses six screens or textures.
In cube mapping, you reflect a ray from some point in your scene
to some point on the inside of a cube surrounding your scene.
In SSR, you reflect a ray from some point on your screen to some other point on your screen.
By reflecting your screen onto itself, you can create the illusion of reflection.
This illusion holds for the most part but SSR does fail in some cases as you'll see.

### Vertex Positions

Like SSAO, you'll need the vertex positions in view space.
Referrer back to [SSAO](ssao.md#vertex-positions) for details.

### Vertex Normals

To compute the reflections, you'll need the vertex normals in view space.
Referrer back to [SSAO](ssao.md#vertex-normals) for details.

![SSR using normal maps.](https://i.imgur.com/zTOOaL2.gif)

Here you see SSR using the normal mapped normals instead of the vertex normals.
Notice how the reflection follows the ripples in the water versus the more mirror
like reflection shown earlier.

To use the normal maps instead,
you'll need to transform the normal mapped normals from tangent space to view space
just like you did in the lighting calculations.
You can see this being done in [normal.frag](../demo/shaders/fragment/normal.frag).

### Position Transformations

![Position Transformations](https://i.imgur.com/Qnsvkc0.gif)

Just like
[SSAO](ssao.md),
SSR goes back and forth between the screen and view space.
You'll need the camera lens' projection matrix to transform points in view space to clip space.
From clip space, you'll have to transform the points again to UV space.
Once in UV space,
you can sample a vertex/fragment position from the scene
which will be the closest position in the scene to your sample.
This is the _screen space_ part in _screen space reflection_
since the "screen" is a texture UV mapped over a screen shaped rectangle.

### Reflected UV Coordinates

There are a few ways you can implement SSR.
The example code computes a reflected UV coordinate for each screen fragment
but you could compute the reflected color instead, using the final rendering of the scene.

Recall that UV coordinates range from zero to one for both U and V.
The screen is just a 2D texture UV mapped over a screen-sized rectangle.
Knowing this, the example code doesn't actually need the final rendering of the scene
to compute the reflections.
It can instead calculate what UV coordinate each screen pixel will eventually use.
These calculated UV coordinates can be saved to a framebuffer texture
and used later when the scene has been rendered.

![Reflected UVs](https://i.imgur.com/cHSKY98.gif)

Here you see the reflected UV coordinates.
Without even rendering the scene yet,
you can get a good feel for what the reflections will look like.

```c
//...

uniform mat4 lensProjection;

uniform sampler2D positionTexture;
uniform sampler2D normalTexture;

//...
```

Recall that you'll need the camera lens' projection matrix
and the positions and normals, in view space, for each vertex.

```c
  // ...

  float steps       = 100;
  float maxDistance = 15;
  float thickness   = 1;

  // ...
```

Like the other effects, SSR has a few parameters you can adjust.
Increasing the `steps` will increase the resolution of the reflections
at the cost of performance.
Increasing the `maxDistance` will keep reflections from being cut off prematurely
at the cost of performance.
The `thickness` controls the cutoff between what counts as a possible
reflection and what does not.

```c
  // ...

  vec2 texSize  = textureSize(positionTexture, 0).xy;
  vec2 texCoord = gl_FragCoord.xy / texSize;

  vec4 position     = texture(positionTexture, texCoord);
  vec3 unitPosition = normalize(position.xyz);
  vec3 normal       = normalize(texture(normalTexture, texCoord).xyz);
  vec3 reflection   = normalize(reflect(unitPosition, normal));

  // ...
```

Pull out the vertex position, normal, and the reflection about the normal.
The position is a vector from the camera position to the vertex position.
The normal is a vector pointing out of the surface at the vertex position.
And the reflection is a ray pointing in the direction of the reflection of the position ray.
It currently has a length or magnitude of one.

![SSR Ray Marching](https://i.imgur.com/wnAC7NI.gif)

Here you see ray marching being used to calculate the reflected UV
coordinate per fragment.
The vertex normal is the bright green arrow,
the position vector is the bright blue arrow,
and the bright red vector is the reflection ray marching through view space.

```c
  // ...

  float stepSize = maxDistance / steps;
  float count    = 1;

  // ...
```

Ray marching is the process of increasing the magnitude or length of a vector
over a number of iterations or steps.
The purpose for extending a ray out is to find an intersection or hit.
A hit meaning the ray touched some geometry in the scene.

```c
  // ...

  vec4 uv = vec4(0);

  // ...
```

Initialize the reflected coordinate to fully transparent black.
If the marching ray doesn't hit any geometry,
this will be set as the fragment color meaning this fragment
reflects nothing.

```c
  // ...

  for (float i = 0; i < steps; ++i) {
    float distance = count * stepSize;
    if (distance > maxDistance) { break; }

    // ...
```

Begin to step through the marching process.
At the start of each step or iteration, calculate the distance or length
you'll move to.
If you go over the `maxDistance`, exit the marching process.

```c
    // ...

    vec3 offset = position.xyz + (reflection * distance);

    // ...
```

Now generate an offset vector by first extending the length of the reflection vector
and then adding this result to the position vector.
This is the point in view space you'll use to sample the screen texture.

![Screen Space Transformations](https://i.imgur.com/Qnsvkc0.gif)

```c
    // ...

    vec4 offsetUv      = vec4(offset, 1.0);
         offsetUv      = lensProjection * offsetUv;
         offsetUv.xyz /= offsetUv.w;
         offsetUv.xy   = offsetUv.xy * 0.5 + 0.5;

    // ...
```

Convert the offset point to clip space and then to UV space.

![Reflection ray exiting the frustum.](https://i.imgur.com/i0btBna.gif)

```c
    // ...

    if
      (  offsetUv.x <  0
      || offsetUv.y <  0
      || offsetUv.z < -1
      || offsetUv.x >  1
      || offsetUv.y >  1
      || offsetUv.z >  1
      ) { break; }

    // ...
```

One of the cases where SSR fails is when the reflection vector
extends past the camera's frustum.
If this is the case, stop ray marching.

```c
    // ...

    vec4 offsetPostion = texture(positionTexture, offsetUv.xy);

    // ...
```

Pull out the actual, camera-captured vertex position at the offset point.

```c
    // ...

    if
      (  offset.y >= offsetPostion.y
      && offset.y <= offsetPostion.y + thickness
      ) {

    // ...
```

If the offset point's scene depth
touches or penetrates the "wall" of some scene geometry,
count this as a hit.

![Reflection ray pointing towards the camera position.](https://i.imgur.com/7e2cOdZ.gif)

Here you see another failure case for SSR.
The reflection ray points in the general direction of the camera and hits a piece of geometry.
The screen captured only the front of the plane, not the back of the plane.
This hit says the back wall should reflect the back of the plane, which is correct, but the
screen doesn't have this information.
What this would do instead is reflect the front of the plane on the back wall which wouldn't look right.

```c
      // ...

      float visibility = 1 - max(dot(reflection, -unitPosition), 0);

      // ...
```

To handle this failure case, you'll need to gradually fade out the reflection based
on how much the reflection vector points to the camera's position.
If the reflection vector points directly in the opposite direction of the position vector,
the visibility is zero.
Any other direction results in the visibility being greater than zero.

Remember to normalize both vectors when taking the dot product.
`unitPosition` is the normalized position vector.
It has a length or magnitude of one.

```c
      // ...

      uv = vec4(offsetUv.x, offsetUv.y, visibility, visibility);

      // ...
```

Since this was a hit, store the reflected UV coordinates for this fragment.
You can use the blue channel to store the visibility since you only
need two channels to store the reflected UV coordinate.

```c
      // ...

      count                 -= 1;
      maxDistance            = distance;
      float previousDistance = count * stepSize;
      float stepsLeft        = max(steps - i, 1);
      stepSize               = (maxDistance - previousDistance) / stepsLeft;

      // ...
```

Now that you've hit some geometry, go back (to where you didn't hit anything)
and approach this hit at a slower pace using a smaller step size.
This will increase the precision of the reflection.
What you want to do is find the surface of the most immediate piece of geometry in the path of the reflection ray.
When the ray first starts off,
it leaps through the scene, possibly passing over multiple surfaces in a single iteration.
What this will do is back the ray up to where it didn't hit anything and have it tip toe up to where it hit last
in the hopes of finding a closer surface point.

```c
    // ...

    } else {
      count      += 1;
    }

    // ...
```

If you didn't hit anything, increase the count which will increase the distance in the next iteration.

```c

  fragColor = uv;
}
```

In the end, assign the fragment color the last known reflected UV or hit.

### Specular Map

![Specular Map](https://i.imgur.com/iuFYVWB.gif)

In addition to the reflected UV coordinates, you'll also need a specular map.
The example code creates one using the fragment's material specular properties.

```c
// ...

#define MAX_SHININESS 127.75

uniform struct
  { vec3 specular
  ; float shininess
  ;
  } p3d_Material;

out vec4 fragColor;

void main() {
  fragColor =
    vec4
      ( p3d_Material.specular
      , clamp(p3d_Material.shininess / MAX_SHININESS, 0, 1)
      );
}
```

The specular fragment shader is quite simple.
Using the fragment's material,
the shader outputs the specular color and uses the alpha channel for the shininess.
The shininess is mapped to a range of zero to one.
In Blender, the maximum specular hardness or shininess is 511.
When exporting from Blender to Panda3D, 511 is exported as 127.75.
Feel free to adjust the shininess to range of zero to one however you see fit for your particular stack.

The example code generates a specular map from the material specular properties but you
could create one in GIMP, for example, and attach that as a texture to your 3D model.
For instance,
say your 3D treasure chest has shiny brackets on it but nothing else should reflect the environment.
You can paint the brackets some shade of gray and the rest of the treasure chest black.
This will mask off the brackets, allowing your shader to render the reflections on only the brackets
and nothing else.

### Scene Colors

![Scene Colors](https://i.imgur.com/diBSxPI.png)

You'll need to render the parts of the scene you wish to reflect and store this in a framebuffer texture.
This is typically just the scene without any reflections.

### Blurred Scene Colors

![Blurred Scene Colors](https://i.imgur.com/XVzBfDU.png)

Now blur the scene colors you wish to reflect and store this in a framebuffer texture.
The blurring is done using a box blur.
Refer to the [SSAO blurring](ssao.md#blurring) step for details.

### Reflected Scene Colors

![Reflection](https://i.imgur.com/zBnRpyP.png)

Here you see just the reflections saved to a framebuffer texture.

```c
// ...

uniform sampler2D uvTexture;
uniform sampler2D specularTexture;
uniform sampler2D colorTexture;
uniform sampler2D colorBlurTexture;

// ...
```

To generate the reflections, you'll need the following.

- The reflected UV coordinates.
- The specular map.
- The texture you'll reflect.
- The blurred version of the texture you'll reflect.

```c
  // ...

  vec4 uv        = texture(uvTexture,        texCoord);
  vec4 specular  = texture(specularTexture,  texCoord);
  vec4 color     = texture(colorTexture,     uv.xy);
  vec4 colorBlur = texture(colorBlurTexture, uv.xy);

  // ...
```

Pull out the UV coordinates, the specular amount and shininess, the scene color, and the blurred scene color.
Notice how the color and blurred color use the reflected UV coordinates.
This is where you connect the calculated reflections to the actual reflected colors.

```c
  // ...

  float specularAmount = dot(specular.rgb, vec3(1)) / 3;

  if (specularAmount <= 0) { fragColor = vec4(0); return; }

  // ...
```

Map the specular color to a greyscale value.
If the specular amount is none, set the frag color to nothing and return;

```c
  dot(specular.rgb, vec3(1)) == (specular.r + specular.g + specular.b);
```

Using the dot product to produce the greyscale value is just a short way of summing the three color components.

```c
  // ...

  float roughness = 1 - min(specular.a, 1);

  // ...
}
```

Calculate the roughness based on the shininess value set during the specular map step.
Recall that the shininess value was saved in the alpha channel of the specular map.
The shininess determined how spread out or blurred the specular reflection was.
Similarly, the `roughness` determines how blurred the reflection is.
A roughness of one will produce the blurred reflection color.
A roughness of zero will produce the non-blurred reflection color.
Doing it this way allows you to control how blurred the reflection is just by changing
the material's shininess value.

The example code generates a roughness map from the material specular properties but you
could create one in GIMP, for example, and attach that as a texture to your 3D model.
For instance, say you have a tiled floor that has polished tiles and scratched up tiles.
The polished tiles could be painted a dark gray while the scratched up tiles could be painted
white.
The brighter the greyscale value, the more the shader will use the blurred reflected color.
So the scratched tiles will have a blurry reflection but the polished tiles will have a
mirror-like reflection.

```c
  // ...

  vec3  reflection  = mix(color.rgb, colorBlur.rgb, roughness);
  float alpha       = uv.b * specularAmount;
        reflection  = mix(vec3(0), reflection, alpha);

  // ...
```

The reflection color is a mix between the reflected scene color and the blurred reflected scene color based on the roughness.
A high roughness will produce a blurry reflection meaning the surface is rough.
A low roughness will produce a clear reflection meaning the surface is smooth.

```c
  // ...

  float alpha       = uv.b * specularAmount;
        reflection  = mix(vec3(0), reflection, alpha);

  // ...
```

The reflection alpha is based on the specular amount and the visibility calculated during the reflected UV coordinates step.
Recall that that the blue channel was used to store the visibility of the reflection.
This visibility, multiplied by the specular amount, determines the perceptibility of the reflection.
Doing it this way allows you to control how much a material reflects its environment
simply by brightening or darkening the specular color.

```c
fragColor = vec4(reflection, alpha);
```

Set the fragment color to the reflection color and alpha.

### Source

- [main.cxx](../demo/src/main.cxx)
- [base.vert](../demo/shaders/vertex/base.vert)
- [basic.vert](../demo/shaders/vertex/basic.vert)
- [position.frag](../demo/shaders/fragment/position.frag)
- [normal.frag](../demo/shaders/fragment/normal.frag)
- [material-specular.frag](../demo/shaders/fragment/material-specular.frag)
- [ssr.frag](../demo/shaders/fragment/ssr.frag)
- [reflection.frag](../demo/shaders/fragment/reflection.frag)
- [blur.frag](../demo/shaders/fragment/blur.frag)
- [base-combine.frag](../demo/shaders/fragment/base-combine.frag)

## Copyright

(C) 2019 David Lettier
<br>
[lettier.com](https://www.lettier.com)

[:arrow_backward:](ssao.md)
[:arrow_double_up:](../README.md)
[:arrow_up_small:](#)
[:arrow_down_small:](#copyright)
[:arrow_forward:](screen-space-refraction.md)
