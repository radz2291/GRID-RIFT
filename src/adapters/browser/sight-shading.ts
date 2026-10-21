import * as THREE from 'three';

/** Tint world surfaces, including cover tops; a ground decal alone leaves the arena fully readable. */
export function shadeBySight(material:THREE.MeshStandardMaterial,texture:THREE.DataTexture,size:THREE.Vector2,time:{value:number},objectSight:{value:number}={value:-1}):void {
  material.onBeforeCompile=shader=>{
    shader.uniforms.sightTexture={value:texture};shader.uniforms.sightMapSize={value:size};shader.uniforms.sightTime=time;shader.uniforms.objectSight=objectSight;
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vSightWorld;').replace('#include <project_vertex>','vSightWorld = (modelMatrix * vec4(transformed, 1.0)).xz;\n#include <project_vertex>');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vSightWorld;\nuniform sampler2D sightTexture;\nuniform vec2 sightMapSize;\nuniform float sightTime;\nuniform float objectSight;').replace('#include <fog_fragment>',`#include <fog_fragment>
      vec2 sightUv = vSightWorld / sightMapSize;
      float visibleGround = 1.0;
      if (sightUv.x >= 0.0 && sightUv.y >= 0.0 && sightUv.x <= 1.0 && sightUv.y <= 1.0) visibleGround = texture2D(sightTexture, sightUv).r;
      if (objectSight >= 0.0) visibleGround = objectSight;
      float mist = sin(vSightWorld.x * 0.31 + vSightWorld.y * 0.17 + sightTime * 0.10) * sin(vSightWorld.y * 0.27 - vSightWorld.x * 0.13 - sightTime * 0.08);
      float cloud = sin(vSightWorld.x * 0.09 - vSightWorld.y * 0.12 + sightTime * 0.04);
      vec3 fogColour = vec3(0.17, 0.22, 0.27) + mist * 0.022 + cloud * 0.015;
      vec3 obscured = mix(gl_FragColor.rgb * 0.35, fogColour, 0.88 + mist * 0.035);
      gl_FragColor.rgb = mix(obscured, gl_FragColor.rgb, smoothstep(0.0, 1.0, visibleGround));
    `);
  };
  material.customProgramCacheKey=()=>'grid-rift-sight/v2';
}
