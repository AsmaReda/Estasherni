/**
 * د. أسماء رضا - أخصائية علاج طبيعي وتأهيل واستشارات نفسية
 * Main JavaScript (script.js)
 * Vanilla ES6+ - UI interactions, mobile navigation, active section observer,
 * section reveal animations (IntersectionObserver), floating WhatsApp FAB,
 * and client-side booking system with validation, localStorage logging, and WhatsApp integration.
 */

// Global timer reference for the success toast
let toastDismissTimer = null;

/**
 * Validates Egyptian mobile phone numbers:
 * Must be 11 digits starting with 01 followed by 0, 1, 2, or 5
 * @param {string} phone
 * @returns {boolean}
 */
function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const regex = /^01[0125][0-9]{8}$/;
  return regex.test(phone.trim());
}

/**
 * Constructs the pre-filled WhatsApp message link with encoded booking details
 * @param {Object} data - Booking data object
 * @returns {string} - WhatsApp URL
 */
function buildWhatsAppLink(data) {
  const message = `مرحباً دكتورة أسماء، أنا ${data.name} حجزت موعد يوم ${data.date} الساعة ${data.time} في تخصص ${data.specialty}`;
  return `https://wa.me/201017782403?text=${encodeURIComponent(message)}`;
}

/**
 * Displays the slide-down success toast notification with booking details & action buttons
 * @param {Object} data - Booking data object { name, phone, specialty, date, time, notes }
 */
function showSuccessToast(data) {
  const toast = document.getElementById('bookingToast');
  const toastTitle = document.getElementById('toastTitle');
  const toastMessage = document.getElementById('toastMessage');
  const toastBadgeText = document.getElementById('toastBadgeText');
  const toastWhatsAppBtn = document.getElementById('toastWhatsAppBtn');
  const toastCloseBtn = document.getElementById('toastCloseBtn');
  const toastDismissBtn = document.getElementById('toastDismissBtn');

  if (!toast) return;

  // Clear any existing dismissal timer
  if (toastDismissTimer) {
    clearTimeout(toastDismissTimer);
    toastDismissTimer = null;
  }

  // Populate toast content
  if (toastTitle) {
    toastTitle.textContent = 'تم الحجز بنجاح';
  }

  if (toastBadgeText) {
    toastBadgeText.textContent = `تم الحجز: ${data.date}`;
  }

  if (toastMessage) {
    toastMessage.textContent = `شكراً ${data.name}، تم استلام طلب الحجز بتاريخ ${data.date} الساعة ${data.time}. برجاء التواصل مع الدكتورة على واتساب لتأكيد التفاصيل.`;
  }

  if (toastWhatsAppBtn) {
    toastWhatsAppBtn.href = buildWhatsAppLink(data);
  }

  // Show toast with slide-down animation
  toast.classList.add('active');
  toast.setAttribute('aria-hidden', 'false');

  // Dismiss helper
  const hideToast = () => {
    toast.classList.remove('active');
    toast.setAttribute('aria-hidden', 'true');
    if (toastDismissTimer) {
      clearTimeout(toastDismissTimer);
      toastDismissTimer = null;
    }
  };

  // Close button handlers
  if (toastCloseBtn) {
    toastCloseBtn.onclick = hideToast;
  }
  if (toastDismissBtn) {
    toastDismissBtn.onclick = hideToast;
  }

  // Auto-dismiss after 15 seconds
  toastDismissTimer = setTimeout(hideToast, 15000);
}

/**
 * Initializes the booking form, sets date bounds, attaches validation and submit handlers
 */
