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

    const sanitisePath = (rawPath, fallback) => {
        if (typeof rawPath !== 'string') {
            return fallback;
        }

        const trimmedValue = rawPath.trim();

        return trimmedValue ? trimmedValue : fallback;
    };

    const getDatasetValue = (element, attribute) => {
        if (!element) {
            return null;
        }

        const value = element.getAttribute(attribute);

        return typeof value === 'string' ? value : null;
    };

    const defaultAnimationPath = sanitisePath(getDatasetValue(heroAnim, 'data-animation-path'), './animation.json');
    const neutralAnimationPath = sanitisePath(getDatasetValue(heroAnim, 'data-neutral-animation-path'), './animationNeutral.json');

    let heroAnimationInstance = null;
    let currentAnimationPath = defaultAnimationPath;

    const loadHeroAnimation = (pathOverride) => {
        if (!heroAnim) {
            return;
        }

        const animationPath = sanitisePath(pathOverride, currentAnimationPath);
        currentAnimationPath = animationPath;

    const defaultAnimationPath = sanitisePath(heroAnim?.dataset?.animationPath, 'animation.json');
    const neutralAnimationPath = sanitisePath(heroAnim?.dataset?.neutralAnimationPath, 'animationNeutral.json');

        if (!window.lottie) {
            return;
        }

        heroAnim.innerHTML = '';

        if (heroAnimationInstance) {
            heroAnimationInstance.destroy();
            heroAnimationInstance = null;
        }

        try {
            const animation = window.lottie.loadAnimation({
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

            heroAnimationInstance = animation;

            const handleReady = () => {
                showHeroAnimation();
            };

            animation.addEventListener('data_ready', handleReady);
            animation.addEventListener('DOMLoaded', handleReady);
            animation.addEventListener('complete', handleReady);
            animation.addEventListener('data_failed', () => {
                console.error('Falha ao carregar os dados da animação:', animationPath);
                showHeroAnimationFallback();
            });
            animation.addEventListener('error', (event) => {
                console.error('Erro da animação Lottie:', event);
                showHeroAnimationFallback();
            });
        } catch (error) {
            console.error('Falha ao iniciar a animação Lottie:', error);
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
