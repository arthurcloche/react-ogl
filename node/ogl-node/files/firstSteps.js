import "./style.css";
import {
  Renderer,
  Camera,
  Transform,
  Box,
  Program,
  Mesh,
  Orbit,
  Text,
  Texture,
} from "ogl";

(async () => {
  const app = document.getElementById("app");

  const renderer = new Renderer({
    width: app.offsetWidth,
    height: app.offsetHeight,
  });
  console.log(renderer);
  const gl = renderer.gl;
  app.appendChild(gl.canvas);

  const camera = new Camera(gl);
  camera.position.z = 5;
  console.log(camera);

  const scene = new Transform();

  const geometry = new Box(gl);
  console.log(geometry);

  const program = new Program(gl, {
    vertex: /* glsl */ `
            attribute vec3 position;
            attribute vec2 uv;
            attribute vec3 normal;
            
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            uniform mat3 normalMatrix;
            uniform vec3 cameraPosition;
            varying vec2 vUv;
            varying vec3 vNormals;
            varying vec3 eye;
            void main() {
                vUv = uv;
                vNormals = normalMatrix * normal;
                vec3 worldPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
                eye = worldPosition - cameraPosition;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
    fragment: /* glsl */ `
            precision mediump float;
            varying vec2 vUv;
            varying vec3 vNormals;
            varying vec3 eye;
            uniform float time;
            vec3 irri(float hue) {
                return .5+ .5 *cos(( 9.*hue)+ vec3(0.,23.,21.));
            }
    
            void main() {
                float d = length(vNormals*.5+.5);
                vec3 normal = normalize(vNormals);
                vec3 pointlight = normalize(vec3(0.5, 1.0, 0.5));
                float shading = dot(normal, pointlight) * 0.35;
                float light = dot(normalize(eye), normal);
                vec3 color = clamp(irri(light*.5+.5)*.65 + shading, vec3(0.), vec3(1.));
                gl_FragColor = vec4(color,1.);

            }
        `,
    uniforms: {
      time: { value: 0 },
    },
  });
  console.log(program);

  const mesh = new Mesh(gl, { geometry, program });
  mesh.rotation.x = Math.PI * 0.1;
  mesh.setParent(scene);

  function update(t) {
    mesh.rotation.y -= 0.04;
    mesh.rotation.z += 0.01;
    program.uniforms.time.value = t * 0.001;
    renderer.render({ scene, camera });
    requestAnimationFrame(update);
  }
  update();

  function resize() {
    renderer.setSize(app.offsetWidth, app.offsetHeight);
    camera.perspective({
      aspect: gl.canvas.width / gl.canvas.height,
    });
  }
  window.addEventListener("resize", resize, false);
  resize();
})();
