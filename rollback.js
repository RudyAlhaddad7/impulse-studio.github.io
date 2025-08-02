import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import MeshReflectorMaterial from './MeshReflectorMaterial.js';
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MeshTransmissionMaterial } from '@pmndrs/vanilla';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { cameraPosition, rotate } from 'three/src/nodes/TSL.js';
import SplitType from 'split-type'
import Lenis from '@studio-freight/lenis'
import { time } from 'three/tsl';

const lenis = new Lenis({
  smooth: true,
  lerp: 0.2,
  inertia: 0.3,
  smoothTouch: true,
})

gsap.registerPlugin(ScrollTrigger);// Import necessary libraries
lenis.on('scroll', ScrollTrigger.update);
// ========================
// SHADER SETUP
// ========================

const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

const canvas = document.getElementById("aBackgroundG");

// Function to get viewport dimensions
function getViewportDimensions() {
  const extraHeight = isMobile ? 0.1 : 0; // Add extra height to consider the missing scroll bar size on mobile
  return {
    width: window.innerWidth,
    height: window.innerHeight * (1 + extraHeight), // Adjust height for mobile
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
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true});
renderer.setSize(width, height);
renderer.setPixelRatio(window.devicePixelRatio); // Improve clarity on high-DPI screens
// Scene & Camera
const scene = new THREE.Scene();
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.1, 100);
camera.position.z = isMobile ? 2.5 : 4; // Adjust depth for mobile
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

function getFullScreenSize() {
  const fov = (camera.fov * Math.PI) / 180; // Convert FOV to radians
  const height = 2 * Math.tan(fov / 2) * camera.position.z ; // Visible height
  const width = height * (window.innerWidth / (window.innerHeight + (isMobile ? 0 : 0))); // Width based on aspect ratio
  return { width, height };
}


// Function to update plane size
function updatePlaneSize() {
  const { width, height } = getFullScreenSize();
  plane.geometry.dispose(); // Remove old geometry
  plane.geometry = new THREE.PlaneGeometry(width, height); // Set new size
}


// Initial plane setup
const { width: planeWidth, height: planeHeight } = getFullScreenSize();
const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);

const CA1 = 232, CA2 = 233, CA3 = 234; // Example colors
const CA4 = 105, CA5 = 114, CA6 = 249; // Example colors


