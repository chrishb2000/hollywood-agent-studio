/* ==========================================================================
   HOLLYWOOD AGENT STUDIO - RENDERER SCRIPT & AI ENGINE ORCHESTRATOR
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // State Management
  let currentStep = 1;
  let currentTheme = 'dark';
  let generatedData = null;
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

  // Load Initial Settings from IPC if available
  if (window.electronAPI) {
    window.electronAPI.getSettings().then(saved => {
      if (saved) {
        appSettings = { ...appSettings, ...saved };
        setTheme(appSettings.theme || 'dark');
        applySettingsToUI();
      }
    });
  }

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
     HOLLYWOOD AI AGENTS ENGINE & ORCHESTRATION
     ========================================== */
  const btnRunGeneration = document.getElementById('btn-run-generation');

  btnRunGeneration.addEventListener('click', async () => {
    const projectType = document.getElementById('project-type').value;
    const projectTitle = document.getElementById('project-title').value.trim() || 'Producción Audiovisual';
    const episodesCount = parseInt(document.getElementById('episodes-count').value) || 4;
    const episodeDuration = document.getElementById('episode-duration').value;
    const storyPremise = document.getElementById('story-premise').value;
    const storyGenre = document.getElementById('story-genre').value;
    const narrativeTone = document.getElementById('narrative-tone').value;
    const protagonistDetails = document.getElementById('protagonist-details').value;
    const secondaryCharacters = document.getElementById('secondary-characters').value;
    const keyLocations = document.getElementById('key-locations').value;
    const visualEra = document.getElementById('visual-era').value;
    const colorPalette = document.getElementById('color-palette').value;
    const artStyle = document.getElementById('art-style').value;
    const cameraStyle = document.getElementById('camera-style').value;
    const voiceoverStyle = document.getElementById('voiceover-style').value;
    const musicStyle = document.getElementById('music-style').value;

    btnRunGeneration.disabled = true;
    btnRunGeneration.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ORQUESTANDO AGENTES DE HOLLYWOOD...';

    setTimeout(() => {
      // Build Full Production Output Data
      generatedData = buildHollywoodProductionBundle({
        projectType,
        projectTitle,
        episodesCount,
        episodeDuration,
        storyPremise,
        storyGenre,
        narrativeTone,
        protagonistDetails,
        secondaryCharacters,
        keyLocations,
        visualEra,
        colorPalette,
        artStyle,
        cameraStyle,
        voiceoverStyle,
        musicStyle
      });

      // Update Output Textareas
      document.getElementById('output-script').value = generatedData.files.scripts;
      document.getElementById('output-characters').value = generatedData.files.characters;
      document.getElementById('output-camera').value = generatedData.files.cinematography;
      document.getElementById('output-audio').value = generatedData.files.audio;

      // Render Visual Avatars & Scenarios Cards
      renderAvatarCards(generatedData.characterList);

      btnRunGeneration.disabled = false;
      btnRunGeneration.innerHTML = '<i class="fa-solid fa-rocket"></i> GENERAR PRODUCCIÓN COMPLETA CON RED DE AGENTES IA';

      // Switch to Script Tab automatically
      const scriptTabBtn = document.querySelector('[data-tab="tab-script"]');
      if (scriptTabBtn) scriptTabBtn.click();

      alert(`¡Producción completada con éxito para "${projectTitle}"!\nSe han generado todos los guiones, prompts de agentes, skills, planos y especificaciones de audio.`);
    }, 1200);
  });

  /* ==========================================
     HOLLYWOOD AGENTS CONTENT GENERATOR
     ========================================== */
  function buildHollywoodProductionBundle(inputs) {
    const title = inputs.projectTitle;
    const episodes = inputs.episodesCount;
    const type = inputs.projectType;

    // Parse Characters List
    const characterList = [
      { name: extractName(inputs.protagonistDetails) || 'Protagonista', role: 'Protagonista Principal', details: inputs.protagonistDetails }
    ];

    const secondLines = inputs.secondaryCharacters.split('\n').filter(l => l.trim().length > 0);
    secondLines.forEach((line, idx) => {
      characterList.push({
        name: extractName(line) || `Personaje ${idx + 2}`,
        role: 'Personaje Secundario / Antagonista',
        details: line
      });
    });

    // 01: System Agents Prompts & Skills Rules
    const systemPrompts = `# HOLLYWOOD AI SYSTEM PROMPTS & AGENT ARCHITECTURE
PROYECTO: ${title.toUpperCase()}
FORMATO: ${type} (${episodes} Capítulos - ${inputs.episodeDuration})
GÉNERO: ${inputs.storyGenre}

---

## 🎭 AGENTE 1: EXECUTIVE PRODUCER & SHOWRUNNER
### SYSTEM PROMPT:
"Eres el Showrunner y Productor Ejecutivo Principal de Hollywood con más de 20 años de experiencia dirigiendo grandes producciones cinematográficas y series premiadas. Tu objetivo es mantener la visión de alto nivel, coherencia temática, control presupuestario creativo y garantizar que la narrativa del proyecto '${title}' resuene profundamente con la audiencia objetivo."

### REGLAS & SKILLS DEL AGENTE:
- Mantener siempre el tono: ${inputs.narrativeTone}.
- Garantizar arcos dramáticos sólidos en los ${episodes} capítulos.
- Supervisar la alineación entre la iluminación (${inputs.colorPalette}) y la evolución emocional de los personajes.

---

## 🎬 AGENTE 2: LEAD SCREENWRITER (GUIONISTA PRINCIPAL)
### SYSTEM PROMPT:
"Eres un guionista cinematográfico con estilo narrativo brillante en el estándar Hollywood Formatted Script. Tu función es redactar diálogos naturales, subtextos potentes, descripciones de acción dinámicas y ganchos finales (cliffhangers) en cada episodio."

### REGLAS & SKILLS DEL AGENTE:
- Formato de texto: Estándar de guion de cine (ENCABEZADO DE ESCENA, ACCIÓN, PERSONAJE, DIÁLOGO, (ACOTACIÓN)).
- Ritmo narrativo calibrado para episodios de ${inputs.episodeDuration}.

---

## 🎥 AGENTE 3: DIRECTOR OF PHOTOGRAPHY (CINEMATOGRAPHER)
### SYSTEM PROMPT:
"Eres el Director de Fotografía jefe del proyecto '${title}'. Tu meta es traducir las escenas en prompts cinematográficos hiperrealistas para generadores de video por IA (Runway Gen-3, OpenAI Sora, Pika Labs, Luma Dream Machine)."

### REGLAS & SKILLS DEL AGENTE:
- Especificar siempre: Tipo de lente (35mm, 50mm, anamórfico), ángulo de cámara, movimiento (Dolly in, Pan, Crane shot, Handheld), tipo de sensor y paleta cromática.
- Estilo visual asignado: ${inputs.artStyle}.

---

## 🎨 AGENTE 4: CONCEPT ARTIST & CHARACTER DESIGNER
### SYSTEM PROMPT:
"Eres el Diseñador de Concepto y Artista de Personajes. Generas prompts técnicos para Midjourney v6, Flux.1 y DALL-E 3 que garantizan consistencia de rostro, vestuario y ambientación en todas las tomas del proyecto."

---

## 🎧 AGENTE 5: AUDIO & SOUNDTRACK DIRECTOR
### SYSTEM PROMPT:
"Eres el Director de Sonido y Locución. Creas la pista de voz (Voiceover) formateada con etiquetas de síntesis de voz ElevenLabs ([sighs], [confident tone], [whispering]), efectos Foley y la ambientación musical."
`;

    const agentRules = `# AGENT RULES & SKILLS CONFIGURATION FILE (.agents / .antigravity)

## REGISTRANTE DE AGENTES ACTIVOS:
1. ExecutiveProducerAgent -> Role: Director General
2. ScreenwriterAgent -> Role: Redactor de Guiones
3. CinematographerAgent -> Role: Generador de Prompts de Cámara
4. ConceptArtistAgent -> Role: Artista de Consistencia Visual
5. SoundDirectorAgent -> Role: Diseñador de Voz & Audio

## INSTRUCCIONES DE INTEGRACIÓN EN LLMs (ChatGPT / Claude / Gemini / Ollama):
- Copiar las secciones de SYSTEM PROMPT en las configuraciones de Custom GPTs, Claude Projects o System Prompts de Ollama.
- Utilizar las reglas del proyecto como guía de contexto persistente.
`;

    // 02: Project Bible
    const projectBible = `# BIBLIA DE PRODUCCIÓN CINEMATOGRÁFICA
**PROYECTO:** ${title}
**TIPO:** ${type}
**CANTIDAD DE CAPÍTULOS:** ${episodes}
**DURACIÓN:** ${inputs.episodeDuration} por capítulo
**GÉNERO:** ${inputs.storyGenre}
**TONO:** ${inputs.narrativeTone}
**ÉPOCA & AMBIENTACIÓN:** ${inputs.visualEra}
**PALETA DE COLORES:** ${inputs.colorPalette}
**ESTILO VISUAL:** ${inputs.artStyle}

---

## 📝 SINOPSIS EJECUTIVA & PREMISA
${inputs.storyPremise}

---

## 🎯 ESTRUCTURA NARRATIVA DE ${episodes} CAPÍTULOS

${generateEpisodesBreakdown(episodes, title, inputs.storyPremise)}
`;

    // 03: Characters Dossier
    const characters = `# DOSSIER TÉCNICO DE PERSONAJES & PROMPTS DE IMAGEN (CONSISTENCY GUIDES)

${characterList.map((char, index) => `
### PERSONAJE ${index + 1}: ${char.name.toUpperCase()} (${char.role})
- **Detalles:** ${char.details}
- **Estilo de Vestuario:** Adaptativo según la evolución de la historia (${inputs.visualEra}).
- **PROMPT DE CONSISTENCIA PARA MIDJOURNEY / FLUX:**
  \`\`\`text
  Cinematic portrait shot of ${char.name}, ${char.details}, ${inputs.artStyle}, photorealistic, dramatic studio lighting, 8k resolution, color palette ${inputs.colorPalette}, shot on 35mm lens --ar 16:9 --style raw --v 6.0
  \`\`\`
`).join('\n---\n')}
`;

    // 04: Scenarios Dossier
    const environments = `# DOSSIER DE ESCENARIOS, ENTORNOS & ILUMINACIÓN

