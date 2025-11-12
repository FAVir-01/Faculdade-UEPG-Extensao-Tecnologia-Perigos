// Smooth scrolling for anchor links
document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll('a[href^="#"]');
    const heroAnimationContainer = document.getElementById('heroAnimation');
    const saibaMaisBtn = document.getElementById('saibaMaisBtn');
    let heroAnimationInstance = null;

    for (const link of links) {
        link.addEventListener("click", function (e) {
            const targetId = this.getAttribute("href").substring(1);

            if (!targetId) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
                return;
            }

            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                e.preventDefault();
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
    }

    if (saibaMaisBtn) {
        saibaMaisBtn.addEventListener('click', () => {
            const protocolosSection = document.getElementById('protocolos');

            if (protocolosSection) {
                window.scrollTo({
                    top: protocolosSection.offsetTop - 20,
                    behavior: 'smooth'
                });
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
            
            const mobileLink = document.querySelector('.mobile-nav a[href*=' + sectionId + ']');
            const desktopLink = document.querySelector('.main-nav a[href*=' + sectionId + ']');

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                mobileLink?.classList.add('active');
                desktopLink?.classList.add('active');
            } else {
                mobileLink?.classList.remove('active');
                desktopLink?.classList.remove('active');
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
