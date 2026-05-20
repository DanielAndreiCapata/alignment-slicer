let API = null;

const statusBox = document.getElementById("status");

function setStatus(text) {
  statusBox.textContent = text;
}

async function init() {
  API = await TrimbleConnectWorkspace.connect(window.parent, () => {});
  setStatus("Connected.\nCreate/select a section box manually, then press Calculate Slice.");
}

document.getElementById("slice").onclick = async () => {
  try {
    const boxes = await API.viewer.getSectionBox
      ? await API.viewer.getSectionBox()
      : "getSectionBox not available";

    const planes = await API.viewer.getSectionPlanes();

    setStatus(
      "SECTION BOX:\n\n" +
      JSON.stringify(boxes, null, 2) +
      "\n\nSECTION PLANES:\n\n" +
      JSON.stringify(planes, null, 2)
    );

    console.log("SECTION BOX:", boxes);
    console.log("SECTION PLANES:", planes);

  } catch (error) {
    console.error(error);
    setStatus("Could not read section box.\n\n" + error.message);
  }
};

init();
