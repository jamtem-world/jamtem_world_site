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
            this.setupScene();
            this.setupCamera();
            this.setupRenderer();
            this.setupControls();
            this.setupLighting();
            await this.createSphere();
            this.setupEventListeners();
            this.animate();
            
            this.isInitialized = true;
            console.log('3D Sphere initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize 3D sphere:', error);
            this.dispose();
            return false;
        }
    }

    setupScene() {
        this.scene = new THREE.Scene();
        // Set transparent background for the scene
        this.scene.background = null; // Transparent background
    }

    setupCamera() {
        // Get proper aspect ratio, fallback to 4:3 if canvas has no dimensions yet
        let width = this.canvas.clientWidth;
        let height = this.canvas.clientHeight;
        
        if (width === 0 || height === 0) {
            const container = this.canvas.parentElement;
            width = container ? container.clientWidth : 800;
            height = container ? container.clientHeight : 600;
        }
        
        if (width === 0 || height === 0) {
            width = 800;
            height = 600;
        }
        
        const aspect = width / height;
        console.log(`Setting camera aspect ratio: ${aspect} (${width}x${height})`);
        
        // Adjust camera settings based on screen size
        const screenWidth = window.innerWidth;
        let fov, cameraDistance;
        
        if (screenWidth < 480) {
            fov = 85; // Wider field of view for mobile
            cameraDistance = 4; // Closer to sphere for mobile
        } else if (screenWidth < 768) {
            fov = 80; // Medium field of view for tablets
            cameraDistance = 4.5; // Medium distance for tablets
        } else {
            fov = 75; // Standard field of view for desktop
            cameraDistance = 5; // Standard distance for desktop
        }
        
        this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
        this.camera.position.set(0, 0, cameraDistance);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: !this.isLowPerformance,
            powerPreference: this.isLowPerformance ? 'low-power' : 'high-performance'
        });
        
        // Get canvas dimensions from CSS computed styles
        const computedStyle = window.getComputedStyle(this.canvas);
        let width = parseInt(computedStyle.width) || this.canvas.clientWidth;
        let height = parseInt(computedStyle.height) || this.canvas.clientHeight;
        
        if (width === 0 || height === 0) {
            // Fallback to container dimensions
            const container = this.canvas.parentElement;
            width = container ? container.clientWidth : 800;
            height = container ? container.clientHeight : 600;
        }
        
        if (width === 0 || height === 0) {
            // Final fallback to default dimensions
            width = 800;
            height = 600;
        }
        
        console.log(`Setting canvas size to: ${width}x${height}`);
        
        // Set the renderer size but don't let it override CSS styles
        this.renderer.setSize(width, height, false); // false prevents setting inline styles
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isLowPerformance ? 1 : 2));
        this.renderer.shadowMap.enabled = !this.isLowPerformance;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Manually set canvas attributes without inline styles
        this.canvas.width = width * this.renderer.getPixelRatio();
        this.canvas.height = height * this.renderer.getPixelRatio();
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
        // Make sphere size responsive to screen size
        const radius = this.getResponsiveSphereRadius();
        
        console.log(`Creating sphere with radius ${radius} for screen width ${window.innerWidth}px`);
        
        const geometry = new THREE.SphereGeometry(radius, this.sphereSegments, this.sphereSegments);
        
        // Create base sphere material
        const material = new THREE.MeshLambertMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.1,
            wireframe: false
        });

        this.sphere = new THREE.Mesh(geometry, material);
        this.scene.add(this.sphere);

        // Store the current radius for resize handling
        this.currentSphereRadius = radius;

        // Add member images to sphere
        await this.addMembersToSphere(radius);
    }

    getResponsiveSphereRadius() {
        const screenWidth = window.innerWidth;
        
        if (screenWidth < 480) {
            return 1.2; // Much smaller sphere for mobile phones
        } else if (screenWidth < 768) {
            return 1.8; // Smaller sphere for tablets
        } else {
            return 2.5; // Medium size for desktop (reduced from 3)
        }
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
        
        if (count <= 12) {
            // For small numbers, cluster them in the front hemisphere
            const angleStep = (Math.PI * 0.8) / Math.max(count - 1, 1); // Reduced spread
            const startAngle = -Math.PI * 0.4; // Start from left side
            
            for (let i = 0; i < count; i++) {
                // Arrange in a curved line across the front of the sphere
                const theta = startAngle + (i * angleStep);
                const phi = Math.PI * 0.5; // Keep them in the middle latitude
                
                // Add some vertical variation for visual interest
                const verticalOffset = (Math.sin(i * 0.8) * 0.3);
                const adjustedPhi = phi + verticalOffset;
                
                const x = radius * Math.sin(adjustedPhi) * Math.cos(theta);
                const y = radius * Math.sin(adjustedPhi) * Math.sin(theta);
                const z = radius * Math.cos(adjustedPhi);
                
                positions.push(new THREE.Vector3(x, y, z));
            }
        } else {
            // For larger numbers, use Fibonacci spiral but constrained to front hemisphere
            const goldenRatio = (1 + Math.sqrt(5)) / 2;
            
            for (let i = 0; i < count; i++) {
                const theta = 2 * Math.PI * i / goldenRatio;
                // Constrain phi to front hemisphere (0 to PI/2 instead of 0 to PI)
                const phi = Math.acos(1 - (i + 0.5) / count) * 0.7; // Reduced spread
                
                const x = radius * Math.sin(phi) * Math.cos(theta);
                const y = radius * Math.sin(phi) * Math.sin(theta);
                const z = radius * Math.cos(phi);
                
                positions.push(new THREE.Vector3(x, y, z));
            }
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

                    // Make image size responsive to screen size
                    const screenWidth = window.innerWidth;
                    let size;
                    
                    if (screenWidth < 480) {
                        size = 0.4; // Smaller images for mobile phones
                    } else if (screenWidth < 768) {
                        size = 0.5; // Medium images for tablets
                    } else {
                        size = 0.6; // Full size for desktop
                    }
                    
                    const geometry = new THREE.PlaneGeometry(size, size);
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

        // Get canvas dimensions from CSS computed styles to respect responsive design
        const computedStyle = window.getComputedStyle(this.canvas);
        let width = parseInt(computedStyle.width) || this.canvas.clientWidth;
        let height = parseInt(computedStyle.height) || this.canvas.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // Set renderer size without overriding CSS styles
        this.renderer.setSize(width, height, false);
        
        // Manually set canvas attributes without inline styles
        this.canvas.width = width * this.renderer.getPixelRatio();
        this.canvas.height = height * this.renderer.getPixelRatio();
        
        // Update camera settings for new screen size
        const screenWidth = window.innerWidth;
        let fov, cameraDistance;
        
        if (screenWidth < 480) {
            fov = 85;
            cameraDistance = 4;
        } else if (screenWidth < 768) {
            fov = 80;
            cameraDistance = 4.5;
        } else {
            fov = 75;
            cameraDistance = 5;
        }
        
        // Update camera field of view and position if they've changed significantly
        if (Math.abs(this.camera.fov - fov) > 2) {
            this.camera.fov = fov;
            this.camera.updateProjectionMatrix();
        }
        
        // Smoothly adjust camera distance if needed
        const currentDistance = this.camera.position.length();
        if (Math.abs(currentDistance - cameraDistance) > 0.5) {
            const direction = this.camera.position.clone().normalize();
            this.camera.position.copy(direction.multiplyScalar(cameraDistance));
        }

        // Check if sphere size needs to be updated
        const newRadius = this.getResponsiveSphereRadius();
        if (Math.abs(this.currentSphereRadius - newRadius) > 0.1) {
            this.resizeSphere(newRadius);
        }
        
        console.log(`Resized to ${width}x${height}, screen width: ${screenWidth}px`);
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
