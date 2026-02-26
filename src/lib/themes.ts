/**
 * Multi-theme system for RationSmart PWA.
 *
 * Each theme defines brand colors for light & dark mode, chart palettes,
 * and preview swatches for the theme picker UI.
 *
 * Use `applyTheme()` to switch at runtime via Quasar's `setCssVar()`.
 */
import { ref } from 'vue';
import { setCssVar } from 'quasar';

export interface ChartPalette {
  primary: string;
  primaryFill: string;
  success: string;
  warning: string;
  morningBar: string;
  eveningBar: string;
  grid: string;
  axisText: string;
  axisTextLight: string;
  baseline: string;
  gridLight: string;
  tooltipBg: string;
  farmerColors: string[];
  dietBandColors: { fill: string; border: string }[];
}

export interface ThemeDefinition {
  id: string;
  /** i18n key for theme name (e.g. 'theme.ocean') */
  nameKey: string;
  /** Brand colors for light mode */
  light: {
    primary: string;
    secondary: string;
    accent: string;
    dark: string;
    'dark-page': string;
    positive: string;
    negative: string;
    info: string;
    warning: string;
  };
  /** Brand colors for dark mode */
  dark: {
    primary: string;
    secondary: string;
    accent: string;
    dark: string;
    'dark-page': string;
    positive: string;
    negative: string;
    info: string;
    warning: string;
  };
  /** Chart color palettes */
  chart: {
    light: ChartPalette;
    dark: ChartPalette;
  };
  /** 3 preview swatch colors for the picker UI */
  swatches: [string, string, string];
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildChartPalette(
  primary: string,
  success: string,
  warning: string,
  isDark: boolean,
): ChartPalette {
  if (isDark) {
    return {
      primary,
      primaryFill: hexToRgba(primary, 0.12),
      success,
      warning,
      morningBar: primary,
      eveningBar: '#78716C',
      grid: 'rgba(255, 255, 255, 0.1)',
      axisText: 'rgba(255, 255, 255, 0.5)',
      axisTextLight: 'rgba(255, 255, 255, 0.35)',
      baseline: 'rgba(255, 255, 255, 0.15)',
      gridLight: 'rgba(255, 255, 255, 0.06)',
      tooltipBg: 'rgba(0, 0, 0, 0.9)',
      farmerColors: [primary, success, warning, '#A1A1AA'],
      dietBandColors: [
        { fill: hexToRgba(success, 0.06), border: hexToRgba(success, 0.4) },
        { fill: 'rgba(100, 181, 246, 0.06)', border: 'rgba(100, 181, 246, 0.4)' },
        { fill: hexToRgba(warning, 0.06), border: hexToRgba(warning, 0.4) },
      ],
    };
  }
  return {
    primary,
    primaryFill: hexToRgba(primary, 0.08),
    success,
    warning,
    morningBar: primary,
    eveningBar: hexToRgba(primary, 0.45),
    grid: '#E0E0E0',
    axisText: '#666666',
    axisTextLight: '#9E9E9E',
    baseline: '#CCCCCC',
    gridLight: '#EEEEEE',
    tooltipBg: 'rgba(0, 0, 0, 0.8)',
    farmerColors: [primary, success, warning, '#71717A'],
    dietBandColors: [
      { fill: hexToRgba(success, 0.08), border: hexToRgba(success, 0.4) },
      { fill: 'rgba(33, 150, 243, 0.08)', border: 'rgba(33, 150, 243, 0.4)' },
      { fill: hexToRgba(warning, 0.08), border: hexToRgba(warning, 0.4) },
    ],
  };
}

// ─── Theme Definitions ────────────────────────────────────────────────

const zinc: ThemeDefinition = {
  id: 'zinc',
  nameKey: 'theme.zinc',
  light: {
    primary: '#18181B',
    secondary: '#71717A',
    accent: '#18181B',
    dark: '#18181B',
    'dark-page': '#09090B',
    positive: '#4CAF50',
    negative: '#F44336',
    info: '#71717A',
    warning: '#FF9800',
  },
  dark: {
    primary: '#E4E4E7',
    secondary: '#A1A1AA',
    accent: '#E4E4E7',
    dark: '#18181B',
    'dark-page': '#09090B',
    positive: '#66BB6A',
    negative: '#EF5350',
    info: '#A1A1AA',
    warning: '#FFA726',
  },
  chart: {
    light: buildChartPalette('#18181B', '#4CAF50', '#FF9800', false),
    dark: buildChartPalette('#E4E4E7', '#66BB6A', '#FFA726', true),
  },
  swatches: ['#18181B', '#71717A', '#4CAF50'],
};

const earthy: ThemeDefinition = {
  id: 'earthy',
  nameKey: 'theme.earthy',
  light: {
    primary: '#2E7D32',
    secondary: '#795548',
    accent: '#E65100',
    dark: '#1B5E20',
    'dark-page': '#0D2F10',
    positive: '#558B2F',
    negative: '#C62828',
    info: '#795548',
    warning: '#F9A825',
  },
  dark: {
    primary: '#81C784',
    secondary: '#BCAAA4',
    accent: '#FF8A65',
    dark: '#1B5E20',
    'dark-page': '#0D2F10',
    positive: '#A5D6A7',
    negative: '#EF5350',
    info: '#BCAAA4',
    warning: '#FFD54F',
  },
  chart: {
    light: buildChartPalette('#2E7D32', '#558B2F', '#F9A825', false),
    dark: buildChartPalette('#81C784', '#A5D6A7', '#FFD54F', true),
  },
  swatches: ['#2E7D32', '#E65100', '#558B2F'],
};

const ocean: ThemeDefinition = {
  id: 'ocean',
  nameKey: 'theme.ocean',
  light: {
    primary: '#1565C0',
    secondary: '#546E7A',
    accent: '#00897B',
    dark: '#0D47A1',
    'dark-page': '#061B3D',
    positive: '#2E7D32',
    negative: '#C62828',
    info: '#546E7A',
    warning: '#FF8F00',
  },
  dark: {
    primary: '#64B5F6',
    secondary: '#90A4AE',
    accent: '#4DB6AC',
    dark: '#0D47A1',
    'dark-page': '#061B3D',
    positive: '#66BB6A',
    negative: '#EF5350',
    info: '#90A4AE',
    warning: '#FFB74D',
  },
  chart: {
    light: buildChartPalette('#1565C0', '#2E7D32', '#FF8F00', false),
    dark: buildChartPalette('#64B5F6', '#66BB6A', '#FFB74D', true),
  },
  swatches: ['#1565C0', '#00897B', '#2E7D32'],
};

const vibrant: ThemeDefinition = {
  id: 'vibrant',
  nameKey: 'theme.vibrant',
  light: {
    primary: '#6200EA',
    secondary: '#7C4DFF',
    accent: '#00BFA5',
    dark: '#4A148C',
    'dark-page': '#1A0536',
    positive: '#00C853',
    negative: '#D50000',
    info: '#7C4DFF',
    warning: '#FF6D00',
  },
  dark: {
    primary: '#B388FF',
    secondary: '#B39DDB',
    accent: '#64FFDA',
    dark: '#4A148C',
    'dark-page': '#1A0536',
    positive: '#69F0AE',
    negative: '#FF5252',
    info: '#B39DDB',
    warning: '#FFAB40',
  },
  chart: {
    light: buildChartPalette('#6200EA', '#00C853', '#FF6D00', false),
    dark: buildChartPalette('#B388FF', '#69F0AE', '#FFAB40', true),
  },
  swatches: ['#6200EA', '#00BFA5', '#00C853'],
};

const sunset: ThemeDefinition = {
  id: 'sunset',
  nameKey: 'theme.sunset',
  light: {
    primary: '#D84315',
    secondary: '#BF360C',
    accent: '#F9A825',
    dark: '#BF360C',
    'dark-page': '#3E1408',
    positive: '#43A047',
    negative: '#C62828',
    info: '#BF360C',
    warning: '#FF8F00',
  },
  dark: {
    primary: '#FF8A65',
    secondary: '#FFAB91',
    accent: '#FFD54F',
    dark: '#BF360C',
    'dark-page': '#3E1408',
    positive: '#81C784',
    negative: '#EF5350',
    info: '#FFAB91',
    warning: '#FFB74D',
  },
  chart: {
    light: buildChartPalette('#D84315', '#43A047', '#FF8F00', false),
    dark: buildChartPalette('#FF8A65', '#81C784', '#FFB74D', true),
  },
  swatches: ['#D84315', '#F9A825', '#43A047'],
};

// ─── Registry ─────────────────────────────────────────────────────────

export const THEMES: Record<string, ThemeDefinition> = {
  zinc,
  earthy,
  ocean,
  vibrant,
  sunset,
};

export const THEME_IDS = Object.keys(THEMES);

const STORAGE_KEY = 'rs_theme';

/** Reactive current theme ID */
export const currentThemeId = ref<string>(
  localStorage.getItem(STORAGE_KEY) || 'zinc',
);

/** Get the current ThemeDefinition */
export function getCurrentTheme(): ThemeDefinition {
  return THEMES[currentThemeId.value] || THEMES.zinc;
}

/**
 * Apply a theme by setting all Quasar brand CSS variables.
 * Call this on boot and whenever theme or dark-mode changes.
 */
export function applyTheme(id: string, isDark: boolean): void {
  const theme = THEMES[id] || THEMES.zinc;
  const colors = isDark ? theme.dark : theme.light;

  currentThemeId.value = theme.id;
  localStorage.setItem(STORAGE_KEY, theme.id);

  // Set all Quasar brand colors at runtime
  setCssVar('primary', colors.primary);
  setCssVar('secondary', colors.secondary);
  setCssVar('accent', colors.accent);
  setCssVar('dark', colors.dark);
  setCssVar('dark-page', colors['dark-page']);
  setCssVar('positive', colors.positive);
  setCssVar('negative', colors.negative);
  setCssVar('info', colors.info);
  setCssVar('warning', colors.warning);
}
