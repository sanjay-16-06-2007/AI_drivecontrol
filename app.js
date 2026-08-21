// Navigation Tab Switcher
function switchTab(tabId) {
  document.getElementById('view-slides').classList.add('hidden');
  document.getElementById('view-dashboard').classList.add('hidden');
  document.getElementById('view-simulation').classList.add('hidden');

  document.getElementById('tab-slides').className = "px-4 py-1.5 rounded-md text-gray-400 hover:text-white transition-all";
  document.getElementById('tab-dashboard').className = "px-4 py-1.5 rounded-md text-gray-400 hover:text-white transition-all";
  document.getElementById('tab-simulation').className = "px-4 py-1.5 rounded-md text-gray-400 hover:text-white transition-all";

  document.getElementById('view-' + tabId).classList.remove('hidden');
  document.getElementById('tab-' + tabId).className = "px-4 py-1.5 rounded-md text-emerald-400 bg-gray-800 font-semibold transition-all";

  if(tabId === 'dashboard' && !chartInitialized) {
    initChart();
  }
}

// Parking Bay State Management
let slot1Occupied = false;
let slot2Occupied = true;

function toggleSlot(slotNum) {
  if(slotNum === 1) {
    slot1Occupied = !slot1Occupied;
    const card = document.getElementById('slot-1');
    const status = document.getElementById('slot-1-status');
    const icon = document.getElementById('slot-1-icon');
    const sonar = document.getElementById('sonarDist');

    if(slot1Occupied) {
      card.className = "p-4 rounded-xl border border-red-900/50 bg-red-950/20";
      status.textContent = "OCCUPIED";
      status.className = "text-red-400 font-bold";
      icon.className = "fa-solid fa-car-side text-3xl text-red-500";
      sonar.textContent = "8 cm (Vehicle Parked)";
      sonar.className = "text-red-400";
    } else {
      card.className = "p-4 rounded-xl border transition-all glass-card-active";
      status.textContent = "VACANT";
      status.className = "text-emerald-400 font-bold";
      icon.className = "fa-solid fa-car-side text-3xl text-emerald-400";
      sonar.textContent = "284 cm (No Obstacle)";
      sonar.className = "text-cyan-400";
    }
  } else {
    slot2Occupied = !slot2Occupied;
    const card = document.getElementById('slot-2');
    const status = document.getElementById('slot-2-status');
    const icon = document.getElementById('slot-2-icon');

    if(slot2Occupied) {
      card.className = "p-4 rounded-xl border border-red-900/50 bg-red-950/20";
      status.textContent = "OCCUPIED";
      status.className = "text-red-400 font-bold";
      icon.className = "fa-solid fa-car-side text-3xl text-red-500";
    } else {
      card.className = "p-4 rounded-xl border transition-all glass-card-active";
      status.textContent = "VACANT";
      status.className = "text-emerald-400 font-bold";
      icon.className = "fa-solid fa-car-side text-3xl text-emerald-400";
    }
  }
}

// Dynamic Distance & Eco Guidance Calculations
function onDistanceChange(val) {
  document.getElementById('sliderVal').textContent = val + " m";
  document.getElementById('distVal').textContent = val + " m";
  updateDashboardMetrics();
}

function updateDashboardMetrics() {
  const dist = parseInt(document.getElementById('distanceSlider').value);
  const terrain = document.getElementById('terrainSelect').value;
  
  let optSpeed = 30;
  let recLane = "L3 (Ingress)";
  let co2Saved = Math.round((1000 - dist) * 0.22);

  if (dist > 600) {
    optSpeed = 55;
    recLane = "L1 (Express)";
  } else if (dist > 250) {
    optSpeed = 40;
    recLane = "L2 (Transit Shift)";
  } else {
    optSpeed = 22;
    recLane = "L3 (Park Bay Prep)";
  }

  if (terrain === 'uphill') {
    optSpeed += 5; 
  } else if (terrain === 'downhill') {
    optSpeed -= 4; 
  }

  document.getElementById('optSpeed').textContent = optSpeed + " km/h";
  document.getElementById('recLane').textContent = recLane;
  document.getElementById('co2Val').textContent = co2Saved + " g";
}

// Chart.js Setup
let chartInitialized = false;
let emissionChart;

