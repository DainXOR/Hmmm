const canvas = document.getElementById("circleCanvas");
const ctx = canvas.getContext("2d");

let points = [];
let pointStates = [];
let prevPoints = [];
let selectedPoints = [];
let connections = [];
let connectionHistory = [];
let redoHistory = [];
let hoveredIdx = -1;
let mousePos = {x: 0, y: 0};
let animatedConnections = [];
let animationFrame = null;
let animationStarted = false;

function animate() {
  drawCircle(points.length);
  requestAnimationFrame(animate);
}

function animateConnection(index, type) {
  // type: 'in' para fade in, 'out' para fade out
  if (!animatedConnections[index]) {
    animatedConnections[index] = {alpha: type === 'in' ? 0 : 1};
  }
  let start = null;
  function step(ts) {
    if (!start) start = ts;
    let progress = (ts - start) / 300; // duración 300ms
    if (type === 'in') {
      animatedConnections[index].alpha = Math.min(1, progress);
      drawCircle(points.length);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        animatedConnections[index].alpha = 1;
        drawCircle(points.length);
      }
    } else {
      animatedConnections[index].alpha = Math.max(0, 1 - progress);
      drawCircle(points.length);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        // Eliminar la conexión visualmente después del fade out
        connections.splice(index, 1);
        animatedConnections.splice(index, 1);
        drawCircle(points.length);
      }
    }
  }
  requestAnimationFrame(step);
}

function drawCircle(numPoints) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // dibujar conexiones manuales con animación
  for (let i = 0; i < connections.length; i++) {
    let alpha = 1;
    if (animatedConnections[i]) {
      alpha = animatedConnections[i].alpha;
    }
    ctx.save();
    ctx.strokeStyle = `rgba(85,85,85,${alpha})`;
    ctx.lineWidth = 2;
    const from = points[connections[i][0]];
    const to = points[connections[i][1]];
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  }

  // dibujar puntos y textos con animación suave
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    // Estado objetivo
    let targetRadius = 6;
    let targetColor = [255, 107, 129]; // normal
    if (selectedPoints.length === 1 && selectedPoints[0] === i) {
      targetColor = [255, 224, 102]; // seleccionado
    } else if (hoveredIdx === i && !(selectedPoints.length === 1 && selectedPoints[0] === i)) {
      targetColor = [81, 207, 102]; // hover
      targetRadius = 10;
    }

    // Inicializar estado animado si no existe
    if (!pointStates[i]) {
      pointStates[i] = {
        radius: targetRadius,
        color: targetColor.slice()
      };
    }
    // Animar radio
    pointStates[i].radius += (targetRadius - pointStates[i].radius) * 0.2;
    // Animar color
    for (let c = 0; c < 3; c++) {
      pointStates[i].color[c] += (targetColor[c] - pointStates[i].color[c]) * 0.2;
    }
    ctx.fillStyle = `rgb(${pointStates[i].color.map(x => Math.round(x)).join(",")})`;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pointStates[i].radius, 0, 2 * Math.PI);
    ctx.fill();

    // texto más pequeño para muchos puntos
    const angle = (i / points.length) * 2 * Math.PI - Math.PI / 2;
    ctx.fillStyle = "#5a2d82"; // morado oscuro
    ctx.font = "8px Poppins";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(i + 1, pt.x + 10 * Math.cos(angle), pt.y + 10 * Math.sin(angle));
  }

  // El bucle de animación ahora lo maneja animate()

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

