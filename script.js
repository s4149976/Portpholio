import { sliderData, personalSliderData } from "./sliderData.js";

const config = {
  scrollSpeed: 1.5,
  lerpFactor: 0.08,
  maxVelocity: 100,
};

function createSlider(containerSelector, data) {
  const sliderElement = document.querySelector(containerSelector);
  if (!sliderElement || !data || data.length === 0) return;

  const totalSlides = data.length;
  const track = sliderElement.querySelector(".slide-track");

  let bgOverlay = document.querySelector("#hover-bg-overlay");
  if (!bgOverlay) {
    bgOverlay = document.createElement("div");
    bgOverlay.id = "hover-bg-overlay";
    document.body.appendChild(bgOverlay);
  }

  const state = {
    currentX: 0,
    targetX: 0,
    lastCurrentX: 0,
    singleLoopWidth: 0,
    slides: [],
    isDragging: false,
    startX: 0,
    lastMouseX: 0,
    dragDistance: 0,
    isMoving: false,
    velocity: 0,
    hasActuallyDragged: false,
    isMobile: false,
  };

  function checkMobile() {
    state.isMobile = window.innerWidth < 1000;
  }

  function createSlideElement(index) {
    const slide = document.createElement("div");
    slide.classList.add("slide");

    if (state.isMobile) {
      slide.style.height = "350px";
    }

    const slideImage = document.createElement("div");
    slideImage.classList.add("slide-image");

    const img = document.createElement("img");
    const dataIndex = index % totalSlides;
    img.src = data[dataIndex].img;
    img.alt = data[dataIndex].title;

    slideImage.appendChild(img);

    const overlay = document.createElement("div");
    overlay.classList.add("slide-overlay");

    const title = document.createElement("p");
    title.textContent = data[dataIndex].title;

    const arrow = document.createElement("div");
    arrow.innerHTML = `<svg viewBox="0 0 24 24"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>`;

    overlay.appendChild(title);
    overlay.appendChild(arrow);

    slide.appendChild(slideImage);
    slide.appendChild(overlay);

    slide.addEventListener("mouseenter", () => {
      if (!state.isDragging) {
        bgOverlay.style.backgroundImage = `url('${data[dataIndex].img}')`;
        bgOverlay.classList.add("active");
      }
    });

    slide.addEventListener("mouseleave", () => {
      bgOverlay.classList.remove("active");
    });

    // Open image directly for bottom slider (.slider-1), open project URL for top slider (.slider)
    slide.addEventListener("click", () => {
      if (state.dragDistance < 5) {
        const isBottomSlider = containerSelector.includes("slider-1");
        const targetDestination = isBottomSlider ? data[dataIndex].img : data[dataIndex].url;
        
        window.open(targetDestination, "_blank", "noopener,noreferrer");
      }
    });

    return slide;
  }

  function calculateLoopWidth() {
    let loopWidth = 0;
    for (let i = 0; i < totalSlides; i++) {
      if (state.slides[i]) {
        const style = window.getComputedStyle(state.slides[i]);
        const marginLeft = parseFloat(style.marginLeft) || 0;
        const marginRight = parseFloat(style.marginRight) || 0;
        loopWidth += state.slides[i].getBoundingClientRect().width + marginLeft + marginRight;
      }
    }
    state.singleLoopWidth = loopWidth;
  }

  function initializeSlides() {
    track.innerHTML = "";
    state.slides = [];

    checkMobile();

    const totalCopies = 6;
    const slideCount = totalSlides * totalCopies;

    for (let i = 0; i < slideCount; i++) {
      const slide = createSlideElement(i);
      track.appendChild(slide);
      state.slides.push(slide);
    }

    requestAnimationFrame(() => {
      calculateLoopWidth();

      if (state.singleLoopWidth > 0) {
        const startOffset = -state.singleLoopWidth * 2;
        state.currentX = startOffset;
        state.targetX = startOffset;
        state.lastCurrentX = startOffset;
      }
    });
  }

  function updateSlidePositions() {
    if (!state.singleLoopWidth) return;

    if (state.currentX > -state.singleLoopWidth) {
      state.currentX -= state.singleLoopWidth;
      state.targetX -= state.singleLoopWidth;
    } else if (state.currentX < -state.singleLoopWidth * 3) {
      state.currentX += state.singleLoopWidth;
      state.targetX += state.singleLoopWidth;
    }

    track.style.transform = `translateX(${state.currentX}px)`;
  }

  function updateParallax() {
    const viewportCenter = window.innerWidth / 2;

    state.slides.forEach((slide) => {
      const img = slide.querySelector("img");
      const slideRect = slide.getBoundingClientRect();

      if (slideRect.right < -500 || slideRect.left > window.innerWidth + 500) {
        return;
      }

      const slideCenter = slideRect.left + slideRect.width / 2;
      const distanceFromCenter = slideCenter - viewportCenter;
      const parallaxOffset = distanceFromCenter * -0.15;

      img.style.transform = `translateX(${parallaxOffset}px) scale(1.15)`;
    });
  }

  function updateMovingState() {
    state.velocity = Math.abs(state.currentX - state.lastCurrentX);
    state.lastCurrentX = state.currentX;

    state.isMoving = state.velocity > 0.1 || state.isDragging;
    sliderElement.style.setProperty("--slider-moving", state.isMoving ? "1" : "0");
  }

  function animate() {
    state.currentX += (state.targetX - state.currentX) * config.lerpFactor;

    updateMovingState();
    updateSlidePositions();
    updateParallax();

    requestAnimationFrame(animate);
  }

  function handleWheel(e) {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      const delta = Math.min(Math.max(e.deltaY, -config.maxVelocity), config.maxVelocity);
      state.targetX -= delta * config.scrollSpeed;
    }
  }

  function handleMouseDown(e) {
    state.isDragging = true;
    state.startX = e.clientX;
    state.lastMouseX = e.clientX;
    state.dragDistance = 0;
    state.hasActuallyDragged = false;
    bgOverlay.classList.remove("active");
  }

  function handleMouseMove(e) {
    if (!state.isDragging) return;

    const deltaX = e.clientX - state.lastMouseX;
    state.lastMouseX = e.clientX;
    state.dragDistance += Math.abs(deltaX);

    if (state.dragDistance > 5) {
      state.hasActuallyDragged = true;
    }

    state.targetX += deltaX * 1.5;
  }

  function handleMouseUp() {
    state.isDragging = false;
  }

  function initializeEventListeners() {
    sliderElement.addEventListener("wheel", handleWheel, { passive: false });

    sliderElement.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    sliderElement.addEventListener("touchstart", (e) => handleMouseDown(e.touches[0]));
    window.addEventListener("touchmove", (e) => handleMouseMove(e.touches[0]));
    window.addEventListener("touchend", handleMouseUp);

    window.addEventListener("resize", () => {
      initializeSlides();
    });
  }

  initializeSlides();
  initializeEventListeners();
  animate();
}

document.addEventListener("DOMContentLoaded", () => {
  createSlider(".slider", sliderData);
  createSlider(".slider-1", personalSliderData);
});