function initChart() {
  const ctx = document.getElementById('emissionChart').getContext('2d');
  emissionChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['1000m', '800m', '600m', '400m', '200m', 'Arrived'],
      datasets: [
        {
          label: 'Unoptimized Driving',
          data: [190, 210, 240, 220, 260, 180],
          borderColor: '#f43f5e',
          borderWidth: 2,
          tension: 0.3,
          fill: false
        },
        {
          label: 'SmartPark AI Eco-Drive',
          data: [140, 135, 128, 120, 110, 95],
          borderColor: '#10b981',
          borderWidth: 2,
          tension: 0.3,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#9ca3af', font: { family: 'JetBrains Mono', size: 10 } }
        }
      },
      scales: {
        x: { grid: { color: '#1f2937' }, ticks: { color: '#9ca3af', font: { size: 10 } } },
        y: { grid: { color: '#1f2937' }, ticks: { color: '#9ca3af', font: { size: 10 } } }
      }
    }
  });
  chartInitialized = true;
}

// HTML5 Canvas Traffic Simulation Logic
const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');
let simRunning = true;
let animFrame;

function resizeCanvas() {
  if(canvas && canvas.parentElement) {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }
}
window.addEventListener('resize', resizeCanvas);

// Vehicle Simulator Class
class Vehicle {
  constructor(x, lane, speed, color) {
    this.x = x;
    this.lane = lane; 
    this.speed = speed;
    this.color = color;
    this.targetLane = lane;
  }

  update() {
    this.x += this.speed;
    if(this.x > canvas.width + 50) {
      this.x = -60;
    }

    if(this.x > canvas.width * 0.4 && this.lane === 1 && Math.random() < 0.02) {
      this.targetLane = 3;
    }

    if(this.lane < this.targetLane) this.lane += 0.03;
    if(this.lane > this.targetLane) this.lane -= 0.03;
  }

  draw() {
    const laneY = 50 + (this.lane - 1) * 70;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.roundRect(this.x, laneY, 40, 22, 5);
    ctx.fill();

    // Wheels
    ctx.fillStyle = "#000";
    ctx.fillRect(this.x + 6, laneY - 2, 8, 3);
    ctx.fillRect(this.x + 26, laneY - 2, 8, 3);
    ctx.fillRect(this.x + 6, laneY + 21, 8, 3);
    ctx.fillRect(this.x + 26, laneY + 21, 8, 3);
  }
}

const vehicles = [
  new Vehicle(20, 1, 3.5, '#10b981'),
  new Vehicle(200, 2, 2.8, '#06b6d4'),
  new Vehicle(400, 3, 2.0, '#f59e0b'),
  new Vehicle(100, 1, 4.0, '#a855f7')
];

function renderSim() {
  if(!canvas) return;
  ctx.fillStyle = '#0a0f1d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Road Lanes
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.setLineDash([15, 15]);

  for(let i = 1; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 50 + i * 70 - 15);
    ctx.lineTo(canvas.width, 50 + i * 70 - 15);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Draw Smart Park Ingress Point
  ctx.fillStyle = '#065f46';
  ctx.fillRect(canvas.width - 120, 180, 100, 80);
  ctx.fillStyle = '#10b981';
  ctx.font = '10px JetBrains Mono';
  ctx.fillText('PARKING BAY A', canvas.width - 110, 225);

  // Render Vehicles
  vehicles.forEach(v => {
    v.update();
    v.draw();
  });

  if(simRunning) {
    animFrame = requestAnimationFrame(renderSim);
  }
}

function toggleCanvasSim() {
  simRunning = !simRunning;
  const btn = document.getElementById('simBtn');
  if(simRunning) {
    btn.textContent = "Pause Sim";
    btn.className = "bg-emerald-600 hover:bg-emerald-500 text-black px-3 py-1 rounded font-mono text-xs font-bold transition-all";
    renderSim();
  } else {
    btn.textContent = "Resume Sim";
    btn.className = "bg-cyan-600 hover:bg-cyan-500 text-black px-3 py-1 rounded font-mono text-xs font-bold transition-all";
    cancelAnimationFrame(animFrame);
  }
}

window.onload = () => {
  resizeCanvas();
  renderSim();
};
