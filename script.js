// === ПЕРЕМЕННЫЕ ДЛЯ РИСОВАНИЯ ===
let isDrawingMode = false;
let currentTool = 'line';
let currentColor = '#ff4444';
let currentLineWidth = 3;
let currentLineStyle = 'solid';
let isDrawing = false;
let startX, startY;
let shapes = [];
let canvas, ctx;

// === ПЕРЕМЕННЫЕ ДЛЯ ПЕРЕМЕЩЕНИЯ ПАНЕЛИ ===
let isPanelMoving = false;
let panelOffsetX = 0;
let panelOffsetY = 0;

// === НАСТРОЙКА ШРИФТА ДЛЯ НАЗВАНИЯ "ТАНАИС" ===
const SELECTED_FONT = "Merriweather, serif";

// === ПЛАВНАЯ ПРОКРУТКА ===
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Данные о продукции
let products = JSON.parse(localStorage.getItem('tanais_products')) || [
    {
        id: 1,
        name: "Тумба Венеция",
        category: "cabinets",
        price: 12500,
        image: "https://images.unsplash.com/photo-1584622650113-1a2ce47b7347?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
        description: "Стильная тумба для ванной комнаты с двумя выдвижными ящиками.",
        features: ["Влагостойкий МДФ", "2 выдвижных ящика", "Размеры: 60x48x85 см"]
    },
    {
        id: 2,
        name: "Зеркало с подсветкой Афина",
        category: "mirrors",
        price: 8900,
        image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80",
        description: "Современное зеркало со встроенной LED-подсветкой.",
        features: ["LED-подсветка", "Сенсорное включение", "Размеры: 80x60 см"]
    },
    {
        id: 3,
        name: "Раковина Мраморная",
        category: "sinks",
        price: 7500,
        image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
        description: "Элегантная раковина из искусственного мрамора.",
        features: ["Искусственный мрамор", "Глубина: 15 см", "Размеры: 50x40 см"]
    }
];

// Переменные для режима модератора
let isModerator = JSON.parse(localStorage.getItem('tanais_isModerator')) || false;
const MODERATOR_PASSWORD = "aefhaspjweofiufa70192";

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    applyTitleFont();
    setupSmoothScroll();
    restoreState();
    displayProducts(products);
    setupFilters();
    setupModal();
    setupImageUpload();
    setupAddProductForm();
    setupModeratorMode();
    setupLogoContextMenu();
    setupAboutInfoModal();
    setupLogoZoom();
    setupDrawingCanvas();
    setupDrawingControls();
    setupPanelDrag();
});

// === ФУНКЦИИ ДЛЯ ЗАТЕМНЕНИЯ CANVAS ПРИ МОДАЛЬНЫХ ОКНАХ ===

// Функция для добавления класса затемнения
function addCanvasDimClass() {
    document.body.classList.add('modal-open');
}

// Функция для удаления класса затемнения
function removeCanvasDimClass() {
    document.body.classList.remove('modal-open');
}

// === ФУНКЦИИ ДЛЯ ПЕРЕМЕЩЕНИЯ ПАНЕЛИ ===

// Настройка перетаскивания панели
function setupPanelDrag() {
    const panel = document.getElementById('drawingPanel');
    const dragHandle = document.getElementById('panelDragHandle');
    
    // Загрузка сохраненной позиции
    loadPanelPosition();
    
    // События для мыши
    dragHandle.addEventListener('mousedown', startPanelDrag);
    
    // События для касаний
    dragHandle.addEventListener('touchstart', startPanelDragTouch, { passive: false });
}

// Начало перетаскивания (мышь)
function startPanelDrag(e) {
    if (e.target.classList.contains('panel-close')) return;
    
    const panel = document.getElementById('drawingPanel');
    isPanelMoving = true;
    panel.classList.add('moving');
    
    const rect = panel.getBoundingClientRect();
    panelOffsetX = e.clientX - rect.left;
    panelOffsetY = e.clientY - rect.top;
    
    document.addEventListener('mousemove', onPanelDrag);
    document.addEventListener('mouseup', stopPanelDrag);
    
    e.preventDefault();
}

// Начало перетаскивания (касание)
function startPanelDragTouch(e) {
    if (e.target.classList.contains('panel-close')) return;
    
    const panel = document.getElementById('drawingPanel');
    isPanelMoving = true;
    panel.classList.add('moving');
    
    const touch = e.touches[0];
    const rect = panel.getBoundingClientRect();
    panelOffsetX = touch.clientX - rect.left;
    panelOffsetY = touch.clientY - rect.top;
    
    document.addEventListener('touchmove', onPanelDragTouch, { passive: false });
    document.addEventListener('touchend', stopPanelDrag);
    
    e.preventDefault();
}

// Перетаскивание (мышь)
function onPanelDrag(e) {
    if (!isPanelMoving) return;
    
    const panel = document.getElementById('drawingPanel');
    const x = e.clientX - panelOffsetX;
    const y = e.clientY - panelOffsetY;
    
    setPanelPosition(x, y);
}

// Перетаскивание (касание)
function onPanelDragTouch(e) {
    if (!isPanelMoving) return;
    
    const panel = document.getElementById('drawingPanel');
    const touch = e.touches[0];
    const x = touch.clientX - panelOffsetX;
    const y = touch.clientY - panelOffsetY;
    
    setPanelPosition(x, y);
    e.preventDefault();
}

// Остановка перетаскивания
function stopPanelDrag() {
    isPanelMoving = false;
    const panel = document.getElementById('drawingPanel');
    panel.classList.remove('moving');
    
    // Сохранение позиции
    savePanelPosition();
    
    document.removeEventListener('mousemove', onPanelDrag);
    document.removeEventListener('touchmove', onPanelDragTouch);
    document.removeEventListener('mouseup', stopPanelDrag);
    document.removeEventListener('touchend', stopPanelDrag);
}

// Установка позиции панели
function setPanelPosition(x, y) {
    const panel = document.getElementById('drawingPanel');
    const maxX = window.innerWidth - panel.offsetWidth;
    const maxY = window.innerHeight - panel.offsetHeight;
    
    // Ограничение движения в пределах окна
    x = Math.max(0, Math.min(x, maxX));
    y = Math.max(0, Math.min(y, maxY));
    
    panel.style.left = x + 'px';
    panel.style.top = y + 'px';
    panel.style.transform = 'none';
}

// Сохранение позиции панели
function savePanelPosition() {
    const panel = document.getElementById('drawingPanel');
    const position = {
        x: parseInt(panel.style.left) || 20,
        y: parseInt(panel.style.top) || (window.innerHeight - panel.offsetHeight) / 2
    };
    localStorage.setItem('tanais_panel_position', JSON.stringify(position));
}

// Загрузка позиции панели
function loadPanelPosition() {
    const savedPosition = localStorage.getItem('tanais_panel_position');
    if (savedPosition) {
        const position = JSON.parse(savedPosition);
        setPanelPosition(position.x, position.y);
    }
}

// === ФУНКЦИИ ДЛЯ РИСОВАНИЯ ===

// Настройка canvas для рисования
function setupDrawingCanvas() {
    canvas = document.getElementById('drawingCanvas');
    ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        redrawShapes();
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', stopDrawing);
}

// Настройка элементов управления рисованием
function setupDrawingControls() {
    const lineWidthSlider = document.getElementById('lineWidth');
    const lineWidthValue = document.getElementById('lineWidthValue');
    
    lineWidthSlider.addEventListener('input', function() {
        currentLineWidth = this.value;
        lineWidthValue.textContent = this.value + 'px';
    });
    
    loadDrawing();
}

// Включение/выключение режима рисования
function toggleDrawingMode() {
    const toggle = document.getElementById('drawingModeToggle');
    isDrawingMode = toggle.checked;
    
    if (isDrawingMode) {
        canvas.classList.add('drawing-active');
        showNotification('🎨 Режим рисования включен');
    } else {
        canvas.classList.remove('drawing-active');
        showNotification('❌ Режим рисования выключен');
    }
}

// Показать/скрыть панель рисования
function toggleDrawingPanel() {
    const panel = document.getElementById('drawingPanel');
    panel.classList.toggle('active');
}

// Установка инструмента
function setTool(tool) {
    currentTool = tool;
    
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tool="${tool}"]`).classList.add('active');
    
    showNotification(`🛠️ Инструмент: ${getToolName(tool)}`);
}

// Получение названия инструмента
function getToolName(tool) {
    const names = {
        'line': 'Линия',
        'rectangle': 'Прямоугольник',
        'circle': 'Круг',
        'arrow': 'Стрелка'
    };
    return names[tool] || tool;
}

// Установка цвета
function setColor(color) {
    currentColor = color;
    
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector(`[data-color="${color}"]`).classList.add('active');
    
    document.getElementById('customColor').value = color;
}

// Установка кастомного цвета
function setCustomColor(color) {
    setColor(color);
}

// Установка стиля линии
function setLineStyle(style) {
    currentLineStyle = style;
    
    document.querySelectorAll('.style-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-style="${style}"]`).classList.add('active');
}

