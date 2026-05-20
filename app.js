let API = null;
let selectedAlignment = null;

const statusBox = document.getElementById("status");

function setStatus(message) {
  statusBox.textContent = message;
}

async function init() {
  try {
    API = await TrimbleConnectWorkspace.connect(
      window.parent,
      (event, data) => {
        console.log("Trimble event:", event, data);
      }
    );

    setStatus("Connected to Trimble Connect.\nSelect an alignment in the viewer, then press 'Read selected alignment'.");
  } catch (error) {
    console.error(error);
    setStatus("Could not connect to Trimble Connect Workspace API.");
  }
}

document.getElementById("selectAlignment").onclick = async () => {
  if (!API) {
    setStatus("API is not connected yet.");
    return;
  }

  try {
    const selection = await API.viewer.getSelection();

    console.log("Selection:", selection);

    if (!selection || selection.length === 0) {
      setStatus("No object selected.\nSelect the alignment in the viewer first.");
      return;
    }

selectedAlignment = selection;

const modelId = selection[0].modelId;
const runtimeIds = selection[0].objectRuntimeIds;

try {

  const properties =
    await API.viewer.getObjectProperties(
      modelId,
      runtimeIds
    );

  console.log(properties);

  setStatus(

    "OBJECT PROPERTIES:\n\n" +

    JSON.stringify(
      properties,
      null,
      2
    )

  );

}
catch(error){

  console.error(error);

  setStatus(
    "Could not read object properties."
  );
}

  } catch (error) {
    console.error(error);
    setStatus("Could not read selected object.\nCheck browser console for details.");
  }
};

document.getElementById("slice").onclick = async () => {
  const start = Number(document.getElementById("start").value);
  const end = Number(document.getElementById("end").value);

  if (!start || !end) {
    setStatus("Enter both start and end chainage.");
    return;
  }

  if (start >= end) {
    setStatus("End chainage must be greater than start chainage.");
    return;
  }

  if (!selectedAlignment) {
    setStatus("No alignment stored.\nSelect alignment first and press 'Read selected alignment'.");
    return;
  }

  setStatus(
    "Ready to create slice:\n\n" +
    "Start: " + start + " m\n" +
    "End: " + end + " m\n\n" +
    "Alignment selection:\n" +
    JSON.stringify(selectedAlignment, null, 2)
  );
};

init();