function animatePoints(numPoints) {
  // Calcula las posiciones objetivo
  const radius = Math.min(canvas.width, canvas.height) / 2 - 30;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  let targetPoints = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    targetPoints.push({x, y});
  }
  if (!prevPoints || prevPoints.length === 0) {
    prevPoints = targetPoints.map(pt => ({...pt}));
  }
  let start = null;
  function animateStep(ts) {
    if (!start) start = ts;
    let progress = Math.min(1, (ts - start) / 400);
    points = targetPoints.map((target, i) => {
      let prev = prevPoints[i] || prevPoints[prevPoints.length - 1] || target;
      return {
        x: prev.x + (target.x - prev.x) * progress,
        y: prev.y + (target.y - prev.y) * progress
      };
    });
    // Reiniciar estados animados para los puntos SOLO al inicio de la animación
    if (progress === 0) {
      pointStates = [];
    }
  // No llamar a drawCircle aquí, animate() lo hará
    if (progress < 1) {
      requestAnimationFrame(animateStep);
    } else {
      points = targetPoints;
      prevPoints = targetPoints.map(pt => ({...pt}));
      pointStates = [];
  // No llamar a drawCircle aquí, animate() lo hará
    }
  }
  requestAnimationFrame(animateStep);
}

// Actualizar en tiempo real al cambiar la cantidad de puntillas
document.getElementById("numPoints").addEventListener("input", () => {
  const numPoints = parseInt(document.getElementById("numPoints").value);
  prevPoints = points.length ? points.map(pt => ({...pt})) : [];
  animatePoints(numPoints);
  connections = [];
  selectedPoints = [];
  connectionHistory = [];
  redoHistory = [];
  animatedConnections = [];
});

// Botón descargar
document.getElementById("downloadBtn").addEventListener("click", () => {
  // Usar la variable importada de downloadContent.js
  const blob = new Blob([downloadText], { type: 'text/plain' });
  const link = document.createElement('a');
  link.download = 'para-ti.txt';
  link.href = URL.createObjectURL(blob);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
// Importar el contenido para descargar
// ...existing code...
// Nota: Asegúrate de que downloadContent.js esté incluido en el HTML antes de script.js
});

// Dibujar inicial leyendo el valor del input en el HTML
const initialNumPoints = parseInt(document.getElementById("numPoints").value);
prevPoints = [];
points = [];
animatePoints(initialNumPoints);
if (!animationStarted) {
  animationStarted = true;
  animate();
}

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
  // No llamar a drawCircle aquí, solo actualizar estado
});

canvas.addEventListener("mouseleave", function() {
  hoveredIdx = -1;
  // No llamar a drawCircle aquí, solo actualizar estado
});

// Manejar clics en el canvas para conectar puntos
canvas.addEventListener("click", function(e) {
  if (hoveredIdx !== -1) {
    selectedPoints.push(hoveredIdx);
    if (selectedPoints.length === 2) {
      connections.push([selectedPoints[0], selectedPoints[1]]);
      // Guardar el estado actual en el historial para deshacer
      connectionHistory.push([...connections]);
      // Limpiar el historial de rehacer al agregar nueva conexión
      redoHistory = [];
      // Animar fade in para la nueva conexión
      animateConnection(connections.length - 1, 'in');
      selectedPoints = [];
    } else {
      drawCircle(points.length);
    }
  } else if (selectedPoints.length > 0) {
    // Si se hace click fuera de cualquier punto y hay uno seleccionado, quitar selección
    selectedPoints = [];
    drawCircle(points.length);
  }
});

// Ctrl+Z y Ctrl+Y para deshacer/rehacer conexiones
document.addEventListener("keydown", function(e) {
  // Deseleccionar punto con Esc
  if (e.key === "Escape") {
    if (selectedPoints.length > 0) {
      selectedPoints = [];
      drawCircle(points.length);
    }
    e.preventDefault();
  }
  if (e.ctrlKey && (e.key === "z" || e.key === "Z")) {
    if (connectionHistory.length > 0 && connections.length > 0) {
      redoHistory.push([...connections]);
      connectionHistory.pop();
      // Animar fade out para la última conexión
      animateConnection(connections.length - 1, 'out');
    }
    e.preventDefault();
  }
  if (e.ctrlKey && (e.key === "y" || e.key === "Y")) {
    if (redoHistory.length > 0) {
      connectionHistory.push([...redoHistory[redoHistory.length - 1]]);
      connections = [...redoHistory.pop()];
      // Animar fade in para la última conexión rehecha
      animateConnection(connections.length - 1, 'in');
    }
    e.preventDefault();
  }
});
