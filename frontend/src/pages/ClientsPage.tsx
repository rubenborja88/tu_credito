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
import {
  Client,
  Bank,
  listClients,
  createClient,
  updateClient,
  deleteClient,
  listBanks,
} from '../api/resources'
import {
  buildFilterParams,
  buildRequestKey,
  buildSortParam,
} from '../components/serverDataGrid'
import { DataGridFilterHeader } from '../components/DataGridFilterHeader'

type Snack = { type: 'success' | 'error'; message: string }

export default function ClientsPage() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Client[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [snack, setSnack] = useState<Snack | null>(null)
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([])
  const [filters, setFilters] = useState({
    full_name: '',
    email: '',
    person_type: [] as string[],
    bank_name: '',
  })
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [sortModel, setSortModel] = useState<GridSortModel>([])
  const [rowCount, setRowCount] = useState(0)
  const lastRequestKey = useRef<string>('')

  const emptyForm = useMemo(
    () => ({
      full_name: '',
      date_of_birth: '',
      age: '' as string | number,
      nationality: '',
      address: '',
      email: '',
      phone: '',
      person_type: 'NATURAL' as 'NATURAL' | 'LEGAL_ENTITY',
      bank: null as number | null,
    }),
    [],
  )

  const [form, setForm] = useState(emptyForm)

  const requestParams = useMemo(
    () => ({
      page: paginationModel.page + 1,
      page_size: paginationModel.pageSize,
      ordering: buildSortParam(sortModel),
      ...buildFilterParams(filters, {
        full_name: { type: 'text' },
        email: { type: 'text' },
        person_type: { type: 'enum', param: 'person_type' },
        bank_name: { type: 'text', param: 'bank_name' },
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
        const clientsRes = await listClients(requestParams)
        setItems(clientsRes.results)
        setRowCount(clientsRes.count)
      } catch (e: any) {
        setError(e?.message || 'Failed to load clients.')
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
    async function loadBanks() {
      try {
        const banksRes = await listBanks()
        if (active) setBanks(banksRes.results)
      } catch (e) {
        if (active) setSnack({ type: 'error', message: 'Failed to load banks.' })
      }
    }
    loadBanks()
    return () => {
      active = false
    }
  }, [])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFieldErrors({})
    setDialogOpen(true)
  }

  function openEdit(c: Client) {
    setEditing(c)
    setForm({
      full_name: c.full_name,
      date_of_birth: c.date_of_birth,
      age: c.age ?? '',
      nationality: c.nationality || '',
      address: c.address || '',
      email: c.email,
      phone: c.phone || '',
      person_type: c.person_type,
      bank: c.bank,
    })
    setFieldErrors({})
    setDialogOpen(true)
  }

  function closeDialog() {
    if (saving) return
    setDialogOpen(false)
  }

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [k]: v }))
    setFieldErrors((prev) => {
      if (!prev[k as string]) return prev
      const next = { ...prev }
      delete next[k as string]
      return next
    })
  }

  function normalizePayload() {
    const ageVal = form.age === '' ? null : Number(form.age)
    return {
      ...form,
      age: Number.isFinite(ageVal) ? ageVal : null,
    }
  }

  function applyServerErrors(data: any) {
    if (!data || typeof data !== 'object') return
    const next: Record<string, string> = {}
    for (const [k, v] of Object.entries(data)) {
      if (Array.isArray(v)) next[k] = String(v[0])
      else next[k] = String(v)
    }
    setFieldErrors(next)
  }

  function validateForm() {
    const errors: Record<string, string> = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!form.full_name.trim()) errors.full_name = 'Full name is required.'
    if (!form.date_of_birth) {
      errors.date_of_birth = 'Date of birth is required.'
    } else if (Number.isNaN(new Date(form.date_of_birth).getTime())) {
      errors.date_of_birth = 'Date of birth must be a valid date.'
    }
    if (!form.email.trim()) {
      errors.email = 'Email is required.'
    } else if (!emailRegex.test(form.email.trim())) {
      errors.email = 'Email must be valid.'
    }

    if (form.age !== '' && form.age !== null) {
      const ageValue = Number(form.age)
      if (!Number.isFinite(ageValue) || !Number.isInteger(ageValue)) {
        errors.age = 'Age must be a whole number.'
      } else if (ageValue < 1 || ageValue > 99) {
        errors.age = 'Age must be between 1 and 99.'
      } else if (form.date_of_birth && !errors.date_of_birth) {
        const dob = new Date(form.date_of_birth)
        const today = new Date()
        let calculated = today.getFullYear() - dob.getFullYear()
        const monthDiff = today.getMonth() - dob.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          calculated -= 1
        }
        if (calculated !== ageValue) {
          errors.age = `Age does not match date of birth (expected ${calculated}).`
        }
      }
    }

    if (!form.person_type) errors.person_type = 'Person type is required.'

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
      const payload = normalizePayload()
      if (editing) {
        await updateClient(editing.id, payload as any)
        setSnack({ type: 'success', message: 'Client updated.' })
      } else {
        await createClient(payload as any)
        setSnack({ type: 'success', message: 'Client created.' })
      }
      setDialogOpen(false)
      await refresh(true)
    } catch (e: any) {
      const resp = e?.response
      if (resp?.status === 400) {
        applyServerErrors(resp.data)
      } else {
        setSnack({ type: 'error', message: resp?.data?.detail || e?.message || 'Request failed.' })
      }
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this client?')) return
    try {
      await deleteClient(id)
      setItems((prev) => prev.filter((x) => x.id !== id))
      setSnack({ type: 'success', message: 'Client deleted.' })
    } catch (e: any) {
      setSnack({ type: 'error', message: e?.response?.data?.detail || e?.message || 'Delete failed.' })
    }
  }

  async function deleteSelected() {
    if (selectionModel.length === 0) return
    if (!confirm(`Delete ${selectionModel.length} selected clients?`)) return
    const ids = selectionModel.map((id) => Number(id))
    const results = await Promise.allSettled(ids.map((id) => deleteClient(id)))
    const failed = results.filter((res) => res.status === 'rejected')
    if (failed.length) {
      setSnack({
        type: 'error',
        message: `${failed.length} of ${ids.length} clients failed to delete.`,
      })
    } else {
      setSnack({ type: 'success', message: 'Selected clients deleted.' })
    }
    setItems((prev) => prev.filter((x) => !ids.includes(x.id)))
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
        field: 'full_name',
        headerName: 'Full Name',
        flex: 1,
        minWidth: 180,
        renderHeader: () => (
          <DataGridFilterHeader
            label="Full Name"
            value={filters.full_name}
            onChange={(value) => updateFilter('full_name', value)}
          />
        ),
      },
      {
        field: 'email',
        headerName: 'Email',
        flex: 1,
        minWidth: 200,
        renderHeader: () => (
          <DataGridFilterHeader
            label="Email"
            value={filters.email}
            onChange={(value) => updateFilter('email', value)}
          />
        ),
      },
      {
        field: 'person_type',
        headerName: 'Person Type',
        flex: 1,
        minWidth: 160,
        renderHeader: () => (
          <DataGridFilterHeader
            label="Person Type"
            type="enum"
            value={filters.person_type}
            options={[
              { value: 'NATURAL', label: 'Natural' },
              { value: 'LEGAL_ENTITY', label: 'Legal Entity' },
            ]}
            onChange={(value) => updateFilter('person_type', value)}
          />
        ),
      },
      {
        field: 'bank_name',
        headerName: 'Bank',
        flex: 1,
        minWidth: 160,
        valueGetter: (params) => params.row.bank_name || '-',
        renderHeader: () => (
          <DataGridFilterHeader
            label="Bank"
            value={filters.bank_name}
            onChange={(value) => updateFilter('bank_name', value)}
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
            <IconButton onClick={() => openEdit(params.row)} aria-label="edit">
              <EditIcon />
            </IconButton>
            <IconButton onClick={() => remove(params.row.id)} aria-label="delete">
              <DeleteIcon />
            </IconButton>
          </>
        ),
      },
    ],
    [
      filters.bank_name,
      filters.email,
      filters.full_name,
      filters.person_type,
      openEdit,
      remove,
      updateFilter,
    ],
  )

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Clients</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            color="error"
            disabled={selectionModel.length === 0}
            onClick={deleteSelected}
          >
            Delete Clients
          </Button>
          <Button variant="contained" onClick={openCreate}>
            New Client
          </Button>
        </Box>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <DataGrid
        autoHeight
        rows={items}
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
        pageSizeOptions={[1, 10, 25, 50]}
        loading={loading}
        disableColumnFilter
        disableColumnMenu
        disableColumnSelector
        columnHeaderHeight={80}
      />

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit Client' : 'Create Client'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Full Name"
              value={form.full_name}
              onChange={(e) => setField('full_name', e.target.value)}
              error={!!fieldErrors.full_name}
              helperText={fieldErrors.full_name}
              fullWidth
            />
            <TextField
              label="Date of Birth"
              type="date"
              value={form.date_of_birth}
              onChange={(e) => setField('date_of_birth', e.target.value)}
              error={!!fieldErrors.date_of_birth}
              helperText={fieldErrors.date_of_birth}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Age (optional)"
              value={form.age}
              onChange={(e) => setField('age', e.target.value)}
              error={!!fieldErrors.age}
              helperText={fieldErrors.age}
              fullWidth
            />
            <TextField
              label="Email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
              fullWidth
            />
            <TextField
              label="Phone"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              error={!!fieldErrors.phone}
              helperText={fieldErrors.phone}
              fullWidth
            />
            <FormControl fullWidth error={!!fieldErrors.person_type}>
              <InputLabel>Person Type</InputLabel>
              <Select
                label="Person Type"
                value={form.person_type}
                onChange={(e) => setField('person_type', e.target.value as any)}
              >
                <MenuItem value="NATURAL">Natural</MenuItem>
                <MenuItem value="LEGAL_ENTITY">Legal Entity</MenuItem>
              </Select>
              {fieldErrors.person_type ? (
                <Typography variant="caption" color="error">
                  {fieldErrors.person_type}
                </Typography>
              ) : null}
            </FormControl>
            <FormControl fullWidth error={!!fieldErrors.bank}>
              <InputLabel>Bank</InputLabel>
              <Select
                label="Bank"
                value={form.bank ?? ''}
                onChange={(e) => setField('bank', e.target.value === '' ? null : Number(e.target.value))}
              >
                <MenuItem value="">None</MenuItem>
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
            <TextField
              label="Nationality"
              value={form.nationality}
              onChange={(e) => setField('nationality', e.target.value)}
              error={!!fieldErrors.nationality}
              helperText={fieldErrors.nationality}
              fullWidth
            />
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