// Начало рисования
function startDrawing(e) {
    if (!isDrawingMode || isPanelMoving) return;
    
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    startX = (e.clientX || e.touches[0].clientX) - rect.left;
    startY = (e.clientY || e.touches[0].clientY) - rect.top;
}

// Обработка касаний
function handleTouchStart(e) {
    if (!isDrawingMode || isPanelMoving) return;
    e.preventDefault();
    startDrawing(e);
}

function handleTouchMove(e) {
    if (!isDrawingMode || isPanelMoving) return;
    e.preventDefault();
    draw(e);
}

// Процесс рисования
function draw(e) {
    if (!isDrawing || !isDrawingMode || isPanelMoving) return;
    
    const rect = canvas.getBoundingClientRect();
    const currentX = (e.clientX || e.touches[0].clientX) - rect.left;
    const currentY = (e.clientY || e.touches[0].clientY) - rect.top;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    redrawShapes();
    
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentLineWidth;
    ctx.setLineDash(getLineDashPattern());
    
    switch (currentTool) {
        case 'line':
            drawLine(startX, startY, currentX, currentY);
            break;
        case 'rectangle':
            drawRectangle(startX, startY, currentX - startX, currentY - startY);
            break;
        case 'circle':
            drawCircle(startX, startY, currentX, currentY);
            break;
        case 'arrow':
            drawArrow(startX, startY, currentX, currentY);
            break;
    }
}

// Остановка рисования
function stopDrawing() {
    if (!isDrawing) return;
    
    isDrawing = false;
    
    const rect = canvas.getBoundingClientRect();
    const currentX = (event.clientX || event.changedTouches[0].clientX) - rect.left;
    const currentY = (event.clientY || event.changedTouches[0].clientY) - rect.top;
    
    const shape = {
        tool: currentTool,
        color: currentColor,
        lineWidth: currentLineWidth,
        lineStyle: currentLineStyle,
        startX: startX,
        startY: startY,
        endX: currentX,
        endY: currentY,
        width: currentX - startX,
        height: currentY - startY
    };
    
    shapes.push(shape);
    saveDrawingToStorage();
}

// Получение паттерна для пунктирной линии
function getLineDashPattern() {
    switch (currentLineStyle) {
        case 'dashed':
            return [10, 5];
        case 'dotted':
            return [2, 5];
        default:
            return [];
    }
}

// Рисование линии
function drawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

// Рисование прямоугольника
function drawRectangle(x, y, width, height) {
    ctx.strokeRect(x, y, width, height);
}

// Рисование круга
function drawCircle(x1, y1, x2, y2) {
    const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    ctx.beginPath();
    ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
    ctx.stroke();
}

// Рисование стрелки
function drawArrow(x1, y1, x2, y2) {
    drawLine(x1, y1, x2, y2);
    
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowLength = 20;
    
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
        x2 - arrowLength * Math.cos(angle - Math.PI / 6),
        y2 - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(x2, y2);
    ctx.lineTo(
        x2 - arrowLength * Math.cos(angle + Math.PI / 6),
        y2 - arrowLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
}

// Перерисовка всех сохраненных фигур
function redrawShapes() {
    shapes.forEach(shape => {
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = shape.lineWidth;
        ctx.setLineDash(getStoredLineDashPattern(shape.lineStyle));
        
        switch (shape.tool) {
            case 'line':
                drawLine(shape.startX, shape.startY, shape.endX, shape.endY);
                break;
            case 'rectangle':
                drawRectangle(shape.startX, shape.startY, shape.width, shape.height);
                break;
            case 'circle':
                drawCircle(shape.startX, shape.startY, shape.endX, shape.endY);
                break;
            case 'arrow':
                drawArrow(shape.startX, shape.startY, shape.endX, shape.endY);
                break;
        }
    });
}

// Получение паттерна для сохраненных фигур
function getStoredLineDashPattern(style) {
    switch (style) {
        case 'dashed':
            return [10, 5];
        case 'dotted':
            return [2, 5];
        default:
            return [];
    }
}

// Очистка canvas
function clearCanvas() {
    shapes = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    localStorage.removeItem('tanais_drawing');
    showNotification('🧹 Холст очищен');
}

// Отмена последнего действия
function undoLast() {
    if (shapes.length > 0) {
        shapes.pop();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        redrawShapes();
        saveDrawingToStorage();
        showNotification('↶ Последнее действие отменено');
    }
}

// Сохранение рисунка
function saveDrawing() {
    saveDrawingToStorage();
    showNotification('💾 Рисунок сохранен');
}

// Сохранение в localStorage
function saveDrawingToStorage() {
    localStorage.setItem('tanais_drawing', JSON.stringify(shapes));
}

// Загрузка рисунка
function loadDrawing() {
    const savedDrawing = localStorage.getItem('tanais_drawing');
    if (savedDrawing) {
        shapes = JSON.parse(savedDrawing);
        redrawShapes();
    }
}

// Показать уведомление
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// === ОСНОВНЫЕ ФУНКЦИИ САЙТА ===

// Функция сохранения состояния
function saveState() {
    localStorage.setItem('tanais_products', JSON.stringify(products));
    localStorage.setItem('tanais_isModerator', JSON.stringify(isModerator));
    localStorage.setItem('tanais_logoType', document.getElementById('siteTitle').innerHTML);
}

// Функция восстановления состояния
function restoreState() {
    const savedLogo = localStorage.getItem('tanais_logoType');
    if (savedLogo && savedLogo !== 'ТАНАИС') {
        document.getElementById('siteTitle').innerHTML = savedLogo;
        
        const logoImg = document.getElementById('siteTitle').querySelector('img');
        if (logoImg) {
            applyLogoStyles(logoImg);
            
            logoImg.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                if (!isModerator) {
                    alert('Для изменения логотипа войдите в режим модератора!');
                    return;
                }
                showLogoContextMenu(e);
            });
        }
    } else {
        applyTitleFont();
    }
    
    if (isModerator) {
        const moderatorBtn = document.getElementById('moderatorBtn');
        moderatorBtn.textContent = 'Вы в режиме модератора';
        moderatorBtn.style.background = 'linear-gradient(135deg, #4caf50, #66bb6a)';
        document.getElementById('addProductForm').style.display = 'block';
        document.body.classList.add('moderator-mode');
        
        // Показать панель рисования при входе в режим модератора
        setTimeout(() => {
            toggleDrawingPanel();
        }, 1000);
    }
}

// Функция применения стилей к логотипу (БЕЗ БЕЛЫХ ГРАНИЦ)
function applyLogoStyles(logoImg) {
    logoImg.style.height = '140px'; // Уменьшено с 200px
    logoImg.style.maxWidth = '600px'; // Уменьшено с 800px
    logoImg.style.cursor = 'pointer';
    logoImg.style.objectFit = 'contain';
    logoImg.style.position = 'relative';
    logoImg.style.zIndex = '10';
    logoImg.style.borderRadius = '10px';
    logoImg.style.background = 'transparent';
}

// Настройка увеличения логотипа
function setupLogoZoom() {
    const siteTitle = document.getElementById('siteTitle');
    
    const logoImg = siteTitle.querySelector('img');
    if (logoImg) {
        logoImg.style.cursor = 'zoom-in';
        logoImg.title = 'Кликните для увеличения';
        logoImg.addEventListener('click', function(e) {
            e.stopPropagation();
            openLogoZoomModal(this.src);
        });
    }
}

