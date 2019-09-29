"use strict";

var THREECAMERA;

function detect_callback(isDetected) {
  if (isDetected) {
    console.log('INFO in detect_callback() : DETECTED');
  } else {
    console.log('INFO in detect_callback() : LOST');
  }
}

function init_threeScene(spec) {
  const threeStuffs = THREE.JeelizHelper.init(spec, detect_callback);

  const loader = new THREE.BufferGeometryLoader();

  loader.load(
    './resource/face.json',
    (geometry) => {
      const mat = new THREE.MeshBasicMaterial({
        // DEBUG: uncomment color, comment map and alphaMap
        // color: 0xFF0000,
        map: new THREE.TextureLoader().load('./resource/texture.png'),
        alphaMap: new THREE.TextureLoader().load('./resource/alpha_map_256.png'),
        transparent: true,
        opacity: 0.6
      });

      const faceMesh = new THREE.Mesh(geometry, mat);
      faceMesh.position.y += 0.15;
      faceMesh.position.z -= 0.25;

      addDragEventListener(faceMesh);

      threeStuffs.faceObject.add(faceMesh);

       //CREATE THE CAMERA
    //const aspecRatio = spec.canvasElement.width / spec.canvasElement.height;
    //THREECAMERA = new THREE.PerspectiveCamera(20, aspecRatio, 0.1, 100);
    }
  )

  // We load the font that we'll use to display 3D text
  const fontLoader = new THREE.FontLoader();

  fontLoader.load(
    './resource/helvetiker_regular.typeface.json',
    (font) => {
      const textGeometry = new THREE.TextGeometry('Heja BVB!', {
        font: font,
        size: 0.25,
        height: 0.1,
        curveSegments: 12,
      });

      const textMesh = new THREE.Mesh(textGeometry, new THREE.MeshBasicMaterial({
        color: 0xe4f52a
      }));
      
      textMesh.rotation.z = 0.3;
      textMesh.position.y += 1;
      threeStuffs.faceObject.add(textMesh);
    }
  );

  function create_mat2d(threeTexture, isTransparent){ //MT216 : we put the creation of the video material in a func because we will also use it for the frame
    return new THREE.RawShaderMaterial({
      depthWrite: false,
      depthTest: false,
      transparent: isTransparent,
      vertexShader: "attribute vec2 position;\n\
        varying vec2 vUV;\n\
        void main(void){\n\
          gl_Position=vec4(position, 0., 1.);\n\
          vUV=0.5+0.5*position;\n\
        }",
      fragmentShader: "precision lowp float;\n\
        uniform sampler2D samplerVideo;\n\
        varying vec2 vUV;\n\
        void main(void){\n\
          gl_FragColor=texture2D(samplerVideo, vUV);\n\
        }",
       uniforms:{
        samplerVideo: { value: threeTexture }
       }
    });
  }

  //MT216 : create the frame. We reuse the geometry of the video
  const calqueMesh = new THREE.Mesh(threeStuffs.videoMesh.geometry,  create_mat2d(new THREE.TextureLoader().load('./resource/bvb_frame.png'), true))
  calqueMesh.renderOrder = 999; // render last
  calqueMesh.frustumCulled = false;
  threeStuffs.scene.add(calqueMesh);

  // CREATE THE CAMERA
  THREECAMERA = THREE.JeelizHelper.create_camera();
} // end init_threeScene()

//launched by body.onload() :
function main() {
  JeelizResizer.size_canvas({
    canvasId: 'jeeFaceFilterCanvas',
    callback: function(isError, bestVideoSettings){
      init_faceFilter(bestVideoSettings);
    }
  })
} //end main()

function init_faceFilter(videoSettings){
  JEEFACEFILTERAPI.init({
    canvasId: 'jeeFaceFilterCanvas',
    NNCpath: './dist/', // root of NNC.json file
    videoSettings: videoSettings,
    callbackReady: function (errCode, spec) {
      if (errCode) {
        console.log('AN ERROR HAPPENS. SORRY BRO :( . ERR =', errCode);
        return;
      }

      console.log('INFO : JEEFACEFILTERAPI IS READY');
      init_threeScene(spec);
    }, // end callbackReady()

    // called at each render iteration (drawing loop)
    callbackTrack: function (detectState) {
      THREE.JeelizHelper.render(detectState, THREECAMERA);
    } // end callbackTrack()
  }); // end JEEFACEFILTERAPI.init call
} // end main()

