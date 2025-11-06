const initialisePage = () => {
    const links = document.querySelectorAll('a[href^="#"]');
    const heroAnimationContainer = document.getElementById('heroAnimation');
    const heroContent = document.getElementById('heroContent');
    const heroContainer = document.getElementById('heroContainer');
    const heroAnim = document.getElementById('heroAnim');
    const heroAnimationFallback = document.getElementById('heroAnimationFallback');
    const heroChat = document.getElementById('heroChat');
    const saibaMaisBtn = document.getElementById('saibaMaisBtn');

    const showHeroAnimationFallback = () => {
        if (heroAnimationFallback) {
            heroAnimationFallback.classList.remove('hidden');
        }

        if (heroAnim) {
            heroAnim.classList.add('hidden');
        }
    };

    const showHeroAnimation = () => {
        if (heroAnimationFallback) {
            heroAnimationFallback.classList.add('hidden');
        }

        if (heroAnim) {
            heroAnim.classList.remove('hidden');
        }
    };

    const normalisePath = (rawPath, fallback) => {
        if (typeof rawPath !== 'string') {
            return fallback;
        }

        const trimmedValue = rawPath.trim();

        if (!trimmedValue) {
            return fallback;
        }

        try {
            return new URL(trimmedValue, window.location.href).href;
        } catch (error) {
            console.error('Caminho inválido para a animação:', trimmedValue, error);
            return fallback;
        }
    };

    const getAttributeValue = (element, attribute, fallback) => {
        if (!element) {
            return fallback;
        }

        const value = element.getAttribute(attribute);

        return normalisePath(value, fallback);
    };

    const defaultAnimationPath = getAttributeValue(heroAnim, 'data-animation-path', new URL('./animation.json', window.location.href).href);
    const neutralAnimationPath = getAttributeValue(heroAnim, 'data-neutral-animation-path', new URL('./animationNeutral.json', window.location.href).href);

    let heroAnimationInstance = null;

    const destroyHeroAnimation = () => {
        if (heroAnimationInstance && typeof heroAnimationInstance.destroy === 'function') {
            heroAnimationInstance.destroy();
        }

        heroAnimationInstance = null;

        if (heroAnim) {
            heroAnim.innerHTML = '';
        }
    };

    const loadHeroAnimation = (targetPath) => {
        if (!heroAnim) {
            return;
        }

        const animationPath = normalisePath(targetPath, defaultAnimationPath);

        showHeroAnimationFallback();

        if (!window.lottie || typeof window.lottie.loadAnimation !== 'function') {
            console.error('Lottie não está disponível para carregar a animação.');
            return;
        }

        destroyHeroAnimation();

        try {
            heroAnimationInstance = window.lottie.loadAnimation({
                container: heroAnim,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: animationPath,
                rendererSettings: {
                    progressiveLoad: true,
                    hideOnTransparent: true,
                },
            });

            const handleReady = () => {
                showHeroAnimation();
            };

            heroAnimationInstance.addEventListener('data_ready', handleReady);
            heroAnimationInstance.addEventListener('DOMLoaded', handleReady);
            heroAnimationInstance.addEventListener('data_failed', () => {
                console.error('Falha ao carregar os dados da animação:', animationPath);
                destroyHeroAnimation();
                showHeroAnimationFallback();
            });
            heroAnimationInstance.addEventListener('error', (event) => {
                console.error('Erro da animação Lottie:', event);
                destroyHeroAnimation();
                showHeroAnimationFallback();
            });
        } catch (error) {
            console.error('Falha ao iniciar a animação Lottie:', error);
            destroyHeroAnimation();
            showHeroAnimationFallback();
        }
    };

    if (heroAnim) {
        loadHeroAnimation(defaultAnimationPath);
    } else {
        showHeroAnimationFallback();
    }

    if (saibaMaisBtn) {
        saibaMaisBtn.addEventListener('click', () => {
            if (heroContent) {
                heroContent.classList.add('hidden');
            }

            if (heroChat) {
                heroChat.classList.remove('hidden');
            }

            if (heroContainer) {
                heroContainer.classList.add('chat-mode');
            }

            if (heroAnimationContainer) {
                heroAnimationContainer.classList.add('chat-expanded');
            }

            loadHeroAnimation(neutralAnimationPath);
        });
    }

    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.animate-on-scroll');

        elements.forEach((element) => {
            const elementPosition = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;

            if (elementPosition < windowHeight - 50) {
                element.classList.add('animated');
            }
        });
    };

    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll();

    const sections = document.querySelectorAll('section[id]');

    const highlightNavigation = () => {
        const scrollY = window.pageYOffset;

        sections.forEach((section) => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');

            if (!sectionId) {
                return;
            }

            const mobileNavLink = document.querySelector('.mobile-nav a[href*="' + sectionId + '"]');
            const mainNavLink = document.querySelector('.main-nav a[href*="' + sectionId + '"]');

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                if (mobileNavLink) {
                    mobileNavLink.classList.add('active');
                }

                if (mainNavLink) {
                    mainNavLink.classList.add('active');
                }
            } else {
                if (mobileNavLink) {
                    mobileNavLink.classList.remove('active');
                }

                if (mainNavLink) {
                    mainNavLink.classList.remove('active');
                }
            }
        });
    };

    window.addEventListener('scroll', highlightNavigation);
    highlightNavigation();

    const cards = document.querySelectorAll('.risk-item, .tip-item, .activity-category, .team-member');

    cards.forEach((card) => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
        });
    });

    links.forEach((link) => {
        link.addEventListener('click', (event) => {
            const href = link.getAttribute('href');

            if (!href || href.charAt(0) !== '#') {
                return;
            }

            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);

            if (!targetElement) {
                return;
            }

            event.preventDefault();

            window.scrollTo({
                top: targetElement.offsetTop - 20,
                behavior: 'smooth',
            });
        });
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialisePage, { once: true });
} else {
    initialisePage();
}
