/* ==========================================================================
   HOLLYWOOD AGENT STUDIO v2.0 - RENDERER SCRIPT & PROJECT MANAGER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // State Management
  let currentStep = 1;
  let currentTheme = 'dark';
  let generatedData = null;
  let savedProjects = [];
  let currentProjectId = null;

  let appSettings = {
    provider: 'offline',
    geminiKey: '',
    openaiKey: '',
    claudeKey: '',
    openrouterKey: '',
    ollamaUrl: 'http://localhost:11434',
    lmstudioUrl: 'http://localhost:1234',
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
      musicStyle: document.getElementById('music-style').value
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
      document.getElementById('output-memory').value = generatedData.files.memoryPattern || '';
      document.getElementById('output-script').value = generatedData.files.scripts || '';
      document.getElementById('output-characters').value = generatedData.files.characters || '';
      document.getElementById('output-camera').value = generatedData.files.cinematography || '';
      document.getElementById('output-audio').value = generatedData.files.audio || '';
      renderAvatarCards(generatedData.characterList || []);
    }

    renderProjectsSidebar();
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
      musicStyle: 'Sintetizador y Orquesta'
    });

    document.getElementById('output-memory').value = '';
    document.getElementById('output-script').value = '';
    document.getElementById('output-characters').value = '';
    document.getElementById('output-camera').value = '';
    document.getElementById('output-audio').value = '';
    document.getElementById('avatar-cards-container').innerHTML = `
      <div class="avatar-placeholder-box">
        <i class="fa-solid fa-wand-magic-sparkles"></i>
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
     SETTINGS MODAL & PROVIDERS
     ========================================== */
  const btnSettings = document.getElementById('btn-settings');
  const modalSettings = document.getElementById('settings-modal');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const aiProviderSelect = document.getElementById('ai-provider');
  const providerSettingGroups = document.querySelectorAll('.provider-setting');

  function updateProviderSettingsVisibility() {
    const provider = aiProviderSelect.value;
    providerSettingGroups.forEach(group => group.style.display = 'none');

    const targetGroup = document.getElementById(`setting-${provider}`);
    if (targetGroup) targetGroup.style.display = 'block';
  }

  aiProviderSelect.addEventListener('change', updateProviderSettingsVisibility);

  btnSettings.addEventListener('click', () => {
    applySettingsToUI();
    modalSettings.classList.add('active');
  });

  btnCloseSettings.addEventListener('click', () => {
    modalSettings.classList.remove('active');
  });

  function applySettingsToUI() {
    aiProviderSelect.value = appSettings.provider || 'offline';
    document.getElementById('gemini-key').value = appSettings.geminiKey || '';
    document.getElementById('openai-key').value = appSettings.openaiKey || '';
    document.getElementById('claude-key').value = appSettings.claudeKey || '';
    document.getElementById('openrouter-key').value = appSettings.openrouterKey || '';
    document.getElementById('ollama-url').value = appSettings.ollamaUrl || 'http://localhost:11434';
    document.getElementById('lmstudio-url').value = appSettings.lmstudioUrl || 'http://localhost:1234';
    updateProviderSettingsVisibility();
  }

  btnSaveSettings.addEventListener('click', () => {
    appSettings.provider = aiProviderSelect.value;
    appSettings.geminiKey = document.getElementById('gemini-key').value.trim();
    appSettings.openaiKey = document.getElementById('openai-key').value.trim();
    appSettings.claudeKey = document.getElementById('claude-key').value.trim();
    appSettings.openrouterKey = document.getElementById('openrouter-key').value.trim();
    appSettings.ollamaUrl = document.getElementById('ollama-url').value.trim();
    appSettings.lmstudioUrl = document.getElementById('lmstudio-url').value.trim();

    if (window.electronAPI) {
      window.electronAPI.saveSettings(appSettings).then(() => {
        alert('Configuración guardada exitosamente.');
        modalSettings.classList.remove('active');
      });
    } else {
      alert('Configuración actualizada.');
      modalSettings.classList.remove('active');
    }
  });

  /* ==========================================
     HOLLYWOOD 10 AGENTS ENGINE & ORCHESTRATION v2.0
     ========================================== */
  const btnRunGeneration = document.getElementById('btn-run-generation');

  btnRunGeneration.addEventListener('click', async () => {
    const inputs = getWizardFormData();

    btnRunGeneration.disabled = true;
    btnRunGeneration.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ORQUESTANDO RED DE 10 AGENTES IA & MEMORIA...';

    setTimeout(() => {
      // Build Full Production Output Data
      generatedData = buildHollywoodProductionBundleV2(inputs);

      // Update Output Textareas
      document.getElementById('output-memory').value = generatedData.files.memoryPattern;
      document.getElementById('output-script').value = generatedData.files.scripts;
      document.getElementById('output-characters').value = generatedData.files.characters;
      document.getElementById('output-camera').value = generatedData.files.cinematography;
      document.getElementById('output-audio').value = generatedData.files.audio;

      // Render Visual Avatars & Scenarios Cards
      renderAvatarCards(generatedData.characterList);

      // Auto save to projects
      saveCurrentProjectState();

      btnRunGeneration.disabled = false;
      btnRunGeneration.innerHTML = '<i class="fa-solid fa-rocket"></i> GENERAR PRODUCCIÓN COMPLETA (10 AGENTES IA + PATRÓN MEMORIA)';

      // Switch to Memory Tab automatically
      const memoryTabBtn = document.querySelector('[data-tab="tab-memory"]');
      if (memoryTabBtn) memoryTabBtn.click();

      alert(`¡Producción completada con éxito para "${inputs.projectTitle}"!\nSe ha generado el Patrón de Memoria Continuada, los guiones desglosados, las fichas de vestuario y la directiva de 10 Agentes.`);
    }, 1400);
  });

  /* ==========================================
     HOLLYWOOD AGENTS v2.0 CONTENT GENERATOR
     ========================================== */
  function buildHollywoodProductionBundleV2(inputs) {
    const title = inputs.projectTitle;
    const episodes = inputs.episodesCount;
    const type = inputs.projectType;

    // Parse Characters List with Fixed IDs
    const characterList = [
      { 
        id: 'CHAR_01_PROTAGONIST',
        name: extractName(inputs.protagonistDetails) || 'Carlos',
        role: 'Protagonista Principal',
        details: inputs.protagonistDetails,
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
        wardrobeStart: 'Atuendo profesional formal según su rol',
        wardrobeEnd: 'Atuendo formal con accesorios distintivos'
      });
    });

    // 00: PATRÓN DE MEMORIA CONTINUADA (AI MEMORY PATTERN)
    const memoryPattern = `# PATRÓN DE MEMORIA CONTINUADA & REGLAS DE COHERENCIA (AI MEMORY PATTERN)
PROYECTO: ${title.toUpperCase()}
ID DE SEMILLA DE PRODUCCIÓN: SEED_${title.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_2026

================================================================================
REGLA N° 1 DE MEMORIA DIRECTA (INSTRUCCIÓN PARA CUALQUIER IA):
"Memoriza este diccionario de producción como verdades absolutas. Bajo ninguna circunstancia cambies los nombres, las características faciales, los identificadores de vestuario ni las reglas de continuidad establecidas en este archivo."
================================================================================

## 🎭 DICCIONARIO MATRICIAL DE PERSONAJES (FIXED CHARACTER TOKENS):

${characterList.map(char => `
### [${char.id}] -> ${char.name.toUpperCase()}
- **Nombre Fijo:** ${char.name}
- **Rol:** ${char.role}
- **Rasgos Físicos Permanentes:** ${char.details}
- **Fase 1 Vestuario (Pobreza/Inicio):** ${char.wardrobeStart}
- **Fase 2 Vestuario (Éxito/Clímax):** ${char.wardrobeEnd}
- **Token Visual Midjourney/Flux:** \`[FACE_SEED_${char.name.toUpperCase()}_8K]\`
`).join('\n')}

