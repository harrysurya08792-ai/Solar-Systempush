/**
 * Planet class for managing individual planet properties and behaviors
 */
export class Planet {
  constructor(name, size, texture, distance, rotationSpeed, orbitSpeed, ring = null) {
    this.name = name;
    this.size = size;
    this.texture = texture;
    this.distance = distance;
    this.rotationSpeed = rotationSpeed;
    this.orbitSpeed = orbitSpeed;
    this.ring = ring;

    this.mesh = null;
    this.orbitObject = null;
    this.infoElement = null;

    this.createPlanet();
  }

  createPlanet() {
    // Create planet geometry and material
    const geometry = new THREE.SphereGeometry(this.size, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      map: this.texture,
      roughness: 0.8,
      metalness: 0.1
    });

    this.mesh = new THREE.Mesh(geometry, material);

    // Create orbit container
    this.orbitObject = new THREE.Object3D();
    this.orbitObject.add(this.mesh);
    this.mesh.position.set(this.distance, 0, 0);

    // Add ring if present
    if (this.ring) {
      const ringGeometry = new THREE.RingGeometry(
        this.ring.innerRadius,
        this.ring.outerRadius,
        64
      );
      const ringMaterial = new THREE.MeshBasicMaterial({
        map: this.ring.texture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      this.orbitObject.add(ringMesh);
      ringMesh.rotation.x = -0.5 * Math.PI;
    }
  }

  update(deltaTime, speed) {
    // Rotate around sun
    this.orbitObject.rotation.y += this.orbitSpeed * speed * deltaTime;

    // Self rotation
    this.mesh.rotation.y += this.rotationSpeed * speed * deltaTime;
  }

  showInfo() {
    if (!this.infoElement) {
      this.createInfoElement();
    }
    this.infoElement.style.display = 'block';
  }

  hideInfo() {
    if (this.infoElement) {
      this.infoElement.style.display = 'none';
    }
  }

  createInfoElement() {
    this.infoElement = document.createElement('div');
    this.infoElement.className = 'planet-info';
    this.infoElement.innerHTML = `
      <h3>${this.name}</h3>
      <p>Distance from Sun: ${this.distance} AU</p>
      <p>Size: ${this.size} Earth radii</p>
      <p>Orbital Period: ${Math.round(365 / this.orbitSpeed)} days</p>
    `;
    this.infoElement.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      display: none;
      z-index: 1000;
    `;
    document.body.appendChild(this.infoElement);
  }

  getMesh() {
    return this.orbitObject;
  }
}
