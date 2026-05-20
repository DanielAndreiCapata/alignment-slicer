let API = null;
let selectedAlignment = null;

const statusBox = document.getElementById("status");

function setStatus(message) {
  statusBox.textContent = message;
}

async function init() {
  try {
    API = await TrimbleConnectWorkspace.connect(window.parent, () => {});
    setStatus("Connected to Trimble Connect.\nSelect an alignment, then press Read selected alignment.");
  } catch (error) {
    console.error(error);
    setStatus("Could not connect to Trimble Connect.");
  }
}

document.getElementById("selectAlignment").onclick = async () => {
  if (!API) {
    setStatus("API is not connected.");
    return;
  }

  const selection = await API.viewer.getSelection();

  if (!selection || selection.length === 0) {
    setStatus("No object selected.");
    return;
  }

  selectedAlignment = selection;

  const modelId = selection[0].modelId;
  const runtimeIds = selection[0].objectRuntimeIds;

  setStatus(
    "Selected alignment:\n\n" +
    "Model ID:\n" + modelId + "\n\n" +
    "Runtime IDs:\n" + JSON.stringify(runtimeIds, null, 2)
  );
};

document.getElementById("slice").onclick = async () => {
  const start = Number(document.getElementById("start").value);
  const end = Number(document.getElementById("end").value);

  if (!start || !end) {
    setStatus("Enter start and end chainage.");
    return;
  }

  if (start >= end) {
    setStatus("End chainage must be greater than start chainage.");
    return;
  }

  if (!selectedAlignment) {
    setStatus("Select alignment first.");
    return;
  }

  setStatus(
    "Ready for next step:\n\n" +
    "Start: " + start + " m\n" +
    "End: " + end + " m\n\n" +
    "Alignment selected successfully."
  );
};

init();
