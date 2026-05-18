const WAITLIST_ENDPOINT = "https://formspree.io/f/FORM_ID";
const PRODUCT_NAME = "TASTY GET BIG MILKSHAKE";
const SELECTED_FLAVOR = "Chocolate";
const SELECTED_PACK_SIZE = "12-pack";
const PRICE_SHOWN = "$XX";
const PAGE_VARIANT = "opener-v1";

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
const availabilitySteps = Array.from(document.querySelectorAll("[data-availability-step]"));
const continueAvailabilityButton = document.querySelector("[data-continue-availability]");
const quantitySelect = document.querySelector("[data-quantity-select]");
const waitlistForm = document.querySelector("[data-waitlist-form]");
const emailInput = document.querySelector("[data-email-input]");
const formMessage = document.querySelector("[data-form-message]");
const submitWaitlistButton = document.querySelector("[data-submit-waitlist]");
const successHeading = document.querySelector("#success-title");
const summaryProduct = document.querySelector("[data-summary-product]");
const summaryFlavor = document.querySelector("[data-summary-flavor]");
const summaryPackSize = document.querySelector("[data-summary-pack-size]");
const summaryPrice = document.querySelector("[data-summary-price]");

let currentSlide = 0;
const revealCounts = slides.map(() => 0);
let lastFocusedElement = null;

function trackEvent(name, data = {}) {
  console.log("[event]", name, data);

  if (typeof window.gtag === "function") {
    window.gtag("event", name, data);
  }
}

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

function getAvailabilityEventData() {
  return {
    product_name: PRODUCT_NAME,
    selected_flavor: SELECTED_FLAVOR,
    selected_pack_size: SELECTED_PACK_SIZE,
    selected_quantity: quantitySelect ? quantitySelect.value : "1",
    price_shown: PRICE_SHOWN,
    page_variant: PAGE_VARIANT,
  };
}

function getUtmParams() {
  const params = new URLSearchParams(window.location.search);

  return {
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
    utm_content: params.get("utm_content") || "",
    utm_term: params.get("utm_term") || "",
  };
}

function setHiddenValue(selector, value) {
  const field = waitlistForm ? waitlistForm.querySelector(selector) : null;

  if (field) {
    field.value = value;
  }
}

function updateProductSummary() {
  if (summaryProduct) {
    summaryProduct.textContent = PRODUCT_NAME;
  }

  if (summaryFlavor) {
    summaryFlavor.textContent = SELECTED_FLAVOR;
  }

  if (summaryPackSize) {
    summaryPackSize.textContent = SELECTED_PACK_SIZE;
  }

  if (summaryPrice) {
    summaryPrice.textContent = PRICE_SHOWN;
  }
}

function updateWaitlistHiddenFields() {
  const utmParams = getUtmParams();

  setHiddenValue("[data-hidden-product-name]", PRODUCT_NAME);
  setHiddenValue("[data-hidden-selected-flavor]", SELECTED_FLAVOR);
  setHiddenValue("[data-hidden-selected-pack-size]", SELECTED_PACK_SIZE);
  setHiddenValue("[data-hidden-selected-quantity]", quantitySelect ? quantitySelect.value : "1");
  setHiddenValue("[data-hidden-price-shown]", PRICE_SHOWN);
  setHiddenValue("[data-hidden-page-variant]", PAGE_VARIANT);
  setHiddenValue("[data-hidden-utm-source]", utmParams.utm_source);
  setHiddenValue("[data-hidden-utm-medium]", utmParams.utm_medium);
  setHiddenValue("[data-hidden-utm-campaign]", utmParams.utm_campaign);
  setHiddenValue("[data-hidden-utm-content]", utmParams.utm_content);
  setHiddenValue("[data-hidden-utm-term]", utmParams.utm_term);
  setHiddenValue("[data-hidden-submitted-at]", new Date().toISOString());
}

function setFormMessage(message, type = "") {
  if (!formMessage) {
    return;
  }

  formMessage.textContent = message;
  formMessage.classList.toggle("is-error", type === "error");
  formMessage.classList.toggle("is-success", type === "success");
}

