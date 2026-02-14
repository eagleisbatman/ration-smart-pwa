<template>
  <q-card flat class="weather-widget q-mb-md">
    <!-- Loading State -->
    <q-card-section v-if="loading" class="q-pa-md">
      <div class="row items-center q-mb-sm">
        <q-skeleton type="circle" size="24px" class="q-mr-sm" />
        <q-skeleton type="text" width="80px" />
      </div>
      <div class="row items-center q-col-gutter-sm">
        <div class="col-12 col-sm-6">
          <q-skeleton type="text" width="60px" height="36px" />
          <q-skeleton type="text" width="100px" class="q-mt-xs" />
        </div>
        <div class="col-12 col-sm-6">
          <q-skeleton type="text" width="90px" />
          <q-skeleton type="text" width="80px" class="q-mt-xs" />
          <q-skeleton type="text" width="70px" class="q-mt-xs" />
        </div>
      </div>
    </q-card-section>

    <!-- Location Not Set State -->
    <q-card-section v-else-if="state === 'location_needed'" class="q-pa-md text-center">
      <q-icon name="location_off" size="32px" color="grey-5" />
      <div class="text-body2 text-grey-7 q-mt-xs">{{ $t('weather.locationNeeded') }}</div>
      <q-btn
        :label="$t('weather.enableLocation')"
        color="primary"
        flat
        dense
        no-caps
        class="q-mt-sm"
        icon="my_location"
        @click="requestLocation"
      />
    </q-card-section>

    <!-- Error State -->
    <q-card-section v-else-if="state === 'error'" class="q-pa-md text-center">
      <q-icon name="cloud_off" size="32px" color="grey-5" />
      <div class="text-body2 text-grey-7 q-mt-xs">{{ $t('weather.error') }}</div>
      <q-btn
        :label="$t('weather.retry')"
        color="primary"
        flat
        dense
        no-caps
        class="q-mt-sm"
        icon="refresh"
        @click="retryFetch"
      />
    </q-card-section>

    <!-- Weather Data -->
    <q-card-section v-else-if="state === 'loaded' && weather" class="q-pa-md">
      <div class="row items-center q-mb-xs">
        <q-icon name="wb_sunny" size="18px" color="orange-7" class="q-mr-xs" />
        <span class="text-subtitle2">{{ $t('weather.title') }}</span>
        <q-space />
        <span v-if="updatedTimeStr" class="text-caption text-grey-5">
          {{ $t('weather.updatedAt', { time: updatedTimeStr }) }}
        </span>
      </div>

      <div class="row items-start q-col-gutter-sm">
        <!-- Left: Temperature and condition -->
        <div class="col-12 col-sm-6">
          <div class="row items-center no-wrap">
            <q-icon
              :name="weatherIcon"
              size="36px"
              :color="weatherIconColor"
            />
            <div class="text-h4 q-ml-xs weather-temp">{{ Math.round(weather.temperature) }}°C</div>
          </div>
          <div class="text-body2 text-grey-7 q-mt-xs">{{ weatherConditionLabel }}</div>
          <div class="text-caption text-grey-5">
            {{ $t('weather.feelsLike') }} {{ Math.round(weather.apparentTemperature) }}°C
          </div>
        </div>

        <!-- Right: Details -->
        <div class="col-12 col-sm-6">
          <div class="weather-detail">
            <q-icon name="water_drop" size="14px" color="blue-5" class="q-mr-xs" />
            <span class="text-caption">{{ $t('weather.humidity') }}: {{ weather.humidity }}%</span>
          </div>
          <div class="weather-detail q-mt-xs">
            <q-icon name="air" size="14px" color="grey-6" class="q-mr-xs" />
            <span class="text-caption">{{ $t('weather.wind') }}: {{ Math.round(weather.windSpeed) }} km/h</span>
          </div>
        </div>
      </div>

      <!-- Farming Tip -->
      <div class="weather-tip q-mt-sm q-pa-xs">
        <q-icon name="lightbulb" size="14px" color="amber-8" class="q-mr-xs" />
        <span class="text-caption text-grey-8">{{ farmingTip }}</span>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Types
interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
}

interface WeatherCache {
  data: WeatherData;
  timestamp: number;
}

interface LocationCache {
  lat: number;
  lng: number;
}

// State
type WidgetState = 'loading' | 'location_needed' | 'error' | 'loaded';
const state = ref<WidgetState>('loading');
const loading = ref(true);
const weather = ref<WeatherData | null>(null);
const updatedTimeStr = ref<string>('');

const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const WEATHER_CACHE_KEY = 'weather_cache';
const LOCATION_CACHE_KEY = 'weather_location';

// Weather code mapping
function getWeatherInfo(code: number): { icon: string; color: string; conditionKey: string; isRain: boolean } {
  if (code === 0) {
    return { icon: 'wb_sunny', color: 'orange-7', conditionKey: 'weather.clear', isRain: false };
  }
  if (code >= 1 && code <= 3) {
    return { icon: 'cloud', color: 'grey-6', conditionKey: 'weather.partlyCloudy', isRain: false };
  }
  if (code === 45 || code === 48) {
    return { icon: 'foggy', color: 'grey-5', conditionKey: 'weather.foggy', isRain: false };
  }
  if (code >= 51 && code <= 55) {
    return { icon: 'grain', color: 'blue-4', conditionKey: 'weather.drizzle', isRain: true };
  }
  if (code >= 61 && code <= 65) {
    return { icon: 'rainy', color: 'blue-6', conditionKey: 'weather.rain', isRain: true };
  }
  if (code >= 71 && code <= 77) {
    return { icon: 'ac_unit', color: 'light-blue-3', conditionKey: 'weather.snow', isRain: false };
  }
  if (code >= 80 && code <= 82) {
    return { icon: 'thunderstorm', color: 'blue-8', conditionKey: 'weather.showers', isRain: true };
  }
  if (code === 95 || code === 96 || code === 99) {
    return { icon: 'flash_on', color: 'amber-8', conditionKey: 'weather.thunderstorm', isRain: true };
  }
  // Default fallback
  return { icon: 'cloud', color: 'grey-6', conditionKey: 'weather.partlyCloudy', isRain: false };
}

