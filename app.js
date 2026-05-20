let API = null;

const statusBox = document.getElementById("status");

function setStatus(message) {
  statusBox.textContent = message;
}

async function init() {
  try {
    API = await TrimbleConnectWorkspace.connect(window.parent, () => {});

    const viewerKeys = Object.keys(API.viewer).sort();

    const possibleClipMethods = viewerKeys.filter(k =>
      k.toLowerCase().includes("clip") ||
      k.toLowerCase().includes("section") ||
      k.toLowerCase().includes("plane")
    );

    setStatus(
      "Connected to Trimble Connect.\n\n" +
      "Viewer methods containing clip / section / plane:\n\n" +
      JSON.stringify(possibleClipMethods, null, 2) +
      "\n\nAll viewer methods are printed in browser console."
    );

    console.log("FULL API:", API);
    console.log("API.viewer:", API.viewer);
    console.log("viewer methods:", viewerKeys);
    console.log("possible clipping methods:", possibleClipMethods);

  } catch (error) {
    console.error(error);
    setStatus("Could not connect to Trimble Connect API.");
  }
}

init();
