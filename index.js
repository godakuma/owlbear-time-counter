import OBR from "https://unpkg.com/@owlbear-rodeo/sdk?module";

const METADATA_TIME = "time-counter:seconds";
const METADATA_RUNNING = "time-counter:running";

let intervalId = null;
let totalSeconds = 0;
let running = false;
let display;
let isGM = false;

function formatTime(seconds) {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${sec.toString().padStart(2,"0")}`;
}

function parseTimeInput(value) {
  const parts = value.split(":").map(p => parseInt(p,10));
  if (parts.some(isNaN)) return null;
  if (parts.length===3) return parts[0]*3600 + parts[1]*60 + parts[2];
  if (parts.length===2) return parts[0]*60 + parts[1];
  if (parts.length===1) return parts[0];
  return null;
}

async function syncState() {
  await OBR.room.setMetadata({
    [METADATA_TIME]: totalSeconds,
    [METADATA_RUNNING]: running
  });
}

function startLocalCountdown() {
  if (intervalId) return;
  intervalId = setInterval(async () => {
    if (!running) return;
    totalSeconds--;
    if (totalSeconds <= 0) {
      totalSeconds = 0;
      running = false;
      clearInterval(intervalId);
      intervalId = null;
      // aviso visual
      display.style.color = "red";
      display.style.fontWeight = "bold";
      setTimeout(()=>{display.style.color=""; display.style.fontWeight="";}, 3000);
    }
    display.innerText = formatTime(totalSeconds);
    await syncState();
  }, 1000);
}

function stopLocalCountdown() {
  clearInterval(intervalId);
  intervalId = null;
}

function createUI() {
  const container = document.createElement("div");
  container.style.padding = "10px";
  container.style.fontFamily = "monospace";
  container.style.width = "220px";

  display = document.createElement("div");
  display.style.fontSize = "22px";
  display.style.marginBottom = "8px";
  display.innerText = formatTime(totalSeconds);

  const input = document.createElement("input");
  input.type="text";
  input.placeholder = isGM ? "HH:MM:SS | MM:SS | SS" : "Somente o GM edita";
  input.style.width="100%";
  input.disabled = !isGM;
  input.addEventListener("keydown", async e=>{
    if (!isGM) return;
    if (e.key==="Enter") {
      const seconds = parseTimeInput(input.value.trim());
      if (seconds!==null) {
        totalSeconds = seconds;
        running = false;
        stopLocalCountdown();
        display.innerText = formatTime(totalSeconds);
        await syncState();
        input.value="";
      }
    }
  });

  const btnStart = document.createElement("button");
  btnStart.innerText="Iniciar"; btnStart.disabled = !isGM;

  const btnPause = document.createElement("button");
  btnPause.innerText="Pausar"; btnPause.style.marginLeft="4px"; btnPause.disabled = !isGM;

  const btnReset = document.createElement("button");
  btnReset.innerText="Resetar"; btnReset.style.marginLeft="4px"; btnReset.disabled = !isGM;

  btnStart.onclick=async ()=>{
    if (!isGM||totalSeconds<=0) return;
    running=true; await syncState(); startLocalCountdown();
  };
  btnPause.onclick=async ()=>{
    if (!isGM) return;
    running=false; stopLocalCountdown(); await syncState();
  };
  btnReset.onclick=async ()=>{
    if (!isGM) return;
    running=false; totalSeconds=0; stopLocalCountdown(); display.innerText=formatTime(totalSeconds); await syncState();
  };

  container.appendChild(display);
  container.appendChild(input);
  container.appendChild(btnStart);
  container.appendChild(btnPause);
  container.appendChild(btnReset);

  return container;
}

OBR.onReady(async () => {
  const player = await OBR.player.getSelf();
  isGM = player.role==="GM";

  const metadata = await OBR.room.getMetadata();
  totalSeconds = metadata[METADATA_TIME] ?? 0;
  running = metadata[METADATA_RUNNING] ?? false;

  OBR.room.onMetadataChange(meta => {
    if (meta[METADATA_TIME]!==undefined){
      totalSeconds = meta[METADATA_TIME];
      display.innerText=formatTime(totalSeconds);
    }
    if (meta[METADATA_RUNNING]!==undefined){
      running = meta[METADATA_RUNNING];
      running ? startLocalCountdown() : stopLocalCountdown();
    }
  });

  // TOOL com ícone personalizado
  await OBR.tool.create({
    icon: "⏳", // seu ícone na pasta da extensão
    label: "Contador",
    onClick: ctx => {
      ctx.openPopover({ anchor: "tool", content: createUI() });
    }
  });
});

