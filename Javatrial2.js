
import * as three from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import MeshTransmissionMaterial from './MeshTransmissionMaterial.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { MeshReflectorMaterial } from '@pmndrs/vanilla'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger.js";

let w = window.innerWidth;
let h = window.innerHeight;
console.log("width: "+ w + "Height: " + h);
//Scroll
const lenis = new Lenis({
  duration: 1,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  smoothTouch: true,


})


function raf(time) {
  lenis.raf(time)
  
  requestAnimationFrame(raf)
}

requestAnimationFrame(raf)


// GSAP ANIMATION(Menu)
var menutoggle = document.querySelector('.navToggle');
var bar1 = document.querySelector('.bar1');
var bar2 = document.querySelector('.bar2');
var menuCont = document.querySelector('.menuCont');
const menuItems = document.querySelectorAll('.homeLinksG');
const menuTitle = document.querySelectorAll('.tGM');
const clickS = document.querySelector('.clickG');
const menuSlideRight = document.querySelectorAll('.menuSlideRight');

let minWidth = 780;

let menuOpen = false;

gsap.set(menuCont,{
  scaleY: 0
})
gsap.set(menuTitle,{
  opacity: 0
})
gsap.set(menuItems, {
  xPercent: -100,
  opacity: 0,

});

gsap.set(menuSlideRight, {
  opacity: 0,
  xPercent: 100,
})
const nTL = gsap.timeline({
  defaults:{
    ease: 'Power4.easeInOut',
    duration: 1
  }
});

nTL
.to(menuCont,{
  scaleY: 1
}, "+=0.45")
.to(bar2,{
  width: "30px",
  backgroundColor: "#050608",
  translateY: 0,
}, "<")

.to(bar1, {
  backgroundColor: "#050608", 
  translateY: 0,
  rotate: "45deg"
},"<") 
.to(bar2, {
  rotate: "-45deg"
},"<") 
.to(menuTitle,{
  opacity: 1
}, "-=0.6")
.to(menuItems,{
  xPercent: 0,
  opacity: 1,
}, "-=0.75");
nTL.pause();



menutoggle.addEventListener('click', () =>{
  if(!menuOpen){
    nTL.play();
    menuOpen = true;
  } else {
    nTL.reverse();
    menuOpen = false;
  }
});


var items = document.getElementsByClassName('clickG');
for (var i = 0; i < items.length; i++) {
  items[i].addEventListener('click', () =>{
    nTL.reverse();
    menuOpen = false;
});}

// ON Hover Round Button //
//**************************************//
//**************************************//
//**************************************//
//**************************************//
//**************************************//
const roundButtons = document.getElementsByClassName('roundButtonContent');

for (const roundButton of roundButtons) {
  
    let Circle = roundButton.querySelector('.Buttoncircle');
    let text = roundButton.querySelector('.ButtonText');
    let SVG =roundButton.querySelector('path');

    gsap.set(Circle,{
      scale: 0.2,
      opacity: 0, 
    });

    let rippleT = new gsap.timeline({ paused: true});
    rippleT.to(roundButton,{
      duration: 0.3,
      scale: 1.15,
      ease: "quad.out"
    }, 0)
    .to(text,{
      color: "#050608"
    }, 0)
    
    .to(SVG, {
      fill: "#050608"
    }, 0)
    .to(Circle,{
      duration: 0.35,
      scale:1.2,
      opacity: 1
    }, 0)
    function setPosition(e) {
      
    var bounds = e.target.getBoundingClientRect();
    var x = e.clientX - bounds.left;
    var y = e.clientY - bounds.top;

      gsap.set(Circle, {
        left: `${x}px`,
        top: `${y}px`
      });
    }
  roundButton.addEventListener('mouseenter', (e) => {
    setPosition(e);
    rippleT.play();
  });
  roundButton.addEventListener('mouseleave', (e) => {
    setPosition(e);
    rippleT.reverse();
  });
}
// Scroll image cover of text//
//**************************************//
//**************************************//
//**************************************//
//**************************************//
//**************************************//
gsap.registerPlugin(ScrollTrigger);

const projectImg = document.querySelector(".projectImg");
const stickyClass = "stickyIMG";

