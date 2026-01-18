import OBR from "import OBR from "https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk@latest/dist/obr-sdk.js";

let timerInterval = null;
let remainingSeconds = 0;

const hhInput = document.getElementById('hh');
const mmInput = document.getElementById('mm');
const ssInput = document.getElementById('ss');

// Função para converter inputs em segundos totais
function getSecondsFromInputs() {
  const h = parseInt(hhInput.value) || 0;
  const m = parseInt(mmInput.value) || 0;
  const s = parseInt(ssInput.value) || 0;
  return (h * 3600) + (m * 60) + s;
}

// Atualiza a exibição visual
function updateDisplay(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  
  hhInput.value = h.toString().padStart(2, '0');
  mmInput.value = m.toString().padStart(2, '0');
  ssInput.value = s.toString().padStart(2, '0');
}

OBR.onReady(() => {
  document.getElementById('start').onclick = () => {
    if (timerInterval) return; // Evita múltiplos intervalos
    
    if (remainingSeconds <= 0) {
      remainingSeconds = getSecondsFromInputs();
    }

    timerInterval = setInterval(() => {
      if (remainingSeconds > 0) {
        remainingSeconds--;
        updateDisplay(remainingSeconds);
      } else {
        clearInterval(timerInterval);
        timerInterval = null;
        alert("O tempo acabou!");
      }
    }, 1000);
  };

  document.getElementById('pause').onclick = () => {
    clearInterval(timerInterval);
    timerInterval = null;
  };

  document.getElementById('reset').onclick = () => {
    clearInterval(timerInterval);
    timerInterval = null;
    remainingSeconds = 0;
    hhInput.value = '';
    mmInput.value = '';
    ssInput.value = '';
  };
});
