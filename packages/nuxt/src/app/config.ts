import { reactive } from 'vue'
import type { AppConfig } from 'nuxt/schema'
// @ts-expect-error virtual file
import __appConfig from '#build/app.config.mjs'

type DeepPartial<T> = T extends Function ? T : T extends Record<string, any> ? { [P in keyof T]?: DeepPartial<T[P]> } : T

function deepDelete (obj: any, newObj: any) {
  for (const key in obj) {
    const val = newObj[key]
    if (!(key in newObj)) {
      delete (obj as any)[key]
    }

    if (val !== null && typeof val === 'object') {
      deepDelete(obj[key], newObj[key])
    }
  }
}

function deepAssign (obj: any, newObj: any) {
  for (const key in newObj) {
    const val = newObj[key]
    if (val !== null && typeof val === 'object') {
      obj[key] = obj[key] || {}
      deepAssign(obj[key], val)
    } else {
      obj[key] = val
    }
  }
}

const appConfig = process.server ? __appConfig : reactive(__appConfig)
export const useAppConfig = () => appConfig

/**
 * Deep assign the current appConfig with the new one.
 *
 * Will preserve existing properties.
 */
export function updateAppConfig (appConfig: DeepPartial<AppConfig>) {
  const _appConfig = useAppConfig()
  deepAssign(_appConfig, appConfig)
}

// HMR Support
if (process.dev) {
  function applyHMR (newConfig: AppConfig) {
    const appConfig = useAppConfig()
    if (newConfig && appConfig) {
      deepAssign(appConfig, newConfig)
      deepDelete(appConfig, newConfig)
    }
  }

  // Vite
  if (import.meta.hot) {
    import.meta.hot.accept((newModule) => {
      const newConfig = newModule?.useAppConfig()
      applyHMR(newConfig)
    })
  }

  // webpack
  if (import.meta.webpackHot) {
    import.meta.webpackHot.accept('#build/app.config.mjs', () => {
      applyHMR(__appConfig)
    })
  }
}