// ScrollTrigger to toggle classes and pin based on scroll position
ScrollTrigger.create({
  trigger: ".projectFrame",
  start: "top top",
  end: "bottom bottom",
  scrub: 1,
  onEnter: () => projectImg.classList.add(stickyClass),
  onLeaveBack: () => projectImg.classList.remove(stickyClass)
});


const createImageTimeline = (triggerElement, clipPathValue) => {
  const imageTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: triggerElement,
      start: "top+=20%",
      end: "bottom-=20%",
      scrub: 1,
      markers: true,
      toggleActions: "play reverse play reverse", // this specifies the timeline behavior when entering and leaving the trigger range
    },
  });

  // ClipPath animation to hide the image
  imageTimeline.to(".first", {
    clipPath: clipPathValue,
  });
  
  return imageTimeline;
};

// Create image timelines for each text slide
const imageTimeline1 = createImageTimeline(".TextSlide1", "inset(0px 0px 100%)");




const createImageTimeline2 = (triggerElement, clipPathValue) => {
  const imageTimeline2 = gsap.timeline({
    scrollTrigger: {
      trigger: triggerElement,
      start: "top+=20%",
      end: "bottom-=20%",
      scrub: 2,
      markers: true,
      toggleActions: "play reverse play reverse", // this specifies the timeline behavior when entering and leaving the trigger range
    },
  });

  // ClipPath animation to hide the image
  imageTimeline2.to(".second", {
    clipPath: clipPathValue,
  });
  
  return imageTimeline2;
};
const imageTimeline2 = createImageTimeline2(".TextSlide2", "inset(0px 0px 100%)");

  // const imageTimeline = gsap.timeline({
  //   scrollTrigger: {
  //     trigger: ".TextSlide1",
  //     start: "top+=30% top",
  //     end: "bottom-=20% top",
  //     scrub: 1,
  //     markers: true,
  //   },
  // });
  
  // const imageTimeline2 = gsap.timeline({
  //   scrollTrigger: {
  //     trigger: ".TextSlide2",
  //     start: "top+=30%",
  //     end: "bottom-=20%",
  //     scrub: 1,
  //     markers: true,
  //   },
  // });
  
  // const imageTimeline3 = gsap.timeline({
  //   scrollTrigger: {
  //     trigger: ".TextSlide3",
  //     start: "top+=30%",
  //     end: "bottom-=10%",
  //     scrub: 1,
  //     markers: true,
  //   },
  // });
  
  // imageTimeline.to(".first", {
  //   clipPath: "polygon(0 0, 100% 0, 100% 100%, 0% 100%)",
  // });

  // imageTimeline.reverse();
// Accordion toggle animation STARTS HERE
//**************************************//
//**************************************//
//**************************************//
//**************************************//
//**************************************//
document.addEventListener('DOMContentLoaded', () => {
  const AccordionContent = document.querySelectorAll(".s6li");
  let currentlyOpenItem = null;

  AccordionContent.forEach((item) => {
      const accText = item.querySelector('.accText');
      const s6AccordionText = accText.querySelector('.s6AccordionText');
      const horizontalSVG = item.querySelector('.horizontal-line');
      const verticalSVG = item.querySelector('.vertical-line');
      const padBord = item.querySelector('.ATS6');
      // Initially hide the accordion text
      gsap.set(s6AccordionText, { display: 'none', height: 0, opacity: 0, });
      s6AccordionText.onclick = false;
      item.addEventListener('click', () => {
          const isActive = item.classList.contains('active');

          // Close the currently open item, if any
          if (currentlyOpenItem && currentlyOpenItem !== item) {
              const otherAccText = currentlyOpenItem.querySelector('.accText');
              const thisVerticalSVG = currentlyOpenItem.querySelector('.vertical-line');
              const thisHorizontalSVG = currentlyOpenItem.querySelector('.horizontal-line');
              const otherAccordionText = otherAccText.querySelector('.s6AccordionText');
              const currentPaddingRemover = currentlyOpenItem.querySelector('.ATS6');

              gsap.to(otherAccordionText, { display: 'none', height: 0, opacity: 0, duration: 0.3 });
              gsap.to(currentPaddingRemover, {paddingBottom: "0", duration: 0.3});
              gsap.to(thisVerticalSVG, { rotation:-90, transformOrigin:"50% 50%", duration: 0.1 });
              gsap.to(thisHorizontalSVG,{ rotation:-90, transformOrigin:"50% 50%", opacity: 1,duration: 0.1});
              currentlyOpenItem.classList.remove('active');
          }

          // Play or reverse the timeline based on the current state
          if (!isActive) {
              // Reverse the timeline to close the clicked item before opening the new one
              gsap.to(s6AccordionText, { display: 'none', height: 0, opacity: 0, duration: 0.3 });
              gsap.to(padBord, {paddingBottom: "0", duration: 0.3});
              
              s6AccordionText.onclick = false;
              // Play the timeline to open the clicked item with a delay
              
              gsap.to(s6AccordionText, { display: 'block', height: 'auto', opacity: 1, duration: 0.3, delay: 0.3 });
              gsap.to(padBord, {paddingBottom: "7px",duration: 0.5});
              gsap.to(verticalSVG, { rotation:90, transformOrigin:"50% 50%", duration: 0.1, delay:0.3 });
              gsap.to(horizontalSVG,{ rotation:90, transformOrigin:"50% 50%", opacity: 0,duration: 0.1, delay:0.3 });
              item.classList.add('active');
              
              s6AccordionText.onclick = true;
              currentlyOpenItem = item;  // Set the currently open item
          } else {
              // Reverse the timeline to close the clicked item
              gsap.to(s6AccordionText, { display: 'none', height: 0, opacity: 0, duration: 0.3 });
              
              gsap.to(padBord, {paddingBottom: "0px", duration: 0.3});
              gsap.to(verticalSVG, { rotation:-90, transformOrigin:"50% 50%", duration: 0.1 });
              gsap.to(horizontalSVG,{ rotation:-90, transformOrigin:"50% 50%", opacity: 1,duration: 0.1});
              item.classList.remove('active');
              
              s6AccordionText.onclick = false;
              currentlyOpenItem = null;  // No item is open
          }
      });
  });
});

