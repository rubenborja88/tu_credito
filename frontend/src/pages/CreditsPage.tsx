import { useEffect, useMemo, useState } from 'react'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'

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

  async function refresh() {
    setLoading(true)
    try {
      const [cRes, bRes, clRes] = await Promise.all([listCredits(), listBanks(), listClients()])
      setCredits(cRes.results)
      setBanks(bRes.results)
      setClients(clRes.results)
    } catch (e: any) {
      setSnack({ type: 'error', message: e?.message || 'Failed to load credits.' })
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
      await refresh()
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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Credits</Typography>
        <Button variant="contained" onClick={openCreate}>
          New Credit
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Bank</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Min</TableCell>
              <TableCell>Max</TableCell>
              <TableCell>Term (months)</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {credits.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.id}</TableCell>
                <TableCell>{r.client_full_name || r.client}</TableCell>
                <TableCell>{r.description}</TableCell>
                <TableCell>{r.bank_name || r.bank}</TableCell>
                <TableCell>{r.credit_type}</TableCell>
                <TableCell>{r.min_payment}</TableCell>
                <TableCell>{r.max_payment}</TableCell>
                <TableCell>{r.term_months}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => openEdit(r)} aria-label="Edit">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => onDelete(r.id)} aria-label="Delete">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

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
