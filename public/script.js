// Smooth scrolling for anchor links
document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll('a[href^="#"]');
    const heroAnimationContainer = document.getElementById('heroAnimation');
    const heroContent = document.getElementById('heroContent');
    const heroContainer = document.getElementById('heroContainer');
    const heroAnimationFallback = document.getElementById('heroAnimationFallback');
    const saibaMaisBtn = document.getElementById('saibaMaisBtn');
    let heroAnimationInstance = null;

    const showHeroFallback = (message) => {
        if (!heroAnimationFallback) {
            return;
        }

        if (message) {
            const messageElement = heroAnimationFallback.querySelector('p');
            if (messageElement) {
                messageElement.textContent = message;
            }
        }

        heroAnimationFallback.classList.remove('hidden');
    };

    const hideHeroFallback = () => {
        heroAnimationFallback?.classList.add('hidden');
    };

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

    if (heroAnimationContainer && window.lottie) {
        try {
            heroAnimationInstance = window.lottie.loadAnimation({
                container: heroAnimationContainer,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: '/animation.json',
                rendererSettings: {
                    preserveAspectRatio: 'xMidYMid meet'
                }
            });

            heroAnimationInstance.addEventListener('DOMLoaded', () => {
                hideHeroFallback();
            });

            const handleAnimationError = () => {
                showHeroFallback('Não foi possível carregar a animação interativa. Veja a representação estática acima.');
            };

            heroAnimationInstance.addEventListener('data_failed', handleAnimationError);
            heroAnimationInstance.addEventListener('error', handleAnimationError);
        } catch (error) {
            showHeroFallback('Não foi possível carregar a animação interativa. Veja a representação estática acima.');
        }
    } else {
        showHeroFallback();
    }

    if (saibaMaisBtn) {
        saibaMaisBtn.addEventListener('click', () => {
            if (heroContent) {
                heroContent.classList.add('hidden');
            }

            if (heroContainer) {
                heroContainer.classList.add('only-animation');
            }

            if (heroAnimationContainer) {
                heroAnimationContainer.classList.add('only');
            }

            heroAnimationInstance?.play();
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
            
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                document.querySelector('.mobile-nav a[href*=' + sectionId + ']').classList.add('active');
                document.querySelector('.main-nav a[href*=' + sectionId + ']')?.classList.add('active');
            } else {
                document.querySelector('.mobile-nav a[href*=' + sectionId + ']').classList.remove('active');
                document.querySelector('.main-nav a[href*=' + sectionId + ']')?.classList.remove('active');
            }
        });
    }

    window.addEventListener('scroll', highlightNavigation);
    
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
