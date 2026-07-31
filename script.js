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
  
  // Table Controls
  const btnInsertTable = document.getElementById('btnInsertTable');
  const tableRowsInput = document.getElementById('tableRows');
  const tableColsInput = document.getElementById('tableCols');
  const tableActions = document.getElementById('tableActions');
  const btnAddRow = document.getElementById('btnAddRow');
  const btnAddCol = document.getElementById('btnAddCol');
  const btnRemoveRow = document.getElementById('btnRemoveRow');
  const btnRemoveCol = document.getElementById('btnRemoveCol');

  // Toolbar Canvas Controls
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

  // State Variables
  let canvas;
  let undoStack = [];
  let redoStack = [];
  let currentMode = 'pen';
  let currentColor = '#2563eb';
  let currentBrushWidth = 3;
  let activeTableCell = null;

  // Initialize Application
  initFabricCanvas();
  initTextCounters();
  initTableTools();
  loadSavedSession();
  setupAutoSave();
  setupEventListeners();

  /**
   * Initialize Fabric.js Canvas
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

    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = currentColor;
    canvas.freeDrawingBrush.width = parseInt(currentBrushWidth, 10);

    canvas.on('path:created', saveCanvasState);
    saveCanvasState();
  }

  function saveCanvasState() {
    if (undoStack.length > 25) undoStack.shift();
    undoStack.push(JSON.stringify(canvas));
    redoStack = [];
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
   * Text Counter & Empty Placeholder Fix
   */
  function updateCounters() {
    if (answerInput.innerHTML === '<br>' || answerInput.innerHTML.trim() === '') {
      answerInput.innerHTML = '';
    }

    const text = answerInput.innerText || '';
    const charCount = text.trim().length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;

    wordCountDisplay.textContent = words;
    charCountDisplay.textContent = charCount;
  }

  function initTextCounters() {
    answerInput.addEventListener('input', updateCounters);
  }

  /**
   * Dynamic Table Management
   */
  function initTableTools() {
    btnInsertTable.addEventListener('click', () => {
      const rows = parseInt(tableRowsInput.value, 10) || 3;
      const cols = parseInt(tableColsInput.value, 10) || 3;

      let tableHTML = '<table><tbody>';
      for (let r = 0; r < rows; r++) {
        tableHTML += '<tr>';
        for (let c = 0; c < cols; c++) {
          if (r === 0) {
            tableHTML += `<th contenteditable="true">Header ${c + 1}</th>`;
          } else {
            tableHTML += `<td contenteditable="true">Data</td>`;
          }
        }
        tableHTML += '</tr>';
      }
      tableHTML += '</tbody></table><p><br></p>';

      answerInput.focus();
      document.execCommand('insertHTML', false, tableHTML);
      updateCounters();
    });

    answerInput.addEventListener('click', (e) => {
      const cell = e.target.closest('td, th');
      if (cell) {
        if (activeTableCell) activeTableCell.classList.remove('selected-cell');
        activeTableCell = cell;
        activeTableCell.classList.add('selected-cell');
        tableActions.style.display = 'flex';
      } else {
        if (activeTableCell) activeTableCell.classList.remove('selected-cell');
        activeTableCell = null;
        tableActions.style.display = 'none';
      }
    });

    btnAddRow.addEventListener('click', () => {
      if (!activeTableCell) return;
      const row = activeTableCell.closest('tr');
      const newRow = row.cloneNode(true);
      Array.from(newRow.cells).forEach(c => c.textContent = 'Data');
      row.parentNode.insertBefore(newRow, row.nextSibling);
    });

    btnAddCol.addEventListener('click', () => {
      if (!activeTableCell) return;
      const colIndex = activeTableCell.cellIndex;
      const table = activeTableCell.closest('table');
      Array.from(table.rows).forEach((row) => {
        const cell = row.cells[colIndex];
        const newCell = document.createElement(row.rowIndex === 0 ? 'th' : 'td');
        newCell.textContent = row.rowIndex === 0 ? 'Header' : 'Data';
        newCell.contentEditable = 'true';
        cell.parentNode.insertBefore(newCell, cell.nextSibling);
      });
    });

    btnRemoveRow.addEventListener('click', () => {
      if (!activeTableCell) return;
      const row = activeTableCell.closest('tr');
      const table = activeTableCell.closest('table');
      if (table.rows.length > 1) {
        row.remove();
        tableActions.style.display = 'none';
      }
    });

    btnRemoveCol.addEventListener('click', () => {
      if (!activeTableCell) return;
      const colIndex = activeTableCell.cellIndex;
      const table = activeTableCell.closest('table');
      if (table.rows[0].cells.length > 1) {
        Array.from(table.rows).forEach(row => row.cells[colIndex].remove());
        tableActions.style.display = 'none';
      }
    });
  }

  /**
   * Local Storage Auto-Save Logic
   */
  function saveToLocalStorage() {
    statusDot.classList.add('saving');
    statusText.textContent = 'Saving...';

    const sessionData = {
      textResponseHTML: answerInput.innerHTML,
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
      if (data.textResponseHTML) {
        answerInput.innerHTML = data.textResponseHTML;
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
    setInterval(saveToLocalStorage, 10000);
  }

  /**
   * Event Listeners Setup
   */
  function setupEventListeners() {
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
      canvas.freeDrawingBrush.color = '#ffffff';
      canvas.freeDrawingBrush.width = parseInt(brushSize.value, 10) * 3;
    });

    colorPicker.addEventListener('input', (e) => {
      currentColor = e.target.value;
      if (currentMode === 'pen') canvas.freeDrawingBrush.color = currentColor;
    });

    colorSwatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        colorSwatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        currentColor = swatch.dataset.color;
        colorPicker.value = currentColor;
        if (currentMode === 'pen') canvas.freeDrawingBrush.color = currentColor;
      });
    });

    brushSize.addEventListener('input', (e) => {
      const val = e.target.value;
      brushSizeVal.textContent = val;
      const multiplier = currentMode === 'eraser' ? 3 : 1;
      canvas.freeDrawingBrush.width = parseInt(val, 10) * multiplier;
    });

    undoBtn.addEventListener('click', handleUndo);
    redoBtn.addEventListener('click', handleRedo);

    clearCanvasBtn.addEventListener('click', () => {
      if (confirm('Clear the drawing board?')) {
        canvas.clear();
        canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));
        saveCanvasState();
      }
    });

    btnClearText.addEventListener('click', () => {
      if (confirm('Clear your written response?')) {
        answerInput.innerHTML = '';
        updateCounters();
        saveToLocalStorage();
      }
    });

    btnClearDrawing.addEventListener('click', () => clearCanvasBtn.click());
    btnDownloadDrawing.addEventListener('click', downloadDrawingPNG);
    btnDownloadAll.addEventListener('click', downloadCompleteResponse);

    btnSubmit.addEventListener('click', () => {
      saveToLocalStorage();
      const payload = {
        studentResponseHTML: answerInput.innerHTML,
        studentResponseText: answerInput.innerText,
        drawingDataURL: canvas.toDataURL({ format: 'png' }),
        submittedAt: new Date().toISOString()
      };
      
      console.log('--- SUBMITTED ACTIVITY DATA ---');
      console.log(payload);
      alert('Activity submitted successfully! Data logged to browser console.');
    });

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

    window.addEventListener('resize', () => {
      const wrapper = document.getElementById('canvasWrapper');
      if (wrapper && canvas) {
        canvas.setWidth(wrapper.clientWidth);
        canvas.setHeight(wrapper.clientHeight || 400);
        canvas.renderAll();
      }
    });
  }

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

----------------------------------------
WRITTEN RESPONSE:
----------------------------------------
${answerInput.innerText || '(No written response provided)'}

========================================
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.download = 'integration-activity-response.txt';
    link.href = URL.createObjectURL(blob);
    link.click();

    downloadDrawingPNG();
  }
});
