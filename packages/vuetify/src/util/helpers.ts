import type { VuetifyIcon } from 'vuetify/types/services/icons'
import type { DataTableCompareFunction, SelectItemKey, ItemGroup } from 'vuetify/types'
import type { ComponentInternalInstance } from 'vue'

import { defineComponent, h } from 'vue'

export function createSimpleFunctional (
  c: string,
  el = 'div',
  name?: string
) {
  return defineComponent({
    name: name ?? c.replace(/__/g, '-'),

    setup (props, { attrs, slots }) {
      return () => h(el, {
        class: c,
        ...attrs,
      }, slots.default?.())
    },
  })
}

export function getNestedValue (obj: any, path: (string | number)[], fallback?: any): any {
  const last = path.length - 1

  if (last < 0) return obj === undefined ? fallback : obj

  for (let i = 0; i < last; i++) {
    if (obj == null) {
      return fallback
    }
    obj = obj[path[i]]
  }

  if (obj == null) return fallback

  return obj[path[last]] === undefined ? fallback : obj[path[last]]
}

export function deepEqual (a: any, b: any): boolean {
  if (a === b) return true

  if (
    a instanceof Date &&
    b instanceof Date &&
    a.getTime() !== b.getTime()
  ) {
    // If the values are Date, compare them as timestamps
    return false
  }

  if (a !== Object(a) || b !== Object(b)) {
    // If the values aren't objects, they were already checked for equality
    return false
  }

  const props = Object.keys(a)

  if (props.length !== Object.keys(b).length) {
    // Different number of props, don't bother to check
    return false
  }

  return props.every(p => deepEqual(a[p], b[p]))
}

export function getObjectValueByPath (obj: any, path: string, fallback?: any): any {
  // credit: http://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-with-string-key#comment55278413_6491621
  if (obj == null || !path || typeof path !== 'string') return fallback
  if (obj[path] !== undefined) return obj[path]
  path = path.replace(/\[(\w+)\]/g, '.$1') // convert indexes to properties
  path = path.replace(/^\./, '') // strip a leading dot
  return getNestedValue(obj, path.split('.'), fallback)
}

export function getPropertyFromItem (
  item: object,
  property: SelectItemKey,
  fallback?: any
): any {
  if (property == null) return item === undefined ? fallback : item

  if (item !== Object(item)) return fallback === undefined ? item : fallback

  if (typeof property === 'string') return getObjectValueByPath(item, property, fallback)

  if (Array.isArray(property)) return getNestedValue(item, property, fallback)

  if (typeof property !== 'function') return fallback

  const value = property(item, fallback)

  return typeof value === 'undefined' ? fallback : value
}

export function createRange (length: number): number[] {
  return Array.from({ length }, (v, k) => k)
}

export function getZIndex (el?: Element | null): number {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return 0

  const index = +window.getComputedStyle(el).getPropertyValue('z-index')

  if (!index) return getZIndex(el.parentNode as Element)
  return index
}

const tagsToReplace = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
} as any

export function escapeHTML (str: string): string {
  return str.replace(/[&<>]/g, tag => tagsToReplace[tag] || tag)
}

export function filterObjectOnKeys<T, K extends keyof T> (obj: T, keys: K[]): { [N in K]: T[N] } {
  const filtered = {} as { [N in K]: T[N] }

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (typeof obj[key] !== 'undefined') {
      filtered[key] = obj[key]
    }
  }

  return filtered
}

export function convertToUnit (str: string | number | null | undefined, unit = 'px'): string | undefined {
  if (str == null || str === '') {
    return undefined
  } else if (isNaN(+str!)) {
    return String(str)
  } else {
    return `${Number(str)}${unit}`
  }
}

export function kebabCase (str: string | null | undefined): string {
  return (str ?? '').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

export function isObject (obj: any): obj is object {
  return obj !== null && typeof obj === 'object'
}

// KeyboardEvent.keyCode aliases
export const keyCodes = Object.freeze({
  enter: 13,
  tab: 9,
  delete: 46,
  esc: 27,
  space: 32,
  up: 38,
  down: 40,
  left: 37,
  right: 39,
  end: 35,
  home: 36,
  del: 46,
  backspace: 8,
  insert: 45,
  pageup: 33,
  pagedown: 34,
})

// This remaps internal names like '$cancel' or '$vuetify.icons.cancel'
// to the current name or component for that icon.
export function remapInternalIcon (vm: ComponentInternalInstance, iconName: string): VuetifyIcon {
  if (!iconName.startsWith('$')) {
    return iconName
  }

  // Get the target icon name
  const iconPath = `$vuetify.icons.values.${iconName.split('$').pop()!.split('.').pop()}`

  // Now look up icon indirection name,
  // e.g. '$vuetify.icons.values.cancel'
  return getObjectValueByPath(vm.ctx, iconPath, iconName)
}

export function keys<O> (o: O) {
  return Object.keys(o) as (keyof O)[]
}

/**
 * Camelize a hyphen-delimited string.
 */
const camelizeRE = /-(\w)/g
export const camelize = (str: string): string => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
}

/**
 * Returns the set difference of B and A, i.e. the set of elements in B but not in A
 */
