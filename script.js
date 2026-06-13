/* ==========================================================================
   GxP COMPLIANCE GROUP — V2 RUNTIME WITH LIVE WEBHOOK PIPELINE
   Smooth transitions, scroll reveals, slideshow, counters, form validation
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* ----------------------------------------------------------------------
       1. View Router with Fade Transition
       ---------------------------------------------------------------------- */
    const viewTriggers = document.querySelectorAll('.frame-view-trigger');
    const pageViews = document.querySelectorAll('.page-view');
    const canvasWrapper = document.getElementById('viewCanvasWrapper');

    viewTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            const requestedView = trigger.getAttribute('data-target-view');
            const targetHref = trigger.getAttribute('href');

            if (targetHref && targetHref.startsWith('#') && requestedView === 'home') {
                const currentView = document.querySelector('.page-view.active');
                if (currentView && currentView.id === 'view-home') {
                    return;
                }
            }

            e.preventDefault();
            if (canvasWrapper) canvasWrapper.classList.add('canvas-fade-out');

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

                if (canvasWrapper) canvasWrapper.classList.remove('canvas-fade-out');

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

            const bar = document.getElementById('serviceTabBar');
            if (bar) {
                const barW = bar.clientWidth;
                const btnOffset = tabBtn.offsetLeft;
                const btnW = tabBtn.offsetWidth;
                bar.scrollTo({ left: btnOffset - (barW / 2) + (btnW / 2), behavior: 'smooth' });
            }

            const targetPanel = document.getElementById(`panel-${targetScope}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
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
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(target * eased);
            if (progress < 1) requestAnimationFrame(tick);
            else el.textContent = target;
        }
        requestAnimationFrame(tick);
    }

    /* ----------------------------------------------------------------------
       7. Contact Form — custom inquiry form → PHP API → MySQL
       ---------------------------------------------------------------------- */
    const INQUIRY_ENDPOINT = 'api/inquiries.php';

    const inquiryForm = document.getElementById('inquiryForm');
    const inquirySuccess = document.getElementById('inquirySuccess');

    if (inquiryForm) {

        const setError = (id, msg) => {
            const el = inquiryForm.querySelector(`[data-error-for="${id}"]`);
            const field = document.getElementById(id);
            if (el) el.textContent = msg || '';
            if (field) {
                const group = field.closest('.input-field-group, .compliance-casl-card');
                if (group) group.classList.toggle('field-state-error', !!msg);
            }
        };

        // Strip to 10 national digits, drop leading country code 1
        const phoneDigits = (v) => {
            let d = (v || '').replace(/\D/g, '');
            if (d.charAt(0) === '1') d = d.slice(1);
            return d.slice(0, 10);
        };

        const validators = {
            'if-name':    v => v.trim() ? '' : 'Please enter your full name.',
            'if-email':   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address.',
            'if-phone':   v => phoneDigits(v).length === 10 ? '' : 'Enter a valid number, e.g. +1 (123) 456-7890.',
            'if-org':     v => v.trim() ? '' : 'Please enter your organization.',
            'if-topic':   v => v ? '' : 'Please select an area of interest.',
            'if-message': v => v.trim() ? '' : 'Please tell us how we can help.',
        };

        // Live +1 mask as user types
        const phoneEl = document.getElementById('if-phone');
        if (phoneEl) {
            phoneEl.addEventListener('input', () => {
                const d = phoneDigits(phoneEl.value).slice(0, 10);
                if (!d) { phoneEl.value = ''; return; }
                let out = '+1 (' + d.slice(0, 3);
                if (d.length >= 3) out += ')';
                if (d.length > 3) out += ' ' + d.slice(3, 6);
                if (d.length > 6) out += '-' + d.slice(6, 10);
                phoneEl.value = out;
            });
        }

        const validateAll = () => {
            let ok = true;
            Object.entries(validators).forEach(([id, fn]) => {
                const el = document.getElementById(id);
                const msg = fn(el ? el.value : '');
                setError(id, msg);
                if (msg) ok = false;
            });
            const consent = document.getElementById('if-consent');
            if (consent && !consent.checked) {
                setError('if-consent', 'Please provide consent to continue.');
                ok = false;
            } else {
                setError('if-consent', '');
            }
            return ok;
        };

        // Clear error on correction
        inquiryForm.querySelectorAll('input, textarea, select').forEach(el => {
            el.addEventListener('input', () => setError(el.id, ''));
        });

        inquiryForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Honeypot — silently drop bots
            const hp = document.getElementById('if-company-website');
            if (hp && hp.value.trim() !== '') return;

            if (!validateAll()) {
                const firstErr = inquiryForm.querySelector('.field-state-error');
                if (firstErr) {
                    firstErr.classList.add('element-shake-event');
                    setTimeout(() => firstErr.classList.remove('element-shake-event'), 500);
                    const input = firstErr.querySelector('input, textarea, select');
                    if (input) input.focus();
                }
                return;
            }

            const submitBtn = document.getElementById('inquirySubmit');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending…';

            const resetBtn = () => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Inquiry';
            };

            const finishSuccess = () => {
                inquiryForm.hidden = true;
                if (inquirySuccess) {
                    inquirySuccess.hidden = false;
                    inquirySuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            };

            const sendInquiry = () => {
                const phone10 = phoneDigits(document.getElementById('if-phone')?.value || '');
                const formattedPhone = phone10.length === 10
                    ? `${phone10.slice(0,3)}-${phone10.slice(3,6)}-${phone10.slice(6)}`
                    : phone10;

                const payload = {
                    fullName: (document.getElementById('if-name')?.value || '').trim(),
                    email: (document.getElementById('if-email')?.value || '').trim(),
                    contactNumber: formattedPhone,
                    organization: (document.getElementById('if-org')?.value || '').trim(),
                    areaOfInterest: (document.getElementById('if-topic')?.value || '').trim(),
                    message: (document.getElementById('if-message')?.value || '').trim(),
                    website: (document.getElementById('if-company-website')?.value || '').trim(),
                };

                fetch(INQUIRY_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                    .then(res => res.json().then(data => ({ ok: res.ok, data })))
                    .then(({ ok, data }) => {
                        if (!ok || !data.ok) {
                            if (data.errors) {
                                Object.entries(data.errors).forEach(([key, msg]) => {
                                    const idMap = { fullName: 'if-name', email: 'if-email', phone: 'if-phone', org: 'if-org', topic: 'if-topic', message: 'if-message' };
                                    setError(idMap[key] || key, msg);
                                });
                            }
                            resetBtn();
                            return;
                        }
                        const ref = inquirySuccess?.querySelector('[data-custid]');
                        if (ref) ref.textContent = data.custid;
                        finishSuccess();
                    })
                    .catch(() => {
                        resetBtn();
                        alert('Something went wrong. Please try again later.');
                    });
            };

            sendInquiry();
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

    /* ----------------------------------------------------------------------
       10. Mobile Navigation (hamburger + Services accordion)
       ---------------------------------------------------------------------- */
    const navToggle = document.getElementById('navToggle');
    const primaryNav = document.getElementById('primaryNav');
    const mobileQuery = window.matchMedia('(max-width: 768px)');

    if (navToggle && header && primaryNav) {
        const setMenu = (open) => {
            header.classList.toggle('nav-open', open);
            navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            if (!open) {
                document.querySelectorAll('.nav-has-dropdown.submenu-open')
                    .forEach(el => el.classList.remove('submenu-open'));
            }
        };

        navToggle.addEventListener('click', () => setMenu(!header.classList.contains('nav-open')));

        const dropToggle = primaryNav.querySelector('.nav-dropdown-toggle');
        if (dropToggle) {
            dropToggle.addEventListener('click', (e) => {
                if (mobileQuery.matches) {
                    e.preventDefault();
                    const parent = dropToggle.closest('.nav-has-dropdown');
                    if (parent) parent.classList.toggle('submenu-open');
                }
            });
        }

        primaryNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (link === dropToggle && mobileQuery.matches) return;
                if (mobileQuery.matches) setMenu(false);
            });
        });

        mobileQuery.addEventListener('change', (e) => { if (!e.matches) setMenu(false); });
    }
});