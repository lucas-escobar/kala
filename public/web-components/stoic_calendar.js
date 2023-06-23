import * as THREE from "../three.module.min.js";

class StoicCalendar extends HTMLElement {
  /**
   * @param {string} birthdate - yyyy-mm-dd
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.backgroundColor = 0x696969;
    this.drawColor = 0xf8f8ff;

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

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styleText);
    document.adoptedStyleSheets = [sheet];
  }

  connectedCallback() {
    const birthdate = this.getAttribute("birthdate");
    if (birthdate) {
      const [year, month, day] = birthdate.split("-");
      const startDate = new Date(year, month - 1, day);
      const calendar = this.generateCalendar(startDate);
      this.render(calendar);
    }
  }

  static get observedAttributes() {
    return ["birthdate"];
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === "birthdate") {
      const [year, month, day] = newValue.split("-");
      const startDate = new Date(year, month - 1, day);
      const calendar = this.generateCalendar(startDate);
      this.render(calendar);
    }
  }

  generateCalendar(startDate) {
    // generates  52 week x 80 year stoicism calendar
    const currentDate = new Date();
    const weeks = parseInt(
      (currentDate - startDate) / (1000 * 60 * 60 * 24 * 7)
    );
    const calendar = new Array(52 * 80);
    for (let i = 0; i < calendar.length; i++) calendar[i] = false;
    calendar.splice(0, weeks, ...new Array(weeks).fill(true));
    return calendar;
  }

  render(calendar) {
    // init scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(this.backgroundColor);
    if (!this.shadowRoot.querySelector("canvas")) {
      this.shadowRoot.appendChild(renderer.domElement);
    }
    //this.inefficientCircles(scene, camera, renderer);
    this.generateCircles(scene, camera, renderer);
  }

  inefficientCircles(scene, camera, renderer) {
    // create circles
    const circleGroup = new THREE.Group();
    scene.add(circleGroup);

    const circleCount = 12;
    const circleRadius = 0.2;
    const rotationSpeed = 0.0005;
    const groupRadius = 2;

    for (let i = 0; i < circleCount; i++) {
      const circleGeometry = new THREE.CircleGeometry(circleRadius, 32);
      const circleMaterial = new THREE.MeshBasicMaterial({
        color: this.drawColor,
        wireframe: false,
      });
      const circleMesh = new THREE.Mesh(circleGeometry, circleMaterial);

      const angle = (2 * Math.PI * i) / circleCount;
      const x = Math.cos(angle) * (circleRadius + groupRadius);
      const y = Math.sin(angle) * (circleRadius + groupRadius);

      circleMesh.position.set(x, y, 0);
      circleGroup.add(circleMesh);
    }

    let frameCount = 0;
    let startTime = performance.now();
    function animate() {
      requestAnimationFrame(animate);

      // update animations
      circleGroup.rotation.z += rotationSpeed;

      // update framerate
      frameCount++;
      const currentTime = performance.now();
      const elapsedTime = currentTime - startTime;
      if (elapsedTime >= 1000) {
        const fps = frameCount / (elapsedTime / 1000);
        console.log(fps.toFixed(2));
        frameCount = 0;
        startTime = currentTime;
      }

      renderer.render(scene, camera);
    }

    animate();
  }

  generateCircles(scene, camera, renderer) {
    const numCircles = 12;
    const circleRadius = 0.5;
    const groupRadius = 2;
    const segments = 64;
    const ndim = 2;

    const circleGeometry = new THREE.CircleGeometry(circleRadius, segments);
    const circleMaterial = new THREE.MeshBasicMaterial({
      color: this.drawColor,
      wireframe: true,
    });
    const offsets = new Float32Array(numCircles * ndim);
    for (let i = 0; i < numCircles; i++) {
      const angle = (2 * Math.PI * i) / numCircles;
      const radius = circleRadius + groupRadius;
      offsets[i * ndim] = Math.cos(angle) * radius; // x offset
      offsets[i * ndim + 1] = Math.sin(angle) * radius; // y offset
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
      //prevTime = performance.now();
    }
    animate();
  }
}

customElements.define("stoic-calendar", StoicCalendar);
