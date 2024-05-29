// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
canvasWidth =  document.getElementById('color-space').clientWidth
canvasHeight =  document.getElementById('color-space').clientHeight
const camera = new THREE.PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(canvasWidth, canvasHeight);
document.getElementById('color-space').appendChild(renderer.domElement);

// Create the triangular bipyramid geometry
const geometry = new THREE.Geometry();
geometry.vertices.push(
  new THREE.Vector3(0, 1, 0),  // Top pole (white)
  new THREE.Vector3(-1, 0, -1),  // Red vertex
  new THREE.Vector3(1, 0, -1),  // Yellow vertex
  new THREE.Vector3(0, 0, 1),  // Blue vertex
  new THREE.Vector3(0, -1, 0)  // Bottom pole (black)
);
geometry.faces.push(
  new THREE.Face3(0, 1, 2),  // Top face (white, red, yellow)
  new THREE.Face3(0, 2, 3),  // Top face (white, yellow, blue)
  new THREE.Face3(0, 3, 1),  // Top face (white, blue, red)
  new THREE.Face3(4, 2, 1),  // Bottom face (black, yellow, red)
  new THREE.Face3(4, 3, 2),  // Bottom face (black, blue, yellow)
  new THREE.Face3(4, 1, 3)  // Bottom face (black, red, blue)
);

// Create the material and mesh
const material = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// Set the colors of the vertices
geometry.faces[0].vertexColors = [new THREE.Color(0xffffff), new THREE.Color(0xff0000), new THREE.Color(0xffff00)];
geometry.faces[1].vertexColors = [new THREE.Color(0xffffff), new THREE.Color(0xffff00), new THREE.Color(0x0000ff)];
geometry.faces[2].vertexColors = [new THREE.Color(0xffffff), new THREE.Color(0x0000ff), new THREE.Color(0xff0000)];
geometry.faces[3].vertexColors = [new THREE.Color(0x000000), new THREE.Color(0xffff00), new THREE.Color(0xff0000)];
geometry.faces[4].vertexColors = [new THREE.Color(0x000000), new THREE.Color(0x0000ff), new THREE.Color(0xffff00)];
geometry.faces[5].vertexColors = [new THREE.Color(0x000000), new THREE.Color(0xff0000), new THREE.Color(0x0000ff)];

// Position the camera and render the scene
camera.position.z = 5;
function animate() {
  requestAnimationFrame(animate);
  mesh.rotation.x += 0.01;
  mesh.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();

// TODO: Add color selection and display logic

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener('click', onMouseClick, false);

function onMouseClick(event) {
  mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
  mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(mesh);

  if (intersects.length > 0) {
    const selectedColor = intersects[0].face.color;
    displaySelectedColor(selectedColor);
  }
}

function displaySelectedColor(color) {
  const selectedColorElement = document.getElementById('selected-color');
  selectedColorElement.style.backgroundColor = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;

  const rybValues = `R: ${color.r.toFixed(2)}, Y: ${color.g.toFixed(2)}, B: ${color.b.toFixed(2)}`;
  document.getElementById('ryb-values').textContent = rybValues;

  const rgbValues = `R: ${Math.round(color.r * 255)}, G: ${Math.round(color.g * 255)}, B: ${Math.round(color.b * 255)}`;
  document.getElementById('rgb-values').textContent = rgbValues;
}