// Create Shader Material
const desktopShader = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    u_color1: { value: new THREE.Vector3(232, 233, 234) }, // Example Red
    u_color2: { value: new THREE.Vector3(105, 114, 249) }, 
    u_color3: { value: new THREE.Vector3(144, 193, 245) }, 
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
const dots = document.querySelectorAll(".AsubDot");
const text3 = document.querySelector(".ASubTextV23");

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
            
            group.rotation.set(1, 1, 1);
            group.scale.set(0.07, 0.07, 0.07);
            isMobile ? group.position.set(0, 0.05, 1) : group.position.set(1.225, 0.135, 2);
            isMobile ? group.scale.set(0.0625, 0.0625, 0.0625) : group.scale.set(0.065, 0.065, 0.065);
            const mid2 = scene.getObjectByName('Mid2');
            const mid1 = scene.getObjectByName('Mid1');
            const inner = scene.getObjectByName('Inner');
            const outer = scene.getObjectByName('Outer');

            if(isMobile){
              
              const AS1Phone = document.querySelector(".Asection1Phone");
              const AS1DescPhone = document.querySelector(".ADescP");
              const AS1TitlePhone = document.querySelector(".ATitlePT");
              const AS1TitleNamePhone = document.querySelector(".ATitleDescP");
              const AS1TitleNameDescPhone = document.querySelector(".ATITLEDescYP");
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
                  start: "top+=15% top",
                  end: "bottom+=15% bottom",
                  scrub: 1,
                }
              });
              
              const T1PhoneSub2 = gsap.timeline({ 
                
                paused: true,
                scrollTrigger: {
                  trigger: AS1Phone,
                  start: "top+=25% top",
                  end: "bottom+=15% bottom",
                  scrub: 1,
                }
              });
              T1Phone.to(AS1DescPhone, {
                y: -75,
                opacity: 0.05,
                ease: "sine.out",
              }, 0);
              T1PhoneSub.to(AS1TitlePhone, {
                x: -100,
                opacity: 0,
                ease: "sine.out",
              }, 0);
              T1PhoneSub2.to(AS1TitleNamePhone, {
                opacity: 0,
                ease: "sine.out",
              },0);
              T1PhoneSub2.to(AS1TitleNameDescPhone, {
                opacity: 0,
                ease: "sine.out",
              },0);
              const t13d = gsap.timeline({
                
                paused: true,
                scrollTrigger: {
                  trigger: AS1Phone,
                  start: "top+=40% top",
                  end: "bottom+=30% center",
                  scrub: 1,
                  ease: "sine.out",
                  
                }
              });

              const absdiv = document.querySelector(".Absdiv");

              ScrollTrigger.create({
                trigger: ".ASub1v2P",
                start: "top top",     // when top of ASubContP hits bottom of viewport
                end: "bottom top",    // when bottom of ASubContP hits bottom of viewport
                scrub: true,
                markers: true,
                onUpdate: self => {
                  if (self.progress > 0 && self.progress < 1) {
                    absdiv.classList.add("stickyBottom");
                  } else {
                    absdiv.classList.remove("stickyBottom");
                  }
                }
              });
              t13d.to(group.position, { x: 0, y: 0.352, z: 1, ease: "slow(0.1,0.2,false)" }, 0);
              t13d.to(group.scale, { x: 0.07, y: 0.07, z: 0.07, ease: "slow(0.1,0.2,false)" }, 0); 
              t13d.to(inner.scale, { x: 0.5, y: 0.5, z: 0.5, ease: "slow(0.1,0.7,false)" }, 0);
              t13d.to(inner.rotation, { x: 0, y: 0.325, z: 1, ease: "power2.out" }, 0);
              const item1 = document.querySelector(".ASubTextV21P");
              const item2 = document.querySelector(".ASubTextV22P");
              const item3 = document.querySelector(".ASubTextV23P");
              const hiddenText1 = item1.querySelector(".ASubTextDescriptionP");
              const hiddenText2 = item2.querySelector(".ASubTextDescriptionP");
              const hiddenText3 = item3.querySelector(".ASubTextDescriptionP");

              // ScrollTrigger with both directions
              ScrollTrigger.create({
                trigger: ".ASubTextV21P",
                start: "top center-=10%",
                end: "bottom center",
                scrub: false,
              });
              const tl3c = gsap.timeline({paused: true});
              tl3c.to(mid1.scale, { x: 0.65, y: 0.65, z: 0.65, ease: "slow(0.1,0.7,false)" }, 0);
              tl3c.to(mid1.rotation, { x: 1, y: 0.25, z: -1, ease: "power2.out" }, 0);
              ScrollTrigger.create({
                trigger: ".ASubTextV21P",
                start: "top-=220% center-=10%",
                end: "bottom center-=10%",
                scrub: true,
                animation: tl3c,
              });
              gsap.registerPlugin(ScrollTrigger);

            // Horizontal scroll tied to vertical scroll
            
              const tl32c = gsap.timeline({paused: true});
              tl32c.to(mid2.scale, { x: 0.75, y: 0.75, z: 0.75, ease: "slow(0.1,0.7,false)" }, 0);
              tl32c.to(mid2.rotation, { x: -1, y: -0.45, z: 1, ease: "power2.out" }, 0);
              ScrollTrigger.create({
                trigger: ".ASubTextV22P",
                start: "top-=100% center-=10%",
                end: "bottom center-=10%",
                scrub: true,
                animation: tl32c,
              });
              
              const tl33c = gsap.timeline({paused: true});
              

              const tEnd = gsap.timeline({
                scrollTrigger: {
                  trigger: ".ASubTextV23P", // this should be the section where scroll-away happens
                  start: "bottom center",
                  end: "bottom+=300% center",
                  scrub: true,
                  
                }
              });

              tEnd.to(group.position, { y: 0.85, ease: "slow(0.1,0.1,false)" }, 0);

              
              
              



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
              

            

            if (!group) {
                console.error("Group not found!");
            } else {
              
                if (!inner || !mid1 || !outer) {
                    console.error("One or more objects (inner, mid, outer) not found!");
                }

                // 🎯 T2 (Scaling & Positioning)
                const t2 = gsap.timeline({
                  scrollTrigger: {
                      trigger: MainCanvas,
                      start: "top-=30% center",
                      end: "center-=40% center",
                      scrub: 1,
                      onEnter: () => { rotating = true;}, // Stop oscillation
                  }
              });
                t2.to(group.scale, { x: 0.095, y: 0.095, z: 0.095, ease: "slow(0.1,0.7,false)" }, 0);
                t2.to(group.position, { x: 0.75, y: 0, z: 2, ease: "slow(0.1,0.7,false)" }, 0);
                
                if (inner) {
                    t2.to(inner.scale, { x: 0.5, y: 0.5, z: 0.5, ease: "slow(0.1,0.7,false)" }, 0);
                    t2.to(inner.rotation, { x: 0.5, y: -1, z: 2, ease: "power2.out" }, 0);
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

              let initialY = group.position.y;
              

              const t5 = gsap.timeline({
                scrollTrigger: {
                  trigger: MainCanvas, // this should be the section where scroll-away happens
                  start: "bottom-=5% center",
                  end: "bottom+=50% center",
                  scrub: true,
                  onUpdate: (self) => {
                    const scrollProgress = self.progress ;
                    const offset = scrollProgress * getWorldOffset();

                    group.position.y =  offset;
                  }
                }
              });
                
                        
                
                
            }
            
                
          
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
                  threshold -= 0.07; // activate at 90% progress
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
// Function to center pivot
// ========================
// ANIMATION LOOP & RESIZE HANDLING
// ========================
let HOVE = document.getElementById("ASub2ThreeJs");


const text1 = document.querySelector(".ASubTextV21");
const text2 = document.querySelector(".ASubTextV22");


const PointLight1 = new THREE.PointLight(0xFF0000, 0.1);
PointLight1.position.set(1, 0.15, 2);
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





console.log(window.innerWidth, window.innerHeight);

const widthtest = document.documentElement.clientWidth;
const heighttest = document.documentElement.clientHeight;

console.log("Width:", widthtest, "Height:", heighttest);


let rotationTime = 0; // Initialize rotation time
// Animate function
function animate(time) {
  lenis.raf(time);

  const delta = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();

  if (rotating) {
    rotationTime += delta;
    const floatOffset = Math.cos(rotationTime * rSpeed / 1.25) * rAmplitude;
    group.rotation.y = floatOffset;
    group.rotation.x = floatOffset * 0.1;
  }

  cubeCamera.position.copy(group.position);
  cubeCamera.update(renderer, scene);

  reflectiveMaterial.envMap = cubeRenderTarget.texture;
  reflectiveMaterial.needsUpdate = true;

  materialS.uniforms.time.value = elapsedTime;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// ✅ Only this is needed to start the loop
requestAnimationFrame(animate);






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
      markers: true,
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




}

const cards = document.querySelectorAll(".cards");
console.log(cards);
const cardTL = gsap.timeline({
  scrollTrigger: {
    trigger: ".Asection2",
    start: "top bottom-=200px",
    end: "center-=20% bottom",
    scrub: 1,
  }
});
cardTL.fromTo(cards, {
  y: 0,
  x: +200,
  opacity: 0.7,
}, {
  y: 0,
  x: 0,
  opacity: 1,
  ease: "power2.out",
}, 0);




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
    console.log("ScrollTrigger initialized"); 
        const projectImg = document.querySelector(".projectImg");
        const projectText = document.querySelector(".projectText");
        console.log(projectImg, projectText); // Check if elements are selected correctly
        // Sticky image ScrollTrigger setup
        ScrollTrigger.create({
            trigger: ".projectFrame",
            start: "top top+=2.5%",
            endTrigger: ".TextSlide3",
            end: "top center",
            scrub: 0.1,
            pinSpacing: false,
            pin: ".projectImg",
            onLeaveBack: () => {
                projectImg.style.position = "sticky";
            }
            
        });
      
        const colorArray1 = [206, 106, 0]; // First color
        const colorArray2 = [210, 165, 94]; // Second color
        const colorArray3 = [196, 162, 108]; // Third color (for another slide)
        const colorArray4 = [233, 152, 22]; // Fourth color (for another slide)
        // Combined timeline for each TextSlide
        const createSlideTimelines = (triggerElement, textSelector, imageSelector, clipPathValue, textLeaveAnim = null) => {
            const combinedTimeline = gsap.timeline({
                scrollTrigger: {
                    trigger: triggerElement,
                    start: "top-=90%",
                    end: "bottom center",
                    scrub: 1,
                },
            });

            // Image animation
            combinedTimeline.to(imageSelector, {
                clipPath: clipPathValue,
            });
            
      

            // Text animation
            combinedTimeline.to(textSelector,{
                opacity: 1,
                x: 0, // Example animation for text
                duration: 0.2,  
                ease: "expo.out",
                toggleActions: "play reverse", 
            }, 0); // Sync with image animation
            
            combinedTimeline.to(textLeaveAnim,{
              opacity: 0,
              x: 35,
              duration: 0.3,
              ease: "expo.out"
            }, 0); 
            // Timeline transition
            combinedTimeline.to(desktopShader.uniforms.u_color2.value, {
                x: colorArray1[0],
                y: colorArray1[1] ,
                z: colorArray1[2],
                ease: "none",
                onUpdate: () => {
                  desktopShader.uniforms.u_color2.value.needsUpdate = true;
                }
            });
      
            combinedTimeline.to(desktopShader.uniforms.u_color3.value, {
                x: colorArray2[0],
                y: colorArray2[1],
                z: colorArray2[2],
                ease: "none",
                onUpdate: () => {
                  desktopShader.uniforms.u_color3.value.needsUpdate = true;
                }
            });
            return combinedTimeline;
        };

        // Create synchronized timelines for each slide
        createSlideTimelines(".TextSlide1", ".TextSlide2", ".first", "inset(0px 0px 100%)", ".TextSlide1", colorArray1, colorArray2);
        createSlideTimelines(".TextSlide2", ".TextSlide3", ".second", "inset(0px 0px 100%)", ".TextSlide2", colorArray3, colorArray4);

        const TimeLineEnd = gsap.timeline({
            scrollTrigger: {
                trigger: ".projectFrame",
                start: "bottom center ",
                end: "bottom top",
                scrub: 1,
                toggleActions: "play reverse play reverse", // Timeline behavior on entering and leaving
            },
        });
        
        TimeLineEnd.to(desktopShader.uniforms.u_color2.value, {
          x: 105,  
          y: 114,
          z: 249,
          ease: "none",
          onUpdate: () => {
            desktopShader.uniforms.u_color3.value.needsUpdate = true;
          }
        });
        TimeLineEnd.to(desktopShader.uniforms.u_color3.value, {
          x: 144,  
          y: 193,
          z: 245,
          ease: "none",
          onUpdate: () => {
            desktopShader.uniforms.u_color3.value.needsUpdate = true;
          }
        });
  }else{
    // ScrollTrigger to toggle classes and pin based on scroll position for Desktop
    const projectImg = document.querySelector(".projectImg");
    const stickyClass = "stickyIMG";
    ScrollTrigger.create({
      trigger: ".projectFrame",
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      onEnter: () => projectImg.classList.add(stickyClass),
      onLeaveBack: () => projectImg.classList.remove(stickyClass),
      snap: {
        snapTo: 1 / 2,
        duration: 0.5,
        ease: "none",
        directional: true
    }
    });

    const createImageTimeline = (triggerElement, clipPathValue) => {
      const imageTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: triggerElement,
          start: "top+=20%",
          end: "bottom-=20%",
          scrub: 1,
          toggleActions: "play reverse play reverse", // Timeline behavior on entering and leaving
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
          toggleActions: "play reverse play reverse", // Timeline behavior on entering and leaving
        },
      });

      imageTimeline2.to(".second", {
        clipPath: clipPathValue,
      });
      
      imageTimeline2.to(desktopShader.uniforms.u_color2.value, {
        x: 196,
        y: 162,
        z: 108,
        onUpdate: () => {
          desktopShader.uniforms.u_color2.value.needsUpdate = true;
        }
      });
      imageTimeline2.to(desktopShader.uniforms.u_color3.value, {
        x: 233,
        y: 152,
        z: 22,
        ease: "power2.in",
        onUpdate: () => {
          desktopShader.uniforms.u_color3.value.needsUpdate = true;
        }
      });
      return imageTimeline2;
    };
    const TimeLineEnd = gsap.timeline({
      scrollTrigger: {
          trigger: ".projectFrame",
          start: "bottom center ",
          end: "bottom top",
          scrub: 1,
          toggleActions: "play reverse play reverse", // Timeline behavior on entering and leaving
      },
  });
    const TimeEnd = gsap.timeline({
      scrollTrigger: {
        trigger: ".projectFrame",
        start: "bottom center ",
        end: "bottom top",
        scrub: 1,
        toggleActions: "play reverse play reverse", // Timeline behavior on entering and leaving
      },
    });
    TimeEnd.to(desktopShader.uniforms.u_color2.value, {
      x: 105,  
      y: 114,
      z: 249,
      ease: "none",
      onUpdate: () => {
        desktopShader.uniforms.u_color3.value.needsUpdate = true;
      }
    });
    TimeEnd.to(desktopShader.uniforms.u_color3.value, {
      x: 144,  
      y: 193,
      z: 245,
      ease: "none",
      onUpdate: () => {
        desktopShader.uniforms.u_color3.value.needsUpdate = true;
      }
    });

    const imageTimeline2 = createImageTimeline2(".TextSlide2", "inset(0px 0px 100%)");
    gsap.registerPlugin(ScrollTrigger);

    const projectText = document.querySelector(".projectText");

   

  }
}
section2Slider();

