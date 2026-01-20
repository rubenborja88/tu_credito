import type { SyntheticEvent } from 'react'
import { Box, MenuItem, Select, TextField, Typography } from '@mui/material'

export type FilterOption = {
  label: string
  value: string
}

type FilterHeaderProps = {
  label: string
  value: string | string[]
  type?: 'text' | 'number' | 'enum'
  options?: FilterOption[]
  placeholder?: string
  onChange: (value: string | string[]) => void
}

function stopGridEvent(event: SyntheticEvent) {
  event.stopPropagation()
}

export function DataGridFilterHeader({
  label,
  value,
  type = 'text',
  options = [],
  placeholder,
  onChange,
}: FilterHeaderProps) {
  return (
    <Box display="flex" flexDirection="column" gap={0.5} width="100%">
      <Typography variant="caption" fontWeight={600}>
        {label}
      </Typography>
      {type === 'enum' ? (
        <Select
          multiple
          size="small"
          displayEmpty
          value={Array.isArray(value) ? value : []}
          onChange={(event) => onChange(event.target.value as string[])}
          onClick={stopGridEvent}
          onKeyDown={stopGridEvent}
          onMouseDown={stopGridEvent}
          renderValue={(selected) => {
            if (selected.length === 0) {
              return <Typography variant="caption">{placeholder ?? 'All'}</Typography>
            }
            const labels = options
              .filter((option) => selected.includes(option.value))
              .map((option) => option.label)
            return labels.join(', ')
          }}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      ) : (
        <TextField
          size="small"
          variant="outlined"
          value={value as string}
          placeholder={placeholder ?? 'Search'}
          onChange={(event) => onChange(event.target.value)}
          onClick={stopGridEvent}
          onKeyDown={stopGridEvent}
          onMouseDown={stopGridEvent}
          inputMode={type === 'number' ? 'numeric' : 'text'}
        />
      )}
    </Box>
  )
}
