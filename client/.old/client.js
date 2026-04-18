const width = 700;
const height = 500;
const padding = 60;

const svg = document.getElementById("plot");
const tooltip = document.getElementById("tooltip");

fetch("http://127.0.0.1:5000/pca")
  .then(response => response.json())
  .then(data => drawPCA(data));

function drawPCA(data) {
  const { x, y, countries, explained_variance } = data;

  // Compute scales
  const xMin = Math.min(...x);
  const xMax = Math.max(...x);
  const yMin = Math.min(...y);
  const yMax = Math.max(...y);

  const xScale = v =>
    padding + ((v - xMin) / (xMax - xMin)) * (width - 2 * padding);

  const yScale = v =>
    height - padding - ((v - yMin) / (yMax - yMin)) * (height - 2 * padding);

  // Clear previous plot
  svg.innerHTML = "";

  // Axes
  drawAxis(
    padding,
    height - padding,
    width - padding,
    height - padding,
    `PC1 (${(explained_variance[0] * 100).toFixed(1)}%)`
  );

  drawAxis(
    padding,
    padding,
    padding,
    height - padding,
    `PC2 (${(explained_variance[1] * 100).toFixed(1)}%)`,
    true
  );

  // Draw points
  for (let i = 0; i < x.length; i++) {
    const cx = xScale(x[i]);
    const cy = yScale(y[i]);

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", cx);
    circle.setAttribute("cy", cy);
    circle.setAttribute("r", 5);
    circle.setAttribute("class", "point");

    circle.addEventListener("mousemove", e => {
      tooltip.style.display = "block";
      tooltip.style.left = e.pageX + 10 + "px";
      tooltip.style.top = e.pageY + 10 + "px";
      tooltip.textContent = countries[i];
    });

    circle.addEventListener("mouseout", () => {
      tooltip.style.display = "none";
    });

    svg.appendChild(circle);
  }
}

function drawAxis(x1, y1, x2, y2, label, vertical = false) {
  const axis = document.createElementNS("http://www.w3.org/2000/svg", "line");
  axis.setAttribute("x1", x1);
  axis.setAttribute("y1", y1);
  axis.setAttribute("x2", x2);
  axis.setAttribute("y2", y2);
  axis.setAttribute("stroke", "black");

  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  if (vertical) {
    text.setAttribute("x", 15);
    text.setAttribute("y", height / 2);
    text.setAttribute("transform", `rotate(-90 15 ${height / 2})`);
  } else {
    text.setAttribute("x", width / 2);
    text.setAttribute("y", height - 10);
  }
  text.setAttribute("text-anchor", "middle");
  text.textContent = label;

  svg.appendChild(axis);
  svg.appendChild(text);
}