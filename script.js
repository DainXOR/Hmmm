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
let shiftPressed = false;
let mousePos = {x: 0, y: 0};
let animatedConnections = [];
let pendingRemovals = [];
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
        // Marcar para eliminar por referencia (los puntos conectados)
        const conn = connections[index];
        if (conn) {
          pendingRemovals.push({a: conn[0], b: conn[1]});
        }
        drawCircle(points.length);
      }
    }
  }
  requestAnimationFrame(step);
}

function drawCircle(numPoints) {
  // Eliminar conexiones pendientes después de animar
  if (pendingRemovals.length > 0) {
    for (const {a, b} of pendingRemovals) {
      for (let i = connections.length - 1; i >= 0; i--) {
        if ((connections[i][0] === a && connections[i][1] === b) || (connections[i][0] === b && connections[i][1] === a)) {
          connections.splice(i, 1);
          animatedConnections.splice(i, 1);
        }
      }
    }
    pendingRemovals = [];
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Pista visual en modo Shift: línea entre punto de inicio y mouse
  if (shiftPressed && selectedPoints.length === 1 && hoveredIdx !== -1 && selectedPoints[0] !== hoveredIdx) {
    const from = points[selectedPoints[0]];
    ctx.save();
    ctx.strokeStyle = "rgba(81, 207, 102, 0.3)"; // verde transparente
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(mousePos.x, mousePos.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

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
// Inicializar el historial con estado vacío
connectionHistory = [[]];

// Actualizar mouse hover y posición
canvas.addEventListener("mousemove", function(e) {
  // Modo Shift: selección y conexión automática como con clicks
  if (shiftPressed) {
    // Si el mouse está sobre un punto, usar la lógica normal
    if (hoveredIdx !== -1) {
      if (selectedPoints.length === 0) {
        selectedPoints = [hoveredIdx];
      } else if (selectedPoints.length === 1 && selectedPoints[0] !== hoveredIdx) {
        const alreadyConnected = connections.some(
          ([a, b]) => (a === selectedPoints[0] && b === hoveredIdx) || (a === hoveredIdx && b === selectedPoints[0])
        );
        if (!alreadyConnected) {
          connections.push([selectedPoints[0], hoveredIdx]);
          connectionHistory.push([...connections]);
          redoHistory = [];
          animateConnection(connections.length - 1, 'in');
        }
        selectedPoints = [hoveredIdx];
      }
    } else if (selectedPoints.length === 1) {
      // Si la línea pasa cerca de algún punto, conectarlo automáticamente
      const from = points[selectedPoints[0]];
      const to = mousePos;
      let minDist = Infinity;
      let closestIdx = -1;
      for (let i = 0; i < points.length; i++) {
        if (i === selectedPoints[0]) continue;
        // Distancia del punto a la línea
        const pt = points[i];
        const A = to.x - from.x;
        const B = to.y - from.y;
        const C = pt.x - from.x;
        const D = pt.y - from.y;
        // Proyección escalar
        const dot = A * C + B * D;
        const len_sq = A * A + B * B;
        const param = len_sq !== 0 ? dot / len_sq : -1;
        let xx, yy;
        if (param < 0) {
          xx = from.x;
          yy = from.y;
        } else if (param > 1) {
          xx = to.x;
          yy = to.y;
        } else {
          xx = from.x + param * A;
          yy = from.y + param * B;
        }
        const dist = Math.sqrt((pt.x - xx) ** 2 + (pt.y - yy) ** 2);
        if (dist < 10 && dist < minDist) {
          minDist = dist;
          closestIdx = i;
        }
      }
      if (closestIdx !== -1) {
        const alreadyConnected = connections.some(
          ([a, b]) => (a === selectedPoints[0] && b === closestIdx) || (a === closestIdx && b === selectedPoints[0])
        );
        if (!alreadyConnected) {
          connections.push([selectedPoints[0], closestIdx]);
          connectionHistory.push([...connections]);
          redoHistory = [];
          animateConnection(connections.length - 1, 'in');
        }
        selectedPoints = [closestIdx];
      }
    }
  }
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
  // Shift presionado
  if (e.key === "Shift") {
    shiftPressed = true;
    lastAutoConnectIdx = hoveredIdx !== -1 ? hoveredIdx : null;
  }
// Shift liberado
document.addEventListener("keyup", function(e) {
  if (e.key === "Shift") {
    shiftPressed = false;
    lastAutoConnectIdx = null;
    // Limpiar la última selección automática
    selectedPoints = [];
    drawCircle(points.length);
  }
});
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
      let prevState;
      if (connectionHistory.length > 1) {
        prevState = connectionHistory[connectionHistory.length - 2];
      } else {
        prevState = [];
      }
      const lastConn = connections.find(conn => {
        return !prevState.some(([a, b]) => (a === conn[0] && b === conn[1]) || (a === conn[1] && b === conn[0]));
      });
      if (lastConn) {
        const idx = connections.findIndex(([a, b]) => (a === lastConn[0] && b === lastConn[1]) || (a === lastConn[1] && b === lastConn[0]));
        if (idx !== -1) animateConnection(idx, 'out');
      }
      connectionHistory.pop();
    }
    e.preventDefault();
  }
  if (e.ctrlKey && (e.key === "y" || e.key === "Y")) {
    if (redoHistory.length > 0) {
      // Si el historial está vacío, inicializarlo
      if (connectionHistory.length === 0) {
        connectionHistory = [[]];
      }
      const nextState = redoHistory[redoHistory.length - 1];
      // Restaurar la siguiente conexión pendiente en orden
      let restored = false;
      for (let i = 0; i < nextState.length; i++) {
        const conn = nextState[i];
        if (!connections.some(([a, b]) => (a === conn[0] && b === conn[1]) || (a === conn[1] && b === conn[0]))) {
          connections.push(conn);
          animatedConnections.push({alpha: 0});
          animateConnection(connections.length - 1, 'in');
          connectionHistory.push([...connections]);
          restored = true;
          break;
        }
      }
      // Si ya restauramos todas, quitamos el estado de redoHistory
      if (connections.length === nextState.length) {
        redoHistory.pop();
      }
    }
    e.preventDefault();
  }
});