// //    THREE + GSAP Section   //
// // ........................ //
// // ........................ //
// // ........................ //


// const tl = gsap.timeline({ paused: true });

// tl.to(".ATIT1PNG", {
//   x: -112,
//   rotation: -10,
//   duration: 0.5,
//   ease: "power2.out"
// })
// const tl2=gsap.timeline({paused:true});

// tl2.fromTo(".ATITText1", {
//   x: -135,
//   y: 100,
//   scale: 0.5,
//   duration: 0.8,
//   y: 0,
// },{
//   x: -55,
//   y: -20,
//   scale: 1,
//   opacity: 1,
//   duration: 0.7,
//   ease: "power2.out"
// })

// document.querySelector('.ATIT1').addEventListener("mouseenter", () => {
//     tl.play();
//     tl2.play();
// });
// document.querySelector('.ATIT1').addEventListener("mouseleave", () => {
//     tl.reverse();
//     tl2.reverse();
// });

// const tlt2 = gsap.timeline({ paused: true });

// tlt2.to(".ATIT2PNG", {
//   x: 120,
//   rotation: 10,
//   duration: 0.8,
//   ease: "power2.out"
// })
// const tlt2T =gsap.timeline({paused:true});

// tlt2T.fromTo(".ATITText2", {
//   x: -180,
//   scale: 0.5,
//   y: 0,
// },{
//   x: -340,
//   y: -20,
//   scale: 1,
//   opacity: 1,
//   duration: 0.7,
//   ease: "power2.out"
// })



