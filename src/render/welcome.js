import { listItems } from '../util.js'

const WELCOME_CREATE_FMX = [
  ['Multi-Device Application - Delphi', 'A cross-platform app for Windows, macOS, iOS, Android, and Linux using FireMonkey.'],
  ['FireMonkey HD Application - Delphi', 'A high-DPI desktop application using the FireMonkey framework.'],
  ['FMX Mobile Application - Delphi', 'A mobile-first app targeting iOS and Android with FireMonkey.'],
  ['Console Application - Delphi', 'A command-line application with no UI.'],
  ['Package - Delphi', 'A smart dynamically loaded library carrying extra metadata.'],
  ['DUnitX Project - Delphi', 'Create a new DUnitX test project.'],
]

const WELCOME_CREATE_VCL = [
  ['Windows VCL Application - Delphi', 'A UI app using Windows native controls and the VCL framework.'],
  ['VCL Form - Delphi', 'A classic Windows form unit.'],
  ['VCL Frame - Delphi', 'Reusable VCL controls for another form or frame.'],
]

const RECENT_PROJECTS = [
  ['FMXApp1.dproj', 'C:\\Users\\Developer\\Documents\\Embarcadero\\Studio\\Projects\\FMXApp1\\'],
  ['CrossPlatformUI.dproj', 'C:\\Users\\Alister\\Documents\\Embarcadero\\Studio\\Projects\\CrossPlatformUI\\'],
  ['MobileDemo.dproj', 'C:\\Users\\Alister\\Documents\\Embarcadero\\Studio\\Projects\\MobileDemo\\'],
]

const LEARN_ITEMS = [
  ['FireMonkey Multi-Device Apps', 'Build apps that run on Windows, macOS, iOS, Android, and Linux.'],
  ['FMX Layouts & Styling', 'Use TLayout, TGridLayout, and styles for adaptive UIs.'],
  ['FireMonkey Animation System', 'Create fluid transitions and animations with TAnimation.'],
  ['LiveBindings in FMX', 'Connect UI controls to data sources without boilerplate code.'],
  ['Cross-Platform File & Camera', 'Access the file system, camera, and sensors on all FMX platforms.'],
  ['RAD Studio 12 Athens', 'New language, editor, and FireMonkey productivity features.'],
]

const GETIT_ITEMS = [
  ['FMXLinux', 'Full-feature FireMonkey implementation for Linux desktop and server.'],
  ['TMS FMX UI Pack', 'A rich set of FireMonkey components for beautiful cross-platform UIs.'],
  ['DDevExtensions', 'IDE productivity extensions for RAD Studio developers.'],
]

const PROMOTED_ITEMS = [
  ['FMXLinux', 'Full feature FireMonkey implementation for Linux platform.'],
  ['TMS FMX UI Pack', 'Professional FireMonkey components for all supported platforms.'],
]

export function renderWelcomePage() {
  return `
    <section class="welcome-page">
      <header class="welcome-top">
        <div class="rad-logo">D</div>
        <h1>Welcome to RAD Studio 12 Athens</h1>
        <nav>
          <button type="button">Extend the IDE</button>
          <button type="button">Manage Features</button>
          <button type="button">GetIt Package Manager</button>
        </nav>
      </header>
      <div class="welcome-grid">
        <article class="welcome-card create-card">
          <h2>Create New</h2>
          <ul>
            <li class="create-section-label">FireMonkey</li>
            ${listItems(WELCOME_CREATE_FMX, ([title, text], index) => `
              <li data-welcome-create="${index}" class="create-item-fmx">
                <span class="create-icon icon-${index}">F</span>
                <span><strong>${title}</strong><small>${text}</small></span>
              </li>
            `)}
            <li class="create-section-label create-section-vcl">VCL <span class="coming-soon-badge">Coming Soon</span></li>
            ${listItems(WELCOME_CREATE_VCL, ([title, text]) => `
              <li class="create-item-vcl">
                <span class="create-icon icon-vcl">V</span>
                <span><strong>${title}</strong><small>${text}</small></span>
              </li>
            `)}
          </ul>
        </article>
        <article class="welcome-card recent-card">
          <h2>Open Recent</h2>
          <ul>
            ${listItems(RECENT_PROJECTS, ([title, text]) => `
              <li>
                <span class="recent-icon">D</span>
                <span><strong>${title}</strong><small>${text}</small></span>
                <button type="button" aria-label="Favorite">♥</button>
              </li>
            `)}
          </ul>
        </article>
        <article class="welcome-card learn-card">
          <h2>Learn FireMonkey</h2>
          <ul>
            ${listItems(LEARN_ITEMS, ([title, text], index) => `
              <li>
                <span class="video-thumb thumb-${index}"></span>
                <span><strong>${title}</strong><small>${text}</small></span>
              </li>
            `)}
          </ul>
        </article>
        <article class="welcome-card getit-card">
          <h2>New in GetIt</h2>
          <ul>
            ${listItems(GETIT_ITEMS, ([title, text], index) => `
              <li>
                <span class="package-icon package-${index}"></span>
                <span><strong>${title}</strong><small>${text}</small></span>
              </li>
            `)}
          </ul>
        </article>
        <article class="welcome-card promoted-card">
          <h2>Promoted in GetIt</h2>
          <ul>
            ${listItems(PROMOTED_ITEMS, ([title, text], index) => `
              <li>
                <span class="round-icon round-${index}"></span>
                <span><strong>${title}</strong><small>${text}</small></span>
              </li>
            `)}
          </ul>
        </article>
      </div>
      <footer class="welcome-bottom">
        <button type="button">Edit Layout</button>
        <label><input type="checkbox" /> Close Welcome screen when opening a new project</label>
      </footer>
    </section>
  `
}