export function arrayDiff (a: any[], b: any[]): any[] {
  const diff: any[] = []
  for (let i = 0; i < b.length; i++) {
    if (!a.includes(b[i])) diff.push(b[i])
  }
  return diff
}

/**
 * Makes the first character of a string uppercase
 */
export function upperFirst (str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function groupItems<T extends any = any> (
  items: T[],
  groupBy: string[],
  groupDesc: boolean[]
): ItemGroup<T>[] {
  const key = groupBy[0]
  const groups: ItemGroup<T>[] = []
  let current = null
  for (var i = 0; i < items.length; i++) {
    const item = items[i]
    const val = getObjectValueByPath(item, key)
    if (current !== val) {
      current = val
      groups.push({
        name: val,
        items: [],
      })
    }
    groups[groups.length - 1].items.push(item)
  }
  return groups
}

export function wrapInArray<T> (v: T | T[] | null | undefined): T[] { return v != null ? Array.isArray(v) ? v : [v] : [] }

export function sortItems<T extends any = any> (
  items: T[],
  sortBy: string[],
  sortDesc: boolean[],
  locale: string,
  customSorters?: Record<string, DataTableCompareFunction<T>>
): T[] {
  if (sortBy === null || !sortBy.length) return items
  const stringCollator = new Intl.Collator(locale, { sensitivity: 'accent', usage: 'sort' })

  return items.sort((a, b) => {
    for (let i = 0; i < sortBy.length; i++) {
      const sortKey = sortBy[i]

      let sortA = getObjectValueByPath(a, sortKey)
      let sortB = getObjectValueByPath(b, sortKey)

      if (sortDesc[i]) {
        [sortA, sortB] = [sortB, sortA]
      }

      if (customSorters?.[sortKey]) {
        const customResult = customSorters[sortKey](sortA, sortB)

        if (!customResult) continue

        return customResult
      }

      // Check if both cannot be evaluated
      if (sortA === null && sortB === null) {
        continue
      }

      [sortA, sortB] = [sortA, sortB].map(s => (s || '').toString().toLocaleLowerCase())

      if (sortA !== sortB) {
        if (!isNaN(sortA) && !isNaN(sortB)) return Number(sortA) - Number(sortB)
        return stringCollator.compare(sortA, sortB)
      }
    }

    return 0
  })
}

export function defaultFilter (value: any, search: string | null, item: any) {
  return value != null &&
    search != null &&
    typeof value !== 'boolean' &&
    value.toString().toLocaleLowerCase().indexOf(search.toLocaleLowerCase()) !== -1
}

export function searchItems<T extends any = any> (items: T[], search: string): T[] {
  if (!search) return items
  search = search.toString().toLowerCase()
  if (search.trim() === '') return items

  return items.filter((item: any) => Object.keys(item).some(key => defaultFilter(getObjectValueByPath(item, key), search, item)))
}

export function debounce (fn: Function, delay: number) {
  let timeoutId = 0 as any
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

export function throttle<T extends (...args: any[]) => any> (fn: T, limit: number) {
  let throttling = false
  return (...args: Parameters<T>): void | ReturnType<T> => {
    if (!throttling) {
      throttling = true
      setTimeout(() => throttling = false, limit)
      return fn(...args)
    }
  }
}

export function getPrefixedScopedSlots (prefix: string, scopedSlots: any) {
  return Object.keys(scopedSlots).filter(k => k.startsWith(prefix)).reduce((obj: any, k: string) => {
    obj[k.replace(prefix, '')] = scopedSlots[k]
    return obj
  }, {})
}

export function clamp (value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value))
}

export function padEnd (str: string, length: number, char = '0') {
  return str + char.repeat(Math.max(0, length - str.length))
}

export function chunk (str: string, size = 1) {
  const chunked: string[] = []
  let index = 0
  while (index < str.length) {
    chunked.push(str.substr(index, size))
    index += size
  }
  return chunked
}

export function humanReadableFileSize (bytes: number, binary = false): string {
  const base = binary ? 1024 : 1000
  if (bytes < base) {
    return `${bytes} B`
  }

  const prefix = binary ? ['Ki', 'Mi', 'Gi'] : ['k', 'M', 'G']
  let unit = -1
  while (Math.abs(bytes) >= base && unit < prefix.length - 1) {
    bytes /= base
    ++unit
  }
  return `${bytes.toFixed(1)} ${prefix[unit]}B`
}

export function camelizeObjectKeys (obj: Record<string, any> | null | undefined) {
  if (!obj) return {}

  return Object.keys(obj).reduce((o: any, key: string) => {
    o[camelize(key)] = obj[key]
    return o
  }, {})
}

export function mergeDeep (
  source: Dictionary<any> = {},
  target: Dictionary<any> = {}
) {
  for (const key in target) {
    const sourceProperty = source[key]
    const targetProperty = target[key]

    // Only continue deep merging if
    // both properties are objects
    if (
      isObject(sourceProperty) &&
      isObject(targetProperty)
    ) {
      source[key] = mergeDeep(sourceProperty, targetProperty)

      continue
    }

    source[key] = targetProperty
  }

  return source
}

export function fillArray<T> (length: number, obj: T) {
  return Array(length).fill(obj)
}