## ENTORNOS PRINCIPALES DEL PROYECTO:
${inputs.keyLocations}

---

## PROMPTS TÉCNICOS DE ENTORNO PARA GENERADORES VISUALES:

### ESCENARIO 1: ENTORNO INICIAL (ORIGEN)
\`\`\`text
Wide cinematic shot of ${inputs.keyLocations.split('\n')[0] || 'Initial Scene'}, ${inputs.visualEra}, atmospheric mood, lighting in ${inputs.colorPalette}, ${inputs.artStyle}, octane render, photorealistic, 8k --ar 16:9
\`\`\`

### ESCENARIO 2: ENTORNO CLÍMAX & ÉXITO
\`\`\`text
Extreme wide majestic shot of high-tech modern skyscraper interior overlooking city skyline, golden hour lighting, cinematic luxury, ${inputs.artStyle}, photorealistic, 8k resolution --ar 16:9
\`\`\`
`;

    // 05: Scripts Breakdown
    const scripts = `# GUION DESGLOSADO CINEMATOGRÁFICO
PROYECTO: ${title}
TOTAL DE CAPÍTULOS: ${episodes}

${generateFullScriptText(episodes, title, characterList, inputs)}
`;

    // 06: Cinematography & Camera Shot List
    const cinematography = `# GUÍA DE DIRECCIÓN DE CÁMARA & PROMPTS PARA AI VIDEO GENERATORS
ESTILO DE CÁMARA: ${inputs.cameraStyle}
ESTILO VISUAL: ${inputs.artStyle}

${generateCameraShotList(episodes, characterList, inputs)}
`;

    // 07: Audio & Voiceover Guide
    const audio = `# DOSSIER DE AUDIO, VOICE OVER & DIRECCIÓN MUSICAL
ESTILO DE LOCUCIÓN: ${inputs.voiceoverStyle}
DIRECCIÓN MUSICAL: ${inputs.musicStyle}

${generateAudioScript(episodes, characterList, inputs)}
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
        engine: 'Hollywood Agent Studio IA Suite'
      },
      files: {
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

  function generateEpisodesBreakdown(episodesCount, title, premise) {
    let breakdown = '';
    const episodeNames = [
      'El Origen y la Tormenta',
      'La Chispas de la Innovación',
      'Traiciones y la Gran Pruebas de Fuego',
      'La Cumbre y el Imperio Recobrado'
    ];

    for (let i = 1; i <= episodesCount; i++) {
      const epTitle = episodeNames[i - 1] || `Capítulo ${i}: La Transformación Continúa`;
      breakdown += `