// document.querySelector('.ATIT2').addEventListener("mouseenter", () => {
//   tlt2.play();
//   tlt2T.play();
// });
// document.querySelector('.ATIT2').addEventListener("mouseleave", () => {
//   tlt2T.reverse();
//   tlt2.reverse();
// });


// const tlt3 = gsap.timeline({ paused: true });

// tlt3.to(".ATIT3PNG", {
//   x: -225,
//   rotation: -10,
//   duration: 0.8,
//   ease: "power2.out"
// })
// const tlt3T =gsap.timeline({paused:true});

// tlt3T.fromTo(".ATITText3", {
//   x: -220,
//   scale: 0.4,
//   y: -220,
// },{
//   x: -185,
//   y: -280,
//   scale: 1,
//   opacity: 1,
//   duration: 0.7,
//   ease: "power2.out"
// })



// document.querySelector('.ATIT3').addEventListener("mouseenter", () => {
//   tlt3.play();
//   tlt3T.play();
// });
// document.querySelector('.ATIT3').addEventListener("mouseleave", () => {
//   tlt3T.reverse();
//   tlt3.reverse();
// });






// const tlt4 = gsap.timeline({ paused: true });
// tlt4.to(".ATIT5PNG", {
//   x: 180,
//   rotation: 10,
//   duration: 0.8,
//   ease: "power2.out"
// })
// const tlt4T =gsap.timeline({paused:true});

