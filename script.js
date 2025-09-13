const canvas = document.getElementById("circleCanvas");
const ctx = canvas.getContext("2d");

function drawCircle(numPoints, step) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const radius = 250;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // posiciones de los puntos
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push({x, y});

        // puntos
    ctx.fillStyle = "#ff6b81"; // rojo rosado
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();

    // texto
    ctx.fillStyle = "#5a2d82"; // morado oscuro
    ctx.font = "12px Poppins";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(i + 1, x + 15 * Math.cos(angle), y + 15 * Math.sin(angle));

    // conexiones
    ctx.strokeStyle = "#a56cc1"; // morado pastel
    ctx.lineWidth = 1;
  }

  // dibujar conexiones
  ctx.strokeStyle = "#555";
  for (let i = 0; i < numPoints; i++) {
    const from = points[i];
    const to = points[(i * step) % numPoints]; // patrón modular

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }
}

// Botón dibujar
document.getElementById("drawBtn").addEventListener("click", () => {
  const numPoints = parseInt(document.getElementById("numPoints").value);
  const step = parseInt(document.getElementById("step").value);
  drawCircle(numPoints, step);
});

// Botón descargar
document.getElementById("downloadBtn").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "puzzle-circulo.png";
  link.href = canvas.toDataURL();
  link.click();
});

// Dibujar inicial
drawCircle(24, 7);