// Открытие модального окна с увеличенным логотипом
function openLogoZoomModal(logoUrl) {
    const zoomModal = document.createElement('div');
    zoomModal.id = 'logoZoomModal';
    zoomModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        cursor: zoom-out;
    `;
    
    zoomModal.innerHTML = `
        <div style="position: relative; max-width: 90%; max-height: 90%;">
            <img src="${logoUrl}" alt="Увеличенный логотип" style="
                max-width: 100%; 
                max-height: 90vh; 
                border-radius: 10px;
                background: transparent;
            ">
            <button onclick="closeLogoZoomModal()" style="position: absolute; top: -50px; right: -50px; background: #ff6b6b; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">×</button>
        </div>
    `;
    
    document.body.appendChild(zoomModal);
    
    // Затемняем canvas при открытии модального окна
    addCanvasDimClass();
    
    zoomModal.addEventListener('click', function(e) {
        if (e.target === zoomModal) {
            closeLogoZoomModal();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeLogoZoomModal();
        }
    });
}

// Закрытие модального окна с увеличенным логотипом
function closeLogoZoomModal() {
    const zoomModal = document.getElementById('logoZoomModal');
    if (zoomModal) {
        zoomModal.remove();
    }
    // Убираем затемнение canvas
    removeCanvasDimClass();
}

// Настройка модального окна информации о компании
function setupAboutInfoModal() {
    const aboutInfoBtn = document.getElementById('aboutInfoBtn');
    const aboutInfoModal = document.getElementById('aboutInfoModal');
    const closeAboutInfo = document.getElementById('closeAboutInfo');

    aboutInfoBtn.addEventListener('click', function() {
        aboutInfoModal.style.display = 'block';
        // Затемняем canvas при открытии модального окна
        addCanvasDimClass();
    });

    closeAboutInfo.addEventListener('click', function() {
        aboutInfoModal.style.display = 'none';
        // Убираем затемнение canvas
        removeCanvasDimClass();
    });

    window.addEventListener('click', function(event) {
        if (event.target === aboutInfoModal) {
            aboutInfoModal.style.display = 'none';
            // Убираем затемнение canvas
            removeCanvasDimClass();
        }
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && aboutInfoModal.style.display === 'block') {
            aboutInfoModal.style.display = 'none';
            // Убираем затемнение canvas
            removeCanvasDimClass();
        }
    });
}

// Настройка контекстного меню для логотипа
function setupLogoContextMenu() {
    const siteTitle = document.getElementById('siteTitle');
    
    siteTitle.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        
        if (!isModerator) {
            alert('Для изменения логотипа войдите в режим модератора!');
            return;
        }
        
        showLogoContextMenu(e);
    });
    
    document.addEventListener('click', function() {
        hideLogoContextMenu();
    });
}

// Показать контекстное меню для логотипа
function showLogoContextMenu(e) {
    hideLogoContextMenu();
    
    const contextMenu = document.createElement('div');
    contextMenu.id = 'logoContextMenu';
    contextMenu.style.cssText = `
        position: fixed;
        top: ${e.pageY}px;
        left: ${e.pageX}px;
        background: white;
        border: 2px solid #42a5f5;
        border-radius: 8px;
        padding: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        min-width: 200px;
    `;
    
    contextMenu.innerHTML = `
        <div style="color: #1565c0; font-weight: bold; margin-bottom: 10px; text-align: center;">Управление логотипом</div>
        <button onclick="openLogoFileDialog()" style="width: 100%; background: linear-gradient(135deg, #42a5f5, #1976d2); color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; margin-bottom: 5px; font-weight: bold;">Загрузить изображение</button>
        <button onclick="resetLogoToText()" style="width: 100%; background: linear-gradient(135deg, #ff6b6b, #ff8e53); color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-weight: bold;">Вернуть текст</button>
    `;
    
    document.body.appendChild(contextMenu);
}

// Скрыть контекстное меню
function hideLogoContextMenu() {
    const contextMenu = document.getElementById('logoContextMenu');
    if (contextMenu) {
        contextMenu.remove();
    }
}

// Открыть диалог выбора файла
function openLogoFileDialog() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.match('image.*')) {
                alert('Пожалуйста, выберите файл изображения (JPG, PNG)');
                return;
            }
            
            if (file.size > 2 * 1024 * 1024) {
                alert('Файл слишком большой! Максимальный размер: 2MB');
                return;
            }
            
            applyLogoFromFile(file);
        }
    });
    
    fileInput.click();
    hideLogoContextMenu();
}

// Применить логотип из файла
function applyLogoFromFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const siteTitle = document.getElementById('siteTitle');
        siteTitle.innerHTML = `<img src="${e.target.result}" alt="ТАНАИС">`;
        
        const logoImg = siteTitle.querySelector('img');
        applyLogoStyles(logoImg);
        
        logoImg.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            showLogoContextMenu(e);
        });
        
        logoImg.style.cursor = 'zoom-in';
        logoImg.title = 'Кликните для увеличения';
        logoImg.addEventListener('click', function(e) {
            e.stopPropagation();
            openLogoZoomModal(this.src);
        });
        
        saveState();
        alert('Логотип успешно применен и сохранен! Теперь вы можете кликнуть по нему для увеличения.');
    };
    
    reader.onerror = function() {
        alert('Ошибка при загрузке изображения');
    };
    
    reader.readAsDataURL(file);
}

// Вернуть текстовый логотип
function resetLogoToText() {
    const siteTitle = document.getElementById('siteTitle');
    siteTitle.innerHTML = 'ТАНАИС';
    applyTitleFont();
    
    siteTitle.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        if (!isModerator) {
            alert('Для изменения логотипа войдите в режим модератора!');
            return;
        }
        showLogoContextMenu(e);
    });
    
    saveState();
    alert('Логотип сброшен до текстового вида и сохранен!');
    hideLogoContextMenu();
}

// Функция применения шрифта к названию "ТАНАИС"
function applyTitleFont() {
    const siteTitle = document.getElementById('siteTitle');
    if (siteTitle && SELECTED_FONT) {
        siteTitle.style.fontFamily = SELECTED_FONT;
        siteTitle.style.fontSize = '50px'; // Уменьшено с 60px
        siteTitle.style.fontWeight = 'bold';
        siteTitle.style.color = '#1565c0';
        siteTitle.style.lineHeight = '1.1';
        siteTitle.style.cursor = 'default';
        siteTitle.style.background = 'transparent';
        siteTitle.style.border = 'none';
        siteTitle.style.outline = 'none';
        siteTitle.style.boxShadow = 'none';
        siteTitle.style.padding = '0';
    }
}

// Настройка режима модератора
function setupModeratorMode() {
    const moderatorBtn = document.getElementById('moderatorBtn');
    const loginModal = document.getElementById('loginModal');
    const closeLogin = document.getElementById('closeLogin');
    const loginBtn = document.getElementById('loginBtn');

    moderatorBtn.addEventListener('click', function() {
        if (!isModerator) {
            loginModal.style.display = 'block';
            // Затемняем canvas при открытии модального окна
            addCanvasDimClass();
        } else {
            logoutModerator();
        }
    });

    closeLogin.addEventListener('click', function() {
        loginModal.style.display = 'none';
        document.getElementById('moderatorPassword').value = '';
        // Убираем затемнение canvas
        removeCanvasDimClass();
    });

    loginBtn.addEventListener('click', function() {
        const password = document.getElementById('moderatorPassword').value;
        if (password === MODERATOR_PASSWORD) {
            loginModerator();
            loginModal.style.display = 'none';
            document.getElementById('moderatorPassword').value = '';
            // Убираем затемнение canvas
            removeCanvasDimClass();
        } else {
            alert('Неверный пароль!');
        }
    });

    document.getElementById('moderatorPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginBtn.click();
        }
    });

    window.addEventListener('click', function(event) {
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
            document.getElementById('moderatorPassword').value = '';
            // Убираем затемнение canvas
            removeCanvasDimClass();
        }
        hideLogoContextMenu();
    });
}

// Вход в режим модератора
function loginModerator() {
    isModerator = true;
    const moderatorBtn = document.getElementById('moderatorBtn');
    moderatorBtn.textContent = 'Вы в режиме модератора';
    moderatorBtn.style.background = 'linear-gradient(135deg, #4caf50, #66bb6a)';
    
    document.getElementById('addProductForm').style.display = 'block';
    document.body.classList.add('moderator-mode');
    displayProducts(products);
    saveState();
    
    // Показать панель рисования
    setTimeout(() => {
        toggleDrawingPanel();
    }, 1000);
    
    alert('Режим модератора активирован и сохранен! Теперь вы можете:\n- Перемещать панель рисования за заголовок\n- Использовать инструменты рисования\n- Кликнуть ПРАВОЙ кнопкой мыши по логотипу для замены\n- Добавлять и удалять товары\n- Кликнуть ЛЕВОЙ кнопкой по логотипу для увеличения');
}

// Выход из режима модератора
function logoutModerator() {
    isModerator = false;
    const moderatorBtn = document.getElementById('moderatorBtn');
    moderatorBtn.textContent = 'Режим модератора';
    moderatorBtn.style.background = 'linear-gradient(135deg, #ff6b6b, #ff8e53)';
    
    document.getElementById('addProductForm').style.display = 'none';
    document.body.classList.remove('moderator-mode');
    displayProducts(products);
    saveState();
    
    // Скрыть панель рисования
    const panel = document.getElementById('drawingPanel');
    panel.classList.remove('active');
    
    // Выключить режим рисования
    const toggle = document.getElementById('drawingModeToggle');
    toggle.checked = false;
    toggleDrawingMode();
    
    alert('Режим модератора деактивирован и сохранен.');
}

// Настройка загрузки изображений
function setupImageUpload() {
    const fileInput = document.getElementById('productImage');
    const fileName = document.getElementById('fileName');
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.match('image.*')) {
                alert('Пожалуйста, выберите файл изображения (JPG, PNG)');
                fileInput.value = '';
                fileName.textContent = 'Фото не выбрано';
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                alert('Файл слишком большой! Максимальный размер: 5MB');
                fileInput.value = '';
                fileName.textContent = 'Фото не выбрано';
                return;
            }
            
            fileName.textContent = file.name;
        } else {
            fileName.textContent = 'Фото не выбрано';
        }
    });
}

// Настройка формы добавления товара
function setupAddProductForm() {
    const addBtn = document.getElementById('addProductBtn');
    
    addBtn.addEventListener('click', function() {
        if (!isModerator) {
            alert('Для добавления товаров войдите в режим модератора!');
            return;
        }
        addNewProduct();
    });
}

// Добавление нового товара
function addNewProduct() {
    const name = document.getElementById('productName').value.trim();
    const category = document.getElementById('productCategory').value;
    const price = document.getElementById('productPrice').value;
    const description = document.getElementById('productDescription').value.trim();
    const features = document.getElementById('productFeatures').value.trim();
    const imageFile = document.getElementById('productImage').files[0];
    
    if (!name || !price || !description || !features) {
        alert('Пожалуйста, заполните все поля');
        return;
    }
    
    if (!imageFile) {
        alert('Пожалуйста, выберите фото товара');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const newProduct = {
            id: Date.now(),
            name: name,
            category: category,
            price: parseInt(price),
            image: e.target.result,
            description: description,
            features: features.split(',').map(f => f.trim()).filter(f => f !== '')
        };
        
        products.push(newProduct);
        displayProducts(products);
        resetForm();
        saveState();
        alert('Товар успешно добавлен в каталог и сохранен!');
    };
    
    reader.onerror = function() {
        alert('Ошибка при загрузке изображения. Попробуйте другой файл.');
    };
    
    reader.readAsDataURL(imageFile);
}

// Сброс формы
function resetForm() {
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productDescription').value = '';
    document.getElementById('productFeatures').value = '';
    document.getElementById('productImage').value = '';
    document.getElementById('fileName').textContent = 'Фото не выбрано';
}

// Отображение продуктов
function displayProducts(productsToShow) {
    const productsGrid = document.querySelector('.products-grid');
    productsGrid.innerHTML = '';
    
    productsToShow.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.setAttribute('data-category', product.category);
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTNmMmZkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzQyYTVmNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPsOXJ3N2O3N0dsO9IMOgIGthcnRpbmtvajwvdGV4dD48L3N2Zz4='">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.description.substring(0, 100)}...</p>
                <div class="product-price">${product.price.toLocaleString()} руб.</div>
            </div>
            ${isModerator ? `<button class="delete-btn" onclick="deleteProduct(${product.id})">×</button>` : ''}
        `;
        productCard.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-btn')) {
                openProductModal(product);
            }
        });
        productsGrid.appendChild(productCard);
    });
}