const weatherInfo = computed(() => {
  if (!weather.value) return getWeatherInfo(0);
  return getWeatherInfo(weather.value.weatherCode);
});

const weatherIcon = computed(() => weatherInfo.value.icon);
const weatherIconColor = computed(() => weatherInfo.value.color);
const weatherConditionLabel = computed(() => t(weatherInfo.value.conditionKey));

const farmingTip = computed(() => {
  if (!weather.value) return '';
  const temp = weather.value.temperature;
  const info = weatherInfo.value;

  if (info.isRain) {
    return t('weather.tip.rain');
  }
  if (temp >= 35) {
    return t('weather.tip.hot');
  }
  if (temp <= 10) {
    return t('weather.tip.cold');
  }
  return t('weather.tip.normal');
});

// Cache helpers
function getCachedWeather(): WeatherCache | null {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as WeatherCache;
    if (Date.now() - cached.timestamp < CACHE_DURATION_MS) {
      return cached;
    }
    return null;
  } catch {
    return null;
  }
}

function setCachedWeather(data: WeatherData): void {
  try {
    const cache: WeatherCache = { data, timestamp: Date.now() };
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

function getCachedLocation(): LocationCache | null {
  try {
    const raw = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocationCache;
  } catch {
    return null;
  }
}

function setCachedLocation(lat: number, lng: number): void {
  try {
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({ lat, lng }));
  } catch {
    // Silently ignore
  }
}

function formatUpdatedTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Fetch weather from Open-Meteo
async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather API returned ${response.status}`);
  }
  const json = await response.json();
  const current = json.current;
  return {
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m,
    weatherCode: current.weather_code,
  };
}

// Get the user's geolocation
function getUserLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        reject(err);
      },
      { timeout: 10000, enableHighAccuracy: false, maximumAge: 600000 }
    );
  });
}

// Main load logic
async function loadWeather(): Promise<void> {
  loading.value = true;

  // 1. Check for cached weather data first
  const cached = getCachedWeather();
  if (cached) {
    weather.value = cached.data;
    updatedTimeStr.value = formatUpdatedTime(cached.timestamp);
    state.value = 'loaded';
    loading.value = false;
    return;
  }

  // 2. Try to get location (cached or fresh)
  let location = getCachedLocation();

  if (!location) {
    try {
      const pos = await getUserLocation();
      location = { lat: pos.lat, lng: pos.lng };
      setCachedLocation(location.lat, location.lng);
    } catch (err) {
      // Check if there is stale weather data we can show as fallback
      try {
        const raw = localStorage.getItem(WEATHER_CACHE_KEY);
        if (raw) {
          const stale = JSON.parse(raw) as WeatherCache;
          weather.value = stale.data;
          updatedTimeStr.value = formatUpdatedTime(stale.timestamp);
          state.value = 'loaded';
          loading.value = false;
          return;
        }
      } catch {
        // Ignore parse errors
      }

      // Determine if permission denied vs other error
      if (err instanceof GeolocationPositionError && err.code === err.PERMISSION_DENIED) {
        state.value = 'location_needed';
      } else {
        state.value = 'error';
      }
      loading.value = false;
      return;
    }
  }

  // 3. Fetch weather data from API
  try {
    const data = await fetchWeather(location.lat, location.lng);
    weather.value = data;
    setCachedWeather(data);
    updatedTimeStr.value = formatUpdatedTime(Date.now());
    state.value = 'loaded';
  } catch {
    // Offline or API error — try to show stale cached data
    try {
      const raw = localStorage.getItem(WEATHER_CACHE_KEY);
      if (raw) {
        const stale = JSON.parse(raw) as WeatherCache;
        weather.value = stale.data;
        updatedTimeStr.value = formatUpdatedTime(stale.timestamp);
        state.value = 'loaded';
      } else {
        state.value = 'error';
      }
    } catch {
      state.value = 'error';
    }
  } finally {
    loading.value = false;
  }
}

// User actions
async function requestLocation(): Promise<void> {
  loading.value = true;
  state.value = 'loading';
  try {
    const pos = await getUserLocation();
    setCachedLocation(pos.lat, pos.lng);
    await loadWeather();
  } catch {
    state.value = 'error';
    loading.value = false;
  }
}

async function retryFetch(): Promise<void> {
  state.value = 'loading';
  loading.value = true;
  await loadWeather();
}

onMounted(() => {
  loadWeather();
});
</script>

<style lang="scss" scoped>
.weather-widget {
  border-radius: $radius-loose;
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.04) 0%, rgba(100, 181, 246, 0.08) 100%);
}

.weather-temp {
  font-weight: 600;
  line-height: 1.1;
}

.weather-detail {
  display: flex;
  align-items: center;
}

.weather-tip {
  display: flex;
  align-items: flex-start;
  background: rgba(255, 193, 7, 0.08);
  border-radius: $radius-default;
}
</style>
