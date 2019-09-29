"use strict";

// SETTINGS of this demo :
const SETTINGS = {
  numberBees: 8
};

// some globalz :f0.5
var THREECAMERA;
const GLASSESOBJ3D = new THREE.Object3D();

const ACTIONS = [];
const MIXERS = [];

let ISANIMATED;

let BEEMESH;
let BEEOBJ3D;


// callback : launched if a face is detected or lost. TODO : add a cool particle effect WoW !
function detect_callback(isDetected) {
  if (isDetected) {
    console.log('INFO in detect_callback() : DETECTED');
  } else {
    console.log('INFO in detect_callback() : LOST');
  }
}

// build the 3D. called once when Jeeliz Face Filter is OK
function init_threeScene(spec) {
  const threeStuffs = THREE.JeelizHelper.init(spec, detect_callback);

  let frameMesh;
  let lensesMesh;
  let branchesMesh;
  let decoMesh;

  const loadingManager = new THREE.LoadingManager();

  // CREATE OUR FRAME
  const loaderFrame = new THREE.BufferGeometryLoader(loadingManager);

  loaderFrame.load(
    './resource2/frame.json',
    (geometry) => {
      const mat = new THREE.MeshPhongMaterial({
        color: 0xf0b5ff,
        shininess: 2,
        specular: 0xffffff,
        transparent: true
      });

      frameMesh = new THREE.Mesh(geometry, mat);
      frameMesh.scale.multiplyScalar(0.0067);
      frameMesh.frustumCulled = false;
      frameMesh.renderOrder = 10000;
    }
  );

  // CREATE OUR LENSES
  const loaderLenses = new THREE.BufferGeometryLoader(loadingManager);

  loaderLenses.load(
    './resource2/lenses.json',
    (geometry) => {
      const mat = new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load('./resource2/texture_mp.jpg')
      });

      lensesMesh = new THREE.Mesh(geometry, mat);
      lensesMesh.scale.multiplyScalar(0.0067);
      lensesMesh.frustumCulled = false;
      lensesMesh.renderOrder = 10000;
    }
  );
  // CREATE OUR BRANCHES
  const loaderBranches = new THREE.BufferGeometryLoader(loadingManager);

  loaderBranches.load(
    './resource2/branches.json',
    (geometry) => {
      const mat = new THREE.MeshBasicMaterial({
        alphaMap: new THREE.TextureLoader().load('./resource2/alpha_branches.jpg'),
        map: new THREE.TextureLoader().load('./resource2/textureBlack.jpg'),
        transparent: true
      });

      branchesMesh = new THREE.Mesh(geometry, mat);
      branchesMesh.scale.multiplyScalar(0.0067);
      branchesMesh.frustumCulled = false;
      branchesMesh.renderOrder = 10000;
    }
  );

  // CREATE OUR DECO
  const loaderDeco = new THREE.BufferGeometryLoader(loadingManager);

  loaderDeco.load(
    './resource2/deco.json',
    (geometry) => {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff
      });

      decoMesh = new THREE.Mesh(geometry, mat);
      decoMesh.scale.multiplyScalar(0.0067);
      
      decoMesh.frustumCulled = false;
      decoMesh.renderOrder = 10000;
    }
  );

  loadingManager.onLoad = () => {
    GLASSESOBJ3D.add(branchesMesh, frameMesh, lensesMesh, decoMesh);
    GLASSESOBJ3D.scale.multiplyScalar(1.1);
    GLASSESOBJ3D.position.setY(0.05); //move glasses a bit up
    GLASSESOBJ3D.position.setZ(0.25);//move glasses a bit forward
    window.zou=GLASSESOBJ3D;

    addDragEventListener(GLASSESOBJ3D);

    threeStuffs.faceObject.add(GLASSESOBJ3D);
  };

  
  // CREATE THE VIDEO BACKGROUND
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
  const calqueMesh = new THREE.Mesh(threeStuffs.videoMesh.geometry,  create_mat2d(new THREE.TextureLoader().load('./resource2/frame.png'), true))
  calqueMesh.renderOrder = 999; // render last
  calqueMesh.frustumCulled = false;
  threeStuffs.scene.add(calqueMesh);

  // CREATE THE CAMERA
  THREECAMERA = THREE.JeelizHelper.create_camera();
  // CREATE A LIGHT
  const ambient = new THREE.AmbientLight(0xffffff, 1);
  threeStuffs.scene.add(ambient)

  var dirLight = new THREE.DirectionalLight(0xffffff);
  dirLight.position.set(100, 1000, 100);

  threeStuffs.scene.add(dirLight)
} // end init_threeScene()

function animateFlyBees(mesh, theta, sign) {
  let count = 0;
  setInterval(() => {
    count += 1;
    const x = mesh.position.x;
    const z = mesh.position.z;
    const y = mesh.position.y;

    mesh.position.set(
      (x * Math.cos(theta) + z * Math.sin(theta)),
      (y * Math.cos(theta) + x * Math.sin(theta))*0.96 + 0.05,
      (z * Math.cos(theta) - x * Math.sin(theta)) //(z * Math.cos(0.03*theta) - x * Math.sin(0.03*theta)*theta)
    );
    mesh.rotation.set(-(x * Math.cos(theta) + z * Math.sin(theta))*sign, -(y * Math.cos(theta) + z * Math.sin(theta))*sign, -(z * Math.cos(theta) - x * Math.sin(theta))*sign);
    // mesh.rotation._y = Math.sin(Math.random()*2*Math.PI*100)
  }, 16)
}

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

      TWEEN.update();

      if (MIXERS.length > 1) {
        MIXERS.forEach((m) => {
          m.update(0.16);
        })
      }
    } // end callbackTrack()
  }); // end JEEFACEFILTERAPI.init call
} // end main()