function initBookingForm() {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  const nameInput = document.getElementById('bookingName');
  const phoneInput = document.getElementById('bookingPhone');
  const specialtySelect = document.getElementById('bookingSpecialty');
  const dateInput = document.getElementById('bookingDate');
  const timeSelect = document.getElementById('bookingTime');
  const notesInput = document.getElementById('bookingNotes');

  const nameError = document.getElementById('nameError');
  const phoneError = document.getElementById('phoneError');
  const specialtyError = document.getElementById('specialtyError');
  const dateError = document.getElementById('dateError');
  const timeError = document.getElementById('timeError');

  // 1. Calculate today's date formatted as YYYY-MM-DD
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayFormatted = `${year}-${month}-${day}`;
  const maxDate = '2035-12-31';

  // Set min & max attributes on date input
  if (dateInput) {
    dateInput.min = todayFormatted;
    dateInput.max = maxDate;
  }

  // Helper to show/hide field errors
  const setError = (inputEl, errorEl, message) => {
    if (inputEl) inputEl.classList.add('input-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
  };

  const clearError = (inputEl, errorEl) => {
    if (inputEl) inputEl.classList.remove('input-error');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
  };

  // Real-time input listeners to clear errors as user types
  nameInput?.addEventListener('input', () => clearError(nameInput, nameError));
  phoneInput?.addEventListener('input', () => {
    // Sanitize non-digits
    phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 11);
    clearError(phoneInput, phoneError);
  });
  specialtySelect?.addEventListener('change', () => clearError(specialtySelect, specialtyError));
  dateInput?.addEventListener('change', () => clearError(dateInput, dateError));
  timeSelect?.addEventListener('change', () => clearError(timeSelect, timeError));

  // Form submit handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let isValid = true;
    let firstInvalidInput = null;

    // Reset previous errors
    clearError(nameInput, nameError);
    clearError(phoneInput, phoneError);
    clearError(specialtySelect, specialtyError);
    clearError(dateInput, dateError);
    clearError(timeSelect, timeError);

    // 1. Validate Name (min 3 chars)
    const nameVal = nameInput ? nameInput.value.trim() : '';
    if (!nameVal || nameVal.length < 3) {
      setError(nameInput, nameError, 'يرجى إدخال الاسم بالكامل (3 أحرف على الأقل)');
      isValid = false;
      if (!firstInvalidInput) firstInvalidInput = nameInput;
    }

    // 2. Validate Phone (Egyptian 11 digits: /^01[0125][0-9]{8}$/)
    const phoneVal = phoneInput ? phoneInput.value.trim() : '';
    if (!validatePhone(phoneVal)) {
      setError(phoneInput, phoneError, 'يرجى إدخال رقم موبايل مصري صحيح مكون من 11 رقماً يبدأ بـ 01 (مثل 01017782403)');
      isValid = false;
      if (!firstInvalidInput) firstInvalidInput = phoneInput;
    }

    // 3. Validate Specialty
    const specialtyVal = specialtySelect ? specialtySelect.value : '';
    if (!specialtyVal) {
      setError(specialtySelect, specialtyError, 'يرجى اختيار التخصص الطبي المطلوب');
      isValid = false;
      if (!firstInvalidInput) firstInvalidInput = specialtySelect;
    }

    // 4. Validate Date (Today until 2035-12-31)
    const dateVal = dateInput ? dateInput.value : '';
    if (!dateVal) {
      setError(dateInput, dateError, 'يرجى تحديد تاريخ موعد الحجز');
      isValid = false;
      if (!firstInvalidInput) firstInvalidInput = dateInput;
    } else if (dateVal < todayFormatted) {
      setError(dateInput, dateError, 'لا يمكن اختيار تاريخ سابق لليوم');
      isValid = false;
      if (!firstInvalidInput) firstInvalidInput = dateInput;
    } else if (dateVal > maxDate) {
      setError(dateInput, dateError, 'التاريخ المحدد خارج النطاق المسموح به (حتى 31 ديسمبر 2035)');
      isValid = false;
      if (!firstInvalidInput) firstInvalidInput = dateInput;
    }

    // 5. Validate Time Slot
    const timeVal = timeSelect ? timeSelect.value : '';
    if (!timeVal) {
      setError(timeSelect, timeError, 'يرجى اختيار الوقت المناسب للموعد');
      isValid = false;
      if (!firstInvalidInput) firstInvalidInput = timeSelect;
    }

    // Focus first invalid element if any
    if (!isValid) {
      firstInvalidInput?.focus();
      return;
    }

    // Booking data payload
    const bookingData = {
      id: 'BK-' + Date.now(),
      name: nameVal,
      phone: phoneVal,
      specialty: specialtyVal,
      date: dateVal,
      time: timeVal,
      notes: notesInput ? notesInput.value.trim() : '',
      createdAt: new Date().toISOString()
    };

    // Save to localStorage as a fallback log
    try {
      const existingLogs = JSON.parse(localStorage.getItem('bookings') || '[]');
      existingLogs.push(bookingData);
      localStorage.setItem('bookings', JSON.stringify(existingLogs));
    } catch (err) {
      console.warn('LocalStorage error while saving booking:', err);
    }

    // Show success notification toast
    showSuccessToast(bookingData);

    // Reset form and reset fields
    form.reset();
  });
}