// Удаление товара
function deleteProduct(productId) {
    if (!isModerator) {
        alert('Для удаления товаров войдите в режим модератора!');
        return;
    }
    
    if (confirm('Вы уверены, что хотите удалить этот товар?')) {
        products = products.filter(product => product.id !== productId);
        displayProducts(products);
        saveState();
        alert('Товар удален из каталога и изменения сохранены!');
    }
}

// Настройка фильтров
function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            
            if (filter === 'all') {
                displayProducts(products);
            } else {
                const filteredProducts = products.filter(product => product.category === filter);
                displayProducts(filteredProducts);
            }
        });
    });
}

// Настройка модального окна товара
function setupModal() {
    const modal = document.getElementById('productModal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        // Убираем затемнение canvas
        removeCanvasDimClass();
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            // Убираем затемнение canvas
            removeCanvasDimClass();
        }
    });
}

// Открытие модального окна с информацией о продукте
function openProductModal(product) {
    const modal = document.getElementById('productModal');
    const modalBody = document.querySelector('.modal-body');
    
    modalBody.innerHTML = `
        <div class="modal-image">
            <img src="${product.image}" alt="${product.name}" 
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTNmMmZkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzQyYTVmNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPsOXJ3N2O3N0dsO9IMOgIGthcnRpbmtvajwvdGV4dD48L3N2Zz4='">
        </div>
        <div class="modal-details">
            <h2>${product.name}</h2>
            <div class="price">${product.price.toLocaleString()} руб.</div>
            <p>${product.description}</p>
            <h3>Характеристики:</h3>
            <ul>
                ${product.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
            <button class="btn" style="margin-top: 20px;" onclick="orderProduct('${product.name}')">Заказать</button>
            ${isModerator ? `<button class="btn" style="margin-top: 10px; background: linear-gradient(135deg, #f44336, #e53935);" onclick="deleteProduct(${product.id}); document.getElementById('productModal').style.display='none'">Удалить товар</button>` : ''}
        </div>
    `;
    
    modal.style.display = 'block';
    // Затемняем canvas при открытии модального окна
    addCanvasDimClass();
}

// Функция для заказа товара
function orderProduct(productName) {
    alert(`Спасибо за заказ "${productName}"! Мы свяжемся с вами в ближайшее время.`);
}

// Функция для сброса всех данных
function resetAllData() {
    if (confirm('Вы уверены, что хотите сбросить ВСЕ данные? Это действие нельзя отменить.')) {
        localStorage.removeItem('tanais_products');
        localStorage.removeItem('tanais_isModerator');
        localStorage.removeItem('tanais_logoType');
        localStorage.removeItem('tanais_drawing');
        localStorage.removeItem('tanais_panel_position');
        location.reload();
    }
}

// СКРЫТИЕ ПАНЕЛИ ПРИ ПРОКРУТКЕ ВНИЗ
let lastScrollTop = 0;
const header = document.querySelector('header');

window.addEventListener('scroll', function() {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Прокрутка вниз - скрываем панель
        header.classList.add('hide');
    } else {
        // Прокрутка вверх - показываем панель
        header.classList.remove('hide');
    }
    
    lastScrollTop = scrollTop;
});

// ДИНАМИЧЕСКИЕ АНИМАЦИИ ПРИ СКРОЛЛЕ
document.addEventListener('DOMContentLoaded', function() {
    // Отслеживание скролла для анимаций
    let ticking = false;
    
    function updateOnScroll() {
        const scrollY = window.pageYOffset;
        
        // Изменение цвета header
        const header = document.querySelector('header');
        if (scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Параллакс для волн
        const waves = document.querySelectorAll('.wave');
        waves.forEach((wave, index) => {
            const speed = 0.5 + (index * 0.1);
            wave.style.transform = `translateX(${scrollY * speed * 0.1}px)`;
        });
        
        // Параллакс для hero
        const heroBg = document.querySelector('.hero::before');
        if (heroBg) {
            heroBg.style.transform = `translateY(${scrollY * 0.5}px)`;
        }
        
        // Анимация появления элементов
        const elements = document.querySelectorAll('section, .product-card, .feature, .contact-item');
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add('visible');
            }
        });
        
        // Анимация кнопок
        const buttons = document.querySelectorAll('.btn, .moderator-btn');
        buttons.forEach(button => {
            const buttonTop = button.getBoundingClientRect().top;
            if (buttonTop < window.innerHeight - 100) {
                button.classList.add('scrolled');
            }
        });
        
        // Анимация футера
        const footer = document.querySelector('footer');
        const footerTop = footer.getBoundingClientRect().top;
        if (footerTop < window.innerHeight - 100) {
            footer.classList.add('visible');
        }
        
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateOnScroll);
            ticking = true;
        }
    }
    
    // События
    window.addEventListener('scroll', requestTick);
    window.addEventListener('resize', requestTick);
    
    // Инициализация при загрузке
    requestTick();
    
    // Запуск анимаций для видимых элементов
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Наблюдаем за элементами
    document.querySelectorAll('section, .product-card, .feature, .contact-item').forEach(el => {
        observer.observe(el);
    });
});

