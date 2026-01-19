import { useEffect, useMemo, useState } from 'react'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
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
  Client,
  Bank,
  listClients,
  createClient,
  updateClient,
  deleteClient,
  listBanks,
} from '../api/resources'

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

  const emptyForm = useMemo(
    () => ({
      full_name: '',
      date_of_birth: '',
      age: '' as string | number,
      nationality: '',
      address: '',
      email: '',
      phone: '',
      person_type: 'NATURAL' as const,
      bank: null as number | null,
    }),
    [],
  )

  const [form, setForm] = useState(emptyForm)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const [clientsRes, banksRes] = await Promise.all([listClients(), listBanks()])
      setItems(clientsRes.results)
      setBanks(banksRes.results)
    } catch (e: any) {
      setError(e?.message || 'Failed to load clients.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      await refresh()
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

  if (loading) {
    return (
      <Box display="flex" alignItems="center" gap={2}>
        <CircularProgress />
        <Typography>Loading clients...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Clients</Typography>
        <Button variant="contained" onClick={openCreate}>
          New Client
        </Button>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Full Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Person Type</TableCell>
            <TableCell>Bank</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((c) => (
            <TableRow key={c.id}>
              <TableCell>{c.id}</TableCell>
              <TableCell>{c.full_name}</TableCell>
              <TableCell>{c.email}</TableCell>
              <TableCell>{c.person_type === 'NATURAL' ? 'Natural' : 'Legal Entity'}</TableCell>
              <TableCell>{c.bank_name || '-'}</TableCell>
              <TableCell align="right">
                <IconButton onClick={() => openEdit(c)} aria-label="edit">
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => remove(c.id)} aria-label="delete">
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
        {snack ? <Alert severity={snack.type}>{snack.message}</Alert> : null}
      </Snackbar>
    </Box>
  )
}
