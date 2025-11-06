const initialisePage = () => {
    const links = document.querySelectorAll('a[href^="#"]');
    const heroAnimationContainer = document.getElementById('heroAnimation');
    const heroContent = document.getElementById('heroContent');
    const heroContainer = document.getElementById('heroContainer');
    const heroAnim = document.getElementById('heroAnim');
    const heroAnimationFallback = document.getElementById('heroAnimationFallback');
    const heroChat = document.getElementById('heroChat');
    const saibaMaisBtn = document.getElementById('saibaMaisBtn');

    for (const link of links) {
        link.addEventListener("click", function (e) {
            e.preventDefault();

            const targetId = this.getAttribute("href").substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 20,
                    behavior: "smooth",
                });
            }
        });
    }

    const showHeroAnimationFallback = () => {
        if (heroAnim) {
            heroAnim.classList.add('hidden');
            heroAnim.innerHTML = '';
        }

        if (heroAnimationFallback) {
            heroAnimationFallback.classList.remove('hidden');
        }
    };

    const showHeroAnimation = () => {
        if (heroAnim) {
            heroAnim.classList.remove('hidden');
        }

        if (heroAnimationFallback) {
            heroAnimationFallback.classList.add('hidden');
        }
    };

    const sanitisePath = (rawPath, fallback) => {
        if (typeof rawPath !== 'string') {
            return fallback;
        }

        const trimmedValue = rawPath.trim();

        return trimmedValue || fallback;
    };

    const defaultAnimationPath = sanitisePath(heroAnim?.dataset?.animationPath, 'animation.json');
    const neutralAnimationPath = sanitisePath(heroAnim?.dataset?.neutralAnimationPath, 'animationNeutral.json');

    let heroAnimationInstance = null;
    let currentAnimationPath = defaultAnimationPath;

    const loadHeroAnimation = (pathOverride) => {
        if (!heroAnim) {
            return;
        }

        const animationPath = sanitisePath(pathOverride, currentAnimationPath);
        currentAnimationPath = animationPath;

        return sanitisedPath || defaultPath;
    };

        if (!window.lottie) {
            showHeroAnimationFallback();
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

            animation.addEventListener('data_failed', () => {
                console.error('Falha ao carregar os dados da animação:', animationPath);
                showHeroAnimationFallback();
            });
            animation.addEventListener('error', (event) => {
                console.error('Erro da animação Lottie:', event);
                showHeroAnimationFallback();
            });
            animation.addEventListener('DOMLoaded', showHeroAnimation);
            animation.addEventListener('data_ready', showHeroAnimation);
            animation.addEventListener('complete', showHeroAnimation);

            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    const [entry] = entries;

                    if (!entry) {
                        return;
                    }

                    if (entry.isIntersecting) {
                        animation.play();
                    } else {
                        animation.pause();
                    }
                }, { threshold: 0.25 });

                observer.observe(heroAnim);

                animation.addEventListener('destroy', () => {
                    observer.disconnect();
                });
            }
        } catch (error) {
            console.error('Falha ao iniciar a animação Lottie:', error);
            showHeroAnimationFallback();
        }
    };

    if (heroAnim) {
        loadHeroAnimation();
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

            heroAnimationContainer?.classList.add('chat-expanded');

            loadHeroAnimation(neutralAnimationPath);
        });
    }

    // Add animation to elements when they come into view
    const animateOnScroll = () => {
        const elements = document.querySelectorAll(".animate-on-scroll");

        for (const element of elements) {
            const elementPosition = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;

            if (elementPosition < windowHeight - 50) {
                element.classList.add("animated");
            }
        }
    };

    window.addEventListener("scroll", animateOnScroll);
    animateOnScroll(); // Run once on page load

    // Mobile navigation highlighting
    const sections = document.querySelectorAll('section[id]');
    
    function highlightNavigation() {
        let scrollY = window.pageYOffset;
        
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 100;
            const sectionId = current.getAttribute('id');

            if (!sectionId) {
                return;
            }

            const mobileNavLink = document.querySelector(`.mobile-nav a[href*="${sectionId}"]`);
            const mainNavLink = document.querySelector(`.main-nav a[href*="${sectionId}"]`);

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                mobileNavLink?.classList.add('active');
                mainNavLink?.classList.add('active');
            } else {
                mobileNavLink?.classList.remove('active');
                mainNavLink?.classList.remove('active');
            }
        });
    }

    window.addEventListener('scroll', highlightNavigation);
    highlightNavigation();
    
    // Add hover effects to cards
    const cards = document.querySelectorAll('.risk-item, .tip-item, .activity-category, .team-member');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
        });
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialisePage, { once: true });
} else {
    initialisePage();
}
