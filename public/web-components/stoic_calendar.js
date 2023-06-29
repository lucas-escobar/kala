import * as THREE from "../three.module.min.js";

class StoicCalendar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._loadSettings();
    this._setupStyleSheet();
    this._setupEnvironment();
    this._generateCalendar();
  }

  static get observedAttributes() {
    return ["birthDate"];
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    sensitivityList = ["birthDate"];
    if (sensitivityList.includes(name)) {
      this._render();
    }
  }

  _loadSettings() {
    this.settings = {
      birthDate: this.getAttribute("birthDate"),
      backgroundColor: 0x696969,
      drawColor: 0xf8f8ff,
      numCircles: 12,
      circleRadius: 0.3,
      groupRadius: 1.5,
      segments: 32,
      ndim: 2,
      wireframe: false,
      angularVelocity: 0.0001,
    };

    this.cameraSettings = {
      fov: 75,
      aspect: window.innerWidth / window.innerHeight,
      near: 0.1,
      far: 1000,
      defaultZPosition: 5,
    };
  }

  _setupEnvironment() {
    const scene = new THREE.Scene();
    const camera = this._setupCamera();
    const renderer = this._setupRenderer();

    this.environment = {
      scene: scene,
      camera: camera,
      renderer: renderer,
    };
  }

  _render() {
    this._generateCircles();
  }

  _generateCalendar() {
    // generates  52 week x 80 year stoicism calendar
    const [year, month, day] = this.settings.birthDate.split("-");

    const lifeExpectency = 80;
    const weeksPerYear = 52;

    const birthDate = new Date(year, month - 1, day);
    const currentDate = new Date();
    const ageInMs = currentDate - birthDate;
    const ageInWeeks = parseInt(ageInMs / (1000 * 60 * 60 * 24 * 7));

    const calendar = new Array(weeksPerYear * lifeExpectency);
    for (let i = 0; i < calendar.length; i++) calendar[i] = false;
    calendar.splice(0, ageInWeeks, ...new Array(ageInWeeks).fill(true));

    this.calendar = calendar;
  }

  _setupCamera() {
    const { fov, aspect, near, far, defaultZPosition } = this.cameraSettings;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = defaultZPosition;
    return camera;
  }

  _setupStyleSheet() {
    const sheet = new CSSStyleSheet();

    const styleText = `
      :host {
       position: fixed;
       top: 0;
       left: 0;
       width: 100vw;
       height: 100vh;
       z-index: -1;
       pointer-events: none;
      }`;

    sheet.replaceSync(styleText);

    document.adoptedStyleSheets = [sheet];
  }

  _setupRenderer() {
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(this.settings.backgroundColor);

    if (!this.shadowRoot.querySelector("canvas")) {
      this.shadowRoot.appendChild(renderer.domElement);
    }

    return renderer;
  }

  _generateCircles() {
    const scene = new THREE.Scene();
    const { camera, renderer } = this.environment;
    const { numCircles, circleRadius, segments, drawColor, wireframe, ndim } =
      this.settings;

    const circleGeometry = new THREE.CircleGeometry(circleRadius, segments);
    const circleMaterial = new THREE.MeshBasicMaterial({
      color: drawColor,
      wireframe: wireframe,
    });

    const offsets = this._getCircleOffsets();
    circleGeometry.setAttribute(
      "offset",
      new THREE.InstancedBufferAttribute(offsets, ndim)
    );

    const instancedMesh = new THREE.InstancedMesh(
      circleGeometry,
      circleMaterial,
      numCircles
    );

    scene.add(instancedMesh);

    const startTime = performance.now();
    let prevTime = performance.now();
    let frameCount = 0;
    let fps = 0;
    let logInterval = 1000; // log every 1 second

    const animate = () => {
      requestAnimationFrame(animate);
      this._updateInstancedCircleTransforms(instancedMesh, startTime);
      renderer.render(scene, camera);

      const currentTime = performance.now();
      const deltaTime = currentTime - prevTime;
      frameCount++;

      if (deltaTime >= logInterval) {
        fps = Math.round((frameCount * 1000) / deltaTime);
        console.log(`FPS: ${fps}`);
        frameCount = 0;
        prevTime = currentTime;
      }
    };

    animate();
  }

  _getCircleOffsets() {
    // returns array of offsets to be used in instance buffer
    const { numCircles, circleRadius, groupRadius, ndim } = this.settings;

    const offsets = new Float32Array(numCircles * ndim);
    const offsetRadius = circleRadius + groupRadius;

    for (let i = 0; i < numCircles; i++) {
      // update angle on each iteration
      const angle = (2 * Math.PI * i) / numCircles;
      offsets[i * ndim] = Math.cos(angle) * offsetRadius; // x offset
      offsets[i * ndim + 1] = Math.sin(angle) * offsetRadius; // y offset
    }

    return offsets;
  }

  _updateInstancedCircleTransforms(instancedMesh, prevTime) {
    const { numCircles, circleRadius, groupRadius, angularVelocity } =
      this.settings;
    const deltaTime = performance.now() - prevTime;
    const offsetRadius = circleRadius + groupRadius;

    // update all circles
    for (let i = 0; i < numCircles; i++) {
      // update angle
      const angle = (2 * Math.PI * i) / numCircles;
      const newAngle = angle + angularVelocity * deltaTime;

      // use new angle to transform mesh instances
      const { position, rotation, scale } = this._getTransformMatrixOptions(
        newAngle,
        offsetRadius,
        deltaTime
      );
      const transformMatrix = new THREE.Matrix4().compose(
        position,
        rotation,
        scale
      );

      instancedMesh.setMatrixAt(i, transformMatrix);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
  }

  _getTransformMatrixOptions(angle, radius, deltaTime) {
    const position = new THREE.Vector3(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      0
    );

    const rotationAngle = (deltaTime * Math.PI) / 10;
    const rotationAxis = new THREE.Vector3(0, 0, 1);
    const rotation = new THREE.Quaternion().setFromAxisAngle(
      rotationAxis,
      rotationAngle
    );

    const scale = new THREE.Vector3(1, 1, 1);

    return { position, rotation, scale };
  }
}

customElements.define("stoic-calendar", StoicCalendar);
