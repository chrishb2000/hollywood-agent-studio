const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const projectsFilePath = () => path.join(app.getPath('userData'), 'studio_projects.json');
const configFilePath = () => path.join(app.getPath('userData'), 'studio_config.json');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'Hollywood Agent Studio v2.0 - IA Production Suite',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.maximize();
  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handler: Export Production Package to Directory & ZIP
ipcMain.handle('export-production-package', async (event, { projectData, targetPath }) => {
  try {
    let exportDir = targetPath;
    if (!exportDir) {
      const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Seleccionar ubicación para exportar el Proyecto',
        defaultPath: `Hollywood_Production_${projectData.title.replace(/[^a-zA-Z0-9]/g, '_')}`,
        buttonLabel: 'Exportar Proyecto'
      });
      if (canceled || !filePath) return { success: false, reason: 'Operación cancelada' };
      exportDir = filePath;
    }

    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Subdirectories structure v2.0
    const folders = [
      '00_CONTINUITY_MEMORY_PATTERN',
      '01_SYSTEM_AGENTS_PROMPTS',
      '02_PROJECT_BIBLE',
      '03_CHARACTERS_CONCEPT',
      '04_SCENARIOS_ENVIRONMENTS',
      '05_EPISODES_SCRIPTS',
      '06_CAMERA_STORYBOARD',
      '07_AUDIO_VOICEOVER_BGM'
    ];

    folders.forEach(dir => {
      const p = path.join(exportDir, dir);
      if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    });

    // 00: Memory & Continuity Pattern
    fs.writeFileSync(
      path.join(exportDir, '00_CONTINUITY_MEMORY_PATTERN', '00_SYSTEM_MEMORY_PATTERN.md'),
      projectData.files.memoryPattern || ''
    );

    // 01: System Agents Prompts
    fs.writeFileSync(
      path.join(exportDir, '01_SYSTEM_AGENTS_PROMPTS', '01_SYSTEM_PROMPTS_MASTER.md'),
      projectData.files.systemPrompts
    );
    fs.writeFileSync(
      path.join(exportDir, '01_SYSTEM_AGENTS_PROMPTS', '02_AGENTS_RULES_AND_SKILLS.md'),
      projectData.files.agentRules
    );

    // 02: Project Bible
    fs.writeFileSync(
      path.join(exportDir, '02_PROJECT_BIBLE', 'PROJECT_BIBLE.md'),
      projectData.files.projectBible
    );
    fs.writeFileSync(
      path.join(exportDir, '02_PROJECT_BIBLE', 'production_manifest.json'),
      JSON.stringify(projectData.manifest, null, 2)
    );

    // 03: Characters
    fs.writeFileSync(
      path.join(exportDir, '03_CHARACTERS_CONCEPT', 'CHARACTERS_DOSSIER.md'),
      projectData.files.characters
    );

    // 04: Scenarios & Environments
    fs.writeFileSync(
      path.join(exportDir, '04_SCENARIOS_ENVIRONMENTS', 'ENVIRONMENTS_DOSSIER.md'),
      projectData.files.environments
    );

    // 05: Scripts & Episodes
    fs.writeFileSync(
      path.join(exportDir, '05_EPISODES_SCRIPTS', 'FULL_SCRIPT_BREAKDOWN.md'),
      projectData.files.scripts
    );

    // 06: Camera & Storyboard
    fs.writeFileSync(
      path.join(exportDir, '06_CAMERA_STORYBOARD', 'CINEMATOGRAPHY_SHOT_LIST.md'),
      projectData.files.cinematography
    );

    // 07: Audio & Voiceover
    fs.writeFileSync(
      path.join(exportDir, '07_AUDIO_VOICEOVER_BGM', 'AUDIO_AND_VOICEOVER_GUIDE.md'),
      projectData.files.audio
    );

    // Export ZIP Archive using adm-zip
    let zipPath = `${exportDir}.zip`;
    try {
      const AdmZip = require('adm-zip');
      const zip = new AdmZip();
      zip.addLocalFolder(exportDir);
      zip.writeZip(zipPath);
    } catch (err) {
      console.warn('adm-zip not available, exported folder only:', err.message);
      zipPath = null;
    }

    return {
      success: true,
      folderPath: exportDir,
      zipPath: zipPath
    };
  } catch (error) {
    console.error('Export Error:', error);
    return { success: false, error: error.message };
  }
});

// IPC Handler: Open Folder
ipcMain.handle('open-folder', async (event, folderPath) => {
  if (folderPath && fs.existsSync(folderPath)) {
    shell.openPath(folderPath);
    return true;
  }
  return false;
});

// IPC Handlers: Settings
ipcMain.handle('get-settings', () => {
  try {
    const file = configFilePath();
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading settings:', e);
  }
  return {
    provider: 'offline',
    geminiKey: '',
    openaiKey: '',
    claudeKey: '',
    openrouterKey: '',
    ollamaUrl: 'http://localhost:11434',
    lmstudioUrl: 'http://localhost:1234',
    theme: 'dark'
  };
});

ipcMain.handle('save-settings', (event, settings) => {
  try {
    fs.writeFileSync(configFilePath(), JSON.stringify(settings, null, 2));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// IPC Handlers: Projects CRUD (Sidebar Management)
ipcMain.handle('get-projects', () => {
  try {
    const file = projectsFilePath();
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading projects:', e);
  }
  return [];
});

ipcMain.handle('save-projects', (event, projects) => {
  try {
    fs.writeFileSync(projectsFilePath(), JSON.stringify(projects, null, 2));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});
