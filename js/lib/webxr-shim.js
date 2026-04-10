/**
 * A basic WebXR to WebVR polyfill shim to allow older WebVR apps
 * to work on newer WebXR-only browsers like Meta Quest 3.
 */
(function () {
  // Always apply if navigator.xr is present to ensure native Quest support
  if (navigator.xr) {
    console.log("WebXR detected, applying WebVR compatibility shim...");

    var currentSession = null;
    var currentReferenceSpace = null;
    var currentWebGLLayer = null;
    var lastFrame = null;

    // Simulated VRDisplay
    function XRVRDisplay() {
      this.isPresenting = false;
      this.capabilities = {
        canPresent: true,
        hasExternalDisplay: false,
        hasPosition: true,
        hasOrientation: true,
        maxLayers: 1,
      };
      this.depthNear = 0.1;
      this.depthFar = 10000;
    }

    XRVRDisplay.prototype.getEyeParameters = function (eye) {
      // Return reasonable defaults for Quest 3 if no session yet
      return {
        renderWidth: (currentWebGLLayer ? currentWebGLLayer.framebufferWidth : window.innerWidth) / 2,
        renderHeight: currentWebGLLayer ? currentWebGLLayer.framebufferHeight : window.innerHeight,
        offset: [eye === "left" ? -0.031 : 0.031, 0, 0],
        fieldOfView: {
          upDegrees: 50,
          downDegrees: 50,
          leftDegrees: 50,
          rightDegrees: 50,
        },
      };
    };

    XRVRDisplay.prototype.getLayers = function () {
      return [
        {
          leftBounds: [0.0, 0.0, 0.5, 1.0],
          rightBounds: [0.5, 0.0, 0.5, 1.0],
          source: document.querySelector("canvas"),
        },
      ];
    };

    XRVRDisplay.prototype.requestPresent = function (layers) {
      var self = this;
      return navigator.xr
        .requestSession("immersive-vr", {
          optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"],
        })
        .then(function (session) {
          currentSession = session;
          self.isPresenting = true;

          var canvas =
            (layers && layers[0] && layers[0].source) ||
            document.querySelector("canvas");
          
          // Ensure the context is XR compatible
          var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
          
          return (gl.makeXRCompatible ? gl.makeXRCompatible() : Promise.resolve()).then(function() {
             currentWebGLLayer = new XRWebGLLayer(session, gl);
             session.updateRenderState({ baseLayer: currentWebGLLayer });

             return session.requestReferenceSpace("local").then(function (refSpace) {
               currentReferenceSpace = refSpace;
               
               session.addEventListener("end", function () {
                 self.isPresenting = false;
                 currentSession = null;
                 window.dispatchEvent(new CustomEvent("vrdisplaypresentchange"));
               });

               window.dispatchEvent(new CustomEvent("vrdisplaypresentchange"));
               console.log("WebXR Session started successfully");
             });
          });
        });
    };

    XRVRDisplay.prototype.exitPresent = function () {
      if (currentSession) {
        return currentSession.end();
      }
      return Promise.resolve();
    };

    XRVRDisplay.prototype.getFrameData = function (frameData) {
      if (!frameData || !lastFrame || !currentReferenceSpace) return false;

      var pose = lastFrame.getViewerPose(currentReferenceSpace);
      if (!pose) return false;

      for (var i = 0; i < pose.views.length; i++) {
        var view = pose.views[i];
        var eye = view.eye === "left" ? "left" : "right";
        var matrixAttr = eye + "ProjectionMatrix";
        var viewAttr = eye + "ViewMatrix";

        if (frameData[matrixAttr])
          frameData[matrixAttr].set(view.projectionMatrix);
        if (frameData[viewAttr])
          frameData[viewAttr].set(view.transform.inverse.matrix);
      }

      var transform = pose.transform;
      if (frameData.pose) {
        frameData.pose.position[0] = transform.position.x;
        frameData.pose.position[1] = transform.position.y;
        frameData.pose.position[2] = transform.position.z;
        frameData.pose.orientation[0] = transform.orientation.x;
        frameData.pose.orientation[1] = transform.orientation.y;
        frameData.pose.orientation[2] = transform.orientation.z;
        frameData.pose.orientation[3] = transform.orientation.w;
      }

      return true;
    };

    XRVRDisplay.prototype.getPose = function () {
      var frameData = new window.VRFrameData();
      this.getFrameData(frameData);
      return frameData.pose;
    };

    XRVRDisplay.prototype.requestAnimationFrame = function (callback) {
      if (currentSession) {
        return currentSession.requestAnimationFrame(function (time, frame) {
          lastFrame = frame;
          callback(time);
        });
      }
      return window.requestAnimationFrame(callback);
    };

    XRVRDisplay.prototype.submitFrame = function () {
      // WebXR handles this automatically via the base layer
    };

    // Override even if already exists (e.g. from polyfill)
    navigator.getVRDisplays = function () {
      return navigator.xr
        .isSessionSupported("immersive-vr")
        .then(function (supported) {
          if (supported) {
            return [new XRVRDisplay()];
          }
          return [];
        });
    };

    if (!window.VRFrameData) {
      window.VRFrameData = function () {
        this.pose = {
          position: new Float32Array([0, 0, 0]),
          orientation: new Float32Array([0, 0, 0, 1]),
        };
        this.leftProjectionMatrix = new Float32Array(16);
        this.rightProjectionMatrix = new Float32Array(16);
        this.leftViewMatrix = new Float32Array(16);
        this.rightViewMatrix = new Float32Array(16);
      };
    }
  }
})();

