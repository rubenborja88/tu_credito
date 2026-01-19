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

import { Bank, createBank, deleteBank, listBanks, updateBank } from '../api/resources'

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

  const [snack, setSnack] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const initialForm: FormState = useMemo(
    () => ({ name: '', bank_type: 'PRIVATE', address: '' }),
    [],
  )
  const [form, setForm] = useState<FormState>(initialForm)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const data = await listBanks()
      setRows(data)
    } catch (e: any) {
      setError(e?.message || 'Failed to load banks.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

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

  async function submit() {
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
      await refresh()
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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Banks</Typography>
        <Button variant="contained" onClick={openCreate}>
          New Bank
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Address</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.id}</TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.bank_type}</TableCell>
                <TableCell>{r.address}</TableCell>
                <TableCell align="right">
                  <IconButton aria-label="edit" onClick={() => openEdit(r)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton aria-label="delete" onClick={() => handleDelete(r.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

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
        {snack ? <Alert severity={snack.type}>{snack.message}</Alert> : null}
      </Snackbar>
    </Box>
  )
}
