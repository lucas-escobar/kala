class PomodoroTimer extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    this.pomodoroDuration =
      parseInt(this.getAttribute("pomodoro-duration"), 10) || 25 * 60;
    this.breakDuration =
      parseInt(this.getAttribute("break-duration"), 10) || 5 * 60;
    this.timerInterval = null;
    this.isRunning = false;
    this.currentTime = this.pomodoroDuration;
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    this.stop();
  }

  static get observedAttributes() {
    return ["pomodoro-duration", "break-duration"];
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === "pomodoro-duration") {
      this.pomodoroDuration = parseInt(newValue, 10);
    } else if (name === "break-duration") {
      this.breakDuration = parseInt(newValue, 10);
    }

    if (!this.isRunning) {
      this.currentTime = this.pomodoroDuration;
      this.render();
    }
  }

  render() {
    const minutes = Math.floor(this.currentTime / 60);
    const seconds = this.currentTime % 60;

    const style = document.createElement("style");
    style.textContent = `
      font-size: xx-large;
    `;
    let container = this.shadowRoot.querySelector("div");
    if (!container) {
      container = document.createElement("div");
      const seperator = document.createTextNode(":");
      const minutesSpan = document.createElement("span");
      const secondsSpan = document.createElement("span");
      minutesSpan.textContent = minutes.toString().padStart(2, "0");
      secondsSpan.textContent = seconds.toString().padStart(2, "0");

      const onOffToggleButton = document.createElement("button");
      onOffToggleButton.textContent = "Start";
      onOffToggleButton.addEventListener("click", () => {
        this.isRunning ? this.stop() : this.start();
      })

      container.appendChild(style);
      container.appendChild(minutesSpan);
      container.appendChild(seperator);
      container.appendChild(secondsSpan);
      container.appendChild(onOffToggleButton);
      this.shadowRoot.appendChild(container);
    } else {
      let spans = this.shadowRoot.querySelectorAll("div span");
      spans[0].textContent = minutes.toString().padStart(2, "0");
      spans[1].textContent = seconds.toString().padStart(2, "0");
    }
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.timerInterval = setInterval(() => {
        if (this.currentTime > 0) {
          this.currentTime--;
          this.render();
        } else {
          this.switchTimer();
        }
      }, 1000);
    }
  }

  stop() {
    if (this.isRunning) {
      this.isRunning = false;
      clearInterval(this.timerInterval);
    }
  }

  switchTimer() {
    if (this.currentTime === this.pomodoroDuration) {
      this.currentTime = this.breakDuration;
      console.log("Take a break!");
    } else {
      this.currentTime = this.pomodoroDuration;
      console.log("Back to work!");
    }

    this.render();
    this.start();
  }
}

customElements.define("pomodoro-timer", PomodoroTimer);
