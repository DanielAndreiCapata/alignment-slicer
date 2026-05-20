let API = null;
let alignments = [];

const statusBox = document.getElementById("status");
const alignmentSelect = document.getElementById("alignmentSelect");

function setStatus(text) {
  statusBox.textContent = text;
}

async function init() {
  setStatus("Loading XML first...");

  await loadXML();

  setStatus(`Ready.\nAlignments loaded: ${alignments.length}\nConnecting to Trimble API...`);

  try {
    API = await Promise.race([
      TrimbleConnectWorkspace.connect(window.parent, () => {}),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Trimble API connection timeout")), 5000)
      )
    ]);

    setStatus(`Ready.\nAlignments loaded: ${alignments.length}\nTrimble API connected.`);
  } catch (error) {
    console.warn(error);
    setStatus(`Ready.\nAlignments loaded: ${alignments.length}\nTrimble API not connected yet.`);
  }
}

async function loadXML() {
  const response = await fetch("./aliniamente.xml?v=130");

  if (!response.ok) {
    throw new Error("Could not load aliniamente.xml");
  }

  const xmlText = await response.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "text/xml");

  const alignmentNodes = Array.from(xml.getElementsByTagName("Alignment"));

  alignmentSelect.innerHTML = "";

  alignments = alignmentNodes.map((node, index) => {
    const item = {
      name: node.getAttribute("name"),
      length: Number(node.getAttribute("length")),
      node: node
    };

    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${item.name} | Length: ${item.length.toFixed(2)} m`;

    alignmentSelect.appendChild(option);
    return item;
  });
}

function parsePoint(text) {
  const p = text.trim().split(/\s+/).map(Number);
  return { x: p[0], y: p[1], z: 0 };
}

function getSegments(alignmentNode) {
  const coordGeom = alignmentNode.getElementsByTagName("CoordGeom")[0];
  const lines = Array.from(coordGeom.getElementsByTagName("Line"));

  return lines.map(line => ({
    staStart: Number(line.getAttribute("staStart")),
    length: Number(line.getAttribute("length")),
    start: parsePoint(line.getElementsByTagName("Start")[0].textContent),
    end: parsePoint(line.getElementsByTagName("End")[0].textContent)
  }));
}

function getPointAtChainage(segments, chainage) {
  for (const s of segments) {
    const staEnd = s.staStart + s.length;

    if (chainage >= s.staStart && chainage <= staEnd) {
      const t = (chainage - s.staStart) / s.length;

      const x = s.start.x + (s.end.x - s.start.x) * t;
      const y = s.start.y + (s.end.y - s.start.y) * t;

      const dx = s.end.x - s.start.x;
      const dy = s.end.y - s.start.y;
      const len = Math.sqrt(dx * dx + dy * dy);

      return {
        x,
        y,
        dirX: dx / len,
        dirY: dy / len
      };
    }
  }

  return null;
}

async function createSectionPlane(point) {
  const normalX = -point.dirY;
  const normalY = point.dirX;

  return API.viewer.addSectionPlane({
    positionX: point.x,
    positionY: point.y,
    positionZ: 0,
    directionX: normalX,
    directionY: normalY,
    directionZ: 0,
    controlsVisible: true
  });
}

document.getElementById("createSection").onclick = async () => {
  try {
    const alignment = alignments[Number(alignmentSelect.value)];
    const chainage = Number(document.getElementById("chainage").value);

    if (!alignment) {
      setStatus("Select an alignment.");
      return;
    }

    if (!Number.isFinite(chainage)) {
      setStatus("Enter a valid chainage.");
      return;
    }

    if (chainage < 0 || chainage > alignment.length) {
      setStatus(`Chainage outside alignment limits.\nLength: ${alignment.length.toFixed(2)} m`);
      return;
    }

    const segments = getSegments(alignment.node);
    const point = getPointAtChainage(segments, chainage);

    if (!point) {
      setStatus("Could not calculate section position.");
      return;
    }

    if (!API || !API.viewer) {
      setStatus(
        `Calculated section position only.\n\n` +
        `Alignment: ${alignment.name}\n` +
        `Chainage: ${chainage} m\n` +
        `X: ${point.x.toFixed(3)}\n` +
        `Y: ${point.y.toFixed(3)}\n\n` +
        `Trimble API is not connected.`
      );
      return;
    }

    await API.viewer.removeSectionPlanes();
    await createSectionPlane(point);

    setStatus(
      `Section created.\n\n` +
      `Alignment: ${alignment.name}\n` +
      `Chainage: ${chainage} m\n` +
      `X: ${point.x.toFixed(3)}\n` +
      `Y: ${point.y.toFixed(3)}`
    );

  } catch (error) {
    console.error(error);
    setStatus("Could not create section.\n\n" + error.message);
  }
};

init();
