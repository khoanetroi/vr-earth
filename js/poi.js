var POIManager = function(scene, earthObject) {
    this.poiData = [
        { name: "Hà Nội", lat: 21.0285, lon: 105.8542, description: "Thủ đô của Việt Nam. Nổi tiếng với kiến trúc cổ kính và nền văn hóa phong phú." },
        { name: "TP. Hồ Chí Minh", lat: 10.7627, lon: 106.6602, description: "Đô thị sầm uất ở miền Nam Việt Nam. Trước đây được gọi là Sài Gòn." },
        { name: "Paris", lat: 48.8566, lon: 2.3522, description: "Kinh đô Ánh sáng. Trung tâm thế giới về nghệ thuật, thời trang và văn hóa." },
        { name: "New York", lat: 40.7128, lon: -74.0060, description: "Quả táo lớn. Trung tâm toàn cầu về tài chính, văn hóa và giải trí." },
        { name: "Tokyo", lat: 35.6895, lon: 139.6917, description: "Thủ đô nhộn nhịp của Nhật Bản. Sự kết hợp giữa hiện đại và truyền thống." },
        { name: "London", lat: 51.5074, lon: -0.1278, description: "Thủ đô của Vương quốc Anh. Thành phố với lịch sử lâu đời từ thời La Mã." },
        { name: "Sydney", lat: -33.8688, lon: 151.2093, description: "Nổi tiếng với Nhà hát Opera và Cầu Cảng tại Úc." },
        { name: "Rio de Janeiro", lat: -22.9068, lon: -43.1729, description: "Nơi có tượng Chúa Cứu Thế và bãi biển Copacabana nổi tiếng." },
        { name: "Cairo", lat: 30.0444, lon: 31.2357, description: "Cửa ngõ dẫn vào Đại kim tự tháp Giza và tượng Nhân sư ở Ai Cập." },
        { name: "Moscow", lat: 55.7558, lon: 37.6173, description: "Được biết đến với Quảng trường Đỏ, Điện Kremlin và Nhà thờ Saint Basil." },
        { name: "Bắc Kinh", lat: 39.9042, lon: 116.4074, description: "Thủ đô của Trung Quốc, quê hương của Tử Cấm Thành và Vạn Lý Trường Thành." },
        { name: "Rome", lat: 41.9028, lon: 12.4964, description: "Thành phố vĩnh cửu, nơi có Đấu trường La Mã và Thành quốc Vatican." },
        { name: "Dubai", lat: 25.2048, lon: 55.2708, description: "Nổi tiếng với Burj Khalifa, tòa nhà cao nhất thế giới." },
        { name: "San Francisco", lat: 37.7749, lon: -122.4194, description: "Nổi tiếng với Cầu Cổng Vàng và những chiếc xe cáp biểu tượng." }
    ];

    this.markers = [];
    this.markerGroup = new THREE.Group();
    earthObject.add(this.markerGroup);

    this.earthRadius = 6.3781;
    this.earthMesh = earthObject.children[0]; // Assuming the first child is the main Earth mesh
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredPOI = null;

    // Create a simple info panel (3D Plane)
    this.infoPanel = new (function() {
        var width = 1024, height = 512;
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        var texture = new THREE.Texture(canvas);
        var material = new THREE.MeshBasicMaterial({map: texture, transparent: true, opacity: 0, depthTest: false, depthWrite: false});
        var geometry = new THREE.PlaneGeometry(10, 5); // Larger and wider
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.renderOrder = 999; // Ensure it renders on top
        this.mesh.visible = false;
        this.targetOpacity = 0;
        scene.add(this.mesh);

        this.update = function(poi) {
            context.clearRect(0, 0, width, height);

            var padding = 20;
            var boxWidth = width - padding * 2;
            var boxHeight = height - padding * 2;
            var x = padding;
            var y = padding;
            var radius = 30;

            // Draw shadow
            context.shadowColor = 'rgba(0, 255, 255, 0.4)';
            context.shadowBlur = 25;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;

            // Gradient background
            var grad = context.createLinearGradient(x, y, x, y + boxHeight);
            grad.addColorStop(0, 'rgba(10, 20, 30, 0.85)');
            grad.addColorStop(1, 'rgba(2, 5, 10, 0.95)');

            context.fillStyle = grad;

            // Custom shape: rounded rectangle with sci-fi cut corners
            context.beginPath();
            context.moveTo(x + radius, y);
            context.lineTo(x + boxWidth - radius, y);
            context.quadraticCurveTo(x + boxWidth, y, x + boxWidth, y + radius);
            // Cut corner bottom right
            context.lineTo(x + boxWidth, y + boxHeight - 60);
            context.lineTo(x + boxWidth - 60, y + boxHeight);
            context.lineTo(x + radius, y + boxHeight);
            context.quadraticCurveTo(x, y + boxHeight, x, y + boxHeight - radius);
            // Cut corner top left
            context.lineTo(x, y + 60);
            context.lineTo(x + 60, y);
            context.lineTo(x + radius, y);
            context.closePath();
            
            context.fill();

            // Clear shadow for the rest
            context.shadowBlur = 0;

            // Subtle border
            context.lineWidth = 2;
            context.strokeStyle = 'rgba(0, 255, 255, 0.15)';
            context.stroke();

            // Sci-fi accent lines
            context.lineWidth = 4;
            context.strokeStyle = '#00ffff';
            
            // Top left accent
            context.beginPath();
            context.moveTo(x, y + 60);
            context.lineTo(x + 60, y);
            context.lineTo(x + boxWidth * 0.4, y);
            context.stroke();

            // Bottom right accent
            context.beginPath();
            context.moveTo(x + boxWidth, y + boxHeight - 60);
            context.lineTo(x + boxWidth - 60, y + boxHeight);
            context.lineTo(x + boxWidth * 0.6, y + boxHeight);
            context.stroke();

            // Marker Dot
            context.fillStyle = '#00ffff';
            context.beginPath();
            context.arc(x + 60, y + 85, 8, 0, Math.PI * 2);
            context.fill();

            // Text Typography
            context.fillStyle = '#ffffff';
            context.font = 'bold 64px "Segoe UI", Roboto, Helvetica, sans-serif';
            context.textAlign = 'left';
            context.fillText(poi.name, x + 90, y + 105);
            
            // Separator line
            context.fillStyle = 'rgba(255, 255, 255, 0.1)';
            context.fillRect(x + 50, y + 140, boxWidth - 100, 2);

            // Description text
            context.fillStyle = '#bbbbbb';
            context.font = '36px "Segoe UI", Roboto, Helvetica, sans-serif';
            
            var words = poi.description.split(' ');
            var line = '';
            var textY = y + 210;
            for(var n = 0; n < words.length; n++) {
                var testLine = line + words[n] + ' ';
                var metrics = context.measureText(testLine);
                if (metrics.width > boxWidth - 120 && n > 0) {
                    context.fillText(line, x + 60, textY);
                    line = words[n] + ' ';
                    textY += 55;
                } else {
                    line = testLine;
                }
            }
            context.fillText(line, x + 60, textY);
            
            texture.needsUpdate = true;
        };
    })();

    this.init = function() {
        var markerGeo = new THREE.SphereGeometry(0.1, 16, 16);
        var markerMat = new THREE.MeshBasicMaterial({color: 0x00ffff});

        for (var i = 0; i < this.poiData.length; i++) {
            var poi = this.poiData[i];
            var pos = this.latLonToVector3(poi.lat, poi.lon, this.earthRadius + 0.1);
            var marker = new THREE.Mesh(markerGeo, markerMat.clone());
            marker.position.copy(pos);
            marker.userData = poi;
            this.markerGroup.add(marker);
            this.markers.push(marker);
        }
    };

    this.latLonToVector3 = function(lat, lon, radius) {
        var phi = (90 - lat) * (Math.PI / 180);
        var theta = (lon + 180) * (Math.PI / 180);

        var x = -(radius * Math.sin(phi) * Math.cos(theta));
        var z = (radius * Math.sin(phi) * Math.sin(theta));
        var y = (radius * Math.cos(phi));

        return new THREE.Vector3(x, y, z);
    };

    this.update = function(camera, mouse) {
        // Desktop mouse picking
        if (!vrDisplay) {
            this.raycaster.setFromCamera(mouse, camera);
        } else {
            // In VR, the raycaster should follow the poseCamera direction (controller/head)
            var direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            this.raycaster.set(camera.position, direction);
        }

        var intersects = this.raycaster.intersectObjects([this.earthMesh].concat(this.markers));
        if (intersects.length > 0) {
            var firstHit = intersects[0].object;
            // If the first thing we hit is NOT the Earth, it must be a marker
            if (firstHit !== this.earthMesh) {
                var poi = firstHit.userData;
                if (this.hoveredPOI !== poi) {
                    this.hoveredPOI = poi;
                    this.infoPanel.update(poi);
                    this.infoPanel.targetOpacity = 0.9;
                    // Update marker color
                    firstHit.material.color.set(0xffff00);
                }
            } else {
                this.resetHover();
            }
        } else {
            this.resetHover();
        }
    };

    this.resetHover = function() {
        if (this.hoveredPOI) {
            // Reset colors
            for (var i = 0; i < this.markers.length; i++) {
                this.markers[i].material.color.set(0x00ffff);
            }
            this.hoveredPOI = null;
            this.infoPanel.targetOpacity = 0;
        }
    };

    this.animatePanel = function(camera) {
        if (this.infoPanel.mesh.material.opacity < this.infoPanel.targetOpacity) {
            this.infoPanel.mesh.material.opacity += 0.05;
            this.infoPanel.mesh.visible = true;
        } else if (this.infoPanel.mesh.material.opacity > this.infoPanel.targetOpacity) {
            this.infoPanel.mesh.material.opacity -= 0.05;
            if (this.infoPanel.mesh.material.opacity <= 0) {
                this.infoPanel.mesh.visible = false;
            }
        }

        if (this.infoPanel.mesh.visible) {
            this.infoPanel.mesh.lookAt(camera.position);
            // If we have a hovered POI, keep following it (in case it moves due to Earth rotation)
            if (this.hoveredPOI) {
                for (var i = 0; i < this.markers.length; i++) {
                    if (this.markers[i].userData === this.hoveredPOI) {
                        var worldPos = new THREE.Vector3();
                        this.markers[i].getWorldPosition(worldPos);
                        var toCamera = new THREE.Vector3().subVectors(camera.position, worldPos).normalize();
                        this.infoPanel.mesh.position.copy(worldPos).add(toCamera.multiplyScalar(2.5));
                        break;
                    }
                }
            }
        }
    };
};
