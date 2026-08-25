/* ==========================================================================
   HOLLYWOOD AGENT STUDIO v3.5 PRO SUITE - RENDERER SCRIPT WITH LIVE TESTERS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // State Management
  let currentStep = 1;
  let currentTheme = 'dark';
  let generatedData = null;
  let savedProjects = [];
  let currentProjectId = null;

  let appSettings = {
    provider: 'ollama',
    geminiKey: '',
    openaiKey: '',
    claudeKey: '',
    openrouterKey: '',
    elevenlabsKey: '',
    fluxKey: '',
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'llama3:latest',
    lmstudioUrl: 'http://localhost:1234',
    comfyUrl: 'http://127.0.0.1:8188',
    webuiUrl: 'http://127.0.0.1:7860',
    theme: 'dark'
  };

  // Load Initial Settings & Projects
  if (window.electronAPI) {
    window.electronAPI.getSettings().then(saved => {
      if (saved) {
        appSettings = { ...appSettings, ...saved };
        setTheme(appSettings.theme || 'dark');
        applySettingsToUI();
      }
    });

    loadSavedProjectsFromStorage();
  }

  /* ==========================================
     SIDEBAR & PROJECTS MANAGEMENT (CRUD)
     ========================================== */
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  const sidebarProjects = document.getElementById('sidebar-projects');
  const btnNewProject = document.getElementById('btn-new-project');
  const btnSaveProjectQuick = document.getElementById('btn-save-project-quick');
  const projectsListContainer = document.getElementById('projects-list-container');

  if (btnToggleSidebar && sidebarProjects) {
    btnToggleSidebar.addEventListener('click', () => {
      sidebarProjects.classList.toggle('collapsed');
    });
  }

  async function loadSavedProjectsFromStorage() {
    if (!window.electronAPI) return;
    try {
      savedProjects = await window.electronAPI.getProjects() || [];
      renderProjectsSidebar();
    } catch (e) {
      console.error('Error loading projects:', e);
    }
  }

  async function saveProjectsToStorage() {
    if (!window.electronAPI) return;
    try {
      await window.electronAPI.saveProjects(savedProjects);
      renderProjectsSidebar();
    } catch (e) {
      console.error('Error saving projects:', e);
    }
  }

  function renderProjectsSidebar() {
    if (!projectsListContainer) return;
    projectsListContainer.innerHTML = '';

    if (savedProjects.length === 0) {
      projectsListContainer.innerHTML = `
        <div class="sidebar-empty-state">
          <i class="fa-solid fa-film"></i>
          <p>No hay proyectos guardados. Configura uno y presiona "Guardar".</p>
        </div>
      `;
      return;
    }

    savedProjects.forEach(proj => {
      const item = document.createElement('div');
      item.className = `project-item ${proj.id === currentProjectId ? 'active' : ''}`;
      
      item.innerHTML = `
        <div class="project-item-info">
          <span class="project-item-title">${proj.title || 'Proyecto Sin Título'}</span>
          <span class="project-item-sub">${proj.type || 'Producción'} • ${proj.episodesCount || 1} cap</span>
        </div>
        <button class="btn-delete-project" data-id="${proj.id}" title="Eliminar Proyecto">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete-project')) return;
        loadProjectIntoUI(proj);
      });

      const btnDelete = item.querySelector('.btn-delete-project');
      btnDelete.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteProject(proj.id);
      });

      projectsListContainer.appendChild(item);
    });
  }

  function getWizardFormData() {
    return {
      projectType: document.getElementById('project-type').value,
      projectTitle: document.getElementById('project-title').value.trim() || 'Producción Audiovisual',
      episodesCount: parseInt(document.getElementById('episodes-count').value) || 4,
      episodeDuration: document.getElementById('episode-duration').value,
      storyPremise: document.getElementById('story-premise').value,
      storyGenre: document.getElementById('story-genre').value,
      narrativeTone: document.getElementById('narrative-tone').value,
      protagonistDetails: document.getElementById('protagonist-details').value,
      secondaryCharacters: document.getElementById('secondary-characters').value,
      keyLocations: document.getElementById('key-locations').value,
      visualEra: document.getElementById('visual-era').value,
      colorPalette: document.getElementById('color-palette').value,
      artStyle: document.getElementById('art-style').value,
      cameraStyle: document.getElementById('camera-style').value,
      voiceoverStyle: document.getElementById('voiceover-style').value,
      musicStyle: document.getElementById('music-style').value,
      // Textarea References v3.5
      formatReferences: document.getElementById('format-references') ? document.getElementById('format-references').value : '',
      plotReferences: document.getElementById('plot-references') ? document.getElementById('plot-references').value : '',
      characterReferences: document.getElementById('character-references') ? document.getElementById('character-references').value : '',
      scenarioReferences: document.getElementById('scenario-references') ? document.getElementById('scenario-references').value : '',
      styleAudioReferences: document.getElementById('style-audio-references') ? document.getElementById('style-audio-references').value : ''
    };
  }

  function setWizardFormData(data) {
    if (data.projectType) document.getElementById('project-type').value = data.projectType;
    if (data.projectTitle) document.getElementById('project-title').value = data.projectTitle;
    if (data.episodesCount) document.getElementById('episodes-count').value = data.episodesCount;
    if (data.episodeDuration) document.getElementById('episode-duration').value = data.episodeDuration;
    if (data.storyPremise) document.getElementById('story-premise').value = data.storyPremise;
    if (data.storyGenre) document.getElementById('story-genre').value = data.storyGenre;
    if (data.narrativeTone) document.getElementById('narrative-tone').value = data.narrativeTone;
    if (data.protagonistDetails) document.getElementById('protagonist-details').value = data.protagonistDetails;
    if (data.secondaryCharacters) document.getElementById('secondary-characters').value = data.secondaryCharacters;
    if (data.keyLocations) document.getElementById('key-locations').value = data.keyLocations;
    if (data.visualEra) document.getElementById('visual-era').value = data.visualEra;
    if (data.colorPalette) document.getElementById('color-palette').value = data.colorPalette;
    if (data.artStyle) document.getElementById('art-style').value = data.artStyle;
    if (data.cameraStyle) document.getElementById('camera-style').value = data.cameraStyle;
    if (data.voiceoverStyle) document.getElementById('voiceover-style').value = data.voiceoverStyle;
    if (data.musicStyle) document.getElementById('music-style').value = data.musicStyle;
    if (data.formatReferences && document.getElementById('format-references')) document.getElementById('format-references').value = data.formatReferences;
    if (data.plotReferences && document.getElementById('plot-references')) document.getElementById('plot-references').value = data.plotReferences;
    if (data.characterReferences && document.getElementById('character-references')) document.getElementById('character-references').value = data.characterReferences;
    if (data.scenarioReferences && document.getElementById('scenario-references')) document.getElementById('scenario-references').value = data.scenarioReferences;
    if (data.styleAudioReferences && document.getElementById('style-audio-references')) document.getElementById('style-audio-references').value = data.styleAudioReferences;
  }

  function saveCurrentProjectState() {
    const formData = getWizardFormData();
    if (!currentProjectId) {
      currentProjectId = 'proj_' + Date.now();
    }

    const existingIndex = savedProjects.findIndex(p => p.id === currentProjectId);
    const projectRecord = {
      id: currentProjectId,
      title: formData.projectTitle,
      type: formData.projectType,
      episodesCount: formData.episodesCount,
      updatedAt: new Date().toISOString(),
      formData: formData,
      generatedData: generatedData
    };

    if (existingIndex >= 0) {
      savedProjects[existingIndex] = projectRecord;
    } else {
      savedProjects.unshift(projectRecord);
    }

    saveProjectsToStorage();
    alert(`Proyecto "${formData.projectTitle}" guardado correctamente.`);
  }

  function loadProjectIntoUI(proj) {
    currentProjectId = proj.id;
    if (proj.formData) setWizardFormData(proj.formData);

    if (proj.generatedData) {
      generatedData = proj.generatedData;
      populateGeneratedOutputs(generatedData);
    }

    renderProjectsSidebar();
  }

  function populateGeneratedOutputs(data) {
    document.getElementById('output-memory').value = data.files.memoryPattern || '';
    document.getElementById('output-script').value = data.files.scripts || '';
    document.getElementById('output-characters').value = data.files.characters || '';
    document.getElementById('output-camera').value = data.files.cinematography || '';
    document.getElementById('output-audio').value = data.files.audio || '';
    document.getElementById('output-promo-kit').value = data.files.promoKit || '';

    // Render Metrics
    if (data.metrics) {
      document.getElementById('metric-audio-chars').textContent = `${data.metrics.elevenlabsChars} caracteres`;
      document.getElementById('metric-video-shots').textContent = `${data.metrics.soraVideoShots} tomas`;
      document.getElementById('metric-image-renders').textContent = `${data.metrics.fluxImageRenders} renders`;
      document.getElementById('metric-render-time').textContent = `~${data.metrics.estimatedRenderTime} min`;
    }

    // Render Storyboard & Avatars
    renderAvatarCards(data.characterList || []);
    renderStoryboardCards(data.storyboardFrames || []);
  }

  function createNewProject() {
    currentProjectId = 'proj_' + Date.now();
    generatedData = null;

    setWizardFormData({
      projectType: 'Serie Web / TV',
      projectTitle: 'Nueva Producción Hollywood',
      episodesCount: 4,
      episodeDuration: '3 a 5 minutos',
      storyPremise: '',
      storyGenre: 'Drama Motivacional / Superación',
      narrativeTone: 'Inspíralo y Emotivo',
      protagonistDetails: '',
      secondaryCharacters: '',
      keyLocations: '',
      visualEra: 'Época Contemporánea / Actual',
      colorPalette: 'Colores cinematográficos',
      artStyle: 'Fotorrealista Cinematográfico (35mm Anamórfico)',
      cameraStyle: 'Movimientos Dinámicos (Dolly, Steadicam, Drone Shots)',
      voiceoverStyle: 'Voz Masculina Grave y Profunda (Narrador Hollywood)',
      musicStyle: 'Sintetizador y Orquesta',
      formatReferences: '',
      plotReferences: '',
      characterReferences: '',
      scenarioReferences: '',
      styleAudioReferences: ''
    });

    document.getElementById('output-memory').value = '';
    document.getElementById('output-script').value = '';
    document.getElementById('output-characters').value = '';
    document.getElementById('output-camera').value = '';
    document.getElementById('output-audio').value = '';
    document.getElementById('output-promo-kit').value = '';

    document.getElementById('storyboard-container').innerHTML = `
      <div class="avatar-placeholder-box">
        <i class="fa-solid fa-images"></i>
        <p>Configura tu nuevo proyecto y presiona "Generar Producción Completa".</p>
      </div>
    `;

    renderProjectsSidebar();
  }

  function deleteProject(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
      savedProjects = savedProjects.filter(p => p.id !== id);
      if (currentProjectId === id) currentProjectId = null;
      saveProjectsToStorage();
    }
  }

  if (btnNewProject) btnNewProject.addEventListener('click', createNewProject);
  if (btnSaveProjectQuick) btnSaveProjectQuick.addEventListener('click', saveCurrentProjectState);

  /* ==========================================
     NAV TABS SWITCHING
     ========================================== */
  const navButtons = document.querySelectorAll('.nav-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      navButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const pane = document.getElementById(targetTab);
      if (pane) pane.classList.add('active');
    });
  });

  /* ==========================================
     WIZARD STEPPER NAVIGATION
     ========================================== */
  const wizardSteps = document.querySelectorAll('.wizard-step-content');
  const stepItems = document.querySelectorAll('.step-item');
  const btnPrev = document.getElementById('btn-wizard-prev');
  const btnNext = document.getElementById('btn-wizard-next');

  function updateWizardUI() {
    wizardSteps.forEach((step, index) => {
      const stepNum = index + 1;
      if (stepNum === currentStep) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
    });

    stepItems.forEach((item, index) => {
      const stepNum = index + 1;
      if (stepNum === currentStep) {
        item.classList.add('active');
        item.classList.remove('completed');
      } else if (stepNum < currentStep) {
        item.classList.remove('active');
        item.classList.add('completed');
      } else {
        item.classList.remove('active', 'completed');
      }
    });

    btnPrev.disabled = currentStep === 1;

    if (currentStep === 5) {
      btnNext.style.display = 'none';
    } else {
      btnNext.style.display = 'inline-flex';
    }
  }

  btnNext.addEventListener('click', () => {
    if (currentStep < 5) {
      currentStep++;
      updateWizardUI();
    }
  });

  btnPrev.addEventListener('click', () => {
    if (currentStep > 1) {
      currentStep--;
      updateWizardUI();
    }
  });

  stepItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetStep = parseInt(item.getAttribute('data-step'));
      if (targetStep >= 1 && targetStep <= 5) {
        currentStep = targetStep;
        updateWizardUI();
      }
    });
  });

  /* ==========================================
     THEME TOGGLE
     ========================================== */
  const btnThemeToggle = document.getElementById('btn-theme-toggle');

  function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    if (btnThemeToggle) {
      btnThemeToggle.innerHTML = theme === 'dark' 
        ? '<i class="fa-solid fa-sun"></i>' 
        : '<i class="fa-solid fa-moon"></i>';
    }
  }

  btnThemeToggle.addEventListener('click', () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    appSettings.theme = newTheme;
    if (window.electronAPI) window.electronAPI.saveSettings(appSettings);
  });

  /* ==========================================
     SETTINGS MODAL & LIVE CONNECTION TESTERS v3.5
     ========================================== */
  const btnSettings = document.getElementById('btn-settings');
  const modalSettings = document.getElementById('settings-modal');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const settingsTabButtons = document.querySelectorAll('.settings-tab-btn');
  const settingsSections = document.querySelectorAll('.settings-section');

  settingsTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const secId = btn.getAttribute('data-sec');
      settingsTabButtons.forEach(b => b.classList.remove('active'));
      settingsSections.forEach(s => s.classList.remove('active'));

      btn.classList.add('active');
      const targetSec = document.getElementById(secId);
      if (targetSec) targetSec.classList.add('active');
    });
  });

  btnSettings.addEventListener('click', () => {
    applySettingsToUI();
    modalSettings.classList.add('active');
  });

  btnCloseSettings.addEventListener('click', () => {
    modalSettings.classList.remove('active');
  });

  function applySettingsToUI() {
    document.getElementById('ai-provider').value = appSettings.provider || 'ollama';
    document.getElementById('gemini-key').value = appSettings.geminiKey || '';
    document.getElementById('openai-key').value = appSettings.openaiKey || '';
    document.getElementById('claude-key').value = appSettings.claudeKey || '';
    document.getElementById('openrouter-key').value = appSettings.openrouterKey || '';
    document.getElementById('elevenlabs-key').value = appSettings.elevenlabsKey || '';
    document.getElementById('flux-key').value = appSettings.fluxKey || '';
    document.getElementById('ollama-url').value = appSettings.ollamaUrl || 'http://localhost:11434';
    document.getElementById('lmstudio-url').value = appSettings.lmstudioUrl || 'http://localhost:1234';
    document.getElementById('comfy-url').value = appSettings.comfyUrl || 'http://127.0.0.1:8188';
    document.getElementById('webui-url').value = appSettings.webuiUrl || 'http://127.0.0.1:7860';
  }

  btnSaveSettings.addEventListener('click', () => {
    appSettings.provider = document.getElementById('ai-provider').value;
    appSettings.geminiKey = document.getElementById('gemini-key').value.trim();
    appSettings.openaiKey = document.getElementById('openai-key').value.trim();
    appSettings.claudeKey = document.getElementById('claude-key').value.trim();
    appSettings.openrouterKey = document.getElementById('openrouter-key').value.trim();
    appSettings.elevenlabsKey = document.getElementById('elevenlabs-key').value.trim();
    appSettings.fluxKey = document.getElementById('flux-key').value.trim();
    appSettings.ollamaUrl = document.getElementById('ollama-url').value.trim();

    const modelSel = document.getElementById('ollama-model-select');
    if (modelSel && modelSel.value) appSettings.ollamaModel = modelSel.value;

    appSettings.lmstudioUrl = document.getElementById('lmstudio-url').value.trim();
    appSettings.comfyUrl = document.getElementById('comfy-url').value.trim();
    appSettings.webuiUrl = document.getElementById('webui-url').value.trim();

    if (window.electronAPI) {
      window.electronAPI.saveSettings(appSettings).then(() => {
        alert('Todas las conexiones IA han sido guardadas exitosamente.');
        modalSettings.classList.remove('active');
      });
    } else {
      alert('Configuración actualizada.');
      modalSettings.classList.remove('active');
    }
  });

  /* ==========================================
     LIVE AI CONNECTION TESTERS FUNCTIONS
     ========================================== */
  function setStatusBadge(elementId, status, message) {
    const el = document.getElementById(elementId);
    if (!el) return;

    if (status === 'testing') {
      el.innerHTML = `<span class="status-badge testing"><i class="fa-solid fa-spinner fa-spin"></i> ${message}</span>`;
    } else if (status === 'connected') {
      el.innerHTML = `<span class="status-badge connected"><i class="fa-solid fa-check"></i> ${message}</span>`;
    } else if (status === 'error') {
      el.innerHTML = `<span class="status-badge error"><i class="fa-solid fa-triangle-exclamation"></i> ${message}</span>`;
    }
  }

  // 1. Test Ollama Connection
  const btnTestOllama = document.getElementById('btn-test-ollama');
  if (btnTestOllama) {
    btnTestOllama.addEventListener('click', async () => {
      const url = document.getElementById('ollama-url').value.trim() || 'http://localhost:11434';
      setStatusBadge('status-ollama', 'testing', 'Conectando con servidor Ollama local...');
      const startTime = Date.now();

      try {
        const response = await fetch(`${url}/api/tags`);
        const latency = Date.now() - startTime;
        if (response.ok) {
          const data = await response.json();
          const models = data.models || [];
          const modelNames = models.map(m => m.name);

          // Populate Ollama Select Dropdown
          const groupSelect = document.getElementById('group-ollama-model');
          const selectEl = document.getElementById('ollama-model-select');
          if (groupSelect && selectEl && modelNames.length > 0) {
            selectEl.innerHTML = '';
            modelNames.forEach(m => {
              const opt = document.createElement('option');
              opt.value = m;
              opt.textContent = `${m} (Instalado localmente)`;
              selectEl.appendChild(opt);
            });
            groupSelect.style.display = 'block';
          }

          setStatusBadge('status-ollama', 'connected', `✓ Conectado a Ollama (${latency}ms) - ${models.length} modelos detectados`);
        } else {
          setStatusBadge('status-ollama', 'error', `Error HTTP ${response.status} en Ollama`);
        }
      } catch (err) {
        setStatusBadge('status-ollama', 'error', `No se pudo conectar a ${url}. Verifica que Ollama esté ejecutándose.`);
      }
    });
  }

  // 2. Test LM Studio Connection
  const btnTestLmStudio = document.getElementById('btn-test-lmstudio');
  if (btnTestLmStudio) {
    btnTestLmStudio.addEventListener('click', async () => {
      const url = document.getElementById('lmstudio-url').value.trim() || 'http://localhost:1234';
      setStatusBadge('status-lmstudio', 'testing', 'Verificando puerto LM Studio...');
      const startTime = Date.now();

      try {
        const response = await fetch(`${url}/v1/models`);
        const latency = Date.now() - startTime;
        if (response.ok) {
          setStatusBadge('status-lmstudio', 'connected', `✓ Servidor LM Studio Activo (${latency}ms)`);
        } else {
          setStatusBadge('status-lmstudio', 'error', `Error HTTP ${response.status} en LM Studio`);
        }
      } catch (err) {
        setStatusBadge('status-lmstudio', 'error', `No se pudo conectar a ${url}`);
      }
    });
  }

  // 3. Test OpenAI API Key
  const btnTestOpenAI = document.getElementById('btn-test-openai');
  if (btnTestOpenAI) {
    btnTestOpenAI.addEventListener('click', async () => {
      const key = document.getElementById('openai-key').value.trim();
      if (!key) {
        setStatusBadge('status-openai', 'error', 'Introduce una API Key de OpenAI para probar');
        return;
      }
      setStatusBadge('status-openai', 'testing', 'Verificando API Key...');
      try {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${key}` }
        });
        if (res.ok) {
          setStatusBadge('status-openai', 'connected', '✓ API Key de OpenAI Válida');
        } else {
          setStatusBadge('status-openai', 'error', 'API Key de OpenAI inválida o rechazada');
        }
      } catch (e) {
        setStatusBadge('status-openai', 'error', 'Error al conectar con la API de OpenAI');
      }
    });
  }

  // 4. Test Gemini API Key
  const btnTestGemini = document.getElementById('btn-test-gemini');
  if (btnTestGemini) {
    btnTestGemini.addEventListener('click', async () => {
      const key = document.getElementById('gemini-key').value.trim();
      if (!key) {
        setStatusBadge('status-gemini', 'error', 'Introduce una API Key de Google Gemini');
        return;
      }
      setStatusBadge('status-gemini', 'testing', 'Verificando API Key de Gemini...');
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        if (res.ok) {
          setStatusBadge('status-gemini', 'connected', '✓ API Key de Google Gemini Válida');
        } else {
          setStatusBadge('status-gemini', 'error', 'API Key de Gemini inválida');
        }
      } catch (e) {
        setStatusBadge('status-gemini', 'error', 'Error de red con Google Gemini');
      }
    });
  }

  // 5. Test ElevenLabs
  const btnTestElevenLabs = document.getElementById('btn-test-elevenlabs');
  if (btnTestElevenLabs) {
    btnTestElevenLabs.addEventListener('click', async () => {
      const key = document.getElementById('elevenlabs-key').value.trim();
      if (!key) {
        setStatusBadge('status-elevenlabs', 'error', 'Introduce tu API Key de ElevenLabs');
        return;
      }
      setStatusBadge('status-elevenlabs', 'testing', 'Verificando cuenta de ElevenLabs...');
      try {
        const res = await fetch('https://api.elevenlabs.io/v1/user', {
          headers: { 'xi-api-key': key }
        });
        if (res.ok) {
          const data = await res.json();
          const count = data.subscription?.character_count || 0;
          const limit = data.subscription?.character_limit || 0;
          setStatusBadge('status-elevenlabs', 'connected', `✓ ElevenLabs Conectado (${count}/${limit} caracteres usados)`);
        } else {
          setStatusBadge('status-elevenlabs', 'error', 'API Key de ElevenLabs inválida');
        }
      } catch (e) {
        setStatusBadge('status-elevenlabs', 'error', 'Error de conexión con ElevenLabs');
      }
    });
  }

  // 6. Test ComfyUI
  const btnTestComfy = document.getElementById('btn-test-comfy');
  if (btnTestComfy) {
    btnTestComfy.addEventListener('click', async () => {
      const url = document.getElementById('comfy-url').value.trim() || 'http://127.0.0.1:8188';
      setStatusBadge('status-comfy', 'testing', 'Conectando con ComfyUI local...');
      try {
        const res = await fetch(`${url}/system_stats`);
        if (res.ok) {
          setStatusBadge('status-comfy', 'connected', '✓ Servidor ComfyUI Local Activo');
        } else {
          setStatusBadge('status-comfy', 'error', `Error HTTP ${res.status}`);
        }
      } catch (e) {
        setStatusBadge('status-comfy', 'error', `No se encontró servidor ComfyUI en ${url}`);
      }
    });
  }

  // 7. Test WebUI (Automatic1111)
  const btnTestWebUI = document.getElementById('btn-test-webui');
  if (btnTestWebUI) {
    btnTestWebUI.addEventListener('click', async () => {
      const url = document.getElementById('webui-url').value.trim() || 'http://127.0.0.1:7860';
      setStatusBadge('status-webui', 'testing', 'Conectando con Automatic1111 WebUI...');
      try {
        const res = await fetch(`${url}/sdapi/v1/sd-models`);
        if (res.ok) {
          setStatusBadge('status-webui', 'connected', '✓ Servidor Automatic1111 WebUI Activo');
        } else {
          setStatusBadge('status-webui', 'error', `Error HTTP ${res.status}`);
        }
      } catch (e) {
        setStatusBadge('status-webui', 'error', `No se encontró servidor WebUI en ${url}`);
      }
    });
  }

  /* ==========================================
     HOLLYWOOD 10 AGENTS ENGINE & PRO ORCHESTRATOR v3.5
     ========================================== */
  const btnRunGeneration = document.getElementById('btn-run-generation');

  btnRunGeneration.addEventListener('click', async () => {
    const inputs = getWizardFormData();

    btnRunGeneration.disabled = true;
    btnRunGeneration.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> CONECTANDO CON IA & GENERANDO PRODUCCIÓN...';

    let aiGeneratedScript = null;

    // Check if Ollama is selected & active to make real HTTP query
    if (appSettings.provider === 'ollama') {
      try {
        const ollamaUrl = appSettings.ollamaUrl || 'http://localhost:11434';
        const modelName = appSettings.ollamaModel || 'llama3:latest';
        
        const promptText = `Eres un Showrunner de Hollywood. Genera la escena principal del Capítulo 1 para la serie "${inputs.projectTitle}". Sinopsis: ${inputs.storyPremise}. Protagonista: ${inputs.protagonistDetails}. Referencias: ${inputs.plotReferences}`;
        
        const response = await fetch(`${ollamaUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelName,
            prompt: promptText,
            stream: false
          })
        });

        if (response.ok) {
          const resData = await response.json();
          aiGeneratedScript = resData.response;
        }
      } catch (e) {
        console.warn('Ollama local API offline or failed, falling back to Hollywood Engine:', e);
      }
    }

    setTimeout(() => {
      // Build Full Production Output Data v3.5
      generatedData = buildHollywoodProductionBundleV3(inputs, aiGeneratedScript);

      // Populate UI Outputs
      populateGeneratedOutputs(generatedData);

      // Auto save to projects
      saveCurrentProjectState();

      btnRunGeneration.disabled = false;
      btnRunGeneration.innerHTML = '<i class="fa-solid fa-rocket"></i> GENERAR PRODUCCIÓN CON PROBADOR DE IA & REFERENCIAS';

      // Switch to Storyboard Tab automatically
      const storyboardTabBtn = document.querySelector('[data-tab="tab-storyboard"]');
      if (storyboardTabBtn) storyboardTabBtn.click();

      alert(`¡Producción v3.5 generada exitosamente para "${inputs.projectTitle}"!\nSe han incorporado todas las referencias de formato, guion, personajes y escenografía.`);
    }, 1500);
  });

  /* ==========================================
     HOLLYWOOD AGENTS v3.5 PRO BUNDLE BUILDER
     ========================================== */
  function buildHollywoodProductionBundleV3(inputs, realAiResponse) {
    const title = inputs.projectTitle;
    const episodes = inputs.episodesCount;
    const type = inputs.projectType;

    // Parse Characters List
    const characterList = [
      { 
        id: 'CHAR_01_PROTAGONIST',
        name: extractName(inputs.protagonistDetails) || 'Carlos',
        role: 'Protagonista Principal',
        details: inputs.protagonistDetails,
        references: inputs.characterReferences || 'Sin referencias específicas',
        wardrobeStart: 'Camisa desgastada azul oscuro, jeans descoloridos, tenis viejos',
        wardrobeEnd: 'Traje de tres piezas gris marengo italiano, reloj de pulsera de lujo, zapatos Oxford de cuero pulido'
      }
    ];

    const secondLines = inputs.secondaryCharacters.split('\n').filter(l => l.trim().length > 0);
    secondLines.forEach((line, idx) => {
      characterList.push({
        id: `CHAR_0${idx + 2}_SECONDARY`,
        name: extractName(line) || `Personaje_${idx + 2}`,
        role: 'Personaje Secundario / Antagonista',
        details: line,
        references: inputs.characterReferences || 'Atuendo profesional formal según su rol',
        wardrobeStart: 'Atuendo profesional formal según su rol',
        wardrobeEnd: 'Atuendo formal con accesorios distintivos'
      });
    });

    // 1. Build Storyboard Frames with References
    const storyboardFrames = [];
    const shotsPerEp = 4;
    for (let ep = 1; ep <= episodes; ep++) {
      for (let s = 1; s <= shotsPerEp; s++) {
        const shotAngle = s === 1 ? 'Close-Up' : s === 2 ? 'Medium Shot' : s === 3 ? 'Wide Shot' : 'Over the Shoulder';
        storyboardFrames.push({
          ep,
          shotNumber: s,
          angle: shotAngle,
          title: `Capítulo ${ep} - Plano ${s}: ${shotAngle}`,
          desc: `Tomas de la fase ${ep} mostrando a ${characterList[0].name}. Estilo de cámara: ${inputs.cameraStyle}.`,
          prompt: `Cinematic ${shotAngle.toLowerCase()} shot of ${characterList[0].name}, ${inputs.artStyle}, lighting in ${inputs.colorPalette}, photorealistic 8k --ar 16:9`
        });
      }
    }

    // 2. Metrics & AI Budget Calculator
    const totalScriptWords = episodes * 350;
    const elevenlabsChars = totalScriptWords * 5;
    const soraVideoShots = storyboardFrames.length;
    const fluxImageRenders = characterList.length * 3 + storyboardFrames.length;
    const estimatedRenderTime = Math.ceil((soraVideoShots * 0.5) + (fluxImageRenders * 0.1));

    // 3. 00_SYSTEM_MEMORY_PATTERN.md
    const memoryPattern = `# PATRÓN DE MEMORIA CONTINUADA & REGLAS DE COHERENCIA (AI MEMORY PATTERN v3.5)
PROYECTO: ${title.toUpperCase()}
ID DE SEMILLA DE PRODUCCIÓN: SEED_${title.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_2026

## 🎭 DICCIONARIO MATRICIAL DE PERSONAJES:
${characterList.map(char => `
### [${char.id}] -> ${char.name.toUpperCase()}
- **Nombre Fijo:** ${char.name}
- **Rol:** ${char.role}
- **Rasgos Físicos Permanentes:** ${char.details}
- **Referencias de Estilo:** ${char.references}
- **Vestuario Fase 1:** ${char.wardrobeStart}
- **Vestuario Fase 2:** ${char.wardrobeEnd}
`).join('\n')}

## 📋 REGLAS ESTRICTAS DE CONTINUIDAD:
1. Consistencia facial obligatoria en todas las tomas.
2. Referencias de Formato: "${inputs.formatReferences}".
3. Referencias Escenográficas: "${inputs.scenarioReferences}".
4. Coherencia cromática: "${inputs.colorPalette}".
`;

    // 4. DaVinci Resolve EDL (CMX3600 Standard)
    let edlContent = `TITLE: ${title.toUpperCase()}\nFCM: NON-DROP FRAME\n\n`;
    storyboardFrames.forEach((frame, idx) => {
      const idxStr = String(idx + 1).padStart(3, '0');
      const startTc = `00:00:${String(idx * 5).padStart(2, '0')}:00`;
      const endTc = `00:00:${String((idx + 1) * 5).padStart(2, '0')}:00`;
      edlContent += `${idxStr}  AX       V     C        ${startTc} ${endTc} ${startTc} ${endTc}\n* FROM CLIP: SHOT_${frame.ep}_${frame.shotNumber}\n\n`;
    });

    // 5. Final Cut / Premiere Pro XML
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="5">
  <sequence>
    <name>${title}</name>
    <duration>${storyboardFrames.length * 150}</duration>
    <rate><timebase>30</timebase><ntsc>FALSE</ntsc></rate>
    <media>
      <video>
        <track>
          ${storyboardFrames.map((f, i) => `
          <clipitem id="clip_${i}">
            <name>SHOT_${f.ep}_${f.shotNumber}</name>
            <duration>150</duration>
            <start>${i * 150}</start>
            <end>${(i + 1) * 150}</end>
          </clipitem>`).join('')}
        </track>
      </video>
    </media>
  </sequence>
</xmeml>`;

    // 6. Kit Promocional de YouTube & Blogger
    const promoKit = `# KIT PROMOCIONAL PARA YOUTUBE & BLOGGER v3.5
PROYECTO: ${title}

## 📺 YOUTUBE METADATA & SEO

### TÍTULOS SUGERIDOS PARA YOUTUBE:
1. 🔥 De la Pobreza Extrema a la Cúspide Tecnológica | ${title} (Episodio 1)
2. El Secreto para Construir un Imperio desde Cero 💡
3. ${title}: La Serie que Cambiará tu Perspectiva del Éxito Financiero

### DESCRIPCIÓN OPTIMIZADA PARA YOUTUBE:
¡Hola a todos los suscriptores y a la audiencia! Bienvenidos a esta impactante serie sobre superación personal y tecnológica.

En esta historia seguimos a ${characterList[0].name}, quien demuestra que con perseverancia autodidacta y visión es posible salir de la pobreza extrema y construir una empresa multimillonaria.

📌 Capítulos de la Serie:
0:00 - Introducción y la Lucha Inicial
1:30 - La Chispas del Negocio Digital
3:00 - Superando el Sabotaje
4:30 - El Triunfo Final

Si te ha gustado el video no olvides darle un me gusta y suscribirte, hasta la vista!

---

### PROMPT PARA LA MINIATURA DE YOUTUBE (THUMBNAIL PROMPT):
\`\`\`text
YouTube thumbnail style, high contrast dramatic split screen: left side shows ${characterList[0].name} in a dark humble room studying on an old laptop, right side shows ${characterList[0].name} in a luxury suit on top of a futuristic skyscraper, bold 3D text "DE POBRE A RICO", photorealistic 8k --ar 16:9
\`\`\`

---

## 📝 ENTRADA DE BLOG PARA BLOGGER

### Título: La Increíble Travesía de ${characterList[0].name}: De la Pobreza al Éxito Tecnológico

En el mundo hiperconectado de hoy, las historias de superación personal no solo nos inspiran, sino que nos brindan una hoja de ruta práctica para transformar nuestras propias vidas.

La nueva serie cinematográfica "${title}" relata el camino de ${characterList[0].name}, un joven autodidacta que convirtió las limitaciones de su entorno en el combustible para crear un imperio tecnológico.
`;

    // 7. System Prompts & Full Scripts
    let scripts = `# GUION CINEMATOGRÁFICO DESGLOSADO POR ESCENAS (CON REFERENCIAS ADICIONALES)
PROYECTO: ${title}
NOTAS DE TRAMA & GIROS: ${inputs.plotReferences}
REFERENCIAS DE RITMO: ${inputs.formatReferences}

`;

    if (realAiResponse) {
      scripts += `\n--- RESPUESTA GENERADA EN TIEMPO REAL POR OLLAMA AI ---\n\n${realAiResponse}\n\n================================================================================\n`;
    }

    scripts += generateFullScriptTextV3(episodes, title, characterList, inputs);

    const systemPrompts = `# HOLLYWOOD SYSTEM PROMPTS v3.5\nPROYECTO: ${title}\nREFERENCIAS DE DIRECCIÓN: ${inputs.styleAudioReferences}`;
    const agentRules = `# AGENT RULES v3.5`;
    const projectBible = `# PROJECT BIBLE v3.5\nPREMISA: ${inputs.storyPremise}\nNOTAS ADICIONALES: ${inputs.plotReferences}`;
    const characters = `# DOSSIER CHARACTERS v3.5\nREFERENCIAS DE ACTORES: ${inputs.characterReferences}`;
    const environments = `# DOSSIER ENVIRONMENTS v3.5\nREFERENCIAS DE ESCENOGRAFÍA: ${inputs.scenarioReferences}`;
    const cinematography = `# CINEMATOGRAPHY SHOT LIST v3.5\nESTILO VISUAL: ${inputs.artStyle}\nREFERENCIAS: ${inputs.styleAudioReferences}`;
    const audio = `# AUDIO GUIDE v3.5\nPROCESAMIENTO VOICEOVER: ${inputs.voiceoverStyle}`;

    const customGptJson = {
      name: title,
      description: inputs.storyPremise,
      instructions: `Eres el asistente de producción de la serie ${title}. Manten la coherencia de personajes y vestuario.`
    };

    const modelfile = `FROM llama3\nSYSTEM "Eres el asistente cinematográfico de ${title}."`;

    return {
      title,
      characterList,
      storyboardFrames,
      metrics: {
        elevenlabsChars,
        soraVideoShots,
        fluxImageRenders,
        estimatedRenderTime
      },
      manifest: {
        title,
        type,
        episodesCount: episodes,
        generatedAt: new Date().toISOString(),
        engine: 'Hollywood Agent Studio v3.5 Pro'
      },
      files: {
        memoryPattern,
        systemPrompts,
        agentRules,
        projectBible,
        characters,
        environments,
        scripts,
        cinematography,
        audio,
        edl: edlContent,
        xml: xmlContent,
        promoKit,
        customGptJson,
        modelfile
      }
    };
  }

  function generateFullScriptTextV3(episodesCount, title, characterList, inputs) {
    let fullScript = '';
    const protagonist = characterList[0]?.name || 'CARLOS';
    const antagonist = characterList[1]?.name || 'ROBERTO';

    for (let ep = 1; ep <= episodesCount; ep++) {
      fullScript += `
================================================================================
CAPÍTULO ${ep}: "DESARROLLO DE ESCENA ${ep}"
================================================================================

ESCENA 1. INT. HABITACIÓN / OFICINA - NOCHE

[NOTAS DE REFERENCIA: ${inputs.scenarioReferences || 'Entorno cinematográfico en alto contraste'}]
[CONTINUITY NOTE: ${protagonist.toUpperCase()} viste ${ep <= 2 ? 'ropa humilde azul desgastada' : 'traje de tres piezas de lujo'}]

La luz tenue ilumina el rostro de ${protagonist.toUpperCase()}.

${protagonist.toUpperCase()}
(firme, con mirada determinada)
Cada línea de código que escribo es un paso fuera de la oscuridad.

${antagonist.toUpperCase()}
(entrando en cuadro)
El mercado no respeta los sueños sin capital, ${protagonist}.

${protagonist.toUpperCase()}
El capital se construye con determinación. Observa cómo cambia la historia.

[CORTE A NEGRO]

---
`;
    }
    return fullScript;
  }

  function extractName(text) {
    if (!text) return null;
    const match = text.match(/^([A-Za-zÁÉÍÓÚáéíóúÑñ]+)/);
    return match ? match[1] : null;
  }

  /* ==========================================
     STORYBOARD & AVATAR CARDS RENDERERS
     ========================================== */
  function renderStoryboardCards(frames) {
    const container = document.getElementById('storyboard-container');
    if (!container) return;

    container.innerHTML = '';

    if (!frames || frames.length === 0) {
      container.innerHTML = `
        <div class="avatar-placeholder-box">
          <i class="fa-solid fa-images"></i>
          <p>Genera un proyecto en el Asistente para ver las tomas de Storyboard.</p>
        </div>
      `;
      return;
    }

    frames.forEach((frame, idx) => {
      const card = document.createElement('div');
      card.className = 'storyboard-card';

      const svgFrame = createStoryboardSvgFrame(idx);

      card.innerHTML = `
        <div class="storyboard-frame-box">
          <span class="shot-badge">${frame.angle}</span>
          ${svgFrame}
        </div>
        <div class="storyboard-card-body">
          <span class="scene-title">${frame.title}</span>
          <p class="scene-desc">${frame.desc}</p>
          <div class="prompt-box">${frame.prompt}</div>
        </div>
      `;

      container.appendChild(card);
    });
  }

  function createStoryboardSvgFrame(idx) {
    const bgColors = ['#1e293b', '#0f172a', '#1e1b4b', '#111827'];
    const bg = bgColors[idx % bgColors.length];

    return `
      <svg width="100%" height="100%" viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg">
        <rect width="320" height="180" fill="${bg}"/>
        <circle cx="160" cy="80" r="30" fill="#6366f1" opacity="0.4"/>
        <path d="M 120 160 Q 160 110 200 160 Z" fill="#6366f1" opacity="0.6"/>
        <text x="160" y="170" fill="#94a3b8" font-size="10" text-anchor="middle">STORYBOARD FRAME #${idx + 1}</text>
      </svg>
    `;
  }

  function renderAvatarCards(characters) {
    const container = document.getElementById('avatar-cards-container');
    if (!container) return;

    container.innerHTML = '';

    characters.forEach((char, index) => {
      const card = document.createElement('div');
      card.className = 'avatar-card';

      const svgIcon = createRandomSvgAvatar(index);

      card.innerHTML = `
        <div class="avatar-svg-box">
          ${svgIcon}
        </div>
        <h4>${char.name}</h4>
        <p>${char.role}</p>
      `;

      container.appendChild(card);
    });
  }

  function createRandomSvgAvatar(index) {
    const colors = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#3b82f6'];
    const color = colors[index % colors.length];

    return `
      <svg width="80" height="80" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="${color}" opacity="0.2"/>
        <circle cx="50" cy="38" r="18" fill="${color}"/>
        <path d="M 22 82 C 22 62, 78 62, 78 82 Z" fill="${color}"/>
      </svg>
    `;
  }

  /* ==========================================
     PRO EXPORT BUTTONS HANDLER
     ========================================== */
  const btnExportEdl = document.getElementById('btn-export-edl');
  const btnExportXml = document.getElementById('btn-export-xml');
  const btnExportGpt = document.getElementById('btn-export-gpt');
  const btnExportPromo = document.getElementById('btn-export-promo');

  function downloadTextFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (btnExportEdl) {
    btnExportEdl.addEventListener('click', () => {
      if (generatedData && generatedData.files.edl) {
        downloadTextFile('timeline_davinci.edl', generatedData.files.edl);
      } else {
        alert('Genera primero un proyecto en el Asistente.');
      }
    });
  }

  if (btnExportXml) {
    btnExportXml.addEventListener('click', () => {
      if (generatedData && generatedData.files.xml) {
        downloadTextFile('timeline_finalcut.xml', generatedData.files.xml);
      } else {
        alert('Genera primero un proyecto en el Asistente.');
      }
    });
  }

  if (btnExportGpt) {
    btnExportGpt.addEventListener('click', () => {
      if (generatedData && generatedData.files.customGptJson) {
        downloadTextFile('custom_gpt_config.json', JSON.stringify(generatedData.files.customGptJson, null, 2));
      } else {
        alert('Genera primero un proyecto en el Asistente.');
      }
    });
  }

  if (btnExportPromo) {
    btnExportPromo.addEventListener('click', () => {
      if (generatedData && generatedData.files.promoKit) {
        downloadTextFile('YOUTUBE_BLOGGER_PROMO_KIT.md', generatedData.files.promoKit);
      } else {
        alert('Genera primero un proyecto en el Asistente.');
      }
    });
  }

  /* ==========================================
     COPY BUTTONS HANDLER
     ========================================== */
  const copyButtons = document.querySelectorAll('.btn-copy');

  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const textarea = document.getElementById(targetId);
      if (textarea && textarea.value) {
        navigator.clipboard.writeText(textarea.value);
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> ¡Copiado!';
        setTimeout(() => btn.innerHTML = originalText, 2000);
      } else {
        alert('No hay contenido generado para copiar.');
      }
    });
  });

  /* ==========================================
     EXPORT QUICK BUTTON v3.5
     ========================================== */
  const btnExportQuick = document.getElementById('btn-export-quick');

  btnExportQuick.addEventListener('click', async () => {
    if (!generatedData) {
      alert('Por favor, genera primero un proyecto en el Asistente antes de exportar.');
      return;
    }

    if (window.electronAPI) {
      const res = await window.electronAPI.exportProductionPackage(generatedData);
      if (res.success) {
        const zipMsg = res.zipPath ? `\n- Archivo ZIP: ${res.zipPath}` : '';
        if (confirm(`¡Proyecto v3.5 exportado exitosamente!\n- Carpeta: ${res.folderPath}${zipMsg}\n\n¿Deseas abrir la carpeta en el Explorador?`)) {
          window.electronAPI.openFolder(res.folderPath);
        }
      } else {
        alert(`Error al exportar: ${res.reason || res.error}`);
      }
    } else {
      alert('La exportación ZIP requiere ejecutar la app en Electron.');
    }
  });

});