// tlt4T.fromTo(".ATITText5", {
//   x: 0,
//   scale: 0.4,
//   y: -220,
// },{
//   x: -100,
//   y: -320,
//   scale: 1,
//   opacity: 1,
//   duration: 0.7,
//   ease: "power2.out"
// })



// document.querySelector('.ATIT5').addEventListener("mouseenter", () => {
//   tlt4.play();
//   tlt4T.play();
// });
// document.querySelector('.ATIT5').addEventListener("mouseleave", () => {
//   tlt4T.reverse();
//   tlt4.reverse();
// });



// THREE + GSAP Mission/vision Section //
// ................................... //
// ................................... //
// ................................... //
// ................................... // let cubesPromise = null;




// let group = new THREE.Group();
// let initialTransforms = [];
// let cubesPromise = null;

// function loadCubes() {
//     return new Promise((resolve, reject) => {
//         const loader = new GLTFLoader();
//         loader.load("/Gallery/3dOBJ/Cubes/11.gltf", function (gltf) {
//             if (gltf && gltf.scene) {
//                 resolve(gltf.scene);
//             } else {
//                 reject(new Error("GLTF scene is not defined"));
//             }
//         }, undefined, function (error) {
//             reject(error);
//         });
//     });
// }

// document.addEventListener("DOMContentLoaded", function () {
//     const ASub2Canvas = document.getElementById("ASub2ThreeJs");
//     let scene2 = new THREE.Scene();
//     let camera1 = new THREE.PerspectiveCamera(60, ASub2Canvas.clientHeight / ASub2Canvas.clientWidth, 0.1, 100);
//     camera1.position.set(0, -0.25, 5);
//     let renderer2 = new THREE.WebGLRenderer({ canvas: ASub2Canvas, antialias: true, alpha: true });
//     renderer2.setSize(ASub2Canvas.clientWidth, ASub2Canvas.clientHeight, false);
//     renderer2.setPixelRatio(window.devicePixelRatio); // Improve rendering quality

