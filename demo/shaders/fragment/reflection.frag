/*
  (C) 2019 David Lettier
  lettier.com
*/

#version 140

uniform sampler2D uvTexture;
uniform sampler2D specularTexture;
uniform sampler2D colorTexture;
uniform sampler2D colorBlurTexture;

out vec4 fragColor;

void main() {
  vec2 texSize  = textureSize(uvTexture, 0).xy;
  vec2 texCoord = gl_FragCoord.xy / texSize;

  vec4 uv        = texture(uvTexture,        texCoord);
  vec4 specular  = texture(specularTexture,  texCoord);
  vec4 color     = texture(colorTexture,     uv.xy);
  vec4 colorBlur = texture(colorBlurTexture, uv.xy);

  float specularAmount = dot(specular.rgb, vec3(1)) / 3;

  if (specularAmount <= 0) { fragColor = vec4(0); return; }

  float roughness = 1 - min(specular.a, 1);

  vec3  reflection  = mix(color.rgb, colorBlur.rgb, roughness);
  float alpha       = uv.b * specularAmount;
        reflection  = mix(vec3(0), reflection, alpha);

  fragColor = vec4(reflection, alpha);
}
