/*
  (C) 2019 David Lettier
  lettier.com
*/

#version 140

uniform sampler2D baseTexture;
uniform sampler2D refractionTexture;
uniform sampler2D foamTexture;
uniform sampler2D reflectionTexture;
uniform sampler2D specularTexture;

out vec4 fragColor;

void main() {
  vec2 texSize  = textureSize(baseTexture, 0).xy;
  vec2 texCoord = gl_FragCoord.xy / texSize;

  vec4 base       = texture(baseTexture,             texCoord);
  vec4 refraction = texture(refractionTexture,       texCoord);
  vec4 foam       = texture(foamTexture,             texCoord);
  vec4 reflection = texture(reflectionTexture,       texCoord);
  vec4 specular   = texture(specularTexture,         texCoord);

  fragColor      = base;
  fragColor.rgb  = mix(fragColor.rgb, refraction.rgb, min(refraction.a, 1));
  fragColor.rgb  = mix(fragColor.rgb, reflection.rgb, min(reflection.a, 1));
  fragColor.rgb  = mix(fragColor.rgb, foam.rgb,       min(foam.a,       1));
  fragColor.rgb += specular.rgb * min(specular.a, 1);
}
