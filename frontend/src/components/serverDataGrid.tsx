export type FilterFieldConfig = {
  type: 'text' | 'number' | 'enum'
  param?: string
}

export type FilterValue = string | number | Array<string | number> | null | undefined

export function buildFilterParams(
  values: Record<string, FilterValue>,
  config: Record<string, FilterFieldConfig>,
) {
  const params: Record<string, string> = {}

  Object.entries(values).forEach(([field, value]) => {
    const fieldConfig = config[field]
    if (!fieldConfig || value === undefined || value === null || value === '') return

    if (fieldConfig.type === 'enum') {
      const valuesArray = Array.isArray(value) ? value : [value]
      if (valuesArray.length === 0) return
      params[fieldConfig.param ?? `${field}__in`] = valuesArray.join(',')
      return
    }

    params[fieldConfig.param ?? `${field}__icontains`] = String(value)
  })

  return params
}

export function buildSortParam(sortModel: { field?: string; sort?: 'asc' | 'desc' }[]) {
  if (!sortModel.length) return undefined
  const sorted = sortModel[0]
  if (!sorted?.field || !sorted?.sort) return undefined
  return `${sorted.sort === 'desc' ? '-' : ''}${sorted.field}`
}

export function buildRequestKey(value: unknown) {
  return JSON.stringify(value)
}
