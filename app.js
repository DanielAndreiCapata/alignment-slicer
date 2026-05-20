let API = null;
let alignments = [];

const alignmentSelect = document.getElementById("alignment");
const startInput = document.getElementById("startKm");
const endInput = document.getElementById("endKm");
const statusBox = document.getElementById("status");

function setStatus(message) {
    statusBox.textContent = message;
}

async function init() {

    API = await TrimbleConnectWorkspace.connect(window.parent, () => {});

    const response = await fetch("./aliniamente.xml");
    const xmlText = await response.text();

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    const alignmentNodes = xmlDoc.getElementsByTagName("Alignment");

    for (let i = 0; i < alignmentNodes.length; i++) {

        const alignment = alignmentNodes[i];

        const name = alignment.getAttribute("name");

        const coordText =
            alignment.getElementsByTagName("CoordGeom")[0].textContent;

        const lines = coordText
            .trim()
            .split("\n")
            .map(l => l.trim())
            .filter(l => l.length > 0);

        const points = lines.map(line => {

            const parts = line.split(",");

            return {
                x: parseFloat(parts[0]),
                y: parseFloat(parts[1])
            };
        });

        let totalLength = 0;

        for (let j = 1; j < points.length; j++) {

            const dx = points[j].x - points[j - 1].x;
            const dy = points[j].y - points[j - 1].y;

            totalLength += Math.sqrt(dx * dx + dy * dy);
        }

        alignments.push({
            name,
            points,
            length: totalLength
        });

        const option = document.createElement("option");

        option.value = i;
        option.textContent =
            `${name} | Length: ${totalLength.toFixed(2)} m`;

        alignmentSelect.appendChild(option);
    }

    setStatus("Ready.");
}

function getPointAtChainage(points, chainage) {

    let accumulated = 0;

    for (let i = 1; i < points.length; i++) {

        const p1 = points[i - 1];
        const p2 = points[i];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;

        const segmentLength = Math.sqrt(dx * dx + dy * dy);

        if (accumulated + segmentLength >= chainage) {

            const local = chainage - accumulated;

            const t = local / segmentLength;

            return {
                x: p1.x + dx * t,
                y: p1.y + dy * t,
                dirX: dx / segmentLength,
                dirY: dy / segmentLength
            };
        }

        accumulated += segmentLength;
    }

    return null;
}

document.getElementById("calculate").onclick = async () => {

    const alignment =
        alignments[alignmentSelect.value];

    const startKm =
        parseFloat(startInput.value);

    const endKm =
        parseFloat(endInput.value);

    if (!alignment) {
        setStatus("Select alignment.");
        return;
    }

    const startPoint =
        getPointAtChainage(
            alignment.points,
            startKm
        );

    const endPoint =
        getPointAtChainage(
            alignment.points,
            endKm
        );

    if (!startPoint || !endPoint) {

        setStatus("Invalid chainage.");
        return;
    }

    try {

        await API.viewer.removeSectionPlanes();

    } catch (e) {}

    try {

        await API.viewer.addSectionPlane({

            position: {
                x: startPoint.x,
                y: startPoint.y,
                z: 0
            },

            normal: {
                x: -startPoint.dirY,
                y: startPoint.dirX,
                z: 0
            }
        });

        await API.viewer.addSectionPlane({

            position: {
                x: endPoint.x,
                y: endPoint.y,
                z: 0
            },

            normal: {
                x: endPoint.dirY,
                y: -endPoint.dirX,
                z: 0
            }
        });

        setStatus(
            "SECTION PLANES CREATED\n\n" +

            `Alignment: ${alignment.name}\n` +

            `Start: ${startKm} m\n` +
            `End: ${endKm} m`
        );

    } catch (error) {

        console.error(error);

        setStatus(
            "Could not create section planes.\n\n" +
            error.message
        );
    }
};

init();
