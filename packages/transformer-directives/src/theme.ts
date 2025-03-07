import type { Declaration } from 'css-tree'
import { colorToString, parseCssColor } from '@unocss/rule-utils'
import type { TransformerDirectivesContext } from '.'

export const themeFnRE = /theme\((.*?)\)/g

export function handleThemeFn({ code, uno, options }: TransformerDirectivesContext, node: Declaration) {
  const { throwOnMissing = true } = options

  const offset = node.value.loc!.start.offset
  const str = code.original.slice(offset, node.value.loc!.end.offset)
  const matches = Array.from(str.matchAll(themeFnRE))

  if (!matches.length)
    return

  for (const match of matches) {
    const rawArg = match[1].trim()
    if (!rawArg)
      throw new Error('theme() expect exact one argument, but got 0')

    const [rawKey, alpha] = rawArg.slice(1, -1).split('/') as [string, string?]
    let value: any = uno.config.theme
    const keys = rawKey.trim().split('.')

    keys.every((key) => {
      if (value[key] != null)
        value = value[key]
      else if (value[+key] != null)
        value = value[+key]
      else
        return false
      return true
    })

    if (typeof value === 'string') {
      if (alpha) {
        const color = parseCssColor(value)
        if (color)
          value = colorToString(color, alpha)
      }

      code.overwrite(
        offset + match.index!,
        offset + match.index! + match[0].length,
        value,
      )
    }
    else if (throwOnMissing) {
      throw new Error(`theme of "${rawArg.slice(1, -1)}" did not found`)
    }
  }
}