/**
 * Initializes site layout & navigation interactions
 */
function initNavigation() {
  const header = document.getElementById('header');
  const mobileToggle = document.getElementById('mobileToggle');
  const primaryNav = document.getElementById('primaryNav');
  const navLinks = document.querySelectorAll('.nav-link');

  // Mobile Menu Toggle
  if (mobileToggle && primaryNav) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = primaryNav.classList.toggle('open');
      mobileToggle.classList.toggle('active', isOpen);
      mobileToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close mobile menu on click outside
    document.addEventListener('click', (event) => {
      if (
        primaryNav.classList.contains('open') &&
        !primaryNav.contains(event.target) &&
        !mobileToggle.contains(event.target)
      ) {
        primaryNav.classList.remove('open');
        mobileToggle.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && primaryNav.classList.contains('open')) {
        primaryNav.classList.remove('open');
        mobileToggle.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileToggle.focus();
      }
    });
  }

  // Smooth close mobile menu on nav link click
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (primaryNav && primaryNav.classList.contains('open')) {
        primaryNav.classList.remove('open');
        mobileToggle.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Header shadow on scroll (triggered after 50px)
  const updateHeaderShadow = () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', updateHeaderShadow, { passive: true });
  updateHeaderShadow();

  // Active navigation highlight on scroll via IntersectionObserver
  const sections = document.querySelectorAll('section[id]');
  if ('IntersectionObserver' in window && sections.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: '-30% 0px -40% 0px',
      threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const activeId = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            if (link.getAttribute('href') === `#${activeId}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach((section) => sectionObserver.observe(section));
  }
}

/**
 * Adds the .reveal-section class to every section and major content block,
 * then uses IntersectionObserver to toggle .is-visible for fade-in + slide animation.
 */
function initScrollReveal() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: make everything visible immediately
    document.querySelectorAll('.reveal-section').forEach(el => el.classList.add('is-visible'));
    return;
  }

  const revealEls = document.querySelectorAll('.reveal-section');
  if (revealEls.length === 0) return;

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Once revealed, stop observing to save resources
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.1
    }
  );

  revealEls.forEach((el) => revealObserver.observe(el));
}

/**
 * Makes the "احجز الآن" CTA button in the navbar scroll to #booking
 * and auto-focus the first visible form input after scroll animation.
 */
function initBookingCtaFocus() {
  const cta = document.getElementById('navBookingCta');
  const bookingSection = document.getElementById('booking');
  const firstInput = document.getElementById('bookingName');

  if (!cta || !bookingSection || !firstInput) return;

  cta.addEventListener('click', (e) => {
    e.preventDefault();
    bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Wait for smooth scroll to settle then focus
    setTimeout(() => {
      firstInput.focus({ preventScroll: true });
    }, 600);
  });
}

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initBookingForm();
  initScrollReveal();
  initBookingCtaFocus();
});