// THREE JS RENDERER STARTS HERE
//**************************************//
//**************************************//
//**************************************//
//**************************************//
//**************************************//

three.ColorManagement.enabled = false;
//Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight/1.4,
}
console.log(window.innerWidth)
//scene
const scene = new three.Scene();

scene.background = new three.Color("#000000");

const canvas = document.querySelector(".webgl");
const renderer = new three.WebGLRenderer({ canvas ,antialias: true});

renderer.setPixelRatio(Math.min(Math.max(1, window.devicePixelRatio), 1));
renderer.toneMapping = three.ACESFilmicToneMapping; 

renderer.setSize(sizes.width, sizes.height)
function render() {

  renderer.render( scene, camera );

}
// //material
 let glassR  = Object.assign(new MeshReflectorMaterial(), {
  attenuationDistance: 1,
  transmission: 1,
  aberrationStrength: 0.5,
  bounces: 4,
  fresnel: 1,
  fastChroma: true,
});
let glassMT  = Object.assign(new MeshTransmissionMaterial(10), {
  clearcoat: 1,
  clearcoatRoughness: 0.01,
  transmission: 1,
  chromaticAberration: 0.2,
  anistropy: 0.1,
  
  thickness: 0.4,
  ior: 1,
  distortion: 0.2,
  distortionScale: 0.1,
  temporalDistortion: 0.2,
  color: new three.Color('white')
});
//Text
function CreateText(){
  
  const textGroup = new three.Group();
  const fontLoader = new FontLoader();

  const line1 = "IMPULSE"
  const line2 = "STUDIOS"

  fontLoader.load('./style/fonts/NunitoEB.json', (font) => {
    const textMaterial = new three.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0,
    })
  
    let textMobileSize 
    if(window.innerWidth >= minWidth){
       textMobileSize = 0.4;
    } else {
      
       textMobileSize = 0.135;
    }


    let textMobileSize2
    if(window.innerWidth >= minWidth){
       textMobileSize2 = .4;
    } else {
      
       textMobileSize2 = 0.135;
    }

    // LINE1
    const textGeo1 = new TextGeometry(line1, {
      font: font,
      size: textMobileSize,
      height: 0,
      curveSegments: 10,
      bevelEnabled: false,
      material: 1,
      extrudeMaterial: 0,
      })
    textGeo1.center()
    textGeo1.computeBoundingBox()
    
    const TextMesh1 = new three.Mesh(textGeo1, textMaterial);

  
    if(window.innerWidth >= minWidth){
      TextMesh1.position.set(0, 0.25, -1)
   } else {
     
    TextMesh1.position.set(0, 0, -1)
   }

    textGroup.add(TextMesh1);
    // LINE2
    const textGeo2 = new TextGeometry(line2, {
      font,
      size: textMobileSize2,
      height: 0,
      curveSegments: 10,
      bevelEnabled: false,
      material: 1,
      extrudeMaterial: 0,
      })
    textGeo2.center()
    textGeo2.computeBoundingBox()

    const TextMesh2 = new three.Mesh(textGeo2, textMaterial);
    
    if(window.innerWidth >= minWidth){
      TextMesh2.position.set(0 , -0.25, -1);  
    } else {
      TextMesh2.position.set(0, -0.15, -1);  
    }
    textGroup.add(TextMesh2);
  });
  
  scene.add(textGroup);
  }

  CreateText();

