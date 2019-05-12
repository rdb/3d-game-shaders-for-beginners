/*
  (C) 2019 David Lettier
  lettier.com
*/

#version 140

uniform mat4 lensProjection;

uniform sampler2D positionFromTexture;
uniform sampler2D positionToTexture;
uniform sampler2D normalFromTexture;

uniform vec2 rior;

uniform vec2 enabled;
uniform vec2 useRefraction;

out vec4 fragColor;

void main() {
  float steps       = 100;
  float maxDistance = 15;
  float thickness   = 0.5;

  vec2 texSize  = textureSize(positionFromTexture, 0).xy;
  vec2 texCoord = gl_FragCoord.xy / texSize;

  vec4 uv = vec4(0);
  if (useRefraction.x == 1) {
       uv = vec4(texCoord.x, texCoord.y, 1, 1);
  }

  if (enabled.x != 1) { fragColor = uv; return; }

  vec4 positionFrom     = texture(positionFromTexture, texCoord);
  vec3 unitPositionFrom = normalize(positionFrom.xyz);
  vec3 normalFrom       = normalize(texture(normalFromTexture, texCoord).xyz);
  vec3 pivot            = normalize(reflect(unitPositionFrom, normalFrom));
  if (useRefraction.x == 1) {
       pivot            = normalize(refract(unitPositionFrom, normalFrom, rior.x));
  }

  float stepSize = maxDistance / steps;
  float count    = 1;

  for (float i = 0; i < steps; ++i) {
    float distance = count * stepSize;
    if (distance > maxDistance) { break; }

    vec3 offset = positionFrom.xyz + (pivot * distance);

    vec4 offsetUv      = vec4(offset, 1);
         offsetUv      = lensProjection * offsetUv;
         offsetUv.xyz /= offsetUv.w;
         offsetUv.xy   = offsetUv.xy * 0.5 + 0.5;

    if
      (  offsetUv.x <  0
      || offsetUv.y <  0
      || offsetUv.z < -1
      || offsetUv.x >  1
      || offsetUv.y >  1
      || offsetUv.z >  1
      ) { break; }

    // Config.prc
    // gl-coordinate-system default
    // textures-auto-power-2 1
    // textures-power-2 down

    vec4 offsetPosition = texture(positionToTexture, offsetUv.xy);

    if
      (  offset.y >= offsetPosition.y
      && offset.y <= offsetPosition.y + thickness
      ) {
      float visibility = 1 - max(dot(pivot, -unitPositionFrom), 0);

      uv = vec4(offsetUv.x, offsetUv.y, visibility, visibility);

      count                  -= 1;
      maxDistance             = distance;
      float previousDistance  = count * stepSize;
      float stepsLeft         = max(steps - i, 1);
      stepSize                = (maxDistance - previousDistance) / stepsLeft;
    } else {
      count += 1;
    }
  }

  fragColor = uv;
}