---

## 🏛️ DICCIONARIO MATRICIAL DE ESCENARIOS (FIXED SCENARIO TOKENS):

### [LOC_01_INITIAL_LOCATION]
- **Nombre:** Entorno de Origen
- **Descripción Fija:** ${inputs.keyLocations.split('\n')[0] || 'Habitación humilde'}
- **Iluminación Fija:** Tonalidades azules frías, lámpara de mesa tenue.

### [LOC_02_CLIMAX_LOCATION]
- **Nombre:** Entorno de Éxito Corporativo
- **Descripción Fija:** Edificio de alta tecnología con ventanales de cristal panorámicos sobre la metrópoli.
- **Iluminación Fija:** Luz dorada cálida de hora mágica (Golden Hour), alto contraste cinematográfico.

---

## 📋 REGLAS ESTRICTAS DE CONTINUIDAD (SCRIPT SUPERVISOR DIRECTIVES):
1. **Consistencia de Rostro:** En todas las escenas donde aparezca \`[CHAR_01_PROTAGONIST]\`, los rasgos faciales deben ser idénticos (mismo corte de cabello, tono de piel y postura).
2. **Evolución del Vestuario:** El personaje NUNCA debe aparecer vistiendo el traje de lujo en el Capítulo 1, ni vistiendo la ropa desgastada en el Capítulo 4. La transición ocurre estrictamente en el Capítulo 3.
3. **Coherencia Cromática:** La paleta cromática de fondo debe cumplir estrictamente: "${inputs.colorPalette}".
`;

    // 01: System Agents Prompts (10 Agents)
    const systemPrompts = `# HOLLYWOOD AI SYSTEM PROMPTS (RED DE 10 AGENTES ESPECIALIZADOS)
PROYECTO: ${title.toUpperCase()}
SHOWRUNNER DIRECTIVE & MASTER CONTROL

---

## 🎬 1. MASTER DIRECTOR & ORQUESTADOR GENERAL
"Eres el Director Supremo de Cine de Hollywood. Tu objetivo es orquestar a los otros 9 agentes para garantizar que la película '${title}' mantenga una narrativa impecable, emoción en cada plano y cero desviaciones del patrón de memoria."

## 📋 2. SCRIPT SUPERVISOR & AGENTE DE CONTINUIDAD
"Supervisas cada objeto, prenda de vestir, posición de luz y peinado entre corte y corte. Si detectas alguna incoherencia entre escenas, la corriges inmediatamente."

## ✍️ 3. GUIONISTA PRINCIPAL (LEAD SCREENWRITER)
"Redactas diálogos dinámicos, subtextos y arcos dramáticos en formato estándar de guion de cine para los ${episodes} capítulos."

## 🎥 4. DIRECTOR DE FOTOGRAFÍA (CINEMATOGRAPHER)
"Diseñas los planos de cámara (Shot List), especificando lentes de 35mm anamórficos, movimientos de Dolly/Steadicam y prompts de video para Runway Gen-3, Sora y Pika."

## 🏛️ 5. DIRECTOR DE ARTE & ESCENARIOS
"Diseñas la arquitectura visual, utilería de época y decorados para los escenarios del proyecto."

## 👔 6. ESPECIALISTA DE VESTUARIO & STYLING (WARDROBE DIRECTOR)
"Garantizas que cada personaje use el atuendo exacto según su evolución socioeconómica en la historia."

## 🎨 7. DISEÑADOR DE CONCEPTO & CONSISTENCIA DE ROSTROS
"Generas prompts matriciales con tokens fijos ([CHAR_ID]) para Midjourney v6 y Flux.1."

## 🎧 8. INGENIERO DE SONIDO & LOCUCIÓN ELEVENLABS
"Formateas las voces con marcas temporales ([confident], [whispering]) y compones la banda sonora."

## 🎞️ 9. COLORISTA & DIRECTOR DE POST-PRODUCCIÓN
"Aplicas las curvas de etalonaje digital (Color Grading), grano de película 35mm y ritmo de corte."

## 🧠 10. ARQUITECTO DE MEMORIA CONTINUADA
"Mantienes actualizado el archivo 00_SYSTEM_MEMORY_PATTERN.md para fijar la memoria de cualquier IA."
`;

    const agentRules = `# AGENT RULES & SKILLS CONFIGURATION FILE v2.0 (.agents / .antigravity)

## LISTA DE AGENTES ACTIVOS EN MEMORIA:
- MasterDirectorAgent
- ContinuitySupervisorAgent
- LeadScreenwriterAgent
- CinematographerAgent
- ProductionArtDirectorAgent
- WardrobeStylistAgent
- CharacterConsistencyAgent
- SoundDirectorAgent
- ColoristPostAgent
- MemoryArchitectAgent
`;

    // 02: Project Bible
    const projectBible = `# BIBLIA DE PRODUCCIÓN CINEMATOGRÁFICA (MASTER BIBLE v2.0)
**PROYECTO:** ${title}
**FORMATO:** ${type} (${episodes} Capítulos)
**DURACIÓN:** ${inputs.episodeDuration} por capítulo
**GÉNERO:** ${inputs.storyGenre}
**TONO NARRATIVO:** ${inputs.narrativeTone}
**PALETA DE COLORES:** ${inputs.colorPalette}
**ESTILO VISUAL:** ${inputs.artStyle}

---

## 📝 PREMISA GENERAL
${inputs.storyPremise}

---

## 🎯 ESTRUCTURA NARRATIVA DE ${episodes} CAPÍTULOS CON PATRÓN DE CONTINUIDAD
${generateEpisodesBreakdownV2(episodes, title, characterList)}
`;

    // 03: Characters & Wardrobe Dossier
    const characters = `# DOSSIER TÉCNICO DE PERSONAJES, VESTUARIO & PROMPTS DE CONSISTENCIA

${characterList.map((char, index) => `
### PERSONAJE ${index + 1}: ${char.name.toUpperCase()} (ID: ${char.id})
- **Rol:** ${char.role}
- **Descripción Físico-Psicológica:** ${char.details}
- **Fase de Origen - Vestuario:** ${char.wardrobeStart}
- **Fase de Éxito - Vestuario:** ${char.wardrobeEnd}

