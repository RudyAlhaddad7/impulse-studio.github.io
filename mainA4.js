import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from 'split-type'
import Lenis from '@studio-freight/lenis'
import SplitText from 'gsap/SplitText';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Face } from 'three/examples/jsm/Addons.js';
// Lamina imports - now working with proper npm package 
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
gsap.registerPlugin(ScrollTrigger, SplitText);// Import necessary libraries

const lenis = new Lenis({
  smoothWheel: true, // Smooth wheel scrolling
  smoothTouch: true, // Disable touch smoothing for better performance on mobile
});

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000)); // Convert time to milliseconds

// SHADER SETUP
// ========================

window.addEventListener("resize", () => {
  console.log(window.innerWidth, window.innerHeight);
  console.log(`Aspect Ratio: ${window.innerWidth / window.innerHeight}`);
});

const isMobile = window.innerWidth <= 768;
const isTablet = window.innerWidth > 768 && window.innerWidth <= 1400;

const canvas = document.getElementById("aBackgroundG");

// Function to get viewport dimensions


function getViewportDimensions() {
  let extraHeight = 0;

  if (isMobile) {
    extraHeight = 0.1;
  } else if (isTablet) {
    extraHeight = 0.2;
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight * (1 + extraHeight),
  };
}

let { width, height } = getViewportDimensions();


const aspectRatio = width / height;
const isPortrait = height > width;

function loadCubes() {
  return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load("/Gallery/3dOBJ/Cubes/ayre4.gltf", function (gltf) {

          if (gltf && gltf.scene) { 
              resolve(gltf.scene);
          } else {
              reject(new Error("GLTF scene is not defined"));
          }
      }, undefined, function (error) {
          reject(error);
      });
  });
}
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);  // ✅ Transparent clear color
renderer.setSize(width, height);
renderer.setPixelRatio(window.devicePixelRatio); // Improve clarity on high-DPI screens
// Scene & Camera
const scene = new THREE.Scene();
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.1, 100);
camera.position.z = isMobile ? 2.5 : 4; // Adjust depth for mobile
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
camera.layers.enable(0);
camera.layers.disable(1);

function getFullScreenSize() {
  const { width: viewWidth, height: viewHeight } = getViewportDimensions(); // <-- Use this instead

  const fov = (camera.fov * Math.PI) / 180;
  const height = 2 * Math.tan(fov / 2) * camera.position.z;
  const width = height * (viewWidth / viewHeight);

  return { width, height };
}


// Function to update plane size
function updatePlaneSize() {
  const { width, height } = getFullScreenSize();
  plane.geometry.dispose(); // Remove old geometry
  plane.geometry = new THREE.PlaneGeometry(width, height); // Set new size
}
console.log(isMobile ? "Mobile" : "Desktop");

// Initial plane setup
const { width: planeWidth, height: planeHeight } = getFullScreenSize();
const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);


function onWindowResize() {
  // Update viewport dimensions
  const { width, height } = getViewportDimensions();
  const aspect = width / height;
  

  // Update camera aspect ratio and projection matrix
  camera.aspect = aspect;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  console.log(`Width: ${width}, Height: ${height}`);  
  console.log(`Camera aspect ratio updated: ${aspect}`);

  // Update renderer
  renderer.setSize(width, height);

}
 onWindowResize() 

// Attach resize listener
// window.addEventListener("resize", onWindowResize);
// Create Shader Material
const desktopShader = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    u_color1: { value: new THREE.Vector3(232, 233, 234) }, // Example Red
    u_color2: { value: new THREE.Vector3(195, 207, 246) }, 
    u_color3: { value: new THREE.Vector3(250, 250, 250) }, 
    u_mouse: { value: new THREE.Vector2(0, 0) },
    u_mouseInteraction: { value: 1.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;
    uniform float time;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse; // Mouse position
    uniform float u_mouseInteraction; // Mouse interaction factor
    uniform vec3 u_color1, u_color2, u_color3; // Colors for blending
    varying vec2 vUv; // UV coordinates

  // Permutation function
  vec4 permute(vec4 x) {
      return mod(((x * 34.0) + 1.0) * x, 289.0);
  }

  // Inverse square root approximation
  vec4 taylorInvSqrt(vec4 r) {
      return 1.79284291400159 - 0.85373472095314 * r;
  }

  // Simple noise function
  float snoise(vec3 v) {
      const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);

      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      i = mod(i, 289.0);
      vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) +
                              i.y + vec4(0.0, i1.y, i2.y, 1.0)) +
                      i.x + vec4(0.0, i1.x, i2.x, 1.0));

      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);

      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);

      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1),
                                      dot(p2, x2), dot(p3, x3)));
  }

  // Circle effect function
  float circle_s(vec2 dist, float radius) {
      return smoothstep(0.0, radius, pow(dot(dist, dist), 0.6) * 2.1);
  }

  // Blur function
  float tvNoise(vec2 uv, float time) {
      float scanline = sin(uv.y * 300.0 + time * 10.0) * 0.05;  // Horizontal scanlines
      float staticNoise = fract(sin(dot(uv * time, vec2(12.9898, 78.233))) * 43758.5453);  // White noise
      staticNoise = staticNoise * 2.0 - 1.0;  // Normalize to [-1,1]
      
      float noise = mix(staticNoise, scanline, 0.4);  // Blend scanlines with noise
      
      return noise * 0.5 + 0.5;  // Normalize to [0,1]
  }


vec3 toLinear(vec3 color) {
    return pow(color, vec3(2.2)); // Convert sRGB to linear
}

vec3 toSRGB(vec3 color) {
    return pow(color, vec3(1.0 / 2.2)); // Convert linear to sRGB
}

