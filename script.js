const canvas = document.getElementById("circleCanvas");
const ctx = canvas.getContext("2d");

let points = [];
let selectedPoints = [];
let connections = [];

function drawCircle(numPoints) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const radius = 250;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  points = [];
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
  }

  // dibujar conexiones manuales
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 2;
  for (const conn of connections) {
    const from = points[conn[0]];
    const to = points[conn[1]];
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }
}

// Botón dibujar
document.getElementById("drawBtn").addEventListener("click", () => {
  const numPoints = parseInt(document.getElementById("numPoints").value);
  drawCircle(numPoints);
  connections = [];
  selectedPoints = [];
});

// Botón descargar
document.getElementById("downloadBtn").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "puzzle-circulo.png";
  link.href = canvas.toDataURL();
  link.click();
});

// Dibujar inicial
drawCircle(24);

// Manejar clics en el canvas para conectar puntos
canvas.addEventListener("click", function(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Buscar el punto más cercano al clic
  let clickedIdx = -1;
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const dist = Math.sqrt((pt.x - mouseX) ** 2 + (pt.y - mouseY) ** 2);
    if (dist < 10) { // radio de selección
      clickedIdx = i;
      break;
    }
  }

  if (clickedIdx !== -1) {
    selectedPoints.push(clickedIdx);
    if (selectedPoints.length === 2) {
      connections.push([selectedPoints[0], selectedPoints[1]]);
      selectedPoints = [];
      drawCircle(points.length);
    }
  }
});
