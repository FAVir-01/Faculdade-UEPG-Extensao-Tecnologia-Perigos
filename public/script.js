const initialisePage = () => {
    const links = document.querySelectorAll('a[href^="#"]');
    const heroAnimationContainer = document.getElementById('heroAnimation');
    const heroContent = document.getElementById('heroContent');
    const heroContainer = document.getElementById('heroContainer');
    const heroAnim = document.getElementById('heroAnim');
    const heroAnimationFallback = document.getElementById('heroAnimationFallback');
    const heroChat = document.getElementById('heroChat');
    const saibaMaisBtn = document.getElementById('saibaMaisBtn');

    const chatMessages = document.getElementById('chatMessages');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatSubmit = document.getElementById('chatSubmit');
    const chatEmpty = document.getElementById('chatEmpty');

    let typingIndicatorBubble = null;
    let hasConversationStarted = false;
    let hasInitialAssistantMessage = false;
    let isSendingMessage = false;
    let messageSequence = 0;
    let sessionId = null;

    const assistantFallbackMessage = 'Consegui registrar sua mensagem, mas não recebi uma resposta desta vez.';
    const assistantErrorMessage = 'Desculpe, ocorreu um problema ao obter a resposta. Tente novamente em instantes.';

    const ensureSessionId = () => {
        if (sessionId) {
            return sessionId;
        }

        try {
            const storedId = sessionStorage.getItem('session_id');

            if (storedId) {
                sessionId = storedId;
                return sessionId;
            }

            if (typeof crypto?.randomUUID === 'function') {
                sessionId = crypto.randomUUID();
            } else {
                sessionId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
            }

            sessionStorage.setItem('session_id', sessionId);
        } catch (error) {
            console.warn('Não foi possível aceder ao sessionStorage. Um identificador temporário será utilizado.', error);
            sessionId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        }

        return sessionId;
    };

    ensureSessionId();

    const logWebhookError = (event, error) => {
        if (error?.name === 'AbortError') {
            console.warn('Envio para o webhook expirou.', { event });
            return;
        }

        console.error('Erro ao enviar evento para o webhook.', {
            event,
            message: error?.message,
        });
    };

    const sendChatEvent = async (event, payload = {}, options = {}) => {
        if (typeof fetch !== 'function') {
            console.error('Fetch API indisponível para enviar o webhook.');
            return options.expectResponse ? null : false;
        }

        const { expectResponse = false, timeoutMs = 10000, throwOnError = expectResponse } = options;

        const body = {
            event,
            sessionId: ensureSessionId(),
            timestamp: new Date().toISOString(),
            ...payload,
        };

        let controller = null;
        let timeoutId = null;

        if (typeof AbortController === 'function' && Number.isFinite(timeoutMs) && timeoutMs > 0) {
            controller = new AbortController();
            timeoutId = window.setTimeout(() => {
                controller.abort();
            }, timeoutMs);
        }

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
                signal: controller?.signal,
            });

            if (!response.ok) {
                const responseText = await response.text().catch(() => '');
                const error = new Error('Falha ao enviar dados para o webhook.');
                error.status = response.status;
                error.body = responseText;

                if (throwOnError) {
                    throw error;
                }

                console.error('Falha ao enviar dados para o webhook.', {
                    event,
                    status: response.status,
                    body: responseText,
                });

                return expectResponse ? null : false;
            }

            if (!expectResponse) {
                return true;
            }

            const contentType = response.headers.get('content-type') ?? '';

            if (contentType.includes('application/json')) {
                return response.json();
            }

            const text = await response.text();

            if (!text) {
                return null;
            }

            try {
                return JSON.parse(text);
            } catch (parseError) {
                return { message: text };
            }
        } catch (error) {
            if (throwOnError) {
                throw error;
            }

            logWebhookError(event, error);

            return expectResponse ? null : false;
        } finally {
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId);
            }
        }
    };

    const conversationHistory = [];

    const updateEmptyState = () => {
        if (!chatMessages || !chatEmpty) {
            return;
        }

        const hasMessages = Boolean(chatMessages.querySelector('.chat-bubble:not(.typing-indicator)'));
        const isTyping = Boolean(chatMessages.querySelector('.typing-indicator'));

        if (hasMessages || isTyping) {
            chatEmpty.classList.add('hidden');
        } else {
            chatEmpty.classList.remove('hidden');
        }
    };

    const recordHistoryMessage = (message) => {
        conversationHistory.push({
            id: message.id,
            role: message.role,
            content: message.content,
            timestamp: message.timestamp ?? new Date().toISOString(),
        });
    };

    const initialiseExistingMessages = () => {
        if (!chatMessages) {
            return;
        }

        const bubbles = Array.from(chatMessages.querySelectorAll('.chat-bubble'));

        bubbles.forEach((bubble, index) => {
            const role = bubble.classList.contains('chat-bubble-user')
                ? 'user'
                : bubble.classList.contains('chat-bubble-system')
                ? 'system'
                : 'assistant';
            const id = bubble.dataset.messageId || `initial-${role}-${index}`;
            const content = bubble.textContent.trim();

            bubble.dataset.messageId = id;
            bubble.dataset.messageRole = role;

            recordHistoryMessage({ id, role, content, timestamp: new Date().toISOString() });

            if (role === 'assistant') {
                hasInitialAssistantMessage = true;
            }
        });

        updateEmptyState();
    };

    initialiseExistingMessages();
    updateEmptyState();

    const generateMessageId = (role) => {
        messageSequence += 1;
        return `${role}-${Date.now()}-${messageSequence}`;
    };

    const setBubbleContent = (bubble, text) => {
        if (!bubble) {
            return;
        }

        const content = typeof text === 'string' ? text : String(text ?? '');
        const lines = content.split(/\n/);

        while (bubble.firstChild) {
            bubble.removeChild(bubble.firstChild);
        }

        lines.forEach((line, index) => {
            bubble.appendChild(document.createTextNode(line));

            if (index < lines.length - 1) {
                bubble.appendChild(document.createElement('br'));
            }
        });
    };

    const scrollChatToBottom = () => {
        if (!chatMessages) {
            return;
        }

        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const appendChatBubble = (message) => {
        if (!chatMessages) {
            return null;
        }

        const roleClass =
            message.role === 'user'
                ? 'chat-bubble-user'
                : message.role === 'system'
                ? 'chat-bubble-system'
                : 'chat-bubble-assistant';

        const bubble = document.createElement('div');
        bubble.classList.add('chat-bubble', roleClass);
        bubble.dataset.messageId = message.id;
        bubble.dataset.messageRole = message.role;

        setBubbleContent(bubble, message.content);

        chatMessages.appendChild(bubble);

        window.requestAnimationFrame(() => {
            bubble.classList.add('chat-bubble-visible');
        });

        scrollChatToBottom();

        updateEmptyState();

        return bubble;
    };

    const showTypingIndicator = () => {
        if (!chatMessages) {
            return;
        }

        if (typingIndicatorBubble && typingIndicatorBubble.parentElement) {
            typingIndicatorBubble.parentElement.removeChild(typingIndicatorBubble);
        }

        const bubble = document.createElement('div');
        bubble.classList.add('chat-bubble', 'chat-bubble-assistant', 'typing-indicator');
        bubble.dataset.messageRole = 'assistant';
        bubble.setAttribute('role', 'status');
        bubble.setAttribute('aria-live', 'polite');
        bubble.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';

        chatMessages.appendChild(bubble);

        window.requestAnimationFrame(() => {
            bubble.classList.add('chat-bubble-visible');
        });

        scrollChatToBottom();

        typingIndicatorBubble = bubble;

        updateEmptyState();
    };

    const hideTypingIndicator = () => {
        if (!typingIndicatorBubble) {
            return;
        }

        if (typingIndicatorBubble.parentElement) {
            typingIndicatorBubble.parentElement.removeChild(typingIndicatorBubble);
        }

        typingIndicatorBubble = null;

        updateEmptyState();
    };

    const extractAssistantContent = (payload) => {
        if (payload == null) {
            return '';
        }

        if (typeof payload === 'string') {
            return payload.trim();
        }

        if (typeof payload === 'object') {
            const keys = ['output', 'reply', 'message', 'text', 'content', 'response'];

            for (const key of keys) {
                const value = payload[key];

                if (typeof value === 'string' && value.trim()) {
                    return value.trim();
                }
            }

            if (typeof payload.message === 'object' && payload.message !== null) {
                return extractAssistantContent(payload.message);
            }
        }

        return String(payload);
    };

    const startConversation = (metadata = {}) => {
        if (hasConversationStarted) {
            return;
        }

        hasConversationStarted = true;

        sendChatEvent(
            'conversation_status',
            {
                status: 'conversation_started',
                location: window.location.href,
                userAgent: navigator.userAgent,
                ...metadata,
            },
            { timeoutMs: 5000 }
        ).catch((error) => {
            logWebhookError('conversation_status', error);
        });
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
            sendChatEvent(
                'saiba-mais-click',
                {
                    location: window.location.href,
                    userAgent: navigator.userAgent,
                },
                { timeoutMs: 5000 }
            ).catch((error) => {
                logWebhookError('saiba-mais-click', error);
            });

            startConversation({ origin: 'cta_click' });

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

            scrollChatToBottom();

            if (chatInput && !chatInput.disabled) {
                window.setTimeout(() => {
                    chatInput.focus();
                }, 200);
            }

            const requestInitialAssistantMessage = async () => {
                if (isSendingMessage || hasInitialAssistantMessage) {
                    return;
                }

                isSendingMessage = true;

                if (chatInput) {
                    chatInput.disabled = true;
                }

                if (chatSubmit) {
                    chatSubmit.disabled = true;
                }

                showTypingIndicator();

                sendChatEvent('conversation_status', {
                    status: 'assistant_typing',
                    active: true,
                }).catch((error) => logWebhookError('conversation_status', error));

                try {
                    const historyPayload = conversationHistory.map((entry) => ({ ...entry }));
                    const responsePayload = await sendChatEvent(
                        'conversation_started',
                        {
                            history: historyPayload,
                            origin: 'cta_click',
                        },
                        { expectResponse: true, timeoutMs: 20000, throwOnError: true }
                    );

                    sendChatEvent('conversation_status', {
                        status: 'assistant_typing',
                        active: false,
                    }).catch((error) => logWebhookError('conversation_status', error));

                    const assistantRawText = extractAssistantContent(responsePayload);
                    const assistantText = assistantRawText || assistantFallbackMessage;

                    const assistantMessage = {
                        id: generateMessageId('assistant'),
                        role: 'assistant',
                        content: assistantText,
                        timestamp: new Date().toISOString(),
                    };

                    hideTypingIndicator();

                    recordHistoryMessage(assistantMessage);
                    appendChatBubble(assistantMessage);

                    hasInitialAssistantMessage = true;

                    const inboundStatusPayload = {
                        status: 'delivered',
                        direction: 'inbound',
                        messageId: assistantMessage.id,
                        message: assistantMessage.content,
                    };

                    sendChatEvent('message_status', inboundStatusPayload).catch((error) =>
                        logWebhookError('message_status', error)
                    );

                    const assistantResponsePayload = {
                        messageId: assistantMessage.id,
                        message: assistantMessage.content,
                    };

                    sendChatEvent('assistant_response', assistantResponsePayload).catch((error) =>
                        logWebhookError('assistant_response', error)
                    );
                } catch (error) {
                    hideTypingIndicator();

                    sendChatEvent('conversation_status', {
                        status: 'assistant_typing',
                        active: false,
                    }).catch((err) => logWebhookError('conversation_status', err));

                    const systemMessage = {
                        id: generateMessageId('system'),
                        role: 'system',
                        content: assistantErrorMessage,
                        timestamp: new Date().toISOString(),
                    };

                    recordHistoryMessage(systemMessage);
                    appendChatBubble(systemMessage);

                    sendChatEvent('message_status', {
                        status: 'error',
                        direction: 'system',
                        messageId: systemMessage.id,
                        error: error?.message ?? 'unknown-error',
                    }).catch((err) => logWebhookError('message_status', err));
                } finally {
                    hideTypingIndicator();

                    isSendingMessage = false;

                    if (chatInput) {
                        chatInput.disabled = false;

                        window.setTimeout(() => {
                            chatInput.focus();
                        }, 200);
                    }

                    if (chatSubmit) {
                        chatSubmit.disabled = false;
                    }
                }
            };

            requestInitialAssistantMessage();
        });
    }

    if (chatForm && chatInput) {
        chatForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (isSendingMessage) {
                chatInput.focus();
                return;
            }

            const rawValue = chatInput.value ?? '';
            const trimmedValue = rawValue.trim();

            if (!trimmedValue) {
                chatInput.value = '';
                chatInput.focus();
                return;
            }

            isSendingMessage = true;

            chatInput.value = '';
            chatInput.disabled = true;

            if (chatSubmit) {
                chatSubmit.disabled = true;
            }

            const userMessage = {
                id: generateMessageId('user'),
                role: 'user',
                content: trimmedValue,
                timestamp: new Date().toISOString(),
            };

            recordHistoryMessage(userMessage);
            appendChatBubble(userMessage);

            startConversation({ origin: 'user_message', firstMessageId: userMessage.id });

            sendChatEvent('message_status', {
                status: 'sent',
                direction: 'outbound',
                messageId: userMessage.id,
                message: userMessage.content,
            }).catch((error) => logWebhookError('message_status', error));

            showTypingIndicator();

            sendChatEvent('conversation_status', {
                status: 'assistant_typing',
                active: true,
                replyingTo: userMessage.id,
            }).catch((error) => logWebhookError('conversation_status', error));

            try {
                const historyPayload = conversationHistory.map((entry) => ({ ...entry }));

                const responsePayload = await sendChatEvent(
                    'conversation_ongoing',
                    {
                        messageId: userMessage.id,
                        message: userMessage.content,
                        history: historyPayload,
                    },
                    { expectResponse: true, timeoutMs: 20000, throwOnError: true }
                );

                sendChatEvent('message_status', {
                    status: 'delivered',
                    direction: 'outbound',
                    messageId: userMessage.id,
                }).catch((error) => logWebhookError('message_status', error));

                const assistantRawText = extractAssistantContent(responsePayload);
                const assistantText = assistantRawText || assistantFallbackMessage;

                hideTypingIndicator();

                sendChatEvent('conversation_status', {
                    status: 'assistant_typing',
                    active: false,
                    replyingTo: userMessage.id,
                }).catch((error) => logWebhookError('conversation_status', error));

                const assistantMessage = {
                    id: generateMessageId('assistant'),
                    role: 'assistant',
                    content: assistantText,
                    timestamp: new Date().toISOString(),
                    inReplyTo: userMessage.id,
                };

                recordHistoryMessage(assistantMessage);
                appendChatBubble(assistantMessage);

                sendChatEvent('message_status', {
                    status: 'delivered',
                    direction: 'inbound',
                    messageId: assistantMessage.id,
                    inReplyTo: userMessage.id,
                    message: assistantMessage.content,
                }).catch((error) => logWebhookError('message_status', error));

                sendChatEvent('assistant_response', {
                    messageId: assistantMessage.id,
                    inReplyTo: userMessage.id,
                    message: assistantMessage.content,
                }).catch((error) => logWebhookError('assistant_response', error));
            } catch (error) {
                hideTypingIndicator();

                sendChatEvent('conversation_status', {
                    status: 'assistant_typing',
                    active: false,
                    replyingTo: userMessage.id,
                }).catch((err) => logWebhookError('conversation_status', err));

                sendChatEvent('message_status', {
                    status: 'failed',
                    direction: 'outbound',
                    messageId: userMessage.id,
                    error: error?.message ?? 'unknown-error',
                }).catch((err) => logWebhookError('message_status', err));

                logWebhookError('user_message', error);

                const systemMessage = {
                    id: generateMessageId('system'),
                    role: 'system',
                    content: assistantErrorMessage,
                    timestamp: new Date().toISOString(),
                    relatedTo: userMessage.id,
                };

                recordHistoryMessage(systemMessage);
                appendChatBubble(systemMessage);

                sendChatEvent('message_status', {
                    status: 'error',
                    direction: 'system',
                    messageId: systemMessage.id,
                    relatedTo: userMessage.id,
                    error: error?.message ?? 'unknown-error',
                }).catch((err) => logWebhookError('message_status', err));
            } finally {
                hideTypingIndicator();

                isSendingMessage = false;

                chatInput.disabled = false;
                chatInput.focus();

                if (chatSubmit) {
                    chatSubmit.disabled = false;
                }
            }
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
