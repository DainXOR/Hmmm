const canvas = document.getElementById("circleCanvas");
const ctx = canvas.getContext("2d");

let points = [];
let selectedPoints = [];
let connections = [];
let hoveredIdx = -1;
let mousePos = {x: 0, y: 0};

function drawCircle(numPoints) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Ajusta el radio para que 200 puntillas se vean bien
  const radius = Math.min(canvas.width, canvas.height) / 2 - 30;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  points = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push({x, y});
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

  // dibujar puntos y textos
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    // Resaltado si está seleccionado o hovered
    if (selectedPoints.length === 1 && selectedPoints[0] === i) {
      ctx.fillStyle = "#ffe066"; // amarillo para seleccionado
    } else if (hoveredIdx === i) {
      ctx.fillStyle = "#51cf66"; // verde para hover
    } else {
      ctx.fillStyle = "#ff6b81"; // rojo rosado
    }
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 6, 0, 2 * Math.PI);
    ctx.fill();

    // texto más pequeño para muchos puntos
    ctx.fillStyle = "#5a2d82"; // morado oscuro
    ctx.font = "8px Poppins";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(i + 1, pt.x + 10 * Math.cos((i / points.length) * 2 * Math.PI), pt.y + 10 * Math.sin((i / points.length) * 2 * Math.PI));
  }

  // Si hay un punto seleccionado, dibujar línea transparente al mouse
  if (selectedPoints.length === 1) {
    const from = points[selectedPoints[0]];
    ctx.save();
    ctx.strokeStyle = "rgba(81, 207, 102, 0.5)"; // verde transparente
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(mousePos.x, mousePos.y);
    ctx.stroke();
    ctx.restore();
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

// Actualizar mouse hover y posición
canvas.addEventListener("mousemove", function(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  mousePos = {x: mouseX, y: mouseY};

  hoveredIdx = -1;
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const dist = Math.sqrt((pt.x - mouseX) ** 2 + (pt.y - mouseY) ** 2);
    if (dist < 10) {
      hoveredIdx = i;
      break;
    }
  }
  drawCircle(points.length);
});

canvas.addEventListener("mouseleave", function() {
  hoveredIdx = -1;
  drawCircle(points.length);
});

// Manejar clics en el canvas para conectar puntos
canvas.addEventListener("click", function(e) {
  if (hoveredIdx !== -1) {
    selectedPoints.push(hoveredIdx);
    if (selectedPoints.length === 2) {
      connections.push([selectedPoints[0], selectedPoints[1]]);
      selectedPoints = [];
    }
    drawCircle(points.length);
  }
});