### CAPÍTULO ${i}: "${epTitle}"
- **Objetivo Narrativo:** Mostrar la fase ${i} del arco dramático en la historia de superación.
- **Conflicto Principal:** ${i === 1 ? 'Luchar contra la escasez y los prejuicios del entorno.' : i === 2 ? 'Construir el primer prototipo funcional enfrentando la falta de recursos.' : i === 3 ? 'Enfrentar la traición de socios e inversionistas.' : 'Alcanzar el triunfo financiero y consolidar el legado.'}
- **Escenario Clave:** Escenario de Fase ${i}.
- **Gancho Final (Cliffhanger):** Momento decisivo de alta tensión emocional que impulsa al espectador al siguiente capítulo.
`;
    }
    return breakdown;
  }

  function generateFullScriptText(episodesCount, title, characterList, inputs) {
    let fullScript = '';
    const protagonist = characterList[0]?.name || 'CARLOS';
    const antagonist = characterList[1]?.name || 'ROBERTO';

    for (let ep = 1; ep <= episodesCount; ep++) {
      fullScript += `
================================================================================
CAPÍTULO ${ep}: "FASE NARRATIVA ${ep}"
================================================================================

ESCENA 1. INT. HABITACIÓN / LOCAL - NOCHE

La luz tenue de una lámpara ilumina el rostro exhausto de ${protagonist.toUpperCase()}.
Sobre la mesa, una laptop antigua muestra líneas de código compilar.

