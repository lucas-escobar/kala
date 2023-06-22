updateClock();
setInterval(updateClock, 1000);

function updateClock() {
  const currTime = new Date();
  const hours = currTime.getHours().toString().padStart(2, "0");
  const minutes = currTime.getMinutes().toString().padStart(2, "0");
  const seconds = currTime.getSeconds().toString().padStart(2, "0");

  const timeString = `${hours}:${minutes}:${seconds}`;

  document.getElementById("clock").textContent = timeString;
}
