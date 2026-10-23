export type Theme = 'light' | 'dark';

const KEY = 'lacita.theme';

/**
 * Claro por defecto: el cielo del atardecer se lee mejor y un proyector sube el nivel de negro, así que el modo
 * oscuro del sistema del notebook del escenario no debe decidir solo. `?tema=oscuro|claro` gana para el demo.
 */
export function initialTheme(): Theme {
  const fromUrl = new URLSearchParams(window.location.search).get('tema');
  if (fromUrl === 'oscuro') return 'dark';
  if (fromUrl === 'claro') return 'light';
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* sin almacenamiento: vale para esta pestaña */
  }
}
