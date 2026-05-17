import { listItems } from '../util.js'

const WELCOME_CREATE = [
  ['Windows VCL Application - Delphi', 'A UI app using Windows native controls and the VCL framework.'],
  ['Multi-Device Application - Delphi', 'A UI app for desktop and mobile devices using FireMonkey.'],
  ['Package - Delphi', 'A smart dynamically loaded library carrying extra metadata.'],
  ['Console Application - Delphi', 'A command-line app.'],
  ['Dynamic Library - Delphi', 'A library that can be loaded and unloaded.'],
  ['DUnitX Project - Delphi', 'Create a new DUnitX test project.'],
  ['VCL Form - Delphi', 'A classic Windows form unit.'],
  ['VCL Frame - Delphi', 'Reusable controls for another form or frame.'],
]

const RECENT_PROJECTS = [
  ['Project1.dproj', 'C:\\Users\\Developer\\Documents\\Embarcadero\\Studio\\Projects\\Project1\\'],
  ['NewNotOperators.dproj', 'C:\\Users\\Alister\\Documents\\Embarcadero\\Studio\\Projects\\NewOperators\\'],
  ['TernaryOperator.dproj', 'C:\\Users\\Alister\\Documents\\Embarcadero\\Studio\\Projects\\TernaryOperator\\'],
]

const LEARN_ITEMS = [
  ['RAD Studio 12 Athens', 'New language, editor, and productivity features.'],
  ['Getting real help for Delphi', 'Find docs, samples, tools, and source packages.'],
  ['AI assistant integrations', 'Build practical app assistants and connected tooling.'],
  ['Recreating a TListView', 'Responsive layouts, controls, and modern UI techniques.'],
  ['Conferences & community', 'Learn about events and community resources.'],
  ['Apps for small screens', 'Responsive FireMonkey design guidance.'],
]

const GETIT_ITEMS = [
  ['Deleaker (Trial)', 'Find memory leaks, GDI leaks, and handle leaks.'],
  ['ErrorSoft VCL Components', 'A free VCL component library for Delphi and C++Builder.'],
  ['ICS for VCL', 'Internet components supporting major protocols.'],
]

const PROMOTED_ITEMS = [
  ['FMXLinux', 'Full feature FireMonkey implementation for Linux platform.'],
  ['MMX Code Explorer', 'A refactoring browser for the Delphi IDE.'],
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
            ${listItems(WELCOME_CREATE, ([title, text], index) => `
              <li data-welcome-create="${index}">
                <span class="create-icon icon-${index}">${title.slice(0, 1)}</span>
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
          <h2>Learn</h2>
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