//     const glassMaterial = new THREE.MeshPhysicalMaterial({
//         transmission: 1,
//         thickness: 1.5,
//         roughness: 0,
//         ior: 2.0,
//         color: new THREE.Color('white'),
//         side: THREE.DoubleSide,
//     });
    
//     const glassMaterial2 = Object.assign(new MeshTransmissionMaterial(10), { 
//         clearcoat: 1,
//         clearcoatRoughness: 1,
//         transmission: 1,
//         chromaticAberration: 1.2,
//         thickness: 5.5,
//         ior: 1.82,
//         distortion: 0.25,
//         distortionScale: 0.05,
//         temporalDistortion: 0.01,
//         color: new THREE.Color('white'),
//         side: THREE.DoubleSide,
//         backside: true,
//         backsideThickness: 2,
//     });

//     // Load environment texture for reflection
//     const textureLoader = new THREE.TextureLoader();
//     const envTexture = textureLoader.load('/Gallery/textures/neon.png', function (texture) {
//         texture.mapping = THREE.EquirectangularReflectionMapping;
//         glassMaterial.envMap = texture;
//         glassMaterial.needsUpdate = true; // Ensure the material updates with the new envMap
//     });

//     cubesPromise = loadCubes().then((Cubes) => {
//         if (!Cubes) {
//             throw new Error("Cubes is not defined");
//         }
//         scene2.add(Cubes);

//         // Collect all mesh objects from the GLTF file
//         let meshes = [];
//         if (Cubes instanceof THREE.Group || Cubes instanceof THREE.Object3D) {
//             Cubes.traverse((child) => {
//                 if (child.isMesh) {
//                     child.material = glassMaterial2;
//                     meshes.push(child);
//                     initialTransforms.push({
//                         object: child,
//                         initialPosition: child.position.clone(),
//                         initialRotation: child.rotation.clone(),
//                         initialScale: child.scale.clone()
//                     });
//                 }
//             });
//         } else {
//             console.error("Cubes is not an instance of THREE.Group or THREE.Object3D");
//         }

//         // Add collected meshes to the group
//         meshes.forEach(mesh => group.add(mesh));
//         group.position.set(0, 0, 0);
//         group.scale.set(1.1, 1.1, 1.1);
//         group.rotation.set(0, 0.4, 6);

//         // Add group to scene
//         scene2.add(group);

//         // Set positions and rotations for specific children
//         if (group.children.length > 6) {
//             group.children[0].position.set(0.4, -0.85, -0.09);
//             group.children[0].rotation.set(1.5, 2.89, 4.15);
//             group.children[1].position.set(1, -1.65, -0.9);
//             group.children[1].rotation.set(1.05, 1.19, 0.9);
//             group.children[2].position.set(0.15, -0.2, 1.76);
//             group.children[2].rotation.set(1.8, 1.2, 0.86);
//             group.children[3].position.set(0.8, 1.5, 0.8);
//             group.children[3].rotation.set(1.2, 1.7, 2.1);
//             group.children[4].position.set(-0.45, -1.4, -1.02);
//             group.children[4].rotation.set(1.15, 1.12 , -1.2);
//             group.children[5].position.set(0.35, -0.2, -1.7);
//             group.children[5].rotation.set(0.5, 0.5, 0.5);
//             group.children[6].position.set(-1.28, 0.34, -0.26);
//             group.children[6].rotation.set(0.28, 0.75, 0.15);
//             group.children[7].position.set(-0.038, 0.98, -1.25);
//             group.children[7].rotation.set(1.65, 0.45, 1.5);
//         }