void main() {
    vec2 uv = vUv;

    // Normalize mouse position
    vec2 mouse = u_mouse / u_resolution;
    mouse = mouse * 2.0 - 1.0; // Map mouse to [-1, 1] range
    mouse.y *= -1.0; // Invert Y-axis

    // Apply noise
    float noiseValue = snoise(vec3(uv, time * 0.25));
    noiseValue = (noiseValue + 1.15) * 0.55;  // Normalize to [0, 1]

    // TV noise effect
    float noiseEffect = tvNoise(uv, time * 1.5);

    // Calculate circle effect based on mouse position
    float alpha = circle_s(uv - mouse, 0.05 * u_mouseInteraction);

    // Create a blend effect based on noise
    float blendFactor = smoothstep(0.1, 0.40, noiseValue * 0.4);
    float blendFactor2 = smoothstep(0.1, 0.2, noiseValue * 0.15); // Second blend factor

    // Convert input colors to linear space first
    vec3 color1 = toLinear(vec3(u_color1) / 255.0);
    vec3 color2 = toLinear(vec3(u_color2) / 255.0);
    vec3 color3 = toLinear(vec3(u_color3) / 255.0);

    // Blend the colors
    vec3 blendedColor = mix(color1, color2, blendFactor);
    blendedColor = mix(blendedColor, color3, blendFactor2);

    // Overlay the TV noise
    blendedColor += vec3(noiseEffect) * 0.1; 

    // Convert back to sRGB for correct output
    gl_FragColor.rgb = toSRGB(blendedColor);
    gl_FragColor.a = alpha;
}


  `,
  transparent: false,
});




const materialS = desktopShader;
const plane = new THREE.Mesh(geometry, materialS);
scene.add(plane);

updatePlaneSize();

const clock = new THREE.Clock();
// ========================
// CUBES SETUP
// ========================


const glassMaterial = new THREE.MeshPhysicalMaterial({
  transmission: 0,
  thickness: 1.5,
  roughness: 1,
  ior: 2.0,
  color: new THREE.Color('white'),
  side: THREE.DoubleSide,
});

const textureLoader = new THREE.TextureLoader();
const displacementMap = textureLoader.load("/Gallery/textures/glassD/displacement.jpg");
const normalMap = textureLoader.load("/Gallery/textures/glassD/normal.png");
const roughnessMap = textureLoader.load("/Gallery/textures/glassD/roughness.jpg");
const metalnessMap = textureLoader.load("/Gallery/textures/glassD/texture.png");
const aoMap = textureLoader.load("/Gallery/textures/glassD/ao.png");
// Glass material settings

const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);
cubeRenderTarget.texture.encoding = THREE.sRGBEncoding;
cubeRenderTarget.texture.mapping = THREE.CubeReflectionMapping;



renderer.outputEncoding = THREE.sRGBEncoding;

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0; // Adjust for brightness balance

scene.add(cubeCamera);
const reflectiveMaterial = new THREE.MeshPhysicalMaterial({
  metalness: 1,  // Fully metallic for strong reflections
  roughness: 0.25,  // Slightly rough for soft reflections (adjust as needed)
  clearcoat: 1,  // Adds a shiny top layer
  clearcoatRoughness: 0.25,  // Keep clearcoat smooth
  reflectivity: 1,  // Maximum reflectivity
  color: new THREE.Color('white'),  // Base color
  envMap: cubeRenderTarget.texture,  // Use the cube render target for reflections
  envMapIntensity: 1,
  envMapRotation: 1,

});


reflectiveMaterial.envMap.encoding = THREE.sRGBEncoding; // Fix color space issues
reflectiveMaterial.needsUpdate = true;
function getWorldOffset() {
  const canvas = document.querySelector("canvas"); // or use your canvas ref directly
  const pixelHeight = canvas.clientHeight;

  const fov = camera.fov * (Math.PI / 180); // convert to radians
  const distance = camera.position.z - group.position.z;

  const worldHeight = 2 * Math.tan(fov / 2) * distance;
  return worldHeight;
}
                      
let rotating = true; // Control flag for rotation
let rAmplitude = 4; // Rotation amplitude
let rSpeed = 0.85; // Rotation speed
let group = new THREE.Group();
let initialTransforms = [];
let meshes = [];
let cubesPromise = null;
const textMain = document.querySelector(".Asection1");
const MainCanvas = document.getElementById("ASub1v2");
const filler = document.querySelector(".filler");
const spacerFill = document.querySelector(".spacerFill");
const dots = document.querySelectorAll(".AsubDot");
const text3 = document.querySelector(".ASubTextV23");
const scaleRatioW = width / 1920;
const aspectRatioScale = (945/1920)/(window.innerHeight/window.innerWidth);
const scaleRatioH = (height / 945);
let inSecondSection = 1;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// function getResponsiveYInitial(height) {
//   if (height >= 945) return 0.135;
//   if (height >= 920) return lerp(0.03, 0.135, (height - 920) / (945 - 920));
//   if (height >= 800) return lerp(0.0, 0.03, (height - 800) / (920 - 800));
//   if (height >= 768) return lerp(-0.115, 0.0, (height - 768) / (800 - 768));
//   return -0.115;
// }

// function getWorldYAboveDiv(divId, camera) {
//   const element = document.getElementById(divId);
//   if (!element) return null; // or some default

//   const rect = element.getBoundingClientRect();
//   const scrollY = window.scrollY;
//   const scrollX = window.scrollX;

//   const screenX = rect.left + rect.width / 2 + scrollX;
//   const screenY = rect.top + scrollY; // document-based Y

//   const ndcX = (screenX / window.innerWidth) * 2 - 1;
//   const ndcY = ((screenY / window.innerHeight) * 2 - 1 );

//   const vec = new THREE.Vector3(ndcX, ndcY, 0.5);
//   vec.unproject(camera);

//   const aspectRatio = width / height;
//   // Calculate offset based on height breakpoints
//   let offsetY = 0;
 
  
//   return vec.y + offsetY;
// }
// // Combine both values with a weighted lerp (or max, or whichever logic fits)

// function getCombinedY(divId, camera, offsetY = 0) {
//   const yDiv = getWorldYAboveDiv(divId, camera);
//   if (yDiv === null) return 0.135; // fallback if div not found


//   // Example 2: Use max to never go below responsive min
//   return yDiv;

//   // Example 3: Weighted lerp (adjust 0.3 to tune)
//   // return lerp(yResponsive, yDiv, 0.3);
// }


function getResponsiveXInitial(width) {
   if (width >= 2520) {
    return 0.067;
  } else if (width >= 1920) {
    const t = (width - 1920) / (2520 - 1920);
    return lerp(0.06, 0.066, t);
  } else if (width >= 1440) {
    const t = (width - 1440) / (1920 - 1440);
    return lerp(0.055, 0.06, t);
  } else if (width >= 1280) {
    const t = (width - 1280) / (1440 - 1280);
    return lerp(0.047, 0.055, t);
  } else if (width >= 1024) {
    const t = (width - 1024) / (1280 - 1024);
    return lerp(0.043, 0.047, t);
  } else {
    return 0.04;
  }
}
let offsetInitial = 0;
if (window.innerWidth >= 1440 && aspect >= 1.6) {
  offsetInitial  = ((960 - (window.innerWidth / aspect)) * -0.0001); // Adjust this value as needed
} else if ( isTablet && aspect > 1.6) {
  offsetInitial  = 0.135;
}else if (isTablet && aspect <= 1.6) {
  offsetInitial  = 0.2;
}

function getCombinedY(elementId, camera) {
  const el = document.getElementById(elementId);
  const topPx = el.getBoundingClientRect().top + window.scrollY;

  const fovInRad = (camera.fov * Math.PI) / 180;
  const distance = Math.abs(camera.position.z - 2); 
  const screenHeightInWorld = 2 * Math.tan(fovInRad / 2) * distance;
  
  const yWorld = ((window.innerHeight / 2 - topPx) / window.innerHeight) * screenHeightInWorld + (aspect / 10) +  offsetInitial;
  return yWorld;
}
const fixedY = getCombinedY('ATitle', camera);

document.addEventListener("DOMContentLoaded", function () {
    cubesPromise = loadCubes().then((Cubes) => {
        if (!Cubes) {
            throw new Error("Cubes is not defined");
        }
        scene.add(Cubes);

        // Collect all mesh objects from the GLTF file
        if (Cubes instanceof THREE.Group || Cubes instanceof THREE.Object3D) {
            Cubes.traverse((child) => {
              if (child.isMesh) {
                child.material = reflectiveMaterial;
                meshes.push(child);
                initialTransforms.push({
                  object: child,
                  initialPosition: child.position.clone(),
                  initialRotation: child.rotation.clone(),
                  initialScale: child.scale.clone()
                });
                scene.add(group);
              
              }
              
            });
        } else {
            console.error("Cubes is not an instance of THREE.Group or THREE.Object3D");
          }

          // Add collected meshes to the group
          meshes.forEach(mesh => group.add(mesh));
            scene.add(group);
            if (isMobile || isTablet) {
              if(isMobile){
                group.position.set(-0.125, -0.17, 1);
              }else if(isTablet){
                group.position.set(aspectRatioScale * 0.95, fixedY, 2);
              }
            } else {
              group.position.set(aspectRatioScale * 1.125, getCombinedY('ATitle', camera), 2);
            }
            console.log("Group position set to:", group.position);
            if (isMobile || isTablet) {
              if(isMobile){
                group.scale.set(0.04, 0.04, 0.04);
              }else if(isTablet){
                group.scale.set(getResponsiveXInitial(window.innerWidth), getResponsiveXInitial(window.innerWidth), getResponsiveXInitial(window.innerWidth));
              }
            } else {
              group.scale.set(getResponsiveXInitial(window.innerWidth), getResponsiveXInitial(window.innerWidth), getResponsiveXInitial(window.innerWidth));
            }
            console.log("Group scale set to:", group.scale);
            const mid2 = scene.getObjectByName('Mid2');
            const mid1 = scene.getObjectByName('Mid1');
            const inner = scene.getObjectByName('Inner');
            const outer = scene.getObjectByName('Outer');

            if(isMobile){
              
              

              const AS1Phone = document.querySelector(".Asection1Phone");
              const AS1DescPhone = document.querySelector(".ALandingSubTextPhoneP");
              const AS1TitlePhone = document.querySelector(".ATitlePT");
              const AS1SepratorText = document.querySelector(".AS1SepratorTextP");
              const AS1SepratorScroll = document.querySelector(".AS1SepratorTextP2");
              const T1Phone = gsap.timeline({ 
                paused: true,
                scrollTrigger: {
                  trigger: AS1Phone,
                  start: "top+=8% top",
                  end: "bottom+=15% bottom",
                  scrub: 1, 
                }
              });
              const T1PhoneSub = gsap.timeline({ 
                paused: true,
                scrollTrigger: {
                  trigger: AS1Phone,
                  start: "top+=5% top",
                  end: "bottom+=15% bottom",
                  duration: 0.5,
                  scrub: 1,
                }
              });
              
              const T1PhoneSub2 = gsap.timeline({ 
                
                paused: true,
                scrollTrigger: {
                  trigger: AS1Phone,
                  start: "top+=11% top",
                  end: "bottom+=15% bottom",
                  scrub: 1,
                }
              });
               const hideBorders = gsap.timeline({ 
                
                paused: true,
                scrollTrigger: {
                  trigger: AS1Phone,
                  start: "top+=17% top",
                  end: "bottom+=15% bottom",
                  scrub: 1,
                }
              });
              T1Phone.to(AS1DescPhone, {
                y: -55,
                opacity: 0,
                ease: "sine.in",
              }, 0);
              T1PhoneSub.to(AS1TitlePhone, {
                x: -100,
                opacity: 0,
                ease: "sine.out",
              }, 0);
              T1PhoneSub2.to(AS1SepratorText, {
                opacity: 0,
                x: -75,
                ease: "sine.out",
              },0);
              T1PhoneSub2.to(AS1SepratorScroll, {
                opacity: 0,
                x: 75,
                ease: "sine.out",
              },0);
              hideBorders.to(".AS1SepratorPhone", {
                opacity: 0,
                ease: "sine.out",
              }, 0);
              const TextReveal = gsap.timeline({ 
                paused: true,
                scrollTrigger: {
                  trigger: AS1Phone,
                  start: "center-=2.75% center-=20%",
                  end: "center+=15% center-=20%",
                  scrub: 1,
                  duration: 0.5,
                }
              });
              

              TextReveal.to(".ASub2TextP", {
                opacity: 1,
              }, 0);

              const absdiv = document.querySelector('.Absdiv1');  // Select the .Absdiv element

              
              

              
              const getHeight = () =>
                window.visualViewport?.height || window.innerHeight;
              
              let previousHeight = getHeight();

              (window.visualViewport || window).addEventListener('resize', () => {
                const newHeight = getHeight();
                const delta = newHeight - previousHeight;

                if (Math.abs(delta) > 50 && inSecondSection == 1) {
                  if (delta > 0) {
                    expandSection();
                  } else {  
                    contractSection();
                  }

                  previousHeight = newHeight;
                }
              });

              function expandSection() {
                gsap.to(".ASubTextV2P", {
                  marginTop: '3vh', // or whatever works
                  duration: 0.75,
                  ease: "power2.out"
                });
                gsap.to(".ASubTextDescriptionP", {
                  fontSize: 'calc(2vw + 0.92em)',
                  duration: 0.75,
                  ease: "power2.out"
                });
                gsap.to(".ASubTextTitle", {
                  fontSize: 'calc(2.7vw + 2.85em)',
                  paddingBottom: '3.5vh',
                  duration: 0.75,
                  ease: "power2.out"
                });
                gsap.to(".AsubTextNum", {
                  fontSize: 'calc(2vw + 0.65em)',
                  duration: 0.75,
                  ease: "power2.out"
                });
              }

              function contractSection() {
                gsap.to(".ASubTextV2P", {
                  marginTop: '2vh', // or whatever works
                  duration: 0.75,
                  ease: "power2.out"
                });
                gsap.to(".ASubTextDescriptionP", {
                  fontSize: 'calc(2vw + 0.89em)',
                  duration: 0.75,
                  ease: "power2.out"
                });
                gsap.to(".AsubTextNum", {
                  fontSize: 'calc(2vw + 0.65em)',
                  duration: 0.75,
                  ease: "power2.out"
                });
                gsap.to(".ASubTextTitle", {
                  fontSize: 'calc(2.7vw + 2.7em)',
                  paddingBottom: '2.75vh',
                  duration: 0.75,
                  ease: "power2.out"
                });
              }


              const item1 = document.querySelector(".ASubTextV21P");
              const item2 = document.querySelector(".ASubTextV22P");
              const item3 = document.querySelector(".ASubTextV23P");



              // ScrollTrigger setup
              ScrollTrigger.create({
                trigger: '.ASubContP',  // When scrolling within this container
                start: 'top+=10px center',    // When the top of the section reaches the bottom of the viewport
                end: 'bottom bottom',    // When the bottom of the section reaches the top of the viewport
                scrub: true,          // Smooth scrubbing
                // Pin the element at the bottom of the viewport when the section comes into view
                pin: absdiv,            // Pin this element
                pinSpacing: true,       // Ensure space is maintained once it's pinned (so the layout doesn't break
                
              });

             const splitnum1 = new SplitText(".AsubTextNum1", {
                type: "chars",
                tag: "span",
                charsClass: "char"
              });
              const splitTitle1 = new SplitText(".ASubTextTitle1", {
                type: "chars",
                tag: "span",
                charsClass: "char"
              });
              const splitpara1 = new SplitText(".ASubTextDescriptionP1", {
                type: "words",
                tag: "span",
                wordsClass: "word"
              });

              const splitnum2 = new SplitText(".AsubTextNum2", {
                type: "chars",
                tag: "span",
                charsClass: "char"
              });
              const splitTitle2 = new SplitText(".ASubTextTitle2", {
                type: "chars",
                tag: "span",
                charsClass: "char"
              });
              const splitpara2 = new SplitText(".ASubTextDescriptionP2", {
                type: "words",
                tag: "span",
                wordsClass: "word"
              });

              const splitnum3 = new SplitText(".AsubTextNum3", {
                type: "chars",
                tag: "span",
                charsClass: "char"
              });
              const splitTitle3 = new SplitText(".ASubTextTitle3", {
                type: "chars",
                tag: "span",
                charsClass: "char++"
              });
              const splitpara3 = new SplitText(".ASubTextDescriptionP3", {
                type: "words",
                tag: "span",
                wrap: true,
                wordsClass: "word"
              });

              gsap.timeline({
                scrollTrigger: {
                  trigger: ".ASubContP",
                  start: "top+=28% center",
                  end: "top+=31% center",
                  toggleActions: "play none none reverse",
                  preventOverlaps: true
                  
                }
              })
              .to(".AsubTextNum1 .char", { y: -100, stagger: 0.1, opacity: 0, duration: 0.3 }, "0")
              .to(".ASubTextTitle1 .char", { y: -100, stagger: 0.1, opacity: 0, duration: 0.3 }, "0")
              .to(".ASubTextDescriptionP1 .word", {stagger:{each: 0.01, from: "start"}, opacity: 0, duration: 0.3 }, "0")
              .to(".AsubTextNum2 .char", { y: 0, stagger: 0.1, opacity: 1, duration: 0.3, delay: 0.25}, "<")
              .to(".ASubTextTitle2 .char", { y: 0, stagger: 0.1, opacity: 1, duration: 0.3}, "<")
              .to(".ASubTextDescriptionP2 .word", {stagger:{each: 0.01, from: "start"}, opacity: 1, duration: 0.32, delay: 0.3 }, "<")
              .to(mid1.scale, { x: 0.725, y: 0.725, z: 0.725, duration: 0.45 }, "<")
              .to(mid1.rotation, { x: -2.5, y: 1.3, z: 2, duration: 0.55 }, "<");

              // Step 2: item2 → item3
              gsap.timeline({
                scrollTrigger: {
                  trigger: ".ASubContP",
                  start: "top+=63.5% center",
                  end: "top+=66% center",
                  toggleActions: "play none none reverse",
                  preventOverlaps: true
                }
              })
              .to(".AsubTextNum2 .char", { y: -100, stagger: 0.1, opacity: 0, duration: 0.3 }, "0")
              .to(".ASubTextTitle2 .char", { y: -100, stagger: 0.1, opacity: 0, duration: 0.3 }, "0")
              .to(".ASubTextDescriptionP2 .word", {stagger:{each: 0.01, from: "start"}, opacity: 0, duration: 0.3 }, "0")
              .to(".AsubTextNum3 .char", { y: 0, stagger: 0.1, opacity: 1, duration: 0.3, delay: 0.25}, "<")
              .to(".ASubTextTitle3 .char", { y: 0, stagger: 0.1, opacity: 1, duration: 0.3, delay: 0.25}, "<")
              .to(".ASubTextDescriptionP3 .word", {stagger:{each: 0.02, from: "start"}, opacity: 1, duration: 0.3, delay: 0.3 }, "<")
              .to(mid2.scale, { x: 0.77, y: 0.77, z: 0.77, duration: 0.4}, "<")
              .to(mid2.rotation, { x: 2.5, y: -0.2, z: 2, duration: 0.5}, "<")
              .to(outer.rotation, { x: 0.25, y: 0.25, z: 0, duration: 0.45}, "<");
                const t13d = gsap.timeline({
                scrollTrigger: {
                  trigger: AS1Phone,
                  start: "center center-=2.5%",
                  end: "bottom top+=40%",
                  scrub: 0.15,
                  onLeaveBack: self => {
                    t13d.pause().progress(0); // reset animation to start
                  },
                }
              });

              t13d.to(group.position, { x: 0, y: 0.252, z: 1, ease: "slow(0.1,0.6,false)" }, 0);
              t13d.to(group.scale, { x: 0.0625, y: 0.0625, z: 0.0625, ease: "slow(0.1,0.6,false)" }, 0);
              const tl3c = gsap.timeline({
                scrollTrigger: {
                trigger: AS1Phone,
                start: "center center-=10%",
                end: "center+=30% center-=10%",
                scrub: 0.5,
                onLeaveBack: self => {
                    tl3c.pause().progress(0); // reset animation to start
                  },
                }
              });

              
              
              tl3c.to(inner.scale, { x: 0.65, y: 0.65, z: 0.65, ease: "slow(0.1,0.7,false)" }, 0);
              tl3c.to(inner.rotation, { x: 1.75, y: 0.85, z: -1, ease: "power2.out" }, 0);

            // Horizontal scroll tied to vertical scroll
              

              const tEnd = gsap.timeline({
                scrollTrigger: {
                  trigger: ".ASub1v2P", 
                  start: "bottom-=16% center",
                  end: "bottom+=8% center",
                  scrub: true,
                  ease: "none",
                  onEnterBack: () => {
                    rotating = true;
                  },
                  onLeaveBack: self => {
                    tEnd.pause().progress(0); // reset animation to start
                  },
                }
              });

              tEnd.to(group.position, { 
                y: 0.85,
                
              }, 0);

              ScrollTrigger.create({
                trigger: ".ASubContP",
                start: "top center", // Starts when the top of the section reaches the bottom of the viewport
                end: "bottom bottom", // Ends when the bottom of the section reaches the top of the viewport
                scrub: true,
                onUpdate: (self) => {
                  const P1 = self.progress;
                  spacerFill.style.setProperty("--P1", self.progress.toFixed(3));
                },
                
            });


            }else{
              
              const t1 = gsap.timeline({ paused: true });
              t1.to(".ATitle", {
                opacity: 0,
                x: -1400,
                y: +25,
                scale: 0.65,
                ease: "sine.out",
              }, 0);
              t1.to(".ATitleDesc", {
                opacity: 0,
                y: -50,
                duration: 0.5,
                ease: "sine.out",
              }, 0);
              ScrollTrigger.create({
                animation: t1,
                trigger: textMain,
                start: "top+=4% top",
                end: "bottom 50%",
                scrub: 1,
                toggleActions: "play reverse play reverse",
              });
              

            

              

                // 🎯 T2 (Scaling & Positioning)
                const t2 = gsap.timeline({
                  scrollTrigger: {
                      trigger: MainCanvas,
                      start: "top-=35% center",
                      end: "center-=40% center",
                      markers: true,
                      scrub: 0.5,
                      fastScrollEnd: true,
                      onEnter: () => { rotating = true;}, // Stop oscillation
                      onLeaveBack: () => { rotating = true; }, // Resume oscillation
                  }
              });
                t2.to(group.scale, { x: getResponsiveXInitial(window.innerWidth)+0.03, y: getResponsiveXInitial(window.innerWidth)+0.03, z: getResponsiveXInitial(window.innerWidth)+0.03
                  , ease: "slow(0.1,0.7,false)", duration: 1 }, 0);
                t2.to(group.position, { x: aspectRatioScale* 0.75, y: 0, z: 2, ease: "slow(0.1,0.7,false)", duration: 1 }, 0);

                if (inner) {
                    t2.to(inner.scale, { x: 0.5, y: 0.5, z: 0.5, ease: "slow(0.1,0.7,false)", duration: 1 }, 0);
                    t2.to(inner.rotation, { x: 0.5, y: -1, z: 2, ease: "power2.out", duration: 1 }, 0);
                }
                const t3 = gsap.timeline({
                  scrollTrigger: {
                      trigger: MainCanvas,
                      start: "center-=20% center",
                      end: "center center",
                      scrub: 1,
                      onEnter: () => { rotating = true;}, // Stop oscillation
                  }
              });
                
                if (mid1) {
                    t3.to(mid1.scale, { x: 0.65, y: 0.65, z: 0.65, ease: "slow(0.1,0.7,false)" }, 0);
                    t3.to(mid1.rotation, { x: 2, y: 0.25, z: -3, ease: "power2.out" }, 0);
                }

                const t4 = gsap.timeline({
                  scrollTrigger: {
                      trigger: MainCanvas,
                      start: "center+=10% center",
                      end: "bottom-=20% center",
                      scrub: 1,
                      onEnter: () => { rotating = true;}, // Stop oscillation
                  }
              });
                
                if (mid2) {
                    t4.to(mid2.scale, { x: 0.8, y: 0.8, z: 0.8, ease: "slow(0.1,0.7,false)" }, 0);
                    t4.to(mid2.rotation, { x: -1, y: -2.5, z: -5, ease: "power2.out" }, 0);
                }

              

              const t5 = gsap.timeline({
                scrollTrigger: {
                  trigger: MainCanvas, // this should be the section where scroll-away happens
                  start: "bottom-=5% center",
                  end: "bottom+=50% center",      
                  scrub: true,
                  markers: true,
                  fastScrollEnd: true,
                  onUpdate: (self) => {
                    const scrollProgress = Math.max(0, Math.min(1, self.progress)); ;
                    const offset = scrollProgress * getWorldOffset();
                    group.position.y =  offset;

                  }
                }
              });

          ScrollTrigger.create({
            trigger: ".ASubCont",
            start: "top center", // Starts when the top of the section reaches the bottom of the viewport
            end: "bottom center+=10%", // Ends when the bottom of the section reaches the top of the viewport
            scrub: true,
            onUpdate: (self) => {
              const p = self.progress;
              filler.style.setProperty("--p", self.progress.toFixed(3));
              dots.forEach((dot, i) => {
                let threshold = i / (dots.length - 1);
          
                // if it's the last dot, make it trigger slightly earlier
                if (i === dots.length - 1) {
                  threshold -= 0.0; // activate at 90% progress
                }
          
                dot.classList.toggle("active", p >= threshold);
              });
            }
          });

          const enterAM = gsap.timeline({
            scrollTrigger: {
              trigger: ".ASubTextV21",
              start: "top+=30% bottom-=10%",
              end: "center bottom",
              ease: "sine.in",
              scrub: 1,
            }
          });
          enterAM.fromTo(text1, {
            x: -200,
            y: 0,
            opacity: 0.25,
          }, {
            x: 0,
            y: 0,
            opacity: 1,
            ease: "power2.out",
          }, 0);


          const enterAV = gsap.timeline({
            scrollTrigger: {
              trigger: ".ASubTextV22",
              start: "top+=30% bottom-=10%",
              end: "center bottom",
              ease: "sine.out",
              scrub: 1,
            }
          });
          enterAV.fromTo(text2, {
            x: -200,
            y: 0,
            opacity: 0.25,
          }, {
            x: 0,
            y: 0,
            opacity: 1,
            ease: "power2.out",
          }, 0);
          
          const enterAVA = gsap.timeline({
            scrollTrigger: {
              trigger: ".ASubTextV23",
              start: "top+=40% bottom-=10%",
              end: "center bottom",
              ease: "sine.out",
              scrub: 1,
            }
          });
          enterAVA.fromTo(text3, {
            x: -200,
            y: 0,
            opacity: 0.25,
          }, {
            x: 0,
            y: 0,
            opacity: 1,
            ease: "power2.out",
          }, 0);
            }

      return Cubes;
    }).catch((error) => {
        console.error("Failed to load Cubes:", error);
    });
    //  GSAP Animation  //
    // ................ //
    // ................ //
    // ................ //
    
    
});
let heart = null;
const heartCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
heartCamera.position.set(0, 0, 3);


heartCamera.layers.disable(0);
heartCamera.layers.enable(1);

if (isMobile) {
  console.log("Mobile device detected, skipping heart model loading.");
}else {
    


    
  const loader = new GLTFLoader();


  // Load the matcap or equirect texture
  textureLoader.load("/Gallery/textures/text1.png", (envMapTexture) => {
    envMapTexture.encoding = THREE.sRGBEncoding;
    envMapTexture.mapping = THREE.EquirectangularReflectionMapping;
    envMapTexture.wrapS = THREE.RepeatWrapping;
    envMapTexture.wrapT = THREE.RepeatWrapping;
    envMapTexture.needsUpdate = true;

  loader.load("/Gallery/3dOBJ/untitled.gltf", (gltf) => {
      heart = gltf.scene;
      heart.scale.set(getResponsiveXInitial(window.innerWidth) * 11, getResponsiveXInitial(window.innerWidth) * 11, getResponsiveXInitial(window.innerWidth) * 11);
      heart.position.set(0, 0, 1);
      heart.rotation.set(0, 1, 0);

      heart.traverse((child) => {
        if (child.isMesh) {
          child.layers.set(1);

          // Soft pink color + subtle reflection
          child.material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#8aa1ff'), // soft lavender-pink
            metalness: 0.75,            // subtle reflection, not metallic
            roughness: 0.2,           // soft reflection
            reflectivity: 1,         // low-level reflection
            emissive: new THREE.Color('#3d54ff'), // soft glow
            emissiveIntensity: 1,    // soft glow intensity
            envMap: envMapTexture,
            envMapIntensity: 2,      // balance this for strength
             
          });

          child.material.depthWrite = true;
          child.material.depthTest = true;
          child.material.needsUpdate = true;
        }
      });

      // Lights (warm lavender ambient + soft spot)
      const ambient = new THREE.AmbientLight(0xb695fe, 5);
      ambient.layers.set(1);
      scene.add(ambient);
      const ambient2 = new THREE.AmbientLight(0xe3d6ff, 7);
      ambient2.layers.set(1);
      ambient2.position.set(0.75, 0.25, 1.5);
      scene.add(ambient2);
      const dirLight = new THREE.DirectionalLight(0xadc2ff, 0.5);
      dirLight.position.set(0.5, 0.2, 1.5);
      dirLight.target = heart;
      scene.add(dirLight);
      dirLight.layers.set(1);
      scene.add(heart);
    });
    
    
  });
  
}
// Function to center pivot
// ========================
// ANIMATION LOOP & RESIZE HANDLING
// ========================
let HOVE = document.getElementById("ASub2ThreeJs");


const text1 = document.querySelector(".ASubTextV21");
const text2 = document.querySelector(".ASubTextV22");



const PointLight1 = new THREE.PointLight(0xFF0000, 0.1);
PointLight1.position.set(1, 0.15, 2);
PointLight1.target = group;
scene.add(PointLight1);

const SpotLight1 = new THREE.SpotLight(0x3C35FF, 2.5);
SpotLight1.position.set(1, 0, 2);
SpotLight1.target = group;
scene.add(SpotLight1);


const SpotLight2 = new THREE.SpotLight(0xE4CB14, 0.5);
SpotLight2.position.set(3, 0.1, 1.25);
SpotLight2.target = group;
scene.add(SpotLight2);

const SpotLight3 = new THREE.SpotLight(0x7d52ff, 2.5);
SpotLight3.position.set(1.15, -0.2, 2.85)
SpotLight3.target = group;
scene.add(SpotLight3);
  
const SpotLight4 = new THREE.SpotLight(0xffffff, 2.5);
SpotLight4.position.set(0.85,1, 2.5)
SpotLight4.target = group;
scene.add(SpotLight4);

const SpotLight5 = new THREE.SpotLight(0x0d72ff, 2.5);
SpotLight5.position.set(1, 1.25, 2.65)
SpotLight5.target = group;
scene.add(SpotLight5);

const widthtest = document.documentElement.clientWidth;
const heighttest = document.documentElement.clientHeight;


  
const card1 = document.querySelectorAll(".card1");
const card2 = document.querySelectorAll(".card2");
const card3 = document.querySelectorAll(".card3");
const card4 = document.querySelectorAll(".card4");
const card5 = document.querySelectorAll(".card5");








// // // Intro animation   ........//
// // // ........................ //
// // // ........................ //
if(isMobile){
  const S4Text = document.querySelector(".AS3DescText");

  const s4TL = gsap.timeline({
    scrollTrigger: {
      trigger: S4Text,
      start: "top bottom",
      end: "center+=50% bottom",
      scrub: 1,
    }
  });
  s4TL.fromTo(S4Text, {
    x: 0,
    y: 120,
    opacity: 0,
  }, {
    y: 0,
    x: 0,
    opacity: 1,
    duration: 1,
    ease: "power2.out",
    immediateRender: false
  }, 0);
  const S4Text2 = document.querySelector(".AS3Card1");
  const s4TL2 = gsap.timeline({
    scrollTrigger: {
      trigger: S4Text2,
      start: "top bottom",
      end: "center+=50% bottom",
      scrub: 1,
    }
  });
  s4TL2.fromTo(S4Text2, {
    x: 0,
    x: 120,
    opacity: 0.1,
  }, {
    y: 0,
    x: 0,
    opacity: 1,
    duration: 1,
    ease: "power2.out",
  }, 0);
  
  const S4Text3 = document.querySelector(".AS3Card2");
  const s4TL3 = gsap.timeline({
    scrollTrigger: {
      trigger: S4Text3,
      start: "top bottom",
      end: "center+=50% bottom",
      scrub: 1,
    }
  });
  s4TL3.fromTo(S4Text3, {
    x: 0,
    x: -120,
    opacity: 0.1,
  }, {
    y: 0,
    x: 0,
    opacity: 1,
    duration: 1,
    ease: "power2.out",
  }, 0);
  const S4Text4 = document.querySelector(".AS3Card3");
  const s4TL4 = gsap.timeline({
    scrollTrigger: {
      trigger: S4Text4,
      start: "top bottom",
      end: "center+=50% bottom",
      scrub: 1,
    }
  });
  s4TL4.fromTo(S4Text4, {
    x: 120,
    y: 0,
    opacity: 0.1,
  }, {
    y: 0,
    x: 0,
    opacity: 1,
    ease: "power2.out",
  }, 0);

  const S4Text5 = document.querySelector(".AS3Card4");
  const s4TL5 = gsap.timeline({
    scrollTrigger: {
      trigger: ".AS3Cbottom",
      start: "bottom-=50% bottom",
      end: "bottom-=25% bottom",
      scrub: 1,
      markers: true,
    }
  });
  s4TL5.fromTo(S4Text5, {
    x: 0,
    y: 120,
    opacity: 0.1,
  }, {
    y: 0,
    x: 0,
    opacity: 1,
    ease: "power2.out",
  }, 0);

  const cardTL = gsap.timeline({
    scrollTrigger: {
      trigger: ".Asection2P",
      start: "top bottom",
      end: "center-=30% bottom",
      scrub: 1,
    }
  });
  const cardTL2 = gsap.timeline({
    scrollTrigger: {
      trigger: ".Asection2P",
      start: "center-=20% bottom",
      end: "center-=5% bottom",
      scrub: 1,
    }
  }); 
  const cardTL3 = gsap.timeline({
    scrollTrigger: {
      trigger: ".Asection2P",
      start: "center+=20% bottom",
      end: "center+=25% bottom",
      scrub: 1,
    }

  });
  cardTL.fromTo(card1, {
    y: 0,
    x: -120,
    opacity: 0,
  }, {
    y: 0,
    x: 0,
    opacity: 1,
    ease: "slow(0.1, 0.7, false)",
  }, 0);
  cardTL2.fromTo(card2, {
    y: 0,
    x: +110,
    opacity: 0,
  }, {
    y: 0,
    x: 0,
    opacity: 1,
    ease: "slow(0.1, 0.7, false)",
  }, 0);
  cardTL3.fromTo(card3, {
    y: 110,
    x: 0,
    opacity: 0,
  }, {
    y: 0,
    x: 0,
    opacity: 1,
    ease: "slow(0.1, 0.7, false)",
    delay: 0.4,
  }, 0);





}else{
  const OSTop = document.querySelector(".AS3CTop");
  const OSBot = document.querySelector(".AS3Cbottom");

  const oST = gsap.timeline({ 
    scrollTrigger: {
    trigger: OSTop,
    start: "top+=40% bottom",
    end: "bottom+=70% bottom",
    scrub: 1,
  }});

  oST.fromTo(OSTop, {
    x: +200,
    y: 0,
    opacity: 0.15,
  }, {
    x: 0,
    y: 0,
    opacity: 1,
    duration: 1,
    ease: "power2.out",
  }, 0);




  const oSB = gsap.timeline({ 
    scrollTrigger: {
    trigger: OSBot,
    start: "top+=40% bottom",
    end: "bottom+=30% bottom",
    scrub: 1,
  }});


  oSB.fromTo(OSBot, {
    x: +200,
    y: 0,
    opacity: 0.15,
  }, {
    x: 0,
    y: 0,
    opacity: 1,
    duration: 1,
    ease: "power2.out",
  }, 0);

  const AS3DescText = document.querySelector(".AS3DescText");
  const AS3DescTL = gsap.timeline({
    scrollTrigger: {
      trigger: AS3DescText,
      start: "top+=40% bottom",
      end: "bottom+=50% bottom",
      scrub: 1,
    }
  });
  AS3DescTL.fromTo(AS3DescText, {
    y: 0,
    x: -120,
    opacity: 0.15,
  }, {
    y: 0,
    x: 0,
    opacity: 1,
    duration: 1,
    ease: "power2.out",
  }, 0);


  const cardTL = gsap.timeline({
    scrollTrigger: {
      trigger: ".Asection2",
      start: "top bottom-=200px",
      end: "center-=20% bottom",
      scrub: 1,
      duration: 1,
    }
  });
  const cardTL2 = gsap.timeline({
    scrollTrigger: {
      trigger: ".Asection2",
      start: "center-=5% bottom-=200px",
      end: "center+=10% bottom",
      scrub: 1,
      duration: 1,
    }
  });
  cardTL.fromTo(card1, {
    y: 0,
    x: -200,
    opacity: 0.7,
  }, {
    y: 0,
    x: 0,
    opacity: 1,
    ease: "slow(0.1, 0.7, false)",
  }, 0);
  cardTL.fromTo(card2, {
    y: +170,
    x: 0,
    opacity: 0.7,
  }, {
    y: 0,
    x: 0,
    opacity: 1,
    ease: "slow(0.1, 0.7, false)",
  }, 0);
  cardTL2.fromTo(card4, {
    y: 170,
    x: 0,
    opacity: 0.7,
  }, {
    y: 0,
    x: 0,
    opacity: 1,
    ease: "slow(0.1, 0.7, false)",
    delay: 0.4,
  }, 0);

  cardTL.fromTo(card3, {
    y: 0,
    x: +200,
    opacity: 0.7,
  }, {
    y: 0,
    x: 0,
    opacity: 1,
    ease: "slow(0.1, 0.7, false)",
  }, 0);


  cardTL2.fromTo(card5, {
    y: 0,
    x: +150,
    opacity: 0.7,
  }, {
    y: 0,
    x: 0,
    opacity: 1,
    ease: "slow(0.1, 0.7, false)",
    delay: 0.4,
  }, 0);




}





const textEl = document.querySelector(".subS3TitleText");
const lines = textEl.innerHTML.split("<br>");
const split = new SplitType('.subS3TitleText', {
  types: 'lines',
  lineClass: 'lineWrap'
});

document.querySelectorAll('.lineWrap').forEach(line => {
  const mask = document.createElement('span');
  mask.classList.add('mask');
  mask.textContent = line.textContent; // duplicate the line's text
  line.appendChild(mask);
  gsap.to(mask, {
    opacity: 0,
    transformOrigin: 'left   bottom',
    ease: 'sine.in',
    scrollTrigger: {
      trigger: line,
      start: 'top bottom-=20%',
      end: 'center bottom-=5%',
      scrub: true,
      delay: 1,
    }
  });
});
const subS3Title = document.querySelector(".subS3TitleText");

const subS3pivot = gsap.timeline({
  scrollTrigger: {
    trigger: subS3Title,
    start: "top+=20% bottom",
    end: "bottom+=50% bottom",
    scrub: 1,
  }
});
subS3pivot.fromTo(subS3Title, {
  y: 0,
  x: -30,
}, {
  y: 0,
  x: 0,
  ease: "sin.in",
});

const subS3TitlePhone = document.querySelector(".subS3TitleP");
const subS3TitlePhoneTL = gsap.timeline({
  scrollTrigger: {
    trigger: subS3TitlePhone,
    start: "top+=20% bottom",
    end: "bottom+=50% bottom",
    scrub: 1,
  }
});
subS3TitlePhoneTL.fromTo(subS3TitlePhone, {
  y: 50,
  opacity: 0,
  
}, {
  y: 0,
  opacity: 1,
  ease: "sin.in",
});

const subS3Desc = document.querySelector(".subS3Desc");

const subS3DescTL = gsap.timeline({
  scrollTrigger: {
    trigger: subS3Desc,
    start: "top+=20% bottom",
    end: "bottom+=50% bottom",
    scrub: 1,
  }
});
subS3DescTL.fromTo(subS3Desc, {
  y: 0,
  opacity: 0,
  x: +100,
}, {
  opacity: 1,
  y: 0,
  x: 0,
  ease: "sin.in",
});


if (isMobile) {
  const card1 = document.querySelector(".card1");
  const card2 = document.querySelector(".card2");
  const card3 = document.querySelector(".card3");
  const CardTimline1 = gsap.timeline({ paused: true,
    scrollTrigger: {
      trigger: card1,
      start: "top+=5% bottom",
      end: "top+=30% bottom",
      scrub: 1,
      onLeave: self => {
        CardTimline1.tweenTo(1); // reset animation to start
      },
      onLeaveBack: self => {
        CardTimline1.tweenTo(0); // reset animation to start
      },
      
    }
  });
  CardTimline1.fromTo(card1, {
    y: 0,
    x: -150,
  }, {
    y: 0,
    x: 0,
    ease: "sin.in",
  });

  const CardTimline2 = gsap.timeline({ paused: true,
    scrollTrigger: {
      trigger: card2,
      start: "top+=5% bottom",
      end: "top+=30% bottom",
      scrub: 1,
      onLeave: self => {
        CardTimline2.tweenTo(1); // reset animation to start
      },
      onLeaveBack: self => {
        CardTimline2.tweenTo(0); // reset animation to start
      },
    }
  });
  CardTimline2.fromTo(card2, {
    y: 0,
    x: +150,
  }, {
    y: 0,
    x: 0,
    ease: "sin.in",
  });
  const CardTimline3 = gsap.timeline({ paused: true,
    scrollTrigger: {
      trigger: card3,
      start: "top+=5% bottom",
      end: "top+=30% bottom",
      scrub: 1,
      onLeave: self => {
        CardTimline3.tweenTo(1); // reset animation to start
      },
      onLeaveBack: self => {
        CardTimline3.tweenTo(0); // reset animation to start
      },
    }
  });
  CardTimline3.fromTo(card3, {
    y: +150,
    x: 0,
  }, {
    y: 0,
    x: 0,
    ease: "sin.in",
  });

  const subS3DescPhone1 = document.querySelector(".subS3projects");

  const subS3DescPhoneTL = gsap.timeline({
    scrollTrigger: {
      trigger: subS3DescPhone1,
      start: "top+=20% bottom",
      end: "bottom+=50% bottom",
      scrub: 1,
    }
  });
  subS3DescPhoneTL.fromTo(subS3DescPhone1, {
    x: -150,
    opacity: 0,
    
  }, {
    opacity: 1,
    y: 0,
    x: 0,
    ease: "sin.in",
  });


  const subS3DescPhone2 = document.querySelector(".subS3years");

  const subS3DescPhoneTL2 = gsap.timeline({
    scrollTrigger: {
      trigger: subS3DescPhone2,
      start: "top+=20% bottom",
      end: "bottom+=50% bottom",
      scrub: 1,
    }
  });
  subS3DescPhoneTL2.fromTo(subS3DescPhone2, {
    x: -150,
    opacity: 0,
    
  }, {
    opacity: 1,
    y: 0,
    x: 0,
    ease: "sin.in",
  });
}


function section2Slider(){
  if(isMobile){
    const stickyClass = "stickyIMG";
        const projectImg = document.querySelector(".projectImg");
        const projectText = document.querySelector(".projectText");
        // Sticky image ScrollTrigger setup
        ScrollTrigger.create({
            trigger: ".projectFrame",
            start: "top top+=3%",
            endTrigger: ".TextSlide3",
            end: "top center",
            scrub: true,
            pin: ".projectImg",
            anticipatePin: 1,
            snap: {
              snapTo: 1 / 2, // Snap to each section
              duration: { min: 0.15, max: 1 }, // Duration of the snap animation
              delay: 0.15, // Delay before snapping
            },
            onLeaveBack: () => {
              projectImg.style.position = "sticky";
            },

        });
        
        let activeTween = null;
        const createSlideTimelines = (triggerElement, textSelector, imageSelector, clipPathValue, textLeaveAnim = null, fromColor2, toColor2, fromColor3, toColor3) => {
          // Proxy object to track progress of the color lerp
          const colorProgress = { t: 0 };

          const combinedTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: triggerElement,
              start: "top-=90%",
              end: "bottom center",
              scrub: 0.15,
              ease: "none",
            },
            onUpdate: () => {
              // This onUpdate runs every GSAP tick — update colors here based on colorProgress.t
              const t = colorProgress.t;

              desktopShader.uniforms.u_color2.value.set(
                lerp(fromColor2[0], toColor2[0], t),
                lerp(fromColor2[1], toColor2[1], t),
                lerp(fromColor2[2], toColor2[2], t)
              );
              desktopShader.uniforms.u_color2.value.needsUpdate = true;

              desktopShader.uniforms.u_color3.value.set(
                lerp(fromColor3[0], toColor3[0], t),
                lerp(fromColor3[1], toColor3[1], t),
                lerp(fromColor3[2], toColor3[2], t)
              );
              desktopShader.uniforms.u_color3.value.needsUpdate = true;
            }
          });

          // Animate clipPath of the image
          combinedTimeline.to(imageSelector, {
            clipPath: clipPathValue,
            ease: "none",
          });

          // Animate text fade in / slide in
          combinedTimeline.to(textSelector, {
            opacity: 1,
            x: 0,
            toggleActions: "play none none reverse",
            ease: "none",
          }, 0);

          // Animate text fade out / slide out
          if (textLeaveAnim) {
            combinedTimeline.to(textLeaveAnim, {
              opacity: 0,
              x: 35,
              ease: "none",
            }, 0);
          }

          // Animate colorProgress.t from 0 to 1 inside the timeline
          combinedTimeline.to(colorProgress, {
            t: 1,
            ease: "none",
          }, 0);

          return combinedTimeline;
        };
        // Define your color arrays for transitions:
        const colorArray1 = [206, 106, 0];
        const colorArray2 = [210, 165, 94];
        const colorArray3 = [196, 162, 108];
        const colorArray4 = [233, 152, 22];

        // Now call your timelines with color lerp ranges:
        createSlideTimelines(
          ".TextSlide1",
          ".TextSlide2",
          ".first",
          "inset(0px 0px 100%)",
          ".TextSlide1",
          [195, 207, 246],   // starting color2 (example original)
          colorArray1,    // target color2
          [250, 250, 250],   // starting color3
          colorArray2     // target color3
        );
        
       
        createSlideTimelines(
          ".TextSlide2",
          ".TextSlide3",
          ".second",
          "inset(0px 0px 100%)",
          ".TextSlide2",
          colorArray1,    // starting color2 (previous slide's end)
          colorArray3,    // target color2
          colorArray2,    // starting color3
          colorArray4     // target color3
        );
        let savedOldColor2 = null;
        let savedOldColor3 = null;

        ScrollTrigger.create({
          trigger: ".projectFrame",
          start: "bottom center-=7.5%",
          end: "bottom+=20.5% top",
          once: false,
          onEnter: () => {
            // Save the current colors as a snapshot when entering
            savedOldColor2 = desktopShader.uniforms.u_color2.value.clone();
            savedOldColor3 = desktopShader.uniforms.u_color3.value.clone();
            
            if (activeTween) activeTween.kill();
            

            activeTween = gsap.to({ t: 0 }, {
              t: 1,
              duration: 0.525,
              ease: "none",
              onUpdate: function () {
                const t = this.targets()[0].t;
                
                desktopShader.uniforms.u_color2.value.set(
                  lerp(savedOldColor2.x, 195, t),
                  lerp(savedOldColor2.y, 207, t),
                  lerp(savedOldColor2.z, 246, t)
                );
                desktopShader.uniforms.u_color2.value.needsUpdate = true;

                desktopShader.uniforms.u_color3.value.set(
                  lerp(savedOldColor3.x, 250, t),
                  lerp(savedOldColor3.y, 250, t),
                  lerp(savedOldColor3.z, 250, t)
                );
                desktopShader.uniforms.u_color3.value.needsUpdate = true;
              }
            });
          },
          onLeaveBack: () => {
            // Use saved colors or fallback if not set
            const oldColor2 = savedOldColor2 || new THREE.Vector3(206, 106, 0);
            const oldColor3 = savedOldColor3 || new THREE.Vector3(210, 165, 94);

            if (activeTween) activeTween.kill();

            activeTween = gsap.to({ t: 0 }, {
              t: 1,
              duration: 0.25,
              ease: "none",
              
              onUpdate: function () {
                const t = this.targets()[0].t;
                desktopShader.uniforms.u_color2.value.set(
                  lerp(195, oldColor2.x, t),
                  lerp(207, oldColor2.y, t),
                  lerp(246, oldColor2.z, t)
                );
                desktopShader.uniforms.u_color2.value.needsUpdate = true;

                desktopShader.uniforms.u_color3.value.set(
                  lerp(250, oldColor3.x, t),
                  lerp(250, oldColor3.y, t),
                  lerp(250, oldColor3.z, t)
                );
                desktopShader.uniforms.u_color3.value.needsUpdate = true;
              }
            });
          }
        });

  }else{
    // ScrollTrigger to toggle classes and pin based on scroll position for Desktop
     const projectImg = document.querySelector(".projectImg");
      const stickyClass = "stickyIMG";

      ScrollTrigger.create({
        trigger: ".projectFrame",
        start: "top top-=10vh",
        end: "bottom bottom",
        scrub: 0.5,
        markers: true,
        snap: {
          snapTo: (window.innerWidth <= 1200) ? [-0.1, 0.5, 1.1] : [0, 0.5, 1], // Snap progress to 3 points: start, middle, end
          duration: { min: 0.1, max: 0.5 },
          delay: 0.1,
          directional: true,
        },
        
      });


      const createImageTimeline = (triggerElement, clipPathValue) => {
        const imageTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: triggerElement,
            start: "top+=20%",
            end: "bottom-=20%",
            scrub: 1,
          },
        });

        // ClipPath animation to hide the image   
        imageTimeline.to(".first", {
          clipPath: clipPathValue,
        });
              
        // Timeline transition
        imageTimeline.to(desktopShader.uniforms.u_color2.value, {
          x: 206,
          y: 106 ,
          z: 0 ,
          ease: "none",
          onUpdate: () => {
            desktopShader.uniforms.u_color2.value.needsUpdate = true;
          }
        });

        imageTimeline.to(desktopShader.uniforms.u_color3.value, {
          x: 210,
          y: 165,
          z: 94 ,
          ease: "none",
          onUpdate: () => {
            desktopShader.uniforms.u_color3.value.needsUpdate = true;
          }
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
            scrub: 1,
          },
        });

        imageTimeline2.to(".second", {
          clipPath: clipPathValue,
        });
        
        imageTimeline2.to(desktopShader.uniforms.u_color2.value, {
          x: 237,
          y: 195,
          z: 155,
          onUpdate: () => {
            desktopShader.uniforms.u_color2.value.needsUpdate = true;
          }
        });
        imageTimeline2.to(desktopShader.uniforms.u_color3.value, {
          x: 233,
          y: 152,
          z: 22,
          ease: "none",
          onUpdate: () => {
            desktopShader.uniforms.u_color3.value.needsUpdate = true;
          }
        });
        return imageTimeline2;
      };
      const imageTimeline2 = createImageTimeline2(".TextSlide2", "inset(0px 0px 100%)");

      const TimeEnd = gsap.timeline({
        scrollTrigger: {
          trigger: ".Asection2",
          start: "top+=10% center ",
          end: "top+=65% center",
          preventOverlaps: true,
          fastScrollEnd: 450,
          ease: "expo.in",
          scrub: 1,
        },
      });
      TimeEnd.to(desktopShader.uniforms.u_color2.value, {
        x: 190,  
        y: 216,
        z: 250,
        ease: "none",
        onUpdate: () => {
          desktopShader.uniforms.u_color3.value.needsUpdate = true;
        }
      });
      TimeEnd.to(desktopShader.uniforms.u_color3.value, {
        x: 250,  
        y: 250,
        z: 250,
        ease: "none",
        onUpdate: () => {
          desktopShader.uniforms.u_color3.value.needsUpdate = true;
        }
      });
    }
    
    
}
section2Slider();
 


let lastColor2 = null;
let lastColor3 = null;

let heartDiv = document.getElementById("heartS8");
let mouse = { x: 0, y: 0 };
let targetMouse = { x: 0, y: 0 };

window.addEventListener('mousemove', (event) => {
  const rect = heartDiv.getBoundingClientRect();

  const margin = 400; // px
  const insideX = event.clientX >= rect.left - margin && event.clientX <= rect.right + 800;
  const insideY = event.clientY >= rect.top - margin && event.clientY <= rect.bottom + margin;

  if (insideX && insideY) {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = (event.clientX - centerX) / (rect.width / 2);
    const y = (event.clientY - centerY) / (rect.height / 2);

    targetMouse.x = THREE.MathUtils.clamp(x, -1, 1);
    targetMouse.y = THREE.MathUtils.clamp(y, -1, 1);
  } else {
    targetMouse.x = 0;
    targetMouse.y = 0;
  }
});

let rotationTime = 0; // Initialize rotation time
// Set once at the top (outside animate)
scene.background = null;
function animateDesktop(time) {
  const delta = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();

  mouse.x += (targetMouse.x - mouse.x) * 0.05; // 10% easing
  mouse.y += (targetMouse.y - mouse.y) * 0.05;

  if (rotating) {
    rotationTime += delta;
    const floatOffset = Math.cos(rotationTime * rSpeed / 1.25) * rAmplitude;
    group.rotation.y = floatOffset;
    group.rotation.x = floatOffset * 0.125;
    if (heart) {
    heart.rotation.y = floatOffset * 0.25;

    // Add subtle position offset from mouse
    // Adjust multiplier for intensity
      
    heart.rotation.x = mouse.x * 0.1; // Adjust rotation based on mouse Y
    heart.rotation.z = mouse.y * 0.1; // Adjust rotation based on mouse X
    heart.position.z = 1; // keep original Z fixed
    }
  }

  cubeCamera.position.copy(group.position);
  cubeCamera.update(renderer, scene);

  reflectiveMaterial.envMap = cubeRenderTarget.texture;
  reflectiveMaterial.needsUpdate = true;

  materialS.uniforms.time.value = elapsedTime;

  // ✅ 1) Render background and rest of the scene (camera, layer 0)
  renderer.setScissorTest(false);
  const extraHeight = isTablet ? 0.2 : 0; // Adjust if you want to add extra height for the background
  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight * (1 + extraHeight));
  renderer.autoClear = true;
  renderer.clear();
  renderer.render(scene, camera);

  // ✅ 2) Prepare to render only heart on top (layer 1)
  const heartDiv = document.getElementById("heartS8");
  const rect = heartDiv.getBoundingClientRect();

  if (rect.bottom > 0 && rect.top < window.innerHeight && heart) {

    const aspect = rect.width / rect.height;
    if (heartCamera.aspect !== aspect) {
      heartCamera.aspect = aspect;
      heartCamera.updateProjectionMatrix();
    }

    // ✅ This keeps the background but clears the depth buffer only
    renderer.autoClear = false;
    renderer.clearDepth();

    renderer.setScissorTest(true);
    renderer.setViewport(rect.left, window.innerHeight - rect.bottom, rect.width, rect.height);
    renderer.setScissor(rect.left, window.innerHeight - rect.bottom, rect.width, rect.height);

    // ✅ Render only the heart (layer 1), no background
    heartCamera.layers.set(1);
    renderer.render(scene, heartCamera);
    renderer.setScissorTest(false);
  }
  requestAnimationFrame(animateDesktop);
}

function animateMobile(time) {
  const delta = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();

  ScrollTrigger.update();

  if (rotating) {
    rotationTime += delta;
    const floatOffset = Math.cos(rotationTime * rSpeed / 1.25) * rAmplitude;
    group.rotation.y = floatOffset;
    group.rotation.x = floatOffset * 0.125;
  }

  cubeCamera.position.copy(group.position);
  cubeCamera.update(renderer, scene);

  reflectiveMaterial.envMap = cubeRenderTarget.texture;
  reflectiveMaterial.needsUpdate = true;

  materialS.uniforms.time.value = elapsedTime;

  // Just render the main scene
  renderer.setScissorTest(false);
  renderer.render(scene, camera);

  requestAnimationFrame(animateMobile);
}

if (isMobile || isTablet) {
  requestAnimationFrame(animateMobile);
} else {
  requestAnimationFrame(animateDesktop);
}





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
      scale: 1.25,
      ease: "quad.out"
    }, 0)
    .to(text,{
      color: "#fff"
    }, 0)
    
    .to(SVG, {
      fill: "#fff"
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