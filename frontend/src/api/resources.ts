import { http } from './http'

export type Paginated<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type Bank = {
  id: number
  name: string
  bank_type: 'PRIVATE' | 'GOVERNMENT'
  address: string
}

export type Client = {
  id: number
  full_name: string
  date_of_birth: string
  age: number | null
  nationality: string
  address: string
  email: string
  phone: string
  person_type: 'NATURAL' | 'LEGAL_ENTITY'
  bank: number | null
  bank_name?: string
}

export type Credit = {
  id: number
  client: number
  client_full_name?: string
  description: string
  min_payment: string
  max_payment: string
  term_months: number
  created_at?: string
  bank: number
  bank_name?: string
  credit_type: 'AUTO' | 'MORTGAGE' | 'COMMERCIAL'
}

export type ListParams = {
  page?: number
  page_size?: number
  search?: string
  ordering?: string
  [key: string]: string | number | undefined
}

export async function listBanks(params?: ListParams): Promise<Paginated<Bank>> {
  const res = await http.get('/banks/', { params })
  return res.data
}

export async function createBank(payload: Omit<Bank, 'id'>): Promise<Bank> {
  const res = await http.post('/banks/', payload)
  return res.data
}

export async function updateBank(id: number, payload: Omit<Bank, 'id'>): Promise<Bank> {
  const res = await http.put(`/banks/${id}/`, payload)
  return res.data
}

export async function deleteBank(id: number): Promise<void> {
  await http.delete(`/banks/${id}/`)
}

export async function listClients(params?: ListParams): Promise<Paginated<Client>> {
  const res = await http.get('/clients/', { params })
  return res.data
}

export async function createClient(payload: Omit<Client, 'id' | 'bank_name'>): Promise<Client> {
  const res = await http.post('/clients/', payload)
  return res.data
}

export async function updateClient(id: number, payload: Omit<Client, 'id' | 'bank_name'>): Promise<Client> {
  const res = await http.put(`/clients/${id}/`, payload)
  return res.data
}

export async function deleteClient(id: number): Promise<void> {
  await http.delete(`/clients/${id}/`)
}

export async function listCredits(params?: ListParams): Promise<Paginated<Credit>> {
  const res = await http.get('/credits/', { params })
  return res.data
}

export async function createCredit(payload: Omit<Credit, 'id' | 'created_at' | 'bank_name' | 'client_full_name'>): Promise<Credit> {
  const res = await http.post('/credits/', payload)
  return res.data
}

export async function updateCredit(id: number, payload: Omit<Credit, 'id' | 'created_at' | 'bank_name' | 'client_full_name'>): Promise<Credit> {
  const res = await http.put(`/credits/${id}/`, payload)
  return res.data
}

export async function deleteCredit(id: number): Promise<void> {
  await http.delete(`/credits/${id}/`)
}
