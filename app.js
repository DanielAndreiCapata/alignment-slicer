let API = null;
let xmlDoc = null;
let alignments = [];

const statusBox = document.getElementById("status");
const alignmentSelect = document.getElementById("alignmentSelect");

function setStatus(message) {
  statusBox.textContent = message;
}

async function init() {

  try {

    API = await TrimbleConnectWorkspace.connect(
      window.parent,
      () => {}
    );

    setStatus("Connected to Trimble Connect");

  } catch (e) {

    console.warn(e);

    setStatus("Running outside Trimble");

  }

  await loadXML();
}

async function loadXML() {

  try {

    const response =
      await fetch("./aliniamente.xml?v=20");

    const xmlText = await response.text();

    const parser = new DOMParser();

    xmlDoc =
      parser.parseFromString(xmlText, "text/xml");

    const alignmentNodes =
      Array.from(
        xmlDoc.getElementsByTagName("Alignment")
      );

    alignments = alignmentNodes.map(node => {

      return {

        name:
          node.getAttribute("name"),

        length:
          Number(node.getAttribute("length")),

        staStart:
          Number(node.getAttribute("staStart")),

        node:
          node

      };

    });

    alignmentSelect.innerHTML = "";

    alignments.forEach((alignment, index) => {

      const option =
        document.createElement("option");

      option.value = index;

      option.textContent =
        alignment.name +
        " | Length: " +
        alignment.length.toFixed(2) +
        " m";

      alignmentSelect.appendChild(option);

    });

    setStatus(
      "XML loaded successfully.\n" +
      "Alignments found: " +
      alignments.length
    );

  } catch (error) {

    console.error(error);

    setStatus(
      "Could not load XML."
    );

  }

}

function parsePoint(text) {

  const parts =
    text.trim()
    .split(/\s+/)
    .map(Number);

  return {

    x: parts[0],
    y: parts[1],
    z: parts[2] || 0

  };

}

function getSegments(alignmentNode) {

  const coordGeom =
    alignmentNode
    .getElementsByTagName("CoordGeom")[0];

  const lineNodes =
    Array.from(
      coordGeom.getElementsByTagName("Line")
    );

  return lineNodes.map(line => {

    const startNode =
      line.getElementsByTagName("Start")[0];

    const endNode =
      line.getElementsByTagName("End")[0];

    return {

      staStart:
        Number(line.getAttribute("staStart")),

      length:
        Number(line.getAttribute("length")),

      start:
        parsePoint(startNode.textContent),

      end:
        parsePoint(endNode.textContent)

    };

  });

}

function getPointAtChainage(
  segments,
  chainage
) {

  for (const segment of segments) {

    const staStart =
      segment.staStart;

    const staEnd =
      staStart + segment.length;

    if (
      chainage >= staStart &&
      chainage <= staEnd
    ) {

      const ratio =
        (chainage - staStart)
        / segment.length;

      const x =
        segment.start.x +
        (segment.end.x - segment.start.x)
        * ratio;

      const y =
        segment.start.y +
        (segment.end.y - segment.start.y)
        * ratio;

      const dx =
        segment.end.x - segment.start.x;

      const dy =
        segment.end.y - segment.start.y;

      const len =
        Math.sqrt(dx * dx + dy * dy);

      return {

        x,
        y,

        normalX:
          -dy / len,

        normalY:
          dx / len

      };

    }

  }

  return null;

}

document
.getElementById("slice")
.onclick = async () => {

  const alignment =
    alignments[
      Number(alignmentSelect.value)
    ];

  const start =
    Number(
      document.getElementById("start").value
    );

  const end =
    Number(
      document.getElementById("end").value
    );

  const segments =
    getSegments(alignment.node);

  const startPoint =
    getPointAtChainage(
      segments,
      start
    );

  const endPoint =
    getPointAtChainage(
      segments,
      end
    );

  if (!startPoint || !endPoint) {

    setStatus(
      "Could not calculate chainage."
    );

    return;

  }

  setStatus(

    "SLICE CALCULATED\n\n" +

    "Alignment:\n" +
    alignment.name +

    "\n\nSTART:\n" +

    "X: " +
    startPoint.x.toFixed(3) +

    "\nY: " +
    startPoint.y.toFixed(3) +

    "\n\nEND:\n" +

    "X: " +
    endPoint.x.toFixed(3) +

    "\nY: " +
    endPoint.y.toFixed(3)

  );

};

init();