#### PROMPT DE CONSISTENCIA FACIAL (MIDJOURNEY v6 / FLUX.1):
\`\`\`text
Cinematic character reference sheet of ${char.name}, ${char.details}, wearing ${char.wardrobeStart}, ${inputs.artStyle}, photorealistic 8k, dramatic lighting, color palette ${inputs.colorPalette}, shot on 35mm anamorphic lens --ar 16:9 --style raw --v 6.0
\`\`\`
`).join('\n---\n')}
`;

    // 04: Scenarios Dossier
    const environments = `# DOSSIER DE ESCENARIOS, ARQUITECTURA DE SETS & ILUMINACIÓN

## ENTORNOS PRINCIPALES DE LA PRODUCCIÓN:
${inputs.keyLocations}

---

## PROMPTS MATRICIALES PARA ESCENARIOS:
\`\`\`text
Wide cinematic interior of ${inputs.keyLocations.split('\n')[0] || 'Initial Location'}, ${inputs.visualEra}, realistic textures, lighting in ${inputs.colorPalette}, ${inputs.artStyle}, 8k resolution --ar 16:9
\`\`\`
`;

    // 05: Scripts Breakdown
    const scripts = `# GUION CINEMATOGRÁFICO DESGLOSADO POR ESCENAS
PROYECTO: ${title}
CONTINUIDAD GARANTIZADA POR SCRIPT SUPERVISOR

${generateFullScriptTextV2(episodes, title, characterList)}
`;

    // 06: Cinematography & Shot List
    const cinematography = `# DIRECCIÓN DE CÁMARA, SHOT LIST & PROMPTS DE VIDEO (AI VIDEO ENGINE)
ESTILO DE CÁMARA: ${inputs.cameraStyle}

${generateCameraShotListV2(episodes, characterList, inputs)}
`;

    // 07: Audio & Voiceover Guide
    const audio = `# DIRECCIÓN DE SONIDO, VOICE OVER ELEVENLABS & MÚSICA
ESTILO DE LOCUCIÓN: ${inputs.voiceoverStyle}
BANDA SONORA: ${inputs.musicStyle}

${generateAudioScriptV2(episodes, characterList, inputs)}
`;

    return {
      title,
      characterList,
      manifest: {
        title,
        type,
        episodesCount: episodes,
        genre: inputs.storyGenre,
        generatedAt: new Date().toISOString(),
        engine: 'Hollywood Agent Studio v2.0 IA Suite'
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
        audio
      }
    };
  }

  function extractName(text) {
    if (!text) return null;
    const match = text.match(/^([A-Za-zÁÉÍÓÚáéíóúÑñ]+)/);
    return match ? match[1] : null;
  }

  function generateEpisodesBreakdownV2(episodesCount, title, characterList) {
    let breakdown = '';
    const protagonist = characterList[0]?.name || 'Carlos';

    for (let i = 1; i <= episodesCount; i++) {
      breakdown += `
### CAPÍTULO ${i}: "Fase ${i} - Arco Dramático de ${protagonist}"
- **Objetivo Narrativo:** Desplegar el nivel ${i} de la transformación de la pobreza al éxito.
- **Vestuario Asignado a ${protagonist}:** ${i <= 2 ? characterList[0].wardrobeStart : characterList[0].wardrobeEnd}.
- **Conflicto Clave:** ${i === 1 ? 'Superación de escasez extrema.' : i === 2 ? 'Creación del primer prototipo digital.' : i === 3 ? 'Traición de inversionistas corporativos.' : 'Consolidación del imperio tecnológico.'}
- **Gancho Final de Continuidad:** Escena de cierre que conecta con el inicio del capítulo ${i + 1 <= episodesCount ? i + 1 : 'final'}.
`;
    }
    return breakdown;
  }

  function generateFullScriptTextV2(episodesCount, title, characterList) {
    let fullScript = '';
    const protagonist = characterList[0]?.name || 'CARLOS';
    const antagonist = characterList[1]?.name || 'ROBERTO';

    for (let ep = 1; ep <= episodesCount; ep++) {
      fullScript += `
================================================================================
CAPÍTULO ${ep}: "DESARROLLO DE ESCENA ${ep}"
================================================================================

ESCENA 1. INT. HABITACIÓN / OFICINA - NOCHE

[CONTINUITY NOTE: ${protagonist.toUpperCase()} viste ${ep <= 2 ? 'ropa humilde azul desgastada' : 'traje de tres piezas de lujo'}]

La luz de la pantalla ilumina el rostro de ${protagonist.toUpperCase()}.

${protagonist.toUpperCase()}
(firme)
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

  function generateCameraShotListV2(episodesCount, characterList, inputs) {
    const protagonist = characterList[0]?.name || 'Carlos';
    return `
## SHOT LIST CINEMATOGRÁFICO v2.0:

### TOMA 1: EXTREME CLOSE-UP (PRIMERÍSIMO PRIMER PLANO DE CONTINUIDAD)
- **Prompt Video AI (Runway Gen-3 / Sora):**
  \`\`\`text
  Extreme close-up shot of ${protagonist}'s face, 35mm lens, intense gaze, cinematic lighting in ${inputs.colorPalette}, photorealistic 8k --motion 3
  \`\`\`

### TOMA 2: TRACKING DOLLY SHOT (SEGUIMIENTO DE CÁMARA)
- **Prompt Video AI:**
  \`\`\`text
  Tracking dolly shot of ${protagonist} walking through city streets, smooth camera movement, anamorphic lens flare, movie quality --motion 5
  \`\`\`
`;
  }

  function generateAudioScriptV2(episodesCount, characterList, inputs) {
    const protagonist = characterList[0]?.name || 'Carlos';
    return `
## GUION DE LOCUCIÓN Y MÚSICA ELEVENLABS v2.0:

\`\`\`text
[soft piano melancholic melody...]

NARRADOR (VOZ CINEMATOGRÁFICA):
[thoughtful] De la escasez más profunda... al liderazgo indiscutible. La historia de ${protagonist} demuestra el poder de la perseverancia.
\`\`\`
`;
  }

  /* ==========================================
     AVATAR CARDS SVG GENERATOR & RENDERER
     ========================================== */
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
     EXPORT QUICK BUTTON
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
        if (confirm(`¡Proyecto exportado exitosamente!\n- Carpeta: ${res.folderPath}${zipMsg}\n\n¿Deseas abrir la carpeta en el Explorador?`)) {
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
