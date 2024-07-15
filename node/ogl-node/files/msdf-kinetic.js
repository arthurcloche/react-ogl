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
} from "ogl";

const vertex = /* glsl */ `
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
                }
            `;

const fragment = /* glsl */ `
                uniform sampler2D tMap;

                varying vec2 vUv;
                varying float vId;
                const float choke = 0.05;
                void main() {
                    vec3 tex = texture2D(tMap, vUv).rgb;
                    float signedDist = max(min(tex.r, tex.g), min(max(tex.r, tex.g), tex.b)) - 0.5 + choke;
                    float d = fwidth(signedDist);
                    float alpha = smoothstep(-d, d, signedDist);

                    if (alpha < 0.01) discard;

                    gl_FragColor.rgb = vec3(sin(vId)*.5+.5, cos(vId + 2.0)*.5+.5, sin(vId + 4.0)*.5+.5);
                    gl_FragColor.a = alpha;
                }
            `;

const vertex100 =
  /* glsl */ `
            ` + vertex;

const fragment100 =
  /* glsl */ `#extension GL_OES_standard_derivatives : enable
                precision highp float;
            ` + fragment;

const vertex300 =
  /* glsl */ `#version 300 es
                #define attribute in
                #define varying out
            ` + vertex;

const fragment300 =
  /* glsl */ `#version 300 es
                precision highp float;
                #define varying in
                #define texture2D texture
                #define gl_FragColor FragColor
                out vec4 FragColor;
            ` + fragment;

(async () => {
  const app = document.getElementById("app");

  const renderer = new Renderer({
    width: app.offsetWidth,
    height: app.offsetHeight,
    dpr: window.devicePixelRatio || 2,
  });
  console.log(renderer);
  const gl = renderer.gl;
  gl.clearColor(1, 1, 1, 1);
  app.appendChild(gl.canvas);

  const camera = new Camera(gl, { fov: 45 });
  camera.position.set(0, 0, 7);

  const controls = new Orbit(camera);
  console.log(camera);

  const scene = new Transform();

  const texture = new Texture(gl, {
    generateMipmaps: false,
  });
  const img = new Image();
  img.onload = () => (texture.image = img);
  img.src = "./src/output/PPRadioGrotesk-Regular.png";

  // const geometry = new Box(gl);
  // console.log(geometry);

  const program = new Program(gl, {
    // Get fallback shader for WebGL1 - needed for OES_standard_derivatives ext
    vertex: renderer.isWebgl2 ? vertex300 : vertex100,
    fragment: renderer.isWebgl2 ? fragment300 : fragment100,
    uniforms: {
      tMap: { value: texture },
      time: { value: 0 },
    },
    transparent: true,
    cullFace: false,
    depthWrite: false,
  });
  console.log(program);

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
    const geometry = new Geometry(gl, {
      position: { size: 3, data: text.buffers.position },
      uv: { size: 2, data: text.buffers.uv },
      // id provides a per-character index, for effects that may require it
      id: { size: 1, data: text.buffers.id },
      index: { data: text.buffers.index },
    });
    console.log(text.buffers);
    const mesh = new Mesh(gl, { geometry, program });

    // Use the height value to position text vertically. Here it is centered.
    mesh.position.y = text.height * 0.5 * (1 + lineHeight);
    mesh.setParent(scene);
  }

  function update(t) {
    controls.update();
    renderer.render({ scene, camera });
    program.uniforms.time.value = t * 0.001;
    // mesh.rotation.y -= 0.04;
    // mesh.rotation.z += 0.01;
    // program.uniforms.time.value = t * 0.001;
    // renderer.render({ scene, camera });
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
