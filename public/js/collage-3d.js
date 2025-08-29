// Three.js Sphere Collage Implementation
// Use direct CDN imports as fallback for import map issues
import * as THREE from 'https://esm.sh/three@0.158.0';
import { OrbitControls } from 'https://esm.sh/three@0.158.0/examples/jsm/controls/OrbitControls.js';

class SphereCollageManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.sphere = null;
        this.memberMeshes = [];
        this.members = [];
        this.canvas = null;
        this.container = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isInitialized = false;
        this.hoveredMesh = null;
        this.animationId = null;
        
        // Performance settings
        this.isLowPerformance = this.detectLowPerformance();
        this.textureSize = this.isLowPerformance ? 128 : 256;
        this.sphereSegments = this.isLowPerformance ? 32 : 64;
    }

    detectLowPerformance() {
        // Simple performance detection
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) return true;
        
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            // Check for mobile or integrated graphics
            if (renderer.includes('Mali') || renderer.includes('Adreno') || renderer.includes('Intel')) {
                return true;
            }
        }
        
        // Check for mobile devices
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    async init(canvas, members) {
        if (this.isInitialized) {
            this.dispose();
        }

        this.canvas = canvas;
        this.members = members;
        this.container = canvas.parentElement;

        try {
            // Wait for the canvas to be visible and have proper dimensions
            await this.waitForCanvasReady();
            
            this.setupScene();
            this.setupCamera();
            this.setupRenderer();
            this.setupControls();
            this.setupLighting();
            await this.createSphere();
            this.setupEventListeners();
            this.animate();
            
            // Force a resize after initialization to ensure proper rendering
            setTimeout(() => {
                this.onWindowResize();
            }, 100);
            
            this.isInitialized = true;
            console.log('3D Sphere initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize 3D sphere:', error);
            this.dispose();
            return false;
        }
    }
    
    async waitForCanvasReady() {
        // Simply resolve immediately - let CSS handle all dimensions
        return Promise.resolve();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        // Set transparent background for the scene
        this.scene.background = null; // Transparent background
    }

    setupCamera() {
        // Use fixed camera settings - CSS controls all dimensions
        const fov = 75;
        const cameraDistance = 7;
        
        // Get aspect ratio from canvas for proper camera setup
        const width = this.canvas.clientWidth || 800;
        const height = this.canvas.clientHeight || 800;
        const aspect = width / height;
        
        this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
        this.camera.position.set(0, 0, cameraDistance);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        
        // Get canvas dimensions for proper resolution
        const width = this.canvas.clientWidth || 800;
        const height = this.canvas.clientHeight || 800;
        
        // Set pixel ratio for crisp rendering
        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        this.renderer.setPixelRatio(pixelRatio);
        
        // Set renderer size for proper resolution - don't override CSS
        this.renderer.setSize(width, height, false);
        
        // Enable shadows and tone mapping
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = false;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 10;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.5;
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        if (!this.isLowPerformance) {
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 1024;
            directionalLight.shadow.mapSize.height = 1024;
        }
        this.scene.add(directionalLight);

        // Point light for extra illumination
        const pointLight = new THREE.PointLight(0xffffff, 0.3);
        pointLight.position.set(-5, -5, 5);
        this.scene.add(pointLight);
    }

    async createSphere() {
        // Calculate dynamic sphere size based on member count and screen size
        const radius = this.getDynamicSphereRadius();
        
        console.log(`Creating sphere with radius ${radius} for ${this.members.length} members on screen width ${window.innerWidth}px`);
        
        const geometry = new THREE.SphereGeometry(radius, this.sphereSegments, this.sphereSegments);
        
        // Create simple uniform transparent grey sphere material
        const material = new THREE.MeshLambertMaterial({
            color: 0x808080, // Medium grey
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });

        this.sphere = new THREE.Mesh(geometry, material);
        this.scene.add(this.sphere);

        // Store the current radius for resize handling
        this.currentSphereRadius = radius;

        // Add member images to sphere
        await this.addMembersToSphere(radius);
    }

    getDynamicSphereRadius() {
        const memberCount = this.members ? this.members.length : 0;
        const screenWidth = window.innerWidth;
        
        // Base radius based on screen size - unified for consistent experience
        let baseRadius;
        if (screenWidth < 480) {
            baseRadius = 2.5; // Increased from 1.2 to match desktop density
        } else if (screenWidth < 768) {
            baseRadius = 2.5; // Slightly smaller than desktop for tablets
        } else {
            baseRadius = 2.5; // Desktop
        }
        
        // Dynamic scaling based on member count
        // Use more gradual scaling to keep members visually dense
        const scalingFactor = Math.pow(Math.max(memberCount, 1) / 20, 0.35);
        const dynamicRadius = baseRadius * Math.max(1, scalingFactor);
        
        // Cap maximum radius to prevent performance issues
        const maxRadius = screenWidth < 480 ? 3 : screenWidth < 768 ? 4 : 6;
        
        return Math.min(dynamicRadius, maxRadius);
    }

    getResponsiveSphereRadius() {
        // Legacy method - now redirects to dynamic calculation
        return this.getDynamicSphereRadius();
    }

    async addMembersToSphere(radius) {
        if (!this.members || this.members.length === 0) return;

        this.memberMeshes = [];
        const positions = this.calculateSpherePositions(this.members.length, radius);

        for (let i = 0; i < this.members.length; i++) {
            const member = this.members[i];
            const position = positions[i];

            try {
                const mesh = await this.createMemberMesh(member, position, radius);
                if (mesh) {
                    this.memberMeshes.push(mesh);
                    this.scene.add(mesh);
                }
            } catch (error) {
                console.warn(`Failed to create mesh for member ${member.name}:`, error);
            }
        }
    }

    calculateSpherePositions(count, radius) {
        const positions = [];
        
        if (count === 0) return positions;
        
        // Use Fibonacci spiral for optimal distribution with no overlap
        // This ensures even spacing and no clustering
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        const angleIncrement = 2 * Math.PI / goldenRatio;
        
        for (let i = 0; i < count; i++) {
            // Calculate position using Fibonacci spiral
            const t = i / count;
            const inclination = Math.acos(1 - 2 * t); // Polar angle (0 to π)
            const azimuth = angleIncrement * i; // Azimuthal angle
            
            // Convert spherical to Cartesian coordinates
            const x = radius * Math.sin(inclination) * Math.cos(azimuth);
            const y = radius * Math.sin(inclination) * Math.sin(azimuth);
            const z = radius * Math.cos(inclination);
            
            positions.push(new THREE.Vector3(x, y, z));
        }
        
        // If we have very few members, use a more structured approach
        if (count <= 4) {
            return this.calculateStructuredPositions(count, radius);
        }
        
        return positions;
    }
    
    calculateStructuredPositions(count, radius) {
        const positions = [];
        
        if (count === 1) {
            // Single member at the front
            positions.push(new THREE.Vector3(0, 0, radius));
        } else if (count === 2) {
            // Two members opposite each other
            positions.push(new THREE.Vector3(0, 0, radius));
            positions.push(new THREE.Vector3(0, 0, -radius));
        } else if (count === 3) {
            // Three members in a triangle around the equator
            for (let i = 0; i < 3; i++) {
                const angle = (i * 2 * Math.PI) / 3;
                positions.push(new THREE.Vector3(
                    radius * Math.cos(angle),
                    radius * Math.sin(angle),
                    0
                ));
            }
        } else if (count === 4) {
            // Four members in a tetrahedron pattern
            const tetrahedronAngles = [
                { theta: 0, phi: 0 },
                { theta: 2 * Math.PI / 3, phi: Math.acos(-1/3) },
                { theta: 4 * Math.PI / 3, phi: Math.acos(-1/3) },
                { theta: 0, phi: Math.PI }
            ];
            
            tetrahedronAngles.forEach(({ theta, phi }) => {
                const x = radius * Math.sin(phi) * Math.cos(theta);
                const y = radius * Math.sin(phi) * Math.sin(theta);
                const z = radius * Math.cos(phi);
                positions.push(new THREE.Vector3(x, y, z));
            });
        }
        
        return positions;
    }

    async createMemberMesh(member, position, sphereRadius) {
        return new Promise((resolve, reject) => {
            if (!member.imageUrl) {
                resolve(null);
                return;
            }

            const loader = new THREE.TextureLoader();
            loader.crossOrigin = 'anonymous';
            
            loader.load(
                member.imageUrl,
                (texture) => {
                    // Configure texture
                    texture.wrapS = THREE.ClampToEdgeWrapping;
                    texture.wrapT = THREE.ClampToEdgeWrapping;
                    texture.minFilter = THREE.LinearFilter;
                    texture.magFilter = THREE.LinearFilter;

                    // Calculate optimal image size based on sphere radius and member count
                    const memberCount = this.members.length;
                    const screenWidth = window.innerWidth;
                    
                    // Unified base size across all devices for consistent experience
                    let baseSize;
                    if (screenWidth < 480) {
                        baseSize = 0.75; // Unified with desktop for consistent density
                    } else if (screenWidth < 768) {
                        baseSize = 0.8; // Slightly larger for tablets
                    } else {
                        baseSize = 0.8; // Desktop baseline
                    }
                    
                    // Scale size based on sphere radius and member density
                    const radiusScale = sphereRadius / 2.5; // Normalize to base radius of 2.5
                    const densityScale = Math.max(0.7, 1 - (memberCount - 20) * 0.01); // Less aggressive scaling - starts reducing after 20 members
                    
                    const size = baseSize * radiusScale * densityScale;
                    
                    // Ensure minimum and maximum sizes
                    const minSize = screenWidth < 480 ? 0.2 : 0.3;
                    const maxSize = screenWidth < 480 ? 0.6 : 0.8;
                    const finalSize = Math.max(minSize, Math.min(maxSize, size));
                    
                    const geometry = new THREE.PlaneGeometry(finalSize, finalSize);
                    const material = new THREE.MeshLambertMaterial({
                        map: texture,
                        transparent: true,
                        side: THREE.DoubleSide
                    });

                    const mesh = new THREE.Mesh(geometry, material);
                    
                    // Position the mesh on the sphere surface
                    mesh.position.copy(position);
                    
                    // Make the plane face outward from the sphere center
                    mesh.lookAt(position.clone().multiplyScalar(2));
                    
                    // Store member data for interaction
                    mesh.userData = {
                        member: member,
                        originalPosition: position.clone(),
                        originalScale: new THREE.Vector3(1, 1, 1)
                    };

                    resolve(mesh);
                },
                undefined,
                (error) => {
                    console.warn(`Failed to load texture for ${member.name}:`, error);
                    resolve(null);
                }
            );
        });
    }

    setupEventListeners() {
        // Mouse/touch events for interaction
        this.canvas.addEventListener('mousemove', (event) => this.onMouseMove(event));
        this.canvas.addEventListener('click', (event) => this.onMouseClick(event));
        this.canvas.addEventListener('touchstart', (event) => this.onTouchStart(event));
        this.canvas.addEventListener('touchend', (event) => this.onTouchEnd(event));

        // Resize handler
        window.addEventListener('resize', () => this.onWindowResize());

        // Visibility change handler for performance
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.controls.autoRotate = false;
            } else {
                this.controls.autoRotate = true;
            }
        });
    }

    onMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.updateHover();
    }

    onTouchStart(event) {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
            
            this.updateHover();
        }
    }

    onTouchEnd(event) {
        if (event.changedTouches.length === 1) {
            this.onMouseClick(event.changedTouches[0]);
        }
    }

    onMouseClick(event) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.memberMeshes);

        if (intersects.length > 0) {
            const mesh = intersects[0].object;
            const member = mesh.userData.member;
            
            // Trigger modal opening (will be handled by main collage manager)
            if (window.collageManager && typeof window.collageManager.openModal === 'function') {
                window.collageManager.openModal(member);
            }
        }
    }

    updateHover() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.memberMeshes);

        // Reset previous hover
        if (this.hoveredMesh) {
            this.hoveredMesh.scale.copy(this.hoveredMesh.userData.originalScale);
            this.hoveredMesh = null;
            this.canvas.style.cursor = 'grab';
        }

        // Apply hover effect
        if (intersects.length > 0) {
            this.hoveredMesh = intersects[0].object;
            this.hoveredMesh.scale.multiplyScalar(1.2);
            this.canvas.style.cursor = 'pointer';
        }
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;

        // Get current canvas dimensions from CSS
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        // Update camera aspect ratio only
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // Update renderer resolution without overriding CSS styling
        this.renderer.setSize(width, height, false);
    }

    async resizeSphere(newRadius) {
        if (!this.sphere || !this.members) return;

        console.log(`Resizing sphere from ${this.currentSphereRadius} to ${newRadius}`);

        // Remove existing member meshes
        this.memberMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            if (mesh.material.map) {
                mesh.material.map.dispose();
            }
            mesh.material.dispose();
            mesh.geometry.dispose();
        });
        this.memberMeshes = [];

        // Remove and recreate the sphere with new size
        this.scene.remove(this.sphere);
        this.sphere.material.dispose();
        this.sphere.geometry.dispose();

        // Create new sphere with updated radius
        const geometry = new THREE.SphereGeometry(newRadius, this.sphereSegments, this.sphereSegments);
        const material = new THREE.MeshLambertMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.1,
            wireframe: false
        });

        this.sphere = new THREE.Mesh(geometry, material);
        this.scene.add(this.sphere);

        // Update stored radius
        this.currentSphereRadius = newRadius;

        // Recreate member meshes with new positions
        await this.addMembersToSphere(newRadius);
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        if (this.controls) {
            this.controls.update();
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        if (this.controls) {
            this.controls.dispose();
            this.controls = null;
        }

        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }

        // Clean up meshes and materials
        this.memberMeshes.forEach(mesh => {
            if (mesh.material.map) {
                mesh.material.map.dispose();
            }
            mesh.material.dispose();
            mesh.geometry.dispose();
        });

        this.memberMeshes = [];

        if (this.sphere) {
            this.sphere.material.dispose();
            this.sphere.geometry.dispose();
            this.sphere = null;
        }

        if (this.scene) {
            this.scene.clear();
            this.scene = null;
        }

        this.camera = null;
        this.isInitialized = false;
    }

    // Public methods for external control
    pauseAutoRotation() {
        if (this.controls) {
            this.controls.autoRotate = false;
        }
    }

    resumeAutoRotation() {
        if (this.controls) {
            this.controls.autoRotate = true;
        }
    }

    focusOnMember(memberIndex) {
        if (memberIndex >= 0 && memberIndex < this.memberMeshes.length) {
            const mesh = this.memberMeshes[memberIndex];
            const position = mesh.position.clone().multiplyScalar(1.5);
            
            // Animate camera to focus on member
            this.animateCameraTo(position);
        }
    }

    animateCameraTo(targetPosition) {
        // Simple camera animation (could be enhanced with a tweening library)
        const startPosition = this.camera.position.clone();
        const duration = 1000; // 1 second
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Smooth easing function
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            this.camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
            this.camera.lookAt(0, 0, 0);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }
}

// Export for use in other modules
export default SphereCollageManager;
