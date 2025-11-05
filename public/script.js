// Smooth scrolling for anchor links
document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll('a[href^="#"]');
    const heroAnimationContainer = document.getElementById('heroAnimation');
    const heroAnimationFallback = document.getElementById('heroAnimationFallback');
    const heroContent = document.getElementById('heroContent');
    const heroContainer = document.getElementById('heroContainer');
    const saibaMaisBtn = document.getElementById('saibaMaisBtn');
    let heroAnimationInstance = null;

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
        heroAnimationInstance = window.lottie.loadAnimation({
            container: heroAnimationContainer,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: 'animation.json',
            rendererSettings: {
                preserveAspectRatio: 'xMidYMid meet'
            }
        });

        heroAnimationInstance.addEventListener('DOMLoaded', () => {
            heroAnimationFallback?.classList.add('hidden');
        });

        heroAnimationInstance.addEventListener('data_failed', () => {
            if (heroAnimationFallback) {
                heroAnimationFallback.textContent = 'Não foi possível carregar a animação. Verifique se o arquivo animation.json está na pasta "public".';
                heroAnimationFallback.classList.remove('hidden');
            }
        });
    } else if (heroAnimationFallback) {
        heroAnimationFallback.textContent = 'Seu navegador não suporta a animação interativa.';
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
                const mobileLink = document.querySelector('.mobile-nav a[href*=' + sectionId + ']');
                const mainLink = document.querySelector('.main-nav a[href*=' + sectionId + ']');

                mobileLink?.classList.add('active');
                mainLink?.classList.add('active');
            } else {
                const mobileLink = document.querySelector('.mobile-nav a[href*=' + sectionId + ']');
                const mainLink = document.querySelector('.main-nav a[href*=' + sectionId + ']');

                mobileLink?.classList.remove('active');
                mainLink?.classList.remove('active');
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
