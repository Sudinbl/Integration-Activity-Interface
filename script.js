/**
 * Integration Activity Board - Main Script
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const answerInput = document.getElementById('studentAnswer');
  const wordCountDisplay = document.getElementById('wordCount');
  const charCountDisplay = document.getElementById('charCount');
  const statusText = document.getElementById('statusText');
  const statusDot = document.querySelector('.status-dot');
  
  // Toolbar Controls
  const toolPen = document.getElementById('toolPen');
  const toolEraser = document.getElementById('toolEraser');
  const colorPicker = document.getElementById('colorPicker');
  const colorSwatches = document.querySelectorAll('.color-swatch');
  const brushSize = document.getElementById('brushSize');
  const brushSizeVal = document.getElementById('brushSizeVal');
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const clearCanvasBtn = document.getElementById('clearCanvasBtn');
  
  // Action Buttons
  const btnClearText = document.getElementById('btnClearText');
  const btnClearDrawing = document.getElementById('btnClearDrawing');
  const btnDownloadDrawing = document.getElementById('btnDownloadDrawing');
  const btnDownloadAll = document.getElementById('btnDownloadAll');
  const btnSubmit = document.getElementById('btnSubmit');

  // Utilities
  const darkModeBtn = document.getElementById('darkModeBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const spellcheckBtn = document.getElementById('spellcheckBtn');
  const timerDisplay = document.getElementById('timerDisplay');

  // State Variables
  let canvas;
  let undoStack = [];
  let redoStack = [];
  let currentMode = 'pen';
  let currentColor = '#2563eb';
  let currentBrushWidth = 3;
  let secondsElapsed = 0;

  // Initialize Application
  initTimer();
  initFabricCanvas();
  initTextCounters();
  loadSavedSession();
  setupAutoSave();
  setupEventListeners();

  /**
   * Initialize Fabric.js HTML5 Canvas
   */
  function initFabricCanvas() {
    const wrapper = document.getElementById('canvasWrapper');
    const width = wrapper.clientWidth || 800;
    const height = 400;

    canvas = new fabric.Canvas('drawingBoard', {
      isDrawingMode: true,
      width: width,
      height: height,
      backgroundColor: '#ffffff'
    });

    // Configure Brush
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = currentColor;
    canvas.freeDrawingBrush.width = parseInt(currentBrushWidth, 10);

    // Save history state on path creation
    canvas.on('path:created', saveCanvasState);

    // Initial empty state
    saveCanvasState();
  }

  /**
   * Undo & Redo Canvas Handlers
   */
  function saveCanvasState() {
    if (undoStack.length > 25) undoStack.shift();
    undoStack.push(JSON.stringify(canvas));
    redoStack = []; // Reset redo on new draw
  }

  function handleUndo() {
    if (undoStack.length > 1) {
      redoStack.push(undoStack.pop());
      const state = undoStack[undoStack.length - 1];
      canvas.loadFromJSON(state, () => canvas.renderAll());
    }
  }

  function handleRedo() {
    if (redoStack.length > 0) {
      const state = redoStack.pop();
      undoStack.push(state);
      canvas.loadFromJSON(state, () => canvas.renderAll());
    }
  }

  /**
   * Text Input Counter & Auto-Expand
   */
  function updateCounters() {
    const text = answerInput.value;
    const charCount = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;

    wordCountDisplay.textContent = words;
    charCountDisplay.textContent = charCount;

    // Auto-expand textarea
    answerInput.style.height = 'auto';
    answerInput.style.height = answerInput.scrollHeight + 'px';
  }

  function initTextCounters() {
    answerInput.addEventListener('input', updateCounters);
  }

  /**
   * Local Storage Auto-Save Logic
   */
  function saveToLocalStorage() {
    statusDot.classList.add('saving');
    statusText.textContent = 'Saving...';

    const sessionData = {
      textResponse: answerInput.value,
      canvasJSON: JSON.stringify(canvas),
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('integration_board_data', JSON.stringify(sessionData));

    setTimeout(() => {
      statusDot.classList.remove('saving');
      statusText.textContent = 'Saved locally';
    }, 600);
  }

  function loadSavedSession() {
    const saved = localStorage.getItem('integration_board_data');
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      if (data.textResponse) {
        answerInput.value = data.textResponse;
        updateCounters();
      }
      if (data.canvasJSON) {
        canvas.loadFromJSON(data.canvasJSON, () => {
          canvas.renderAll();
          undoStack = [data.canvasJSON];
        });
      }
    } catch (e) {
      console.error('Error loading saved session:', e);
    }
  }

  function setupAutoSave() {
    setInterval(saveToLocalStorage, 10000); // Save every 10 seconds
  }

  /**
   * Event Listeners Setup
   */
  function setupEventListeners() {
    // Tool switching
    toolPen.addEventListener('click', () => {
      currentMode = 'pen';
      toolPen.classList.add('active');
      toolEraser.classList.remove('active');
      canvas.freeDrawingBrush.color = currentColor;
      canvas.freeDrawingBrush.width = parseInt(brushSize.value, 10);
    });

    toolEraser.addEventListener('click', () => {
      currentMode = 'eraser';
      toolEraser.classList.add('active');
      toolPen.classList.remove('active');
      canvas.freeDrawingBrush.color = '#ffffff'; // White for background eraser
      canvas.freeDrawingBrush.width = parseInt(brushSize.value, 10) * 3;
    });

    // Color controls
    colorPicker.addEventListener('input', (e) => {
      currentColor = e.target.value;
      if (currentMode === 'pen') {
        canvas.freeDrawingBrush.color = currentColor;
      }
    });

    colorSwatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        colorSwatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        currentColor = swatch.dataset.color;
        colorPicker.value = currentColor;
        if (currentMode === 'pen') {
          canvas.freeDrawingBrush.color = currentColor;
        }
      });
    });

    // Brush Size
    brushSize.addEventListener('input', (e) => {
      const val = e.target.value;
      brushSizeVal.textContent = val;
      const multiplier = currentMode === 'eraser' ? 3 : 1;
      canvas.freeDrawingBrush.width = parseInt(val, 10) * multiplier;
    });

    // Canvas actions
    undoBtn.addEventListener('click', handleUndo);
    redoBtn.addEventListener('click', handleRedo);
    clearCanvasBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear the drawing board?')) {
        canvas.clear();
        canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));
        saveCanvasState();
      }
    });

    // Bottom Action Buttons
    btnClearText.addEventListener('click', () => {
      if (confirm('Clear your written response?')) {
        answerInput.value = '';
        updateCounters();
        saveToLocalStorage();
      }
    });

    btnClearDrawing.addEventListener('click', () => {
      clearCanvasBtn.click();
    });

    btnDownloadDrawing.addEventListener('click', downloadDrawingPNG);
    btnDownloadAll.addEventListener('click', downloadCompleteResponse);

    btnSubmit.addEventListener('click', () => {
      saveToLocalStorage();
      const payload = {
        question: document.getElementById('questionBox').innerText,
        studentResponse: answerInput.value,
        drawingDataURL: canvas.toDataURL({ format: 'png' }),
        submittedAt: new Date().toISOString()
      };
      
      console.log('--- SUBMITTED ACTIVITY DATA ---');
      console.log(payload);
      alert('Activity submitted successfully! Data logged to browser console.');
    });

    // Utilities
    darkModeBtn.addEventListener('click', () => {
      const isDark = document.body.getAttribute('data-theme') === 'dark';
      document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    });

    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    });

    spellcheckBtn.addEventListener('click', () => {
      const current = answerInput.getAttribute('spellcheck') === 'true';
      answerInput.setAttribute('spellcheck', !current);
      spellcheckBtn.style.opacity = current ? '0.6' : '1';
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          handleUndo();
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          handleRedo();
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          downloadCompleteResponse();
        }
      }
    });

    // Responsive Canvas Resizing
    window.addEventListener('resize', () => {
      const wrapper = document.getElementById('canvasWrapper');
      if (wrapper && canvas) {
        canvas.setWidth(wrapper.clientWidth);
        canvas.renderAll();
      }
    });
  }

  /**
   * Downloads
   */
  function downloadDrawingPNG() {
    const dataURL = canvas.toDataURL({ format: 'png', quality: 1.0 });
    const link = document.createElement('a');
    link.download = 'integration-drawing.png';
    link.href = dataURL;
    link.click();
  }

  function downloadCompleteResponse() {
    const content = `INTEGRATION ACTIVITY RESPONSE
========================================
Date: ${new Date().toLocaleString()}
Elapsed Time: ${timerDisplay.textContent}

----------------------------------------
WRITTEN RESPONSE:
----------------------------------------
${answerInput.value || '(No written response provided)'}

========================================
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.download = 'integration-activity-response.txt';
    link.href = URL.createObjectURL(blob);
    link.click();

    // Also prompt download of drawing
    downloadDrawingPNG();
  }

  /**
   * Timer Utility
   */
  function initTimer() {
    setInterval(() => {
      secondsElapsed++;
      const mins = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
      const secs = String(secondsElapsed % 60).padStart(2, '0');
      timerDisplay.textContent = `${mins}:${secs}`;
    }, 1000);
  }
});