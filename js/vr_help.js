var VRHelpPanel = function () {
  var width = 512,
    height = 384;
  var canvas = (this.canvas = document.createElement("canvas"));
  var context = (this.context = this.canvas.getContext("2d"));
  var texture = (this.texture = new THREE.Texture(canvas));
  var material = (this.material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  }));
  material.depthTest = true;
  material.depthWrite = true;
  canvas.width = width;
  canvas.height = height;
  var geometry = new THREE.PlaneGeometry(8, 6);
  this.plane = new THREE.Mesh(geometry, material);
  this.plane.renderOrder = 0;

  // Position it further out and slightly higher to avoid clipping with Earth
  this.plane.position.set(-10, 5, -18);

  this.draw = function () {
    context.clearRect(0, 0, width, height);

    // Background
    context.fillStyle = "rgba(0, 0, 0, 0.6)";
    context.fillRect(0, 0, width, height);
    context.strokeStyle = "#00ffff";
    context.lineWidth = 5;
    context.strokeRect(0, 0, width, height);

    // Title
    context.fillStyle = "#00ffff";
    context.font = "bold 36px Arial";
    context.textAlign = "center";
    context.fillText("VR TUTORIAL", width / 2, 50);

    // Content
    context.fillStyle = "#ffffff";
    context.font = "24px Arial";
    context.textAlign = "left";

    var startY = 110;
    var step = 45;

    context.fillText("● B / Y: Mở/Tắt Menu", 40, startY);
    context.fillText("● Grip (Nút cạnh): Phóng Meteor", 40, startY + step);
    context.fillText("● Cần xoay (Stick): Chỉnh tốc độ", 40, startY + step * 2);
    context.fillText("● Stick press: Tận thế", 40, startY + step * 3);
    context.fillText("● A / X: Reset", 40, startY + step * 4);

    context.fillStyle = "#ffff00";
    context.font = "italic 18px Arial";
    context.fillText(
      "(Hướng dẫn sẽ tự ẩn sau khi mở Menu)",
      40,
      startY + step * 5 + 10,
    );

    texture.needsUpdate = true;
  };

  this.update = function () {
    // Always face user
    if (typeof camera !== "undefined") {
      this.plane.lookAt(camera.position);
    }
  };

  this.draw();
};
