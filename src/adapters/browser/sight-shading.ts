import * as THREE from 'three';

/** Tint world surfaces, including cover tops; a ground decal alone leaves the arena fully readable. */
export function shadeBySight(material:THREE.MeshStandardMaterial,texture:THREE.DataTexture,size:THREE.Vector2):void {
  material.onBeforeCompile=shader=>{
    shader.uniforms.sightTexture={value:texture};shader.uniforms.sightMapSize={value:size};
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vSightWorld;').replace('#include <project_vertex>','vSightWorld = (modelMatrix * vec4(transformed, 1.0)).xz;\n#include <project_vertex>');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vSightWorld;\nuniform sampler2D sightTexture;\nuniform vec2 sightMapSize;').replace('#include <fog_fragment>',`#include <fog_fragment>
      vec2 sightUv = vSightWorld / sightMapSize;
      float visibleGround = 1.0;
      if (sightUv.x >= 0.0 && sightUv.y >= 0.0 && sightUv.x <= 1.0 && sightUv.y <= 1.0) visibleGround = texture2D(sightTexture, sightUv).r;
      float knownTerrain = dot(gl_FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      gl_FragColor.rgb = mix(knownTerrain * vec3(0.25, 0.32, 0.42), gl_FragColor.rgb, visibleGround);
    `);
  };
  material.customProgramCacheKey=()=>'grid-rift-sight/v1';
}
