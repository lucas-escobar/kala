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
      numCircles: 128,
      circleRadius: 2,
      groupRadius: 1.2,
      segments: 6,
      ndim: 2,
      wireframe: true,
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

    const birthDate = new Date(year, month - 1, day);
    const currentDate = new Date();
    const ageInMs = currentDate - birthDate;
    const ageInWeeks = parseInt(ageInMs / (1000 * 60 * 60 * 24 * 7));

    const calendar = new Array(52 * 80);
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
       top: -1;
       left: -1;
       width: 100vw;
       height: 100vh;
       z-index: -1;
       pointer-events: none;
      }`;

    sheet.replaceSync(styleText);

    this.shadowRoot.adoptedStyleSheets = [sheet];
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
    const { scene, camera, renderer } = this.environment;
    const {
      numCircles,
      circleRadius,
      groupRadius,
      segments,
      drawColor,
      wireframe,
      ndim,
    } = this.settings;

    const circleGeometry = new THREE.CircleGeometry(circleRadius, segments);
    const circleMaterial = new THREE.MeshBasicMaterial({
      color: drawColor,
      wireframe: wireframe,
    });

    function updateCircleOffsets(i, ndim, angle, radius) {
      offsets[i * ndim] = Math.cos(angle) * radius; // x offset
      offsets[i * ndim + 1] = Math.sin(angle) * radius; // y offset
    }

    const offsets = new Float32Array(numCircles * ndim);
    const totalRadius = circleRadius + groupRadius;

    for (let i = 0; i < numCircles; i++) {
      // update angle on each iteration
      const angle = (2 * Math.PI * i) / numCircles;
      updateCircleOffsets(i, ndim, angle, totalRadius);
    }

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

    const prevTime = performance.now();

    function animate() {
      requestAnimationFrame(animate);

      const deltaTime = (performance.now() - prevTime) / 20000;

      const scale = new THREE.Vector3(1, 1, 1);
      const radius = circleRadius + groupRadius;

      for (let i = 0; i < numCircles; i++) {
        const angle = (2 * Math.PI * i) / numCircles;
        const position = new THREE.Vector3(
          Math.cos(angle + deltaTime) * radius,
          Math.sin(angle + deltaTime) * radius,
          0
        );

        const rotation = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 0, -1),
          (deltaTime * Math.PI) / 10
        );

        const transformMatrix = new THREE.Matrix4().compose(
          position,
          rotation,
          scale
        );

        instancedMesh.setMatrixAt(i, transformMatrix);
      }

      instancedMesh.instanceMatrix.needsUpdate = true;
      renderer.render(scene, camera);
    }
    animate();
  }
}

customElements.define("stoic-calendar", StoicCalendar);