//         return Cubes;
//     }).catch((error) => {
//         console.error("Failed to load Cubes:", error);
//     });

//     // Lighting
//     const ambientLight = new THREE.AmbientLight(0x404040, 1);
//     scene2.add(ambientLight);
//     const SpotLight = new THREE.SpotLight(0xff0000, 4);
//     SpotLight.position.set(0, -2, -4);
//     scene2.add(SpotLight);

//     const PLight2 = new THREE.PointLight(0xfffff, 1);
//     scene2.add(PLight2); 

//     const directionalLight2 = new THREE.DirectionalLight(0x0000ff, 1);
//     directionalLight2.position.set(0, 0, 2).normalize();
//     scene2.add(directionalLight2);

//     const directionalLight3 = new THREE.DirectionalLight(0x0000ff, 1);
//     directionalLight3.position.set(0, -2, -0.25).normalize();
//     scene2.add(directionalLight3);

//     const textureEquirec = textureLoader.load('/Gallery/textures/neon.png');
//     textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
//     textureEquirec.encoding = THREE.sRGBEncoding;
//     scene2.environment = textureEquirec;
//     scene2.backgroundIntensity = 1;
//     scene2.backgroundBlurriness = 0; 
//     scene2.backgroundIntensity = 0;

// // Track mouse movement
// const mouse = { x: 0, y: 0 };

// window.addEventListener("mousemove", (event) => {
//     // Normalize mouse position (-0.5 to 0.5)
//     mouse.x = (event.clientX / window.innerWidth - 0.5) * 2;
//     mouse.y = -(event.clientY / window.innerHeight - 0.5) * 2;
// });
// let time = 0;
//     // Animation looptim
//     function animate1() {
//         cubesPromise.then((Cubes) => {
//             if (Cubes) {
              
//               group.rotation.y = mouse.x * 0.15; // Adjust sensitivity
//               group.rotation.x = -mouse.y * 0.085;

//               group.rotation.z = Math.sin(time) * 0.012; // Adjust range with *0.01
//               group.position.y = Math.sin(time * 0.5) * 0.1; // Adjust range with *0.1

//               time += 0.05;
//             } else {
//             }
//         });

//         requestAnimationFrame(animate1);
//         renderer2.render(scene2, camera1);
//     }// Scroll-triggered animation

    
//     function createReconstructionTimeline() {
//       const timeline = gsap.timeline();
    
//       gsap.killTweensOf("#ASub1v2"); 
//       initialTransforms.forEach((transform) => {
//         timeline.to(transform.object.position, {
//           duration: 2.25,
//           x: transform.initialPosition.x,
//           y: transform.initialPosition.y,
//           z: transform.initialPosition.z,
//           onUpdate: () => {
//             console.log("Position Updated");
//           },
//           ease: "power2.inOut"
//         }, 0);
    
//         timeline.to(transform.object.rotation, {
//           duration: 2.25,
//           x: transform.initialRotation.x,
//           y: transform.initialRotation.y,
//           z: transform.initialRotation.z,
//           ease: "power2.inOut"
//         }, 0);


//       });
    
//       return timeline;
//     }
    

// function reverseAnimationTimeline() {
//   const timeline = gsap.timeline();
//   gsap.killTweensOf("#ASub1v2"); 
//   const positions = [
//     { x: 0.4, y: -0.85, z: -0.09 },
//     { x: 1, y: -1.65, z: -0.9 },
//     { x: 0.15, y: -0.2, z: 1.76 },
//     { x: 0.8, y: 1.5, z: 0.8 },
//     { x: -0.45, y: -1.4, z: -1.02 },
//     { x: 0.35, y: -0.2, z: -1.7 },
//     { x: -1.28, y: 0.34, z: -0.26 },
//     { x: -0.038, y: 0.98, z: -1.25 }
//   ];

//   const rotations = [
//     { x: 1.5, y: 2.89, z: 4.15 },
//     { x: 1.05, y: 1.19, z: 0.9 },
//     { x: 1.8, y: 1.2, z: 0.86 },
//     { x: 1.2, y: 1.7, z: 2.1 },
//     { x: 1.15, y: 1.12, z: -1.2 },
//     { x: 0.5, y: 0.5, z: 0.5 },
//     { x: 0.28, y: 0.75, z: 0.15 },
//     { x: 1.65, y: 0.45, z: 1.5 }
//   ];

