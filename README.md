# Hollywood Agent Studio 🎬🤖

**Hollywood Agent Studio** es una plataforma de escritorio profesional desarrollada con **Electron JS** que actúa como un asistente integral de producción y post-producción audiovisual impulsado por IA. Funciona como una productora de cine virtual de Hollywood donde cientos de agentes virtuales colaboran para concebir, guionar, diseñar y empaquetar producciones completas (Películas, Series, Documentales, Shorts/Reels, Comerciales).

---

## 📋 Prerrequisitos de Sistema

Para ejecutar **Hollywood Agent Studio** en tu sistema Windows, asegúrate de contar con el siguiente software instalado:

* **Node.js**: Versión `18.0.0` o superior (se recomienda LTS).
  * 📥 **Enlace directo de descarga**: [https://nodejs.org/](https://nodejs.org/)
* **npm** (incluido automáticamente con Node.js).
* *(Opcional)* **Ollama** o **LM Studio** si deseas utilizar modelos de IA 100% locales en tu computadora:
  * 📥 **Ollama**: [https://ollama.com/](https://ollama.com/)
  * 📥 **LM Studio**: [https://lmstudio.ai/](https://lmstudio.ai/)

---

## 🚀 Inicio Rápido (1-Click Executable)

1. Simplemente haz doble clic sobre el archivo ejecutable **`launch-studio.bat`**.
2. El script verificará automáticamente que tengas Node.js instalado.
3. Si es la primera vez que lo ejecutas, el script instalará automáticamente las dependencias con `npm install` e iniciará la aplicación maximizada.

---

## ✨ Características Principales

* 🧙‍♂️ **Asistente de Producción Multipaso (Wizard)**: Formulario guiado e interactivo que consulta tipo de producción (ej. serie de 4 capítulos de pobre a rico), premisa, personajes, escenarios, paleta cromática, lentes de cámara y estilo de voz.
* 🎬 **Red de Agentes de Hollywood**:
  * **Director Ejecutivo & Showrunner** (Visión estratégica)
  * **Guionista Principal** (Guiones en formato Hollywood)
  * **Director de Fotografía** (Shot List & Prompts para Sora, Runway Gen-3, Pika)
  * **Diseñador de Concepto & Avatares** (Prompts de consistencia para Midjourney v6 / Flux.1 y avatares SVG)
  * **Ingeniero de Sonido & Locución** (Guiones para ElevenLabs y BGM)
  * **Arquitecto de Prompts** (Prompts, Skills y Rules clasificados)
* 📦 **Motor de Exportación (.ZIP / Carpeta Organizada)**: Exporta todo el proyecto estructurado en subcarpetas listas para importar en cualquier IA (ChatGPT, Claude, Gemini, Antigravity, Ollama).
* ⚙️ **Hub de Modelos de IA & APIs**: Configuración para Google Gemini, OpenAI (GPT-4o), Anthropic Claude, OpenRouter / Hermes, y servidores locales (Ollama en `http://localhost:11434`, LM Studio en `http://localhost:1234`), además de un Motor Interno Offline.
* 🌓 **Tema Dual (Claro / Oscuro)**: Conmutador de modo claro y oscuro.
* 🖥️ **Interfaz Limpia**: Ventana maximizada sin barra de menú tradicional.

---

## 📁 Estructura del Paquete Exportado (.ZIP / Carpeta)

```text
Hollywood_Production_[Nombre_Proyecto]/
├── 01_SYSTEM_AGENTS_PROMPTS/
│   ├── 01_SYSTEM_PROMPTS_MASTER.md
│   └── 02_AGENTS_RULES_AND_SKILLS.md
├── 02_PROJECT_BIBLE/
│   ├── PROJECT_BIBLE.md
│   └── production_manifest.json
├── 03_CHARACTERS_CONCEPT/
│   └── CHARACTERS_DOSSIER.md
├── 04_SCENARIOS_ENVIRONMENTS/
│   └── ENVIRONMENTS_DOSSIER.md
├── 05_EPISODES_SCRIPTS/
│   └── FULL_SCRIPT_BREAKDOWN.md
├── 06_CAMERA_STORYBOARD/
│   └── CINEMATOGRAPHY_SHOT_LIST.md
└── 07_AUDIO_VOICEOVER_BGM/
    └── AUDIO_AND_VOICEOVER_GUIDE.md
```

---

## Autor y apoyo

Desarrollado por [Christian Herencia](https://christian-freelance.us/).

Si el proyecto te resulta útil, puedes
[invitarme a un café mediante PayPal](https://www.paypal.com/donate/?hosted_button_id=YC6YAWBQ7HNSS).

---

## 📄 Licencia

Este proyecto está distribuido bajo la licencia MIT.
