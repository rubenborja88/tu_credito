import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Alert,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import {
  DataGrid,
  GridColDef,
  GridRowSelectionModel,
  GridSortModel,
} from '@mui/x-data-grid'

import { Bank, createBank, deleteBank, listBanks, updateBank } from '../api/resources'
import {
  buildFilterParams,
  buildRequestKey,
  buildSortParam,
} from '../components/serverDataGrid'
import { DataGridFilterHeader } from '../components/DataGridFilterHeader'

type FormState = {
  name: string
  bank_type: 'PRIVATE' | 'GOVERNMENT'
  address: string
}

export default function BanksPage() {
  const [rows, setRows] = useState<Bank[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Bank | null>(null)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([])
  const [filters, setFilters] = useState({ name: '', bank_type: [] as string[], address: '' })
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [sortModel, setSortModel] = useState<GridSortModel>([])
  const [rowCount, setRowCount] = useState(0)
  const lastRequestKey = useRef<string>('')

  const [snack, setSnack] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const initialForm: FormState = useMemo(
    () => ({ name: '', bank_type: 'PRIVATE', address: '' }),
    [],
  )
  const [form, setForm] = useState<FormState>(initialForm)

  const requestParams = useMemo(
    () => ({
      page: paginationModel.page + 1,
      page_size: paginationModel.pageSize,
      ordering: buildSortParam(sortModel),
      ...buildFilterParams(filters, {
        name: { type: 'text' },
        address: { type: 'text' },
        bank_type: { type: 'enum', param: 'bank_type' },
      }),
    }),
    [filters, paginationModel.page, paginationModel.pageSize, sortModel],
  )
  const requestKey = useMemo(() => buildRequestKey(requestParams), [requestParams])

  const refresh = useCallback(
    async (force = false) => {
      if (!force && requestKey === lastRequestKey.current) return
      lastRequestKey.current = requestKey
      setLoading(true)
      setError(null)
      try {
        const data = await listBanks(requestParams)
        setRows(data.results)
        setRowCount(data.count)
      } catch (e: any) {
        setError(e?.message || 'Failed to load banks.')
      } finally {
        setLoading(false)
      }
    },
    [requestKey, requestParams],
  )

  useEffect(() => {
    refresh()
  }, [refresh])

  function openCreate() {
    setEditing(null)
    setForm(initialForm)
    setFieldErrors({})
    setOpen(true)
  }

  function openEdit(row: Bank) {
    setEditing(row)
    setForm({ name: row.name, bank_type: row.bank_type, address: row.address || '' })
    setFieldErrors({})
    setOpen(true)
  }

  function closeDialog() {
    if (!saving) setOpen(false)
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function mapValidationErrors(err: any) {
    const data = err?.response?.data
    if (!data || typeof data !== 'object') return
    const mapped: Record<string, string> = {}
    for (const [k, v] of Object.entries(data)) {
      if (Array.isArray(v) && v.length > 0) mapped[k] = String(v[0])
      else if (typeof v === 'string') mapped[k] = v
    }
    setFieldErrors(mapped)
  }

  function validateForm() {
    const errors: Record<string, string> = {}
    if (!form.name.trim()) errors.name = 'Name is required.'
    if (form.name.trim().length > 255) errors.name = 'Name must be 255 characters or less.'
    if (!form.bank_type) errors.bank_type = 'Type is required.'
    if (form.address.trim().length > 255) errors.address = 'Address must be 255 characters or less.'
    return errors
  }

  async function submit() {
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setSaving(true)
    setError(null)
    setFieldErrors({})
    try {
      if (editing) {
        await updateBank(editing.id, form)
        setSnack({ type: 'success', message: 'Bank updated.' })
      } else {
        await createBank(form)
        setSnack({ type: 'success', message: 'Bank created.' })
      }
      setOpen(false)
      await refresh(true)
    } catch (e: any) {
      mapValidationErrors(e)
      setSnack({ type: 'error', message: 'Could not save bank. Please fix the errors and try again.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this bank? This action cannot be undone.')) return
    try {
      await deleteBank(id)
      setRows((prev) => prev.filter((r) => r.id !== id))
      setSnack({ type: 'success', message: 'Bank deleted.' })
    } catch (e: any) {
      setSnack({ type: 'error', message: 'Failed to delete bank. It may be referenced by credits.' })
    }
  }

  async function deleteSelected() {
    if (selectionModel.length === 0) return
    if (!confirm(`Delete ${selectionModel.length} selected banks?`)) return
    const ids = selectionModel.map((id) => Number(id))
    const results = await Promise.allSettled(ids.map((id) => deleteBank(id)))
    const failed = results.filter((res) => res.status === 'rejected')
    if (failed.length) {
      setSnack({
        type: 'error',
        message: `${failed.length} of ${ids.length} banks failed to delete.`,
      })
    } else {
      setSnack({ type: 'success', message: 'Selected banks deleted.' })
    }
    setRows((prev) => prev.filter((r) => !ids.includes(r.id)))
    setSelectionModel([])
  }

  const updateFilter = useCallback((key: keyof typeof filters, value: string | string[]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPaginationModel((prev) => ({ ...prev, page: 0 }))
  }, [])

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: 'id', headerName: 'ID', width: 80, sortable: true },
      {
        field: 'name',
        headerName: 'Name',
        flex: 1,
        minWidth: 180,
        renderHeader: () => (
          <DataGridFilterHeader
            label="Name"
            value={filters.name}
            onChange={(value) => updateFilter('name', value)}
          />
        ),
      },
      {
        field: 'bank_type',
        headerName: 'Type',
        flex: 1,
        minWidth: 160,
        renderHeader: () => (
          <DataGridFilterHeader
            label="Type"
            type="enum"
            value={filters.bank_type}
            options={[
              { value: 'PRIVATE', label: 'Private' },
              { value: 'GOVERNMENT', label: 'Government' },
            ]}
            onChange={(value) => updateFilter('bank_type', value)}
          />
        ),
      },
      {
        field: 'address',
        headerName: 'Address',
        flex: 1,
        minWidth: 200,
        renderHeader: () => (
          <DataGridFilterHeader
            label="Address"
            value={filters.address}
            onChange={(value) => updateFilter('address', value)}
          />
        ),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        width: 120,
        renderCell: (params) => (
          <>
            <IconButton aria-label="edit" onClick={() => openEdit(params.row)}>
              <EditIcon />
            </IconButton>
            <IconButton aria-label="delete" onClick={() => handleDelete(params.row.id)}>
              <DeleteIcon />
            </IconButton>
          </>
        ),
      },
    ],
    [filters.address, filters.bank_type, filters.name, handleDelete, openEdit, updateFilter],
  )

  function handleSortModelChange(model: GridSortModel) {
    setSortModel(model)
    setPaginationModel((prev) => ({ ...prev, page: 0 }))
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Banks</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            color="error"
            disabled={selectionModel.length === 0}
            onClick={deleteSelected}
          >
            Delete Banks
          </Button>
          <Button variant="contained" onClick={openCreate}>
            New Bank
          </Button>
        </Box>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <DataGrid
        autoHeight
        rows={rows}
        columns={columns}
        checkboxSelection
        disableRowSelectionOnClick
        rowSelectionModel={selectionModel}
        onRowSelectionModelChange={setSelectionModel}
        paginationMode="server"
        sortingMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        rowCount={rowCount}
        sortModel={sortModel}
        onSortModelChange={handleSortModelChange}
        pageSizeOptions={[10, 25, 50]}
        loading={loading}
        disableColumnFilter
        disableColumnMenu
        disableColumnSelector
        columnHeaderHeight={80}
      />

      <Dialog open={open} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Bank' : 'New Bank'}</DialogTitle>
        <DialogContent>
          <Box display="grid" gap={2} mt={1}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              error={!!fieldErrors.name}
              helperText={fieldErrors.name}
              fullWidth
              required
            />
            <FormControl fullWidth error={!!fieldErrors.bank_type}>
              <InputLabel id="bank-type-label">Type</InputLabel>
              <Select
                labelId="bank-type-label"
                label="Type"
                value={form.bank_type}
                onChange={(e) => setField('bank_type', e.target.value as any)}
              >
                <MenuItem value="PRIVATE">Private</MenuItem>
                <MenuItem value="GOVERNMENT">Government</MenuItem>
              </Select>
              {fieldErrors.bank_type ? (
                <Typography variant="caption" color="error">
                  {fieldErrors.bank_type}
                </Typography>
              ) : null}
            </FormControl>
            <TextField
              label="Address"
              value={form.address}
              onChange={(e) => setField('address', e.target.value)}
              error={!!fieldErrors.address}
              helperText={fieldErrors.address}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={submit} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : editing ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snack ? <Alert severity={snack.type}>{snack.message}</Alert> : undefined}
      </Snackbar>
    </Box>
  )
}
