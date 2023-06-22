import * as THREE from "../three.module.min.js";

class StoicCalendar extends HTMLElement {
  /**
   * @param {string} birthdate - yyyy-mm-dd
   * @param {string} color - r-g-b
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

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
    renderer.setClearColor(0xf8f8ff);
    if (!this.shadowRoot.querySelector("canvas")) {
      this.shadowRoot.appendChild(renderer.domElement);
    }

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
        color: 0x696969,
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
}

customElements.define("stoic-calendar", StoicCalendar);