function showAvailabilityStep(stepName) {
  availabilitySteps.forEach((step) => {
    step.hidden = step.dataset.availabilityStep !== stepName;
  });

  if (stepName === "confirm") {
    modalPanel.setAttribute("aria-labelledby", "availability-modal-title");
    modalPanel.setAttribute("aria-describedby", "availability-modal-description");
  }

  if (stepName === "waitlist") {
    modalPanel.setAttribute("aria-labelledby", "waitlist-title");
    modalPanel.setAttribute("aria-describedby", "waitlist-description");
    updateWaitlistHiddenFields();
    trackEvent("out_of_stock_viewed", getAvailabilityEventData());

    window.setTimeout(() => {
      if (emailInput) {
        emailInput.focus();
      }
    }, 0);
  }

  if (stepName === "success") {
    modalPanel.setAttribute("aria-labelledby", "success-title");
    modalPanel.setAttribute("aria-describedby", "success-description");

    window.setTimeout(() => {
      if (successHeading) {
        successHeading.focus();
      }
    }, 0);
  }
}

function resetAvailabilityFlow() {
  updateProductSummary();

  if (quantitySelect) {
    quantitySelect.value = "1";
  }

  if (waitlistForm) {
    waitlistForm.reset();
  }

  if (submitWaitlistButton) {
    submitWaitlistButton.disabled = false;
    submitWaitlistButton.textContent = "Notify me";
  }

  setFormMessage("");
  updateWaitlistHiddenFields();
  showAvailabilityStep("confirm");
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
  resetAvailabilityFlow();
  modal.hidden = false;
  document.body.classList.add("modal-open");
  trackEvent("availability_opened", getAvailabilityEventData());

  const closeButton = modal.querySelector("[data-close-modal]");
  closeButton.focus();
}

function closeModal() {
  if (modal.hidden) {
    return;
  }

  modal.hidden = true;
  document.body.classList.remove("modal-open");
  trackEvent("availability_closed", getAvailabilityEventData());

  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

function handleQuantityChange() {
  updateWaitlistHiddenFields();
  trackEvent("quantity_changed", getAvailabilityEventData());
}

function continueToOutOfStock() {
  updateWaitlistHiddenFields();
  trackEvent("continue_to_out_of_stock", getAvailabilityEventData());
  showAvailabilityStep("waitlist");
}

async function submitWaitlistForm(event) {
  event.preventDefault();

  if (!waitlistForm.reportValidity()) {
    return;
  }

  updateWaitlistHiddenFields();
  setFormMessage("");

  if (WAITLIST_ENDPOINT.includes("FORM_ID")) {
    const message = "Waitlist form is not configured yet. Replace FORM_ID with the real Formspree form ID.";
    setFormMessage(message, "error");
    trackEvent("waitlist_submit_failed", {
      ...getAvailabilityEventData(),
      reason: "placeholder_endpoint",
    });
    return;
  }

  if (submitWaitlistButton) {
    submitWaitlistButton.disabled = true;
    submitWaitlistButton.textContent = "Submitting...";
  }

  try {
    const response = await fetch(WAITLIST_ENDPOINT, {
      method: "POST",
      body: new FormData(waitlistForm),
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Form submission failed with status ${response.status}`);
    }

    trackEvent("waitlist_submitted", getAvailabilityEventData());
    showAvailabilityStep("success");
  } catch (error) {
    setFormMessage("Something went wrong. Please try again in a moment.", "error");
    trackEvent("waitlist_submit_failed", {
      ...getAvailabilityEventData(),
      reason: error.message,
    });

    if (submitWaitlistButton) {
      submitWaitlistButton.disabled = false;
      submitWaitlistButton.textContent = "Notify me";
    }
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
continueAvailabilityButton.addEventListener("click", continueToOutOfStock);
quantitySelect.addEventListener("change", handleQuantityChange);
waitlistForm.addEventListener("submit", submitWaitlistForm);

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