// РЕВЕРСИВНЫЕ АНИМАЦИИ ПРИ ПРОКРУТКЕ ВВЕРХ/ВНИЗ
document.addEventListener('DOMContentLoaded', function() {
    let lastScrollY = window.pageYOffset;
    let scrollDirection = 'down'; // 'down' или 'up'
    let ticking = false;
    let scrollProgress = 0;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    
    // Элементы для наблюдения
    const observedElements = new Map();
    
    function updateAnimations(scrollY, direction) {
        const scrollPercent = (scrollY / maxScroll) * 100;
        
        // 1. Анимация фона body
        document.body.style.backgroundPosition = `0% ${scrollPercent * 10}%`;
        
        // 2. Анимация header
        const header = document.querySelector('header');
        if (scrollY > 50) {
            if (direction === 'down') {
                header.classList.remove('scrolled-up');
                header.classList.add('scrolled-down');
            } else {
                header.classList.remove('scrolled-down');
                header.classList.add('scrolled-up');
            }
        } else {
            header.classList.remove('scrolled-down', 'scrolled-up');
        }
        
        // 3. Параллакс волн (реверсивный)
        const waves = document.querySelectorAll('.wave');
        waves.forEach((wave, index) => {
            const speed = 0.2 + (index * 0.05);
            const parallax = scrollY * speed;
            wave.style.transform = `translateX(${direction === 'down' ? -parallax : parallax * 0.5}px)`;
        });
        
        // 4. Анимация hero контента
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            if (direction === 'down') {
                heroContent.classList.add('scrolled-down');
                heroContent.classList.remove('scrolled-up');
            } else {
                heroContent.classList.add('scrolled-up');
                heroContent.classList.remove('scrolled-down');
            }
        }
        
        // 5. Анимация кнопок
        const buttons = document.querySelectorAll('.btn, .moderator-btn');
        buttons.forEach(button => {
            if (direction === 'down') {
                button.classList.add('scrolled-down');
                button.classList.remove('scrolled-up');
            } else {
                button.classList.add('scrolled-up');
                button.classList.remove('scrolled-down');
            }
        });
        
        // 6. Анимация футера
        const footer = document.querySelector('footer');
        if (scrollY > maxScroll * 0.7) {
            if (direction === 'down') {
                footer.classList.add('scrolled-down');
                footer.classList.remove('scrolled-up');
            } else {
                footer.classList.add('scrolled-up');
                footer.classList.remove('scrolled-down');
            }
        }
        
        // 7. Реверсивное наблюдение за видимостью элементов
        const elements = document.querySelectorAll('section, .product-card, .feature, .contact-item');
        elements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight - 100 && rect.bottom > 0;
            
            if (isVisible && !observedElements.get(element)) {
                // Элемент стал видимым
                element.classList.remove('hidden');
                element.classList.add('visible');
                observedElements.set(element, true);
                
                // Реверсивная задержка для анимации
                if (direction === 'up') {
                    element.style.transitionDelay = '0.2s';
                    setTimeout(() => {
                        element.style.transitionDelay = '';
                    }, 300);
                }
            } else if (!isVisible && observedElements.get(element)) {
                // Элемент скрылся
                element.classList.remove('visible');
                element.classList.add('hidden');
                observedElements.set(element, false);
            }
        });
        
        // 8. Анимация текста hero
        const heroText = document.querySelectorAll('.hero h2, .hero p');
        heroText.forEach(text => {
            if (scrollY < 300) {
                if (direction === 'down') {
                    text.classList.add('scrolled-down');
                }
            } else {
                text.classList.remove('scrolled-down');
            }
        });
        
        scrollProgress = scrollPercent;
        ticking = false;
    }
    
    function onScroll() {
        const currentScrollY = window.pageYOffset;
        
        // Определяем направление скролла
        if (currentScrollY > lastScrollY) {
            scrollDirection = 'down';
        } else if (currentScrollY < lastScrollY) {
            scrollDirection = 'up';
        }
        
        lastScrollY = currentScrollY;
        
        if (!ticking) {
            requestAnimationFrame(() => {
                updateAnimations(currentScrollY, scrollDirection);
            });
            ticking = true;
        }
    }
    
    // Создаем контейнер для hero контента если его нет
    const heroContainer = document.querySelector('.hero .container');
    if (heroContainer && !heroContainer.classList.contains('hero-content')) {
        heroContainer.classList.add('hero-content');
    }
    
    // Инициализация начального состояния
    observedElements.clear();
    document.querySelectorAll('section, .product-card, .feature, .contact-item').forEach(el => {
        observedElements.set(el, false);
    });
    
    // Слушатели событий
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    
    // Инициализация при загрузке
    onScroll();
    
    // Дополнительная анимация для плавного перехода
    const style = document.createElement('style');
    style.textContent = `
        .transition-all {
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .reverse-transition {
            transition: all 0.7s cubic-bezier(0.2, 0, 0.4, 1) !important;
        }
    `;
    document.head.appendChild(style);
});

// УПРАВЛЕНИЕ ВЕРХНЕЙ ПАНЕЛЬЮ
document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('header');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Прокрутка вниз - скрываем панель
            header.style.transform = 'translateY(-100%)';
            header.style.transition = 'transform 0.3s ease-in-out';
        } else {
            // Прокрутка вверх - показываем панель
            header.style.transform = 'translateY(0)';
            header.style.transition = 'transform 0.3s ease-in-out';
        }
        
        lastScrollTop = scrollTop;
    });
});

// ПЛАВНОЕ ОТКРЫВАНИЕ И ЗАКРЫТИЕ ОКОН
function setupSmoothWindowAnimations() {
    // 1. ПЛАВНОЕ ОТКРЫТИЕ МОДАЛЬНЫХ ОКОН
    const originalDisplayProducts = window.displayProducts;
    if (originalDisplayProducts) {
        window.displayProducts = function(productsToShow) {
            originalDisplayProducts.call(this, productsToShow);
            
            // Анимация появления карточек
            setTimeout(() => {
                document.querySelectorAll('.product-card').forEach((card, index) => {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(30px)';
                    card.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                    
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, index * 100);
                });
            }, 100);
        };
    }
    
    // 2. ПЛАВНОЕ ОТКРЫТИЕ МОДАЛЬНОГО ОКНА ТОВАРА
    const originalOpenProductModal = window.openProductModal;
    if (originalOpenProductModal) {
        window.openProductModal = function(product) {
            const modal = document.getElementById('productModal');
            const modalBody = document.querySelector('.modal-body');
            
            if (!modal || !modalBody) return;
            
            // Плавное появление модального окна
            modal.style.display = 'block';
            setTimeout(() => {
                modal.style.opacity = '1';
                modal.style.transform = 'translateY(0)';
            }, 10);
            
            modalBody.innerHTML = `
                <div class="modal-image">
                    <img src="${product.image}" alt="${product.name}" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTNmMmZkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzQyYTVmNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPsOXJ3N2O3N0dsO9IMOgIGthcnRpbmtvajwvdGV4dD48L3N2Zz4='">
                </div>
                <div class="modal-details">
                    <h2>${product.name}</h2>
                    <div class="price">${product.price.toLocaleString()} руб.</div>
                    <p>${product.description}</p>
                    <h3>Характеристики:</h3>
                    <ul>
                        ${product.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                    <button class="btn" style="margin-top: 20px;" onclick="orderProduct('${product.name}')">Заказать</button>
                    ${isModerator ? `<button class="btn" style="margin-top: 10px; background: linear-gradient(135deg, #f44336, #e53935);" onclick="deleteProduct(${product.id}); closeModal('productModal')">Удалить товар</button>` : ''}
                </div>
            `;
            
            // Анимация появления контента внутри модального окна
            setTimeout(() => {
                const modalContent = modal.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.style.opacity = '0';
                    modalContent.style.transform = 'scale(0.9) translateY(20px)';
                    modalContent.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                    
                    setTimeout(() => {
                        modalContent.style.opacity = '1';
                        modalContent.style.transform = 'scale(1) translateY(0)';
                    }, 50);
                }
                
                // Последовательное появление элементов внутри
                const elements = modalBody.querySelectorAll('*');
                elements.forEach((el, index) => {
                    el.style.opacity = '0';
                    el.style.transform = 'translateY(15px)';
                    el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                    
                    setTimeout(() => {
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0)';
                    }, 200 + (index * 50));
                });
            }, 100);
            
            // Затемняем canvas
            if (typeof addCanvasDimClass === 'function') {
                addCanvasDimClass();
            }
        };
    }
    
    // 3. ПЛАВНОЕ ЗАКРЫТИЕ МОДАЛЬНЫХ ОКОН
    function closeModalSmoothly(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        // Анимация закрытия
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.opacity = '0';
            modalContent.style.transform = 'scale(0.9) translateY(20px)';
        }
        
        modal.style.opacity = '0';
        
        setTimeout(() => {
            modal.style.display = 'none';
            modal.style.opacity = '1';
            if (modalContent) {
                modalContent.style.opacity = '1';
                modalContent.style.transform = 'scale(1) translateY(0)';
            }
            
            // Убираем затемнение canvas
            if (typeof removeCanvasDimClass === 'function') {
                removeCanvasDimClass();
            }
        }, 400);
    }
    
    // 4. ОБРАБОТЧИКИ ДЛЯ КНОПОК ЗАКРЫТИЯ
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                closeModalSmoothly(modal.id);
            }
        });
    });
    
    // 5. ЗАКРЫТИЕ ПО КЛИКУ ВНЕ ОКНА
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModalSmoothly(event.target.id);
        }
    });
    
    // 6. ПЛАВНОЕ ОТКРЫТИЕ ОКНА ВХОДА
    const moderatorBtn = document.getElementById('moderatorBtn');
    if (moderatorBtn) {
        moderatorBtn.addEventListener('click', function(e) {
            if (!isModerator) {
                e.preventDefault();
                const loginModal = document.getElementById('loginModal');
                
                if (loginModal) {
                    // Плавное появление
                    loginModal.style.display = 'block';
                    setTimeout(() => {
                        loginModal.style.opacity = '1';
                        loginModal.style.transform = 'translateY(0)';
                    }, 10);
                    
                    // Анимация контента
                    setTimeout(() => {
                        const modalContent = loginModal.querySelector('.modal-content');
                        if (modalContent) {
                            modalContent.style.opacity = '0';
                            modalContent.style.transform = 'scale(0.9) translateY(20px)';
                            modalContent.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                            
                            setTimeout(() => {
                                modalContent.style.opacity = '1';
                                modalContent.style.transform = 'scale(1) translateY(0)';
                            }, 50);
                        }
                        
                        // Анимация элементов формы
                        const formElements = loginModal.querySelectorAll('input, button, h2');
                        formElements.forEach((el, index) => {
                            el.style.opacity = '0';
                            el.style.transform = 'translateY(10px)';
                            el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                            
                            setTimeout(() => {
                                el.style.opacity = '1';
                                el.style.transform = 'translateY(0)';
                            }, 200 + (index * 100));
                        });
                    }, 100);
                    
                    // Затемняем canvas
                    if (typeof addCanvasDimClass === 'function') {
                        addCanvasDimClass();
                    }
                }
            }
        });
    }
    
    // 7. ПЛАВНОЕ ОТКРЫТИЕ ИНФОРМАЦИИ О КОМПАНИИ
    const aboutInfoBtn = document.getElementById('aboutInfoBtn');
    if (aboutInfoBtn) {
        aboutInfoBtn.addEventListener('click', function() {
            const aboutModal = document.getElementById('aboutInfoModal');
            
            if (aboutModal) {
                // Плавное появление
                aboutModal.style.display = 'block';
                setTimeout(() => {
                    aboutModal.style.opacity = '1';
                    aboutModal.style.transform = 'translateY(0)';
                }, 10);
                
                // Анимация контента
                setTimeout(() => {
                    const modalContent = aboutModal.querySelector('.modal-content');
                    if (modalContent) {
                        modalContent.style.opacity = '0';
                        modalContent.style.transform = 'scale(0.95) translateY(30px)';
                        modalContent.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                        
                        setTimeout(() => {
                            modalContent.style.opacity = '1';
                            modalContent.style.transform = 'scale(1) translateY(0)';
                        }, 50);
                    }
                }, 100);
                
                // Затемняем canvas
                if (typeof addCanvasDimClass === 'function') {
                    addCanvasDimClass();
                }
            }
        });
    }
    
    // 8. ПЛАВНАЯ ПАНЕЛЬ РИСОВАНИЯ
    const drawingPanel = document.getElementById('drawingPanel');
    if (drawingPanel) {
        window.toggleDrawingPanel = function() {
            if (drawingPanel.classList.contains('active')) {
                // Плавное скрытие
                drawingPanel.style.opacity = '0';
                drawingPanel.style.transform = 'translateX(-100%) translateY(-50%)';
                
                setTimeout(() => {
                    drawingPanel.classList.remove('active');
                    drawingPanel.style.opacity = '1';
                    drawingPanel.style.transform = 'translateX(0) translateY(-50%)';
                }, 400);
            } else {
                // Плавное появление
                drawingPanel.classList.add('active');
                drawingPanel.style.opacity = '0';
                drawingPanel.style.transform = 'translateX(-100%) translateY(-50%)';
                
                setTimeout(() => {
                    drawingPanel.style.opacity = '1';
                    drawingPanel.style.transform = 'translateX(0) translateY(-50%)';
                }, 10);
            }
        };
    }
    
    // 9. ГЛОБАЛЬНЫЕ ФУНКЦИИ
    window.closeModal = closeModalSmoothly;
}

// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем плавные анимации для всех окон
    setupSmoothWindowAnimations();
    
    // Инициализируем CSS переходы для окон
    const style = document.createElement('style');
    style.textContent = `
        /* Плавные переходы для модальных окон */
        .modal {
            transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                        transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            transform: translateY(-20px);
        }
        
        .modal-content {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Плавное появление карточек товаров */
        .product-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Плавная панель рисования */
        .drawing-panel {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
    `;
    document.head.appendChild(style);
});

// ЦИКЛИЧНОЕ ПЛАВНОЕ УВЕЛИЧЕНИЕ И УМЕНЬШЕНИЕ ОКОН
document.addEventListener('DOMContentLoaded', function() {
    
    // 1. ФУНКЦИЯ ОТКРЫТИЯ ОКНА С УВЕЛИЧЕНИЕМ
    window.openModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        // Убираем класс закрытия если был
        modal.classList.remove('closing');
        
        // Показываем окно
        modal.style.display = 'flex';
        
        // Ждем один кадр и запускаем анимацию увеличения
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        // Затемняем canvas
        document.body.classList.add('modal-open');
        
        // Запускаем эффект волны
        createRippleEffect(modal);
        
        // Закрываем другие открытые окна
        document.querySelectorAll('.modal.active').forEach(otherModal => {
            if (otherModal.id !== modalId && !otherModal.classList.contains('closing')) {
                window.closeModal(otherModal.id);
            }
        });
    };
    
    // 2. ФУНКЦИЯ ЗАКРЫТИЯ ОКНА С УМЕНЬШЕНИЕМ
    window.closeModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        // Запускаем анимацию уменьшения
        modal.classList.add('closing');
        modal.classList.remove('active');
        
        // Ждем окончания анимации и скрываем окно
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('closing');
        }, 600);
        
        // Убираем затемнение canvas если нет других открытых окон
        const hasActiveModals = document.querySelectorAll('.modal.active').length > 0;
        if (!hasActiveModals) {
            document.body.classList.remove('modal-open');
        }
    };
    
    // 3. ЭФФЕКТ ВОЛНЫ ПРИ ОТКРЫТИИ
    function createRippleEffect(modal) {
        // Удаляем старый эффект если есть
        const oldRipple = modal.querySelector('.ripple-effect');
        if (oldRipple) oldRipple.remove();
        
        // Создаем новый эффект волны
        const ripple = document.createElement('div');
        ripple.className = 'ripple-effect';
        ripple.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100px;
            height: 100px;
            background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%);
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(0);
            animation: rippleEffect 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
            pointer-events: none;
            z-index: 2001;
        `;
        modal.appendChild(ripple);
        
        // Удаляем эффект после завершения анимации
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 800);
    }
    
    // 4. ОКНО ТОВАРА
    const originalOpenProductModal = window.openProductModal;
    if (originalOpenProductModal) {
        window.openProductModal = function(product) {
            const modalBody = document.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = `
                    <div class="modal-image">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="modal-details">
                        <h2>${product.name}</h2>
                        <div class="price">${product.price.toLocaleString()} руб.</div>
                        <p>${product.description}</p>
                        <h3>Характеристики:</h3>
                        <ul>
                            ${product.features.map(feature => `<li>${feature}</li>`).join('')}
                        </ul>
                        <button class="btn" style="margin-top: 20px;" onclick="orderProduct('${product.name}')">Заказать</button>
                        ${isModerator ? `<button class="btn" style="margin-top: 10px; background: linear-gradient(135deg, #f44336, #e53935);" onclick="deleteProduct(${product.id}); closeModal('productModal')">Удалить товар</button>` : ''}
                    </div>
                `;
            }
            window.openModal('productModal');
        };
    }
    
    // 5. ОБРАБОТЧИКИ ЗАКРЫТИЯ
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                window.closeModal(modal.id);
            }
        });
    });
    
    // 6. ЗАКРЫТИЕ ПО КЛИКУ ВНЕ ОКНА
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            window.closeModal(event.target.id);
        }
    });
    
    // 7. ЗАКРЫТИЕ ПО ESCAPE
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                window.closeModal(modal.id);
            });
        }
    });
    
    // 8. ОКНО ВХОДА
    const moderatorBtn = document.getElementById('moderatorBtn');
    if (moderatorBtn) {
        moderatorBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (!isModerator) {
                window.openModal('loginModal');
            } else {
                if (confirm('Вы действительно хотите выйти из режима модератора?')) {
                    if (typeof logoutModerator === 'function') {
                        logoutModerator();
                    }
                }
            }
        });
    }
    
    // 9. КНОПКА ВХОДА
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            const password = document.getElementById('moderatorPassword').value;
            const MODERATOR_PASSWORD = "admin123";
            
            if (password === MODERATOR_PASSWORD) {
                if (typeof loginModerator === 'function') {
                    loginModerator();
                }
                window.closeModal('loginModal');
                document.getElementById('moderatorPassword').value = '';
            } else {
                alert('Неверный пароль!');
            }
        });
    }
    
    // 10. ОКНО ИНФОРМАЦИИ О КОМПАНИИ
    const aboutInfoBtn = document.getElementById('aboutInfoBtn');
    if (aboutInfoBtn) {
        aboutInfoBtn.addEventListener('click', function() {
            window.openModal('aboutInfoModal');
        });
    }
    
    // 11. ПАНЕЛЬ РИСОВАНИЯ С УВЕЛИЧЕНИЕМ/УМЕНЬШЕНИЕМ
    const drawingPanel = document.getElementById('drawingPanel');
    if (drawingPanel) {
        window.toggleDrawingPanel = function() {
            if (drawingPanel.classList.contains('active')) {
                // Уменьшаем и скрываем
                drawingPanel.classList.add('closing');
                drawingPanel.classList.remove('active');
                
                setTimeout(() => {
                    drawingPanel.style.display = 'none';
                    drawingPanel.classList.remove('closing');
                }, 600);
            } else {
                // Показываем и увеличиваем
                drawingPanel.style.display = 'block';
                setTimeout(() => {
                    drawingPanel.classList.add('active');
                }, 10);
            }
        };
        
        // Кнопка закрытия панели
        const panelClose = drawingPanel.querySelector('.panel-close');
        if (panelClose) {
            panelClose.addEventListener('click', function() {
                window.toggleDrawingPanel();
            });
        }
    }
    
    // 12. ENTER В ПОЛЕ ПАРОЛЯ
    const passwordInput = document.getElementById('moderatorPassword');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const loginBtn = document.getElementById('loginBtn');
                if (loginBtn) {
                    loginBtn.click();
                }
            }
        });
    }
    
    // 13. УВЕДОМЛЕНИЯ С УВЕЛИЧЕНИЕМ/УМЕНЬШЕНИЕМ
    const originalShowNotification = window.showNotification;
    if (originalShowNotification) {
        window.showNotification = function(message) {
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('show');
            }, 10);
            
            setTimeout(() => {
                notification.classList.remove('show');
                notification.classList.add('hiding');
                
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 500);
            }, 3000);
        };
    }
    
});


// После загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    // Другие функции...
    
    // Сбрасываем стили кнопки модератора если они были установлены
    const moderatorBtn = document.getElementById('moderatorBtn');
    if (moderatorBtn) {
        moderatorBtn.style.background = 'transparent';
        moderatorBtn.style.color = 'transparent';
        moderatorBtn.style.border = 'none';
        moderatorBtn.style.padding = '0';
        moderatorBtn.style.margin = '0 auto';
        moderatorBtn.style.width = '40px';
        moderatorBtn.style.height = '20px';
        moderatorBtn.style.opacity = '0.05';
        moderatorBtn.style.fontSize = '0';
    }
});









// === ДОБАВЛЕНИЕ ФУНКЦИОНАЛА ДЛЯ НЕОГРАНИЧЕННОГО КОЛИЧЕСТВА ФОТО ===

// 1. Модифицируем функцию setupImageUpload для неограниченного выбора фото
const originalSetupImageUpload = window.setupImageUpload;
window.setupImageUpload = function() {
    // Вызываем оригинальную функцию если она есть
    if (typeof originalSetupImageUpload === 'function') {
        originalSetupImageUpload();
    }
    
    const fileInput = document.getElementById('productImage');
    const fileName = document.getElementById('fileName');
    
    if (fileInput) {
        // Добавляем атрибут multiple для выбора нескольких файлов
        fileInput.setAttribute('multiple', 'multiple');
        
        // Обновляем обработчик change
        fileInput.addEventListener('change', function(e) {
            const files = e.target.files;
            if (files && files.length > 0) {
                // Проверяем типы файлов
                const invalidFiles = Array.from(files).filter(file => !file.type.match('image.*'));
                
                if (invalidFiles.length > 0) {
                    alert('Некоторые файлы не являются изображениями. Пожалуйста, выберите только файлы изображений (JPG, PNG, GIF)');
                    fileInput.value = '';
                    fileName.textContent = 'Фото не выбрано';
                    return;
                }
                
                // Проверяем размер файлов (5MB каждый)
                const largeFiles = Array.from(files).filter(file => file.size > 5 * 1024 * 1024);
                if (largeFiles.length > 0) {
                    alert(`Некоторые файлы слишком большие! Максимальный размер каждого файла: 5MB\nСлишком большие файлы: ${largeFiles.length}`);
                    fileInput.value = '';
                    fileName.textContent = 'Фото не выбрано';
                    return;
                }
                
                // Показываем количество выбранных файлов
                fileName.textContent = `Выбрано ${files.length} фото`;
                fileName.style.color = '#4caf50';
                fileName.style.fontWeight = 'bold';
                
                // Добавляем подсказку
                let hint = fileName.parentNode.querySelector('.file-hint');
                if (!hint) {
                    hint = document.createElement('div');
                    hint.className = 'file-hint';
                    hint.style.cssText = 'font-size: 12px; color: #666; margin-top: 5px; font-style: italic;';
                    fileName.parentNode.appendChild(hint);
                }
                hint.textContent = `Можно выбрать любое количество фото. Используйте Ctrl+Клик для выбора нескольких файлов.`;
                
            } else {
                fileName.textContent = 'Фото не выбрано';
                fileName.style.color = '';
                fileName.style.fontWeight = '';
                
                // Убираем подсказку
                const hint = fileName.parentNode.querySelector('.file-hint');
                if (hint) {
                    hint.remove();
                }
            }
        });
    }
};

// 2. Модифицируем функцию addNewProduct для сохранения всех фото
const originalAddNewProduct = window.addNewProduct;
window.addNewProduct = function() {
    const name = document.getElementById('productName').value.trim();
    const category = document.getElementById('productCategory').value;
    const price = document.getElementById('productPrice').value;
    const description = document.getElementById('productDescription').value.trim();
    const features = document.getElementById('productFeatures').value.trim();
    const imageFiles = document.getElementById('productImage').files;
    
    // Валидация
    if (!name || !price || !description || !features) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
    }
    
    if (!imageFiles || imageFiles.length === 0) {
        alert('Пожалуйста, выберите хотя бы одно фото товара');
        return;
    }
    
    // Конвертируем все выбранные фото в base64
    const fileReaders = [];
    const base64Images = [];
    
    Array.from(imageFiles).forEach((file, index) => {
        const reader = new FileReader();
        fileReaders.push(new Promise((resolve, reject) => {
            reader.onload = function(e) {
                base64Images.push({
                    data: e.target.result,
                    name: file.name,
                    size: file.size,
                    type: file.type
                });
                resolve();
            };
            reader.onerror = function() {
                reject(`Ошибка при чтении файла: ${file.name}`);
            };
            reader.readAsDataURL(file);
        }));
    });
    
    // Когда все фото загружены
    Promise.all(fileReaders).then(() => {
        // Создаем новый товар с массивом всех фото
        const newProduct = {
            id: Date.now(),
            name: name,
            category: category,
            price: parseInt(price),
            images: base64Images.map(img => img.data), // Сохраняем все фото
            image: base64Images[0].data, // Первое фото для отображения в каталоге
            description: description,
            features: features.split(',').map(f => f.trim()).filter(f => f !== ''),
            imagesCount: base64Images.length // Сохраняем количество фото
        };
        
        // Добавляем товар в массив
        products.push(newProduct);
        
        // Обновляем отображение
        if (typeof displayProducts === 'function') {
            displayProducts(products);
        }
        
        // Сбрасываем форму
        document.getElementById('productName').value = '';
        document.getElementById('productPrice').value = '';
        document.getElementById('productDescription').value = '';
        document.getElementById('productFeatures').value = '';
        document.getElementById('productImage').value = '';
        document.getElementById('fileName').textContent = 'Фото не выбрано';
        document.getElementById('fileName').style.color = '';
        document.getElementById('fileName').style.fontWeight = '';
        
        // Убираем подсказку
        const hint = document.querySelector('.file-hint');
        if (hint) {
            hint.remove();
        }
        
        // Сохраняем в localStorage
        if (typeof saveState === 'function') {
            saveState();
        }
        
        // Показываем уведомление
        alert(`✅ Товар "${name}" успешно добавлен!\nЗагружено фото: ${base64Images.length}\nСтрелки для листания появятся при просмотре товара.`);
        
    }).catch(error => {
        alert(`Ошибка при загрузке фото: ${error}\nПопробуйте выбрать другие файлы.`);
    });
};

// 3. Добавляем стрелки для листания фото в модальном окне товара
const originalOpenProductModal = window.openProductModal;
window.openProductModal = function(product) {
    // Вызываем оригинальную функцию
    originalOpenProductModal.call(this, product);
    
    // Ждем пока модальное окно откроется
    setTimeout(() => {
        addPhotoNavigation(product);
    }, 100);
};

// Функция для добавления навигации по фото
function addPhotoNavigation(product) {
    const modalImage = document.querySelector('.modal-image');
    if (!modalImage) return;
    
    // Получаем массив фото товара
    const images = product.images || [product.image];
    
    // Если фото больше одного - добавляем навигацию
    if (images.length > 1) {
        // Создаем контейнер для изображения
        let imageContainer = modalImage.querySelector('.image-container');
        if (!imageContainer) {
            imageContainer = document.createElement('div');
            imageContainer.className = 'image-container';
            const img = modalImage.querySelector('img');
            if (img) {
                modalImage.insertBefore(imageContainer, img);
                imageContainer.appendChild(img);
            }
        }
        
        // Добавляем стили для контейнера
        imageContainer.style.position = 'relative';
        imageContainer.style.width = '100%';
        imageContainer.style.height = '100%';
        
        // Добавляем стрелки
        addNavigationArrows(imageContainer, images);
        
        // Добавляем счетчик
        addImageCounter(imageContainer, images);
    }
}

// Функция добавления стрелок навигации
function addNavigationArrows(container, images) {
    // Удаляем старые стрелки если есть
    const oldArrows = container.querySelectorAll('.photo-nav-arrow');
    oldArrows.forEach(arrow => arrow.remove());
    
    // Левая стрелка
    const prevArrow = document.createElement('button');
    prevArrow.className = 'photo-nav-arrow prev-arrow';
    prevArrow.innerHTML = '‹';
    prevArrow.style.cssText = `
        position: absolute;
        top: 50%;
        left: 20px;
        transform: translateY(-50%);
        width: 50px;
        height: 50px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        border: none;
        font-size: 30px;
        color: #1565c0;
        cursor: pointer;
        z-index: 100;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
    `;
    
    // Правая стрелка
    const nextArrow = document.createElement('button');
    nextArrow.className = 'photo-nav-arrow next-arrow';
    nextArrow.innerHTML = '›';
    nextArrow.style.cssText = prevArrow.style.cssText;
    nextArrow.style.left = '';
    nextArrow.style.right = '20px';
    
    // Добавляем hover эффекты
    [prevArrow, nextArrow].forEach(arrow => {
        arrow.addEventListener('mouseenter', () => {
            arrow.style.background = 'white';
            arrow.style.transform = 'translateY(-50%) scale(1.1)';
            arrow.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
        });
        
        arrow.addEventListener('mouseleave', () => {
            arrow.style.background = 'rgba(255, 255, 255, 0.9)';
            arrow.style.transform = 'translateY(-50%)';
            arrow.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        });
    });
    
    // Добавляем функционал листания
    let currentImageIndex = 0;
    const imageElement = container.querySelector('img');
    
    function showImage(index) {
        if (imageElement && images[index]) {
            imageElement.src = images[index];
            currentImageIndex = index;
            updateCounter();
        }
    }
    
    function nextImage() {
        currentImageIndex = (currentImageIndex + 1) % images.length;
        showImage(currentImageIndex);
    }
    
    function prevImage() {
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        showImage(currentImageIndex);
    }
    
    // Назначаем обработчики
    nextArrow.addEventListener('click', (e) => {
        e.stopPropagation();
        nextImage();
    });
    
    prevArrow.addEventListener('click', (e) => {
        e.stopPropagation();
        prevImage();
    });
    
    // Добавляем стрелки в контейнер
    container.appendChild(prevArrow);
    container.appendChild(nextArrow);
    
    // Добавляем навигацию с клавиатуры
    const handleKeyNavigation = (e) => {
        if (document.getElementById('productModal').style.display === 'block') {
            if (e.key === 'ArrowRight') {
                nextImage();
                e.preventDefault();
            } else if (e.key === 'ArrowLeft') {
                prevImage();
                e.preventDefault();
            }
        }
    };
    
    document.addEventListener('keydown', handleKeyNavigation);
    
    // Сохраняем обработчик для удаления
    container.dataset.keyboardHandler = 'true';
}

// Функция добавления счетчика фото
function addImageCounter(container, images) {
    // Удаляем старый счетчик если есть
    const oldCounter = container.querySelector('.photo-counter');
    if (oldCounter) oldCounter.remove();
    
    // Создаем счетчик
    const counter = document.createElement('div');
    counter.className = 'photo-counter';
    counter.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 6px 15px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
        z-index: 100;
        backdrop-filter: blur(5px);
    `;
    
    // Функция обновления счетчика
    function updateCounter() {
        counter.textContent = `${currentImageIndex + 1} / ${images.length}`;
    }
    
    // Инициализируем счетчик
    let currentImageIndex = 0;
    updateCounter();
    
    // Добавляем счетчик в контейнер
    container.appendChild(counter);
    
    // Сохраняем функцию обновления в контейнере
    container.updateCounter = updateCounter;
    container.currentImageIndex = 0;
}

