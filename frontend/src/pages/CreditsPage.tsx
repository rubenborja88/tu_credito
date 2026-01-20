import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
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

import {
  createCredit,
  deleteCredit,
  listBanks,
  listClients,
  listCredits,
  updateCredit,
  type Bank,
  type Client,
  type Credit,
} from '../api/resources'
import {
  buildFilterParams,
  buildRequestKey,
  buildSortParam,
} from '../components/serverDataGrid'
import { DataGridFilterHeader } from '../components/DataGridFilterHeader'

type Snack = { type: 'success' | 'error'; message: string }

type FormState = {
  client: number | ''
  description: string
  min_payment: string
  max_payment: string
  term_months: number
  bank: number | ''
  credit_type: 'AUTO' | 'MORTGAGE' | 'COMMERCIAL'
}

export default function CreditsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [credits, setCredits] = useState<Credit[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Credit | null>(null)
  const [snack, setSnack] = useState<Snack | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([])
  const [filters, setFilters] = useState({
    client_full_name: '',
    description: '',
    bank_name: '',
    credit_type: [] as string[],
    min_payment: '',
    max_payment: '',
    term_months: '',
  })
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [sortModel, setSortModel] = useState<GridSortModel>([])
  const [rowCount, setRowCount] = useState(0)
  const lastRequestKey = useRef<string>('')

  const emptyForm: FormState = useMemo(
    () => ({
      client: '',
      description: '',
      min_payment: '',
      max_payment: '',
      term_months: 12,
      bank: '',
      credit_type: 'AUTO',
    }),
    [],
  )

  const [form, setForm] = useState<FormState>(emptyForm)

  const requestParams = useMemo(
    () => ({
      page: paginationModel.page + 1,
      page_size: paginationModel.pageSize,
      ordering: buildSortParam(sortModel),
      ...buildFilterParams(filters, {
        client_full_name: { type: 'text', param: 'client_full_name' },
        description: { type: 'text' },
        bank_name: { type: 'text', param: 'bank_name' },
        credit_type: { type: 'enum', param: 'credit_type' },
        min_payment: { type: 'number', param: 'min_payment' },
        max_payment: { type: 'number', param: 'max_payment' },
        term_months: { type: 'number', param: 'term_months' },
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
      try {
        const cRes = await listCredits(requestParams)
        setCredits(cRes.results)
        setRowCount(cRes.count)
      } catch (e: any) {
        setSnack({ type: 'error', message: e?.message || 'Failed to load credits.' })
      } finally {
        setLoading(false)
      }
    },
    [requestKey, requestParams],
  )

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    let active = true
    async function loadReferenceData() {
      try {
        const [banksRes, clientsRes] = await Promise.all([listBanks(), listClients()])
        if (!active) return
        setBanks(banksRes.results)
        setClients(clientsRes.results)
      } catch (e) {
        if (active) setSnack({ type: 'error', message: 'Failed to load reference data.' })
      }
    }
    loadReferenceData()
    return () => {
      active = false
    }
  }, [])

  function openCreate() {
    setEditing(null)
    setFieldErrors({})
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(row: Credit) {
    setEditing(row)
    setFieldErrors({})
    setForm({
      client: row.client,
      description: row.description,
      min_payment: row.min_payment,
      max_payment: row.max_payment,
      term_months: row.term_months,
      bank: row.bank,
      credit_type: row.credit_type,
    })
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }))
    setFieldErrors((prev) => {
      if (!prev[key as string]) return prev
      const next = { ...prev }
      delete next[key as string]
      return next
    })
  }

  function mapFieldErrors(data: any) {
    const mapped: Record<string, string> = {}
    if (data && typeof data === 'object') {
      for (const [k, v] of Object.entries(data)) {
        if (Array.isArray(v) && v.length) mapped[k] = String(v[0])
        else if (typeof v === 'string') mapped[k] = v
      }
    }
    return mapped
  }

  function validateForm() {
    const errors: Record<string, string> = {}
    if (!form.client) errors.client = 'Client is required.'
    if (!form.description.trim()) errors.description = 'Description is required.'
    if (form.description.trim().length > 255) errors.description = 'Description must be 255 characters or less.'

    const minValue = form.min_payment === '' ? NaN : Number(form.min_payment)
    const maxValue = form.max_payment === '' ? NaN : Number(form.max_payment)
    if (!Number.isFinite(minValue)) errors.min_payment = 'Min payment must be a valid number.'
    if (!Number.isFinite(maxValue)) errors.max_payment = 'Max payment must be a valid number.'
    if (Number.isFinite(minValue) && minValue < 0) errors.min_payment = 'Min payment cannot be negative.'
    if (Number.isFinite(maxValue) && maxValue < 0) errors.max_payment = 'Max payment cannot be negative.'
    if (Number.isFinite(minValue) && Number.isFinite(maxValue) && minValue > maxValue) {
      errors.min_payment = 'Min payment must be less than or equal to max payment.'
    }

    if (!form.term_months || Number(form.term_months) < 1) {
      errors.term_months = 'Term must be at least 1 month.'
    }
    if (!form.bank) errors.bank = 'Bank is required.'
    if (!form.credit_type) errors.credit_type = 'Credit type is required.'

    return errors
  }

  async function submit() {
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setSaving(true)
    setFieldErrors({})
    try {
      const payload = {
        client: Number(form.client),
        description: form.description,
        min_payment: form.min_payment,
        max_payment: form.max_payment,
        term_months: Number(form.term_months),
        bank: Number(form.bank),
        credit_type: form.credit_type,
      }

      if (editing) await updateCredit(editing.id, payload as any)
      else await createCredit(payload as any)

      setSnack({ type: 'success', message: editing ? 'Credit updated.' : 'Credit created.' })
      setDialogOpen(false)
      await refresh(true)
    } catch (e: any) {
      const data = e?.response?.data
      const mapped = mapFieldErrors(data)
      if (Object.keys(mapped).length) setFieldErrors(mapped)
      else setSnack({ type: 'error', message: e?.message || 'Failed to save credit.' })
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(id: number) {
    if (!confirm('Delete this credit?')) return
    try {
      await deleteCredit(id)
      setCredits((p) => p.filter((x) => x.id !== id))
      setSnack({ type: 'success', message: 'Credit deleted.' })
    } catch (e: any) {
      setSnack({ type: 'error', message: e?.message || 'Failed to delete credit.' })
    }
  }

  async function deleteSelected() {
    if (selectionModel.length === 0) return
    if (!confirm(`Delete ${selectionModel.length} selected credits?`)) return
    const ids = selectionModel.map((id) => Number(id))
    const results = await Promise.allSettled(ids.map((id) => deleteCredit(id)))
    const failed = results.filter((res) => res.status === 'rejected')
    if (failed.length) {
      setSnack({
        type: 'error',
        message: `${failed.length} of ${ids.length} credits failed to delete.`,
      })
    } else {
      setSnack({ type: 'success', message: 'Selected credits deleted.' })
    }
    setCredits((prev) => prev.filter((x) => !ids.includes(x.id)))
    setSelectionModel([])
  }

  const updateFilter = useCallback((key: keyof typeof filters, value: string | string[]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPaginationModel((prev) => ({ ...prev, page: 0 }))
  }, [])

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: 'id', headerName: 'ID', width: 80 },
      {
        field: 'client_full_name',
        headerName: 'Client',
        flex: 1,
        minWidth: 180,
        valueGetter: (params) => params.row.client_full_name || params.row.client,
        renderHeader: () => (
          <DataGridFilterHeader
            label="Client"
            value={filters.client_full_name}
            onChange={(value) => updateFilter('client_full_name', value)}
          />
        ),
      },
      {
        field: 'description',
        headerName: 'Description',
        flex: 1,
        minWidth: 200,
        renderHeader: () => (
          <DataGridFilterHeader
            label="Description"
            value={filters.description}
            onChange={(value) => updateFilter('description', value)}
          />
        ),
      },
      {
        field: 'bank_name',
        headerName: 'Bank',
        flex: 1,
        minWidth: 160,
        valueGetter: (params) => params.row.bank_name || params.row.bank,
        renderHeader: () => (
          <DataGridFilterHeader
            label="Bank"
            value={filters.bank_name}
            onChange={(value) => updateFilter('bank_name', value)}
          />
        ),
      },
      {
        field: 'credit_type',
        headerName: 'Type',
        flex: 1,
        minWidth: 160,
        renderHeader: () => (
          <DataGridFilterHeader
            label="Type"
            type="enum"
            value={filters.credit_type}
            options={[
              { value: 'AUTO', label: 'Automotive' },
              { value: 'MORTGAGE', label: 'Mortgage' },
              { value: 'COMMERCIAL', label: 'Commercial' },
            ]}
            onChange={(value) => updateFilter('credit_type', value)}
          />
        ),
      },
      {
        field: 'min_payment',
        headerName: 'Min',
        flex: 1,
        minWidth: 120,
        renderHeader: () => (
          <DataGridFilterHeader
            label="Min"
            type="number"
            value={filters.min_payment}
            onChange={(value) => updateFilter('min_payment', value)}
          />
        ),
      },
      {
        field: 'max_payment',
        headerName: 'Max',
        flex: 1,
        minWidth: 120,
        renderHeader: () => (
          <DataGridFilterHeader
            label="Max"
            type="number"
            value={filters.max_payment}
            onChange={(value) => updateFilter('max_payment', value)}
          />
        ),
      },
      {
        field: 'term_months',
        headerName: 'Term (months)',
        flex: 1,
        minWidth: 140,
        renderHeader: () => (
          <DataGridFilterHeader
            label="Term (months)"
            type="number"
            value={filters.term_months}
            onChange={(value) => updateFilter('term_months', value)}
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
            <IconButton onClick={() => openEdit(params.row)} aria-label="Edit">
              <EditIcon />
            </IconButton>
            <IconButton onClick={() => onDelete(params.row.id)} aria-label="Delete">
              <DeleteIcon />
            </IconButton>
          </>
        ),
      },
    ],
    [
      filters.bank_name,
      filters.client_full_name,
      filters.credit_type,
      filters.description,
      filters.max_payment,
      filters.min_payment,
      filters.term_months,
      onDelete,
      openEdit,
      updateFilter,
    ],
  )

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Credits</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            color="error"
            disabled={selectionModel.length === 0}
            onClick={deleteSelected}
          >
            Delete Credits
          </Button>
          <Button variant="contained" onClick={openCreate}>
            New Credit
          </Button>
        </Box>
      </Box>

      <DataGrid
        autoHeight
        rows={credits}
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
        onSortModelChange={(model) => {
          setSortModel(model)
          setPaginationModel((prev) => ({ ...prev, page: 0 }))
        }}
        pageSizeOptions={[10, 25, 50]}
        loading={loading}
        disableColumnFilter
        disableColumnMenu
        disableColumnSelector
        columnHeaderHeight={80}
      />

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit Credit' : 'Create Credit'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <FormControl fullWidth error={!!fieldErrors.client}>
              <InputLabel id="client-label">Client</InputLabel>
              <Select
                labelId="client-label"
                label="Client"
                value={form.client}
                onChange={(e) => setField('client', e.target.value as any)}
              >
                {clients.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.full_name}
                  </MenuItem>
                ))}
              </Select>
              {fieldErrors.client ? (
                <Typography variant="caption" color="error">
                  {fieldErrors.client}
                </Typography>
              ) : null}
            </FormControl>

            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              error={!!fieldErrors.description}
              helperText={fieldErrors.description}
              fullWidth
            />

            <Box display="flex" gap={2}>
              <TextField
                label="Min payment"
                value={form.min_payment}
                onChange={(e) => setField('min_payment', e.target.value)}
                error={!!fieldErrors.min_payment}
                helperText={fieldErrors.min_payment}
                fullWidth
              />
              <TextField
                label="Max payment"
                value={form.max_payment}
                onChange={(e) => setField('max_payment', e.target.value)}
                error={!!fieldErrors.max_payment}
                helperText={fieldErrors.max_payment}
                fullWidth
              />
            </Box>

            <TextField
              label="Term (months)"
              type="number"
              value={form.term_months}
              onChange={(e) => setField('term_months', Number(e.target.value) as any)}
              error={!!fieldErrors.term_months}
              helperText={fieldErrors.term_months}
              fullWidth
            />

            <FormControl fullWidth error={!!fieldErrors.bank}>
              <InputLabel id="bank-label">Bank</InputLabel>
              <Select
                labelId="bank-label"
                label="Bank"
                value={form.bank}
                onChange={(e) => setField('bank', e.target.value as any)}
              >
                {banks.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.name}
                  </MenuItem>
                ))}
              </Select>
              {fieldErrors.bank ? (
                <Typography variant="caption" color="error">
                  {fieldErrors.bank}
                </Typography>
              ) : null}
            </FormControl>

            <FormControl fullWidth error={!!fieldErrors.credit_type}>
              <InputLabel id="type-label">Credit type</InputLabel>
              <Select
                labelId="type-label"
                label="Credit type"
                value={form.credit_type}
                onChange={(e) => setField('credit_type', e.target.value as any)}
              >
                <MenuItem value="AUTO">Automotive</MenuItem>
                <MenuItem value="MORTGAGE">Mortgage</MenuItem>
                <MenuItem value="COMMERCIAL">Commercial</MenuItem>
              </Select>
              {fieldErrors.credit_type ? (
                <Typography variant="caption" color="error">
                  {fieldErrors.credit_type}
                </Typography>
              ) : null}
            </FormControl>

            {fieldErrors.non_field_errors ? (
              <Alert severity="error">{fieldErrors.non_field_errors}</Alert>
            ) : null}
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
        {snack ? <Alert severity={snack.type}>{snack.message}</Alert> : null}
      </Snackbar>
    </Box>
  )
}