//   group.children.forEach((child, index) => {
//     timeline.to(child.position, {
//       duration: 1.5,
//       x: positions[index].x,
//       y: positions[index].y,
//       z: positions[index].z,
//       ease: "power2.inOut"
//     }, 0);

//     timeline.to(child.rotation, {
//       duration: 1.5,
//       x: rotations[index].x,
//       y: rotations[index].y,
//       z: rotations[index].z,
//       ease: "power2.inOut"
//     }, 0);
//   });

//   return timeline;
// }

// function replaceTextC() {
//   gsap.killTweensOf(".ASubTextV21, .ASubTextV22"); 
//   const text1 = document.querySelector(".ASubTextV21");
//   const text2 = document.querySelector(".ASubTextV22");

//   const timeline = gsap.timeline();
//   timeline.to(text1, { opacity: 0, duration: 0.5, y:-50, duration:1, ease: "power2.inOut" }, 0);
//   timeline.to(text2, { opacity: 1, duration: 0.5, y:0, duration:1, delay:0.6,  ease: "power2.inOut" }, 0);
// }

// function replaceTextCReverse() {
//   gsap.killTweensOf("#ASub1v2"); 
//   const text1 = document.querySelector(".ASubTextV21");
//   const text2 = document.querySelector(".ASubTextV22");

//   const timeline = gsap.timeline();
//   timeline.to(text1, { opacity: 1, duration: 0.5, y:0, duration:1, delay:0.6, ease: "power2.inOut" }, 0);
//   timeline.to(text2, { opacity: 0, duration: 0.5, y:50, duration:1,  ease: "power2.inOut", }, 0);
// }

// // Scroll-triggered animation
// gsap.registerPlugin(ScrollTrigger);


// function disableScroll() {
//   window.addEventListener('wheel', preventScroll, { passive: false });
//   window.addEventListener('keydown', preventKeys, { passive: false });
// }

// // Enable scrolling
// function enableScroll() {
//   window.removeEventListener('wheel', preventScroll);
//   window.removeEventListener('keydown', preventKeys);
// }

// // Prevent scroll events
// function preventScroll(e) {
//   e.preventDefault();
// }

// // Prevent arrow keys & spacebar from scrolling
// function preventKeys(e) {
//   if (["ArrowDown", "ArrowUp", "Space"].includes(e.key)) {
//     e.preventDefault();
//   }
// }

// // Function to detect snap completion
// let scrollTimeout;
// function handleSnapCompletion(self) {
//   clearTimeout(scrollTimeout); // Clear previous timeout
//   scrollTimeout = setTimeout(() => {
//     if (Math.abs(self.getVelocity()) < 0.1) { 
//       enableScroll();  // Enable scrolling when snap is fully complete
//     } else {
//       handleSnapCompletion(self); // Check again if still moving
//     }
//   }, 100); // Delay check for smooth detection
// }
// // Function to track snap state
// let isSnapping = false;

// gsap.registerPlugin(ScrollTrigger);

// const MainCanvas = document.getElementById("ASub1v2");

// ScrollTrigger.create({
//   trigger: MainCanvas,
//   start: "center-=20% center",
//   end: "bottom bottom",
//   pinSpacing: false,
//   snap: {
//     snapTo: 1 / 1, // Snap to each section
//     duration: { min: 0.2, max: 0.75 }, // Smooth snapping
//     ease: "power2.inOut",
//   },

//   onEnter: () => {
//     createReconstructionTimeline();
//     replaceTextC();
//   },
//   onEnterBack: () => {
//     reverseAnimationTimeline();
//     replaceTextCReverse();
//   },
//   onLeaveBack: () => {
//     reverseAnimationTimeline();
//     replaceTextCReverse();
//   },

//   // When scroll starts (including snap)
//   onUpdate: (self) => {
//     if (Math.abs(self.getVelocity()) > 5) {
//       disableScroll(); // Lock scrolling when moving
//     }
//     handleSnapCompletion(self); // Wait for snap to finish
//   },
  

// });


//   // Call once to set the initial size
//   function onWindowResize1() {
//     const CanvasCube = document.getElementById("ASub2ThreeJs");
//     camera1.aspect = CanvasCube.clientWidth / CanvasCube.clientHeight;
//     camera1.updateProjectionMatrix();

//     renderer2.setSize(CanvasCube.clientWidth, CanvasCube.clientHeight);
//     } 

//     onWindowResize1();
//     createReconstructionTimeline();
//     animate1();
// });

// // Function to access Cubes
// function getCubes() {
//     return cubesPromise;
// }

