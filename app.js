let API = null;
let alignments = [];

const statusBox = document.getElementById("status");
const alignmentSelect = document.getElementById("alignmentSelect");

function setStatus(text) {
  statusBox.textContent = text;
}

async function init() {
  API = await TrimbleConnectWorkspace.connect(window.parent, () => {});

  const response = await fetch("./aliniamente.xml?v=50");
  const xmlText = await response.text();

  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "text/xml");

  const alignmentNodes = Array.from(xml.getElementsByTagName("Alignment"));

  alignmentSelect.innerHTML = "";

  alignments = alignmentNodes.map((node, index) => {
    const item = {
      name: node.getAttribute("name"),
      length: Number(node.getAttribute("length")),
      node
    };

    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${item.name} | Length: ${item.length.toFixed(2)} m`;

    alignmentSelect.appendChild(option);

    return item;
  });

  setStatus(`Ready.\nAlignments loaded: ${alignments.length}`);
}

function parsePoint(text) {
  const p = text.trim().split(/\s+/).map(Number);
  return { x: p[0], y: p[1], z: 0 };
}

function getSegments(alignmentNode) {
  const coordGeom = alignmentNode.getElementsByTagName("CoordGeom")[0];
  const lines = Array.from(coordGeom.getElementsByTagName("Line"));

  return lines.map(line => {
    return {
      staStart: Number(line.getAttribute("staStart")),
      length: Number(line.getAttribute("length")),
      start: parsePoint(line.getElementsByTagName("Start")[0].textContent),
      end: parsePoint(line.getElementsByTagName("End")[0].textContent)
    };
  });
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
        z: 0,
        dirX: dx / len,
        dirY: dy / len
      };
    }
  }

  return null;
}

async function addPlane(point, normalX, normalY) {
  return API.viewer.addSectionPlane({
    position: {
      x: point.x,
      y: point.y,
      z: 0
    },
    normal: {
      x: normalX,
      y: normalY,
      z: 0
    }
  });
}

document.getElementById("slice").onclick = async () => {
  const alignment = alignments[Number(alignmentSelect.value)];

  const start = Number(document.getElementById("start").value);
  const end = Number(document.getElementById("end").value);

  if (!alignment) {
    setStatus("Select alignment.");
    return;
  }

  if (start >= end) {
    setStatus("End chainage must be greater than start.");
    return;
  }

  if (end > alignment.length) {
    setStatus(
      `End chainage is outside alignment length.\n\n` +
      `Alignment length: ${alignment.length.toFixed(2)} m`
    );
    return;
  }

  const segments = getSegments(alignment.node);

  const p1 = getPointAtChainage(segments, start);
  const p2 = getPointAtChainage(segments, end);

  if (!p1 || !p2) {
    setStatus("Could not calculate chainage points.");
    return;
  }

  try {
    await API.viewer.removeSectionPlanes();

    await addPlane(p1, -p1.dirY, p1.dirX);
    await addPlane(p2, p2.dirY, -p2.dirX);

    setStatus(
      `Slice created.\n\n` +
      `Alignment: ${alignment.name}\n` +
      `Start: ${start} m\n` +
      `End: ${end} m`
    );

  } catch (error) {
    console.error(error);

    setStatus(
      "Could not create section planes.\n\n" +
      "Open browser console and send me the error."
    );
  }
};

init();