// 4. Модифицируем отображение товаров для показа количества фото
const originalDisplayProducts = window.displayProducts;
window.displayProducts = function(productsToShow) {
    // Вызываем оригинальную функцию
    originalDisplayProducts.call(this, productsToShow);
    
    // Добавляем бейджи с количеством фото
    document.querySelectorAll('.product-card').forEach((card, index) => {
        const product = productsToShow[index];
        if (product) {
            const imagesCount = product.images ? product.images.length : 1;
            
            // Если фото больше одного, добавляем бейдж
            if (imagesCount > 1) {
                const badge = document.createElement('div');
                badge.className = 'photo-count-badge';
                badge.style.cssText = `
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(33, 150, 243, 0.9);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: bold;
                    z-index: 10;
                    backdrop-filter: blur(5px);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                `;
                badge.textContent = `${imagesCount} фото`;
                badge.title = `Количество фото: ${imagesCount}`;
                
                const productImage = card.querySelector('.product-image');
                if (productImage) {
                    productImage.appendChild(badge);
                }
            }
        }
    });
};

// 5. Обновляем существующие товары при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем массив images к существующим товарам
    setTimeout(() => {
        products = products.map(product => {
            if (!product.images) {
                product.images = [product.image];
            }
            return product;
        });
        
        // Сохраняем изменения
        if (typeof saveState === 'function') {
            saveState();
        }
        
        // Обновляем отображение товаров
        if (typeof displayProducts === 'function') {
            displayProducts(products);
        }
    }, 500);
});





