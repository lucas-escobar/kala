class AudioPlayer extends HTMLElement {
  constructor() {
    super();
    this.audio = new Audio();
  }

  connectedCallback() {
    const src = this.getAttribute("src");

    if (src) {
      this.audio.src = src;
      this.audio.loop = true;
      this.appendChild(this.audio);
    }

    this.textContent = "audio";

    this.addEventListener("click", () => {
      this.audio.paused ? this.audio.play() : this.audio.pause();
    });
  }
}

customElements.define("audio-player", AudioPlayer);