const envLoader = new RGBELoader();
const loader = new GLTFLoader();

var dracoLoader = new DRACOLoader();

dracoLoader.setDecoderPath( '/draco/gltf/');
loader.setDRACOLoader( dracoLoader );
const [{ scene: gltfScene }] = await Promise.all([
  new Promise((res) => 
    loader.load("/Gallery/3dOBJ/NewTrial.glb", res) 
  )
]);

 const textureLoader = new three.TextureLoader()
        const textureEquirec = textureLoader.load('Gallery/textures/4.jpg')
        textureEquirec.mapping = three.EquirectangularReflectionMapping
        textureEquirec.encoding = three.sRGBEncoding

      scene.environment = textureEquirec
      scene.environment.mapping = three.EquirectangularReflectionMapping
      scene.background = textureEquirec
      scene.background = new three.Color('#030000');
      scene.backgroundBlurriness = 2
      scene.backgroundIntensity = 1
//added
scene.environment.mapping = three.EquirectangularReflectionMapping;

let HeartGlass = gltfScene.getObjectByName('heart');
HeartGlass.material = glassMT;
HeartGlass.position.set(0,0,0);
HeartGlass.rotation.z = 2.5;
HeartGlass.rotation.x = 1.5;
if(window.innerWidth >= minWidth){
  HeartGlass.scale.set(0.45,0.45,0.45);
} else {
  
  HeartGlass.scale.set(0.18,0.18,0.18);
}
 scene.add(gltfScene)
//light
const ambL = new three.AmbientLight(0xffffff, 1, 100)

scene.add(ambL);

 const light4 = new three.SpotLight(0xffffff, 1, 100)
 light4.position.set( 0, 0, 1)
 scene.add(light4)

// const light3 = new three.SpotLight(0xbbb, 1, 1000)
// light3.position.set(30, -40, 20)
// scene.add(light3)

//render 


//camera
const camera = new three.PerspectiveCamera(45, sizes.width/sizes.height)
if(window.innerWidth >= minWidth){
  camera.position.z = 2;
}else{
  camera.position.z = 1;
}

camera.updateProjectionMatrix();
scene.add(camera)

//Scene 

// const backgroundHDR = new RGBELoader()
// backgroundHDR.setPath( '/Gallery/textures/' )
// backgroundHDR.load( '1k.hdr', function ( texture ) {

// texture.colorSpace= three.SRGBColorSpace
// texture.mapping = three.EquirectangularReflectionMapping
//   render();

// });
// renderer.render(scene, camera)


//controls
const controls  = new OrbitControls(camera, canvas)
if(window.innerWidth >= minWidth){
  
    controls.enabled = false
    controls.enableDamping = true
    controls.enablePan = false
    controls.enableZoom = false
    controls.autoRotate = false
    controls.autoRotateSpeed = 0
  }else{
    controls.enabled = false
    controls.enableDamping = false
    controls.enablePan = false
    controls.enableZoom = false
    controls.autoRotate = false
    controls.autoRotateSpeed = 0
}

//resize

window.addEventListener("resize", () => {
  //update size
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight/1.5;  
  //cam
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()
  renderer.setSize(sizes.width, sizes.height)
  render();
})

function animate(t) {
  requestAnimationFrame(animate);
  HeartGlass.material.time = t / 1000;
  HeartGlass.rotation.z += 0.01;
  controls.update();
  renderer.render(scene, camera)
}
 animate();

// const loop = () => {

//   enderer.render(scene, camera)
//  controls.update();
//  window.requestAnimationFrame(loop)
//  }
//  loop()