// === ПРОСТОЙ КОД ДЛЯ СТРЕЛОК В МОДАЛКЕ ТОВАРА ===

// 1. Перехватываем клик на карточку товара
document.addEventListener('click', function(e) {
    const productCard = e.target.closest('.product-card');
    if (productCard && !e.target.classList.contains('delete-btn')) {
        // Находим индекс товара
        const index = Array.from(document.querySelectorAll('.product-card')).indexOf(productCard);
        if (index !== -1 && products[index]) {
            const product = products[index];
            
            // Открываем модальное окно
            setTimeout(() => {
                const modal = document.getElementById('productModal');
                if (modal) {
                    modal.style.display = 'block';
                    
                    // Добавляем стрелки после отрисовки
                    setTimeout(() => {
                        addSimpleArrows(product);
                    }, 50);
                }
            }, 10);
        }
    }
});

// 2. Функция добавления стрелок
function addSimpleArrows(product) {
    const modalImage = document.querySelector('.modal-image');
    if (!modalImage) return;
    
    // Удаляем старые стрелки
    const oldArrows = modalImage.querySelectorAll('.simple-arrow');
    oldArrows.forEach(arrow => arrow.remove());
    
    // Получаем фото товара
    const images = product.images || [product.image];
    
    // Создаем стрелки
    const leftArrow = document.createElement('button');
    leftArrow.className = 'simple-arrow left';
    leftArrow.innerHTML = '‹';
    
    const rightArrow = document.createElement('button');
    rightArrow.className = 'simple-arrow right';
    rightArrow.innerHTML = '›';
    
    // Добавляем стили
    const arrowStyle = `
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 40px;
        height: 40px;
        background: white;
        border: none;
        border-radius: 50%;
        font-size: 24px;
        color: #333;
        cursor: pointer;
        z-index: 100;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    leftArrow.style.cssText = arrowStyle + 'left: 10px;';
    rightArrow.style.cssText = arrowStyle + 'right: 10px;';
    
    // Если фото только одно - делаем неактивными
    if (images.length <= 1) {
        leftArrow.style.opacity = '0.5';
        leftArrow.style.cursor = 'not-allowed';
        rightArrow.style.opacity = '0.5';
        rightArrow.style.cursor = 'not-allowed';
    } else {
        // Добавляем функционал листания
        let currentIndex = 0;
        const imgElement = modalImage.querySelector('img');
        
        leftArrow.onclick = () => {
            currentIndex = (currentIndex - 1 + images.length) % images.length;
            if (imgElement) imgElement.src = images[currentIndex];
        };
        
        rightArrow.onclick = () => {
            currentIndex = (currentIndex + 1) % images.length;
            if (imgElement) imgElement.src = images[currentIndex];
        };
    }
    
    // Добавляем стрелки
    modalImage.appendChild(leftArrow);
    modalImage.appendChild(rightArrow);
}

// 3. Добавляем CSS для стрелок
const style = document.createElement('style');
style.textContent = `
    .simple-arrow {
        transition: all 0.2s ease;
    }
    .simple-arrow:hover {
        background: #f0f0f0 !important;
        transform: translateY(-50%) scale(1.1) !important;
    }
`;
document.head.appendChild(style);



// САМЫЙ ПРОСТОЙ И НАДЕЖНЫЙ СПОСОБ
document.addEventListener('DOMContentLoaded', function() {
    let modalLock = false;
    let lockTime = 0;
    
    // Блокируем при открытии любого окна
    document.body.addEventListener('click', function(e) {
        if (e.target.closest('.product-card') || 
            e.target.id === 'moderatorBtn' ||
            e.target.id === 'aboutInfoBtn' ||
            e.target.id === 'drawingModeToggle') {
            modalLock = true;
            lockTime = Date.now();
            
            // Разблокируем через 1 секунду
            setTimeout(() => {
                modalLock = false;
            }, 1000);
        }
    }, true); // Используем capture phase - самый ранний перехват
    
    // Блокируем все попытки закрыть
    document.body.addEventListener('click', function(e) {
        if (modalLock) {
            // Если это кнопка закрытия или клик по фону
            if (e.target.classList.contains('close') || 
                e.target.closest('.close') ||
                e.target.classList.contains('modal') ||
                e.target.classList.contains('panel-close')) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }
        }
    }, true);
});




