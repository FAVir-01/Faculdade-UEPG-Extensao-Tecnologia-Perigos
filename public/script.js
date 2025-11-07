const initialisePage = () => {
    const links = document.querySelectorAll('a[href^="#"]');
    const heroAnimationContainer = document.getElementById('heroAnimation');
    const heroContent = document.getElementById('heroContent');
    const heroContainer = document.getElementById('heroContainer');
    const heroAnim = document.getElementById('heroAnim');
    const heroAnimationFallback = document.getElementById('heroAnimationFallback');
    const heroChat = document.getElementById('heroChat');
    const saibaMaisBtn = document.getElementById('saibaMaisBtn');

    const triggerChatWebhook = async () => {
        if (typeof fetch !== 'function') {
            console.error('Fetch API indisponível para enviar o webhook.');
            return false;
        }

        const payload = {
            event: 'saiba-mais-click',
            timestamp: new Date().toISOString(),
            location: window.location.href,
            userAgent: navigator.userAgent,
        };

        let timeoutId = null;
        let controller = null;

        if (typeof AbortController === 'function') {
            controller = new AbortController();
            timeoutId = window.setTimeout(() => {
                controller.abort();
            }, 5000);
        }

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: controller?.signal,
            });

            if (!response.ok) {
                const responseText = await response.text();
                console.error('Falha ao enviar dados para o webhook.', {
                    status: response.status,
                    body: responseText,
                });
                return false;
            }

            return true;
        } catch (error) {
            if (error?.name === 'AbortError') {
                console.warn('Envio para o webhook expirou.');
            } else {
                console.error('Erro ao enviar dados para o webhook.', error);
            }

            return false;
        } finally {
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId);
            }
        }
    };

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

    const toAbsoluteUrl = (path) => {
        if (typeof path !== 'string') {
            return null;
        }

        const trimmedValue = path.trim();

        if (!trimmedValue) {
            return null;
        }

        try {
            return new URL(trimmedValue, window.location.href).href;
        } catch (error) {
            console.error('Caminho inválido para a animação:', trimmedValue, error);
            return null;
        }
    };

    const normalisePath = (rawPath, fallbackPath) => {
        const fallback = toAbsoluteUrl(fallbackPath);

        if (typeof rawPath !== 'string') {
            return fallback;
        }

        return toAbsoluteUrl(rawPath) ?? fallback;
    };

    const getAnimationPath = (element, attribute, fallbackPath) => {
        if (!element) {
            return normalisePath(null, fallbackPath);
        }

        const value = element.getAttribute(attribute);

        return normalisePath(value, fallbackPath);
    };

    const defaultAnimationPath = getAnimationPath(heroAnim, 'data-animation-path', './animation.json');
    const neutralAnimationPath = getAnimationPath(heroAnim, 'data-neutral-animation-path', './animationNeutral.json');

    let heroAnimationInstance = null;
    let currentAnimationRequestId = 0;

    const destroyHeroAnimation = () => {
        if (heroAnimationInstance && typeof heroAnimationInstance.destroy === 'function') {
            heroAnimationInstance.destroy();
        }

        heroAnimationInstance = null;

        if (heroAnim) {
            heroAnim.innerHTML = '';
        }
    };

    const fetchAnimationData = async (animationPath) => {
        try {
            const response = await fetch(animationPath, { cache: 'no-store' });

            if (!response.ok) {
                throw new Error(`Resposta ${response.status} ao carregar a animação.`);
            }

            const data = await response.json();

            if (!data || typeof data !== 'object') {
                throw new Error('JSON de animação inválido.');
            }

            return data;
        } catch (error) {
            console.error('Falha ao obter os dados da animação:', animationPath, error);
            return null;
        }
    };

    const loadHeroAnimation = async (targetPath, options = {}) => {
        const { preserveCurrentAnimation = false } = options;
        const requestId = ++currentAnimationRequestId;

        if (!heroAnim) {
            return;
        }

        // Exibe a imagem estática enquanto a animação é carregada,
        // exceto quando queremos manter a animação atual como fallback.
        if (!(preserveCurrentAnimation && heroAnimationInstance)) {
            showHeroAnimationFallback();
        } else {
            showHeroAnimation();
        }

        const animationPath = normalisePath(targetPath, defaultAnimationPath);

        if (!animationPath) {
            console.error('Não foi possível determinar o caminho da animação.');
            if (!(preserveCurrentAnimation && heroAnimationInstance)) {
                showHeroAnimationFallback();
            }
            return;
        }

        if (!window.lottie || typeof window.lottie.loadAnimation !== 'function') {
            console.error('Lottie não está disponível para carregar a animação.');
            if (!(preserveCurrentAnimation && heroAnimationInstance)) {
                showHeroAnimationFallback();
            }
            return;
        }

        const animationData = await fetchAnimationData(animationPath);

        if (!animationData) {
            if (!(preserveCurrentAnimation && heroAnimationInstance)) {
                showHeroAnimationFallback();
            } else {
                showHeroAnimation();
            }
            return;
        }

        if (requestId !== currentAnimationRequestId) {
            return;
        }

        destroyHeroAnimation();

        try {
            heroAnimationInstance = window.lottie.loadAnimation({
                container: heroAnim,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                animationData,
                rendererSettings: {
                    progressiveLoad: true,
                    hideOnTransparent: true,
                },
            });

            const handleReady = () => {
                showHeroAnimation();

                if (heroAnimationInstance) {
                    heroAnimationInstance.removeEventListener('data_ready', handleReady);
                    heroAnimationInstance.removeEventListener('DOMLoaded', handleReady);
                }
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
            triggerChatWebhook();

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

            loadHeroAnimation(neutralAnimationPath, { preserveCurrentAnimation: true });
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
