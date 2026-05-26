/* ==========================================================================
   GxP COMPLIANCE GROUP — V2 RUNTIME
   Smooth transitions, scroll reveals, slideshow, counters, form validation
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* ----------------------------------------------------------------------
       1. Template Switcher
       ---------------------------------------------------------------------- */
    const sandboxButtons = document.querySelectorAll('.sandbox-btn');

    sandboxButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedTemplate = btn.getAttribute('data-set-template');
            sandboxButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.body.setAttribute('data-selected-template', selectedTemplate);

            // Re-trigger reveals after template flip so visible blocks animate nicely
            document.querySelectorAll('.reveal-on-scroll, .reveal-fade-up').forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    el.classList.add('is-visible');
                }
            });
        });
    });

    /* ----------------------------------------------------------------------
       2. View Router with Fade Transition
       ---------------------------------------------------------------------- */
    const viewTriggers = document.querySelectorAll('.frame-view-trigger');
    const pageViews = document.querySelectorAll('.page-view');
    const canvasWrapper = document.getElementById('viewCanvasWrapper');

    viewTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            const requestedView = trigger.getAttribute('data-target-view');
            const targetHref = trigger.getAttribute('href');

            // Hash links inside the active home view → just smooth-scroll
            if (targetHref && targetHref.startsWith('#') && requestedView === 'home') {
                const currentView = document.querySelector('.page-view.active');
                if (currentView && currentView.id === 'view-home') {
                    return; // browser will handle the hash scroll
                }
            }

            e.preventDefault();
            canvasWrapper.classList.add('canvas-fade-out');

            setTimeout(() => {
                viewTriggers.forEach(t => {
                    if (t.getAttribute('data-target-view') === requestedView) {
                        t.classList.add('active');
                    } else {
                        t.classList.remove('active');
                    }
                });

                pageViews.forEach(view => {
                    view.classList.toggle('active', view.id === `view-${requestedView}`);
                });

                canvasWrapper.classList.remove('canvas-fade-out');

                if (targetHref && targetHref.startsWith('#') && targetHref.length > 1) {
                    const target = document.querySelector(targetHref);
                    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 220);
        });
    });

    /* ----------------------------------------------------------------------
       3. Service Tabs
       ---------------------------------------------------------------------- */
    const tabTriggers = document.querySelectorAll('.tab-trigger');
    const matrixPanels = document.querySelectorAll('.matrix-panel');

    tabTriggers.forEach(tabBtn => {
        tabBtn.addEventListener('click', () => {
            const targetScope = tabBtn.getAttribute('data-matrix');

            tabTriggers.forEach(t => t.classList.remove('active'));
            matrixPanels.forEach(p => p.classList.remove('active'));

            tabBtn.classList.add('active');
            const targetPanel = document.getElementById(`panel-${targetScope}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
                // Force image reflow to avoid blank panel image on first switch
                const img = targetPanel.querySelector('.panel-context-img');
                if (img) {
                    img.style.display = 'none';
                    void img.offsetHeight;
                    img.style.display = '';
                }
            }
        });
    });

    /* ----------------------------------------------------------------------
       4. Scroll Reveals — IntersectionObserver
       ---------------------------------------------------------------------- */
    const revealNodes = document.querySelectorAll('.reveal-on-scroll, .reveal-fade-up');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        revealNodes.forEach(node => observer.observe(node));
    } else {
        revealNodes.forEach(node => node.classList.add('is-visible'));
    }

    /* ----------------------------------------------------------------------
       5. Animated Slideshow with Indicators
       ---------------------------------------------------------------------- */
    const slides = document.querySelectorAll('.about-slideshow-container .about-slide');
    const indicatorWrap = document.querySelector('.slideshow-indicators');

    if (slides.length > 0) {
        // Build dots
        if (indicatorWrap) {
            slides.forEach((_, i) => {
                const dot = document.createElement('span');
                dot.classList.add('dot');
                if (i === 0) dot.classList.add('active');
                dot.addEventListener('click', () => showSlide(i));
                indicatorWrap.appendChild(dot);
            });
        }
        const dots = indicatorWrap ? indicatorWrap.querySelectorAll('.dot') : [];

        let currentIndex = 0;
        let slideTimer;

        function showSlide(idx) {
            slides[currentIndex].classList.remove('active');
            if (dots[currentIndex]) dots[currentIndex].classList.remove('active');
            currentIndex = (idx + slides.length) % slides.length;
            slides[currentIndex].classList.add('active');
            if (dots[currentIndex]) dots[currentIndex].classList.add('active');
            resetTimer();
        }

        function resetTimer() {
            clearInterval(slideTimer);
            slideTimer = setInterval(() => showSlide(currentIndex + 1), 4200);
        }
        resetTimer();
    }

    /* ----------------------------------------------------------------------
       6. Metric Counter Animation
       ---------------------------------------------------------------------- */
    const counters = document.querySelectorAll('[data-count-target]');

    if ('IntersectionObserver' in window && counters.length > 0) {
        const counterObs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    runCounter(entry.target);
                    counterObs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(c => counterObs.observe(c));
    }

    function runCounter(el) {
        const target = parseInt(el.getAttribute('data-count-target'), 10) || 0;
        const duration = 1400;
        const startTime = performance.now();

        function tick(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(target * eased);
            if (progress < 1) requestAnimationFrame(tick);
            else el.textContent = target;
        }
        requestAnimationFrame(tick);
    }

    /* ----------------------------------------------------------------------
       7. Form Validation with Micro-Shake
       ---------------------------------------------------------------------- */
    const form = document.getElementById('interactiveInquiryForm');
    const formCard = document.getElementById('formInteractionTarget');

    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();

            // Reset prior error states
            const allGroups = form.querySelectorAll('.input-field-group');
            allGroups.forEach(group => {
                group.classList.remove('field-state-error', 'element-shake-event');
                const errNode = group.querySelector('.field-error-message');
                if (errNode) errNode.textContent = '';
            });
            formCard.classList.remove('holistic-shake-event');

            const fields = {
                clientName: {
                    el: document.getElementById('clientName'),
                    val: document.getElementById('clientName').value.trim(),
                    label: 'Full name'
                },
                clientEmail: {
                    el: document.getElementById('clientEmail'),
                    val: document.getElementById('clientEmail').value.trim(),
                    label: 'Work email'
                },
                clientPhone: {
                    el: document.getElementById('clientPhone'),
                    val: document.getElementById('clientPhone').value.trim(),
                    label: 'Contact number'
                },
                clientOrg: {
                    el: document.getElementById('clientOrg'),
                    val: document.getElementById('clientOrg').value.trim(),
                    label: 'Organization'
                },
                clientMessage: {
                    el: document.getElementById('clientMessage'),
                    val: document.getElementById('clientMessage').value.trim(),
                    label: 'Message'
                },
                caslConsentCheck: {
                    el: document.getElementById('caslConsentCheck'),
                    val: document.getElementById('caslConsentCheck').checked,
                    label: 'CASL consent'
                }
            };

            const missing = [];

            if (!fields.clientName.val) missing.push('clientName');

            if (!fields.clientEmail.val) {
                missing.push('clientEmail');
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.clientEmail.val)) {
                const group = form.querySelector('[data-validator-group="clientEmail"]');
                group.classList.add('field-state-error', 'element-shake-event');
                group.querySelector('.field-error-message').textContent = 'Please enter a valid email address.';
            }

            if (!fields.clientPhone.val) {
                missing.push('clientPhone');
            } else if (!/^[+\d][\d\s().\-]{6,}$/.test(fields.clientPhone.val)) {
                const group = form.querySelector('[data-validator-group="clientPhone"]');
                group.classList.add('field-state-error', 'element-shake-event');
                group.querySelector('.field-error-message').textContent = 'Please enter a valid contact number.';
            }

            if (!fields.clientOrg.val) missing.push('clientOrg');
            if (!fields.clientMessage.val) missing.push('clientMessage');
            if (!fields.caslConsentCheck.val) missing.push('caslConsentCheck');

            // Entire form empty → whole-card shake
            if (missing.length === Object.keys(fields).length) {
                void formCard.offsetWidth;
                formCard.classList.add('holistic-shake-event');
                missing.forEach(key => {
                    const group = form.querySelector(`[data-validator-group="${key}"]`);
                    group.classList.add('field-state-error');
                    group.querySelector('.field-error-message').textContent = `${fields[key].label} is required.`;
                });
                return;
            }

            // Some missing → per-field shake
            if (missing.length > 0) {
                missing.forEach(key => {
                    const group = form.querySelector(`[data-validator-group="${key}"]`);
                    void group.offsetWidth;
                    group.classList.add('field-state-error', 'element-shake-event');
                    group.querySelector('.field-error-message').textContent = `${fields[key].label} cannot be empty.`;
                });
                return;
            }

            if (form.querySelectorAll('.field-state-error').length > 0) return;

            // Success state
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<span class="btn-label">Submitting…</span>';
            submitBtn.disabled = true;

            setTimeout(() => {
                formCard.innerHTML = `
                    <div class="submission-success-card">
                        <div class="success-icon-badge">✓</div>
                        <h3>Engagement Request Received</h3>
                        <p class="success-p1">Thank you. Your inquiry has been routed to our coordination desk.</p>
                        <p class="success-p2">A senior practitioner will reach out shortly regarding your inspection timeline or pipeline milestones.</p>
                    </div>
                `;
            }, 700);
        });
    }

    /* ----------------------------------------------------------------------
       8. Subtle Parallax on Hero Orbit (mouse-follow tilt)
       ---------------------------------------------------------------------- */
    const orbitFrame = document.querySelector('.hero-orbit-frame');
    const heroShowcase = document.querySelector('.hero-showcase');

    if (orbitFrame && heroShowcase && window.matchMedia('(pointer: fine)').matches) {
        heroShowcase.addEventListener('mousemove', (e) => {
            const rect = heroShowcase.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * 16;
            orbitFrame.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        });
        heroShowcase.addEventListener('mouseleave', () => {
            orbitFrame.style.transform = 'translate3d(0, 0, 0)';
        });
        orbitFrame.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
    }

    /* ----------------------------------------------------------------------
       9. Header Shadow on Scroll
       ---------------------------------------------------------------------- */
    const header = document.querySelector('.site-header');
    if (header) {
        const onScroll = () => {
            if (window.scrollY > 12) header.style.boxShadow = '0 4px 20px rgba(15, 23, 42, 0.06)';
            else header.style.boxShadow = 'none';
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }
});