${protagonist.toUpperCase()}
(murmurando para sí mismo)
Un intento más... Esto tiene que funcionar.

De pronto, la puerta se abre de golpe. Entra ${antagonist.toUpperCase()}.

${antagonist.toUpperCase()}
(con tono escéptico)
¿Sigues perdiendo el tiempo con esos sueños absurdos? El mundo real no perdona a los débiles.

${protagonist.toUpperCase()}
(mirada firme, levantándose)
El mundo real pertenece a los que no se rinden jamás. Observa con atención, porque esto es solo el comienzo.

[CORTE A NEGRO]

---
`;
    }
    return fullScript;
  }

  function generateCameraShotList(episodesCount, characterList, inputs) {
    const protagonist = characterList[0]?.name || 'Protagonista';
    return `
## SHOT LIST TÉCNICO & PROMPTS PARA RUNWAY GEN-3 / SORA / PIKA:

### TOMA 1: EXTREME CLOSE-UP (PRIMERÍSIMO PRIMER PLANO)
- **Sujeto:** Ojos de ${protagonist} reflejando la pantalla digital.
- **Movimiento de Cámara:** Slow Zoom In (Acercamiento lento).
- **Prompt Video AI:** 
  \`\`\`text
  Extreme close-up shot of ${protagonist}'s eyes focused intently on a glowing screen, slow zoom in, dramatic low-key lighting, 35mm anamorphic lens, cinematic depth of field, hyperrealistic --motion 4
  \`\`\`

### TOMA 2: MEDIUM DOLLY SHOT (PLANO MEDIO EN MOVIMIENTO)
- **Sujeto:** ${protagonist} caminando determinado por la calle.
- **Movimiento de Cámara:** Tracking Dolly Shot a la par del sujeto.
- **Prompt Video AI:**
  \`\`\`text
  Medium tracking shot of ${protagonist} walking through rain-slicked city streets, moody atmosphere, neon reflections, 50mm lens, 4k 60fps cinematic look --motion 6
  \`\`\`

### TOMA 3: DRONE ESTABLISHING SHOT (PLANO GENERAL AÉREO)
- **Sujeto:** Edificio corporativo imponente de noche.
- **Movimiento de Cámara:** Drone Orbiting Shot (Órbita de drone).
- **Prompt Video AI:**
  \`\`\`text
  Cinematic aerial drone orbiting shot of a futuristic glass skyscraper at dusk, golden and blue hour lighting, hyperrealistic, movie scene --motion 5
  \`\`\`
`;
  }

  function generateAudioScript(episodesCount, characterList, inputs) {
    const protagonist = characterList[0]?.name || 'Carlos';
    return `
## GUION DE LOCUCIÓN (VOICEOVER FOR ELEVENLABS):

### ETIQUETAS DE VOZ & TIMING DE NARRADOR:
\`\`\`text
[soft piano melody fading in...]

NARRADOR (VOZ GRAVE Y INSPIRADORA):
[thoughtful tone] Muchos piensan que el éxito es cuestión de suerte... [pause 1s] pero la verdadera historia de ${protagonist}... se escribió en las noches más oscuras, cuando nadie más creía en él.

[dramatic swell in music...]

NARRADOR:
[confident] De la escasez absoluta... a dominar una industria global. Esta es su travesía.
\`\`\`

---

## DIRECCIÓN DE BANDA SONORA (BGM):
- **Inicio de Episodio:** Melodía de piano solo en tempo lento (60 BPM) que transmite esfuerzo y soledad.
- **Clímax:** Entrada gradual de violines y percusión épica (120 BPM) marcando el triunfo narrativo.
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
      alert('Por favor, genera primero un proyecto desde el Asistente de Producción antes de exportar.');
      return;
    }

    if (window.electronAPI) {
      const res = await window.electronAPI.exportProductionPackage(generatedData);
      if (res.success) {
        const zipMsg = res.zipPath ? `\n- Archivo ZIP: ${res.zipPath}` : '';
        if (confirm(`¡Proyecto exportado exitosamente!\n- Carpeta: ${res.folderPath}${zipMsg}\n\n¿Deseas abrir la carpeta del proyecto en el Explorador?`)) {
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
