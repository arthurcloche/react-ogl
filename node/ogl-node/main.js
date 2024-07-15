import "./style.css";
import {
  Renderer,
  Camera,
  Transform,
  Geometry,
  Texture,
  Program,
  Mesh,
  Orbit,
  Text,
  Triangle,
  RenderTarget,
} from "ogl";

const vertex = `#version 300 es
#define attribute in
#define varying out
attribute vec2 uv;
attribute vec3 position;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying vec2 vUv;
uniform float time;
void main() {
    vUv = uv;    
    gl_Position = vec4(position, 1.0);
}`;

const fragment = `#version 300 es
precision highp float;
#define varying in
#define texture2D texture
#define gl_FragColor FragColor
out vec4 FragColor;
uniform sampler2D map;

varying vec2 vUv;
const float choke = 0.05;
void main() {
    vec2 uv = vUv;
    vec3 color = texture2D(map, uv).rgb;
    gl_FragColor = vec4(color,1.0);
}`;

const fontvertex = `#version 300 es
#define attribute in
#define varying out
attribute vec2 uv;
attribute vec3 position;
attribute float id;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying float vId;
varying vec2 vUv;
uniform float time;
void main() {
    vUv = uv;
    vId = id;
    vec3 pos = position + vec3(0.0, sin(id+time)*.25, 0.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`;

const fontfragment = `#version 300 es
precision highp float;
#define varying in
#define texture2D texture
#define gl_FragColor FragColor
out vec4 FragColor;
uniform sampler2D tMap;

varying vec2 vUv;
varying float vId;
const float choke = 0.05;
void main() {
    vec2 uv = vUv;
    vec3 tex = texture2D(tMap, vUv).rgb;
    float signedDist = max(min(tex.r, tex.g), min(max(tex.r, tex.g), tex.b)) - 0.5 + choke;
    float d = fwidth(signedDist);
    float alpha = smoothstep(-d, d, signedDist);

    if (alpha < 0.01) discard;

    gl_FragColor.rgb = vec3(sin(vId)*.5+.5, cos(vId + 2.0)*.5+.5, sin(vId + 4.0)*.5+.5);
    gl_FragColor.a = alpha;
}`;

(async () => {
  const app = document.getElementById("app");

  const renderer = new Renderer({
    width: app.offsetWidth,
    height: app.offsetHeight,
    dpr: window.devicePixelRatio || 2,
  });

  const gl = renderer.gl;
  gl.clearColor(1, 1, 1, 1);
  app.appendChild(gl.canvas);

  const camera = new Camera(gl, { fov: 35 });
  camera.position.set(0, 0, 1);
  // camera.lookAt([0, 0, 0]);

  // const controls = new Orbit(camera);
  // console.log(camera);

  const fbo = new Transform();
  let target = new RenderTarget(gl);
  const fboCamera = new Camera(gl, { fov: 45 });
  fboCamera.position.set(0, 0, 7);
  fboCamera.lookAt([0, 0, 0]);

  const texture = new Texture(gl, {
    generateMipmaps: false,
  });
  const img = new Image();
  img.onload = () => (texture.image = img);
  img.src = "./src/output/PPRadioGrotesk-Regular.png";

  const fontprogram = new Program(gl, {
    vertex: fontvertex,
    fragment: fontfragment,
    uniforms: {
      tMap: { value: texture },
      time: { value: 0 },
    },
    transparent: true,
    cullFace: false,
    depthWrite: false,
  });

  const scene = new Transform();
  const geometry = new Triangle(gl);

  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      time: { value: 0 },
      map: { value: null },
    },
  });

  const mesh = new Mesh(gl, { geometry, program });
  mesh.setParent(scene);

  loadText();
  async function loadText() {
    const font = await (
      await fetch("./src/output/PPRadioGrotesk-Regular.json")
    ).json();
    const lineHeight = 0.2;
    const text = new Text({
      font,
      text: "This is crazy",
      width: 3,
      align: "center",
      letterSpacing: 0,
      size: 1,
      lineHeight: 1 - lineHeight,
    });

    // Pass the generated buffers into a geometry
    const fontgeometry = new Geometry(gl, {
      position: { size: 3, data: text.buffers.position },
      uv: { size: 2, data: text.buffers.uv },
      id: { size: 1, data: text.buffers.id },
      index: { data: text.buffers.index },
    });
    const mesh = new Mesh(gl, { geometry: fontgeometry, program: fontprogram });
    mesh.position.y = text.height * 0.5 * (1 + lineHeight);
    mesh.setParent(fbo);
    console.log(fbo);
  }

  function update(t) {
    // controls.update();
    gl.clearColor(0, 0, 0, 1);
    fontprogram.uniforms.time.value = t * 0.001;
    renderer.render({ scene: fbo, camera: fboCamera, target });

    gl.clearColor(1, 1, 1, 1);
    program.uniforms.time.value = t * 0.001;
    program.uniforms.map.value = target.texture;
    renderer.render({ scene, camera });

    requestAnimationFrame(update);
  }
  update();

  function resize() {
    renderer.setSize(app.offsetWidth, app.offsetHeight);
    target = new RenderTarget(gl);

    camera.perspective({
      aspect: gl.canvas.width / gl.canvas.height,
    });
    fboCamera.perspective({
      aspect: gl.canvas.width / gl.canvas.height,
    });
  }
  window.addEventListener("resize", resize, false);
  resize();
})();
