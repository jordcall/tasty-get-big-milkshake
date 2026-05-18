const slides = Array.from(document.querySelectorAll("[data-slide]"));
const slideStage = document.querySelector("[data-slide-stage]");
const counter = document.querySelector("[data-slide-counter]");
const progressFill = document.querySelector("[data-progress-fill]");
const backButton = document.querySelector("[data-slide-back]");
const continueHint = document.querySelector("[data-continue-hint]");
const skipButton = document.querySelector("[data-skip-to-product]");
const productSection = document.querySelector("#product");
const modal = document.querySelector("[data-modal]");
const openModalButton = document.querySelector("[data-open-modal]");
const closeModalButtons = Array.from(document.querySelectorAll("[data-close-modal]"));
const modalPanel = document.querySelector(".modal-panel");

let currentSlide = 0;
const revealCounts = slides.map(() => 0);
let lastFocusedElement = null;

function getRevealLines(slide) {
  return Array.from(slide.querySelectorAll("[data-reveal-line]"));
}

function updateSlide() {
  slides.forEach((slide, index) => {
    const isActiveSlide = index === currentSlide;
    const revealLines = getRevealLines(slide);

    slide.classList.toggle("is-active", isActiveSlide);
    slide.setAttribute("aria-hidden", String(!isActiveSlide));

    revealLines.forEach((line, lineIndex) => {
      const isRevealed = lineIndex < revealCounts[index];

      line.classList.toggle("is-revealed", isRevealed);
      line.setAttribute("aria-hidden", String(!isActiveSlide || !isRevealed));
    });
  });

  const currentRevealCount = getRevealLines(slides[currentSlide]).length;
  const hasMoreReveals = revealCounts[currentSlide] < currentRevealCount;
  const isFinalSlide = currentSlide === slides.length - 1;

  counter.textContent = `${currentSlide + 1} / ${slides.length}`;
  progressFill.style.width = `${((currentSlide + 1) / slides.length) * 100}%`;
  backButton.classList.toggle("is-visible", currentSlide > 0);
  backButton.disabled = currentSlide === 0;
  continueHint.textContent = hasMoreReveals
    ? "Click/tap to reveal"
    : isFinalSlide
      ? "Click/tap to see product"
      : "Click/tap to continue";
}

function goToProduct() {
  productSection.scrollIntoView({ behavior: "smooth", block: "start" });
  productSection.focus({ preventScroll: true });
}

function advanceSlide() {
  const revealLines = getRevealLines(slides[currentSlide]);

  if (revealCounts[currentSlide] < revealLines.length) {
    revealCounts[currentSlide] += 1;
    updateSlide();
    return;
  }

  if (currentSlide >= slides.length - 1) {
    goToProduct();
    return;
  }

  currentSlide += 1;
  updateSlide();
}

function retreatSlide() {
  if (revealCounts[currentSlide] > 0) {
    revealCounts[currentSlide] -= 1;
    updateSlide();
    return;
  }

  if (currentSlide === 0) {
    return;
  }

  currentSlide -= 1;
  updateSlide();
}

function openModal() {
  lastFocusedElement = document.activeElement;
  modal.hidden = false;
  document.body.classList.add("modal-open");

  const closeButton = modal.querySelector("[data-close-modal]");
  closeButton.focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.classList.remove("modal-open");

  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

function keepFocusInsideModal(event) {
  if (modal.hidden || event.key !== "Tab") {
    return;
  }

  const focusable = Array.from(
    modal.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")
  ).filter((element) => !element.disabled);

  if (!focusable.length) {
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

slideStage.addEventListener("click", advanceSlide);
backButton.addEventListener("click", retreatSlide);
skipButton.addEventListener("click", goToProduct);
openModalButton.addEventListener("click", openModal);

closeModalButtons.forEach((button) => {
  button.addEventListener("click", closeModal);
});

document.addEventListener("keydown", (event) => {
  if (!modal.hidden) {
    if (event.key === "Escape") {
      closeModal();
    }

    keepFocusInsideModal(event);
    return;
  }

  if (event.key === " " || event.key === "ArrowRight") {
    event.preventDefault();
    advanceSlide();
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    retreatSlide();
  }
});

modalPanel.addEventListener("click", (event) => {
  event.stopPropagation();
});

updateSlide();
