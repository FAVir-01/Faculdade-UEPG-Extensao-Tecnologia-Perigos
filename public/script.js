// Smooth scrolling for anchor links
document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll('a[href^="#"]');
    const heroAnimationContainer = document.getElementById('heroAnimation');
    const heroContent = document.getElementById('heroContent');
    const heroContainer = document.getElementById('heroContainer');
    const heroAnimationPlayer = document.getElementById('heroAnimationPlayer');
    const heroAnimationFallback = document.getElementById('heroAnimationFallback');
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
        heroAnimationPlayer?.classList.add('hidden');
        heroAnimationFallback?.classList.remove('hidden');
    };

    if (heroAnimationPlayer) {
        if (window.lottie) {
            try {
                const animation = window.lottie.loadAnimation({
                    container: heroAnimationPlayer,
                    renderer: 'svg',
                    loop: true,
                    autoplay: true,
                    path: 'animation.json',
                    rendererSettings: {
                        progressiveLoad: true,
                        hideOnTransparent: true,
                    },
                });

                animation.addEventListener('data_failed', showHeroAnimationFallback);
            } catch (error) {
                console.error('Falha ao iniciar a animação Lottie:', error);
                showHeroAnimationFallback();
            }
        } else {
            showHeroAnimationFallback();
        }
    }

    if (saibaMaisBtn) {
        saibaMaisBtn.addEventListener('click', () => {
            if (heroContent) {
                heroContent.classList.add('hidden');
            }

            if (heroContainer) {
                heroContainer.classList.add('only-animation');
            }

            heroAnimationContainer?.classList.add('only');
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
});
