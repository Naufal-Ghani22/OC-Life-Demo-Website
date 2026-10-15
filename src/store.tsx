import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import {
  K, MAIN_TENANT, gate, nextBatchId, nowAt, round, seed, voucherCode, expiresIn, fmt,
  type Check, type State, type Batch, type LogEvent,
} from './data'

const KEY = 'oc-life-demo-v4'

type Action =
  | { t: 'reset' }
  | { t: 'tour'; on: boolean; step?: number }
  | { t: 'mark'; step: number }
  | { t: 'binReady'; v: boolean }
  | { t: 'saveBatch'; tenantId: string; kg: number; checks: Check[]; photo: string; dur: number; officer: string; demo: boolean }
  | { t: 'deleteBatch'; id: string }
  | { t: 'offline'; v: boolean }
  | { t: 'sync' }
  | { t: 'pdu'; id: string; ok: boolean; biogas?: number; slurry?: number; reason?: string }
  | { t: 'redeem'; tenantId: string; code: string }
  | { t: 'useVoucher'; code: string; cashier: string }
  | { t: 'sellSlurry'; liters: number }

function ev(e: Omit<LogEvent, 'id' | 'at'> & { at?: string }): LogEvent {
  return { id: Math.random().toString(36).slice(2), at: e.at ?? nowAt(), ...e }
}

function reducer(s: State, a: Action): State {
  switch (a.t) {
    case 'reset':
      return seed()
    case 'tour':
      return { ...s, tour: { ...s.tour, on: a.on, step: a.step ?? s.tour.step } }
    case 'mark':
      return s.tour.done.includes(a.step) ? s : { ...s, tour: { ...s.tour, done: [...s.tour.done, a.step] } }
    case 'binReady': {
      const t = s.tenants.find((x) => x.id === MAIN_TENANT)!
      return {
        ...s, binReady: a.v,
        events: a.v ? [ev({ kind: 'tenant', actor: t.owner, text: `${t.name} menandai Wadah #07 siap dijemput` }), ...s.events] : s.events,
      }
    }
    case 'saveBatch': {
      const status = gate(a.checks)
      const id = nextBatchId(s)
      const b: Batch = {
        id, tenantId: a.tenantId, kg: a.kg, status, checks: a.checks, at: nowAt(), dur: a.dur,
        officer: a.officer, photo: a.photo, synced: !s.offline,
        points: status === 'murni' ? Math.round(a.kg * K.pointsPerKg) : 0,
      }
      const t = s.tenants.find((x) => x.id === a.tenantId)!
      return {
        ...s,
        batches: [...s.batches, b],
        demoBatch: a.demo ? id : s.demoBatch,
        binReady: a.tenantId === MAIN_TENANT ? false : s.binReady,
        events: [ev({ kind: 'pickup', actor: a.officer, text: `${t.name} · ${fmt(a.kg, 1)} kg · ${status === 'murni' ? 'Murni' : status === 'pilah' ? 'Pilah Ulang' : 'Ditolak'}`, batchId: id }), ...s.events],
      }
    }
    case 'deleteBatch':
      return {
        ...s,
        batches: s.batches.filter((b) => b.id !== a.id),
        demoBatch: s.demoBatch === a.id ? undefined : s.demoBatch,
        events: s.events.filter((e) => e.batchId !== a.id),
      }
    case 'offline':
      return { ...s, offline: a.v }
    case 'sync':
      return { ...s, batches: s.batches.map((b) => (b.synced ? b : { ...b, synced: true })) }
    case 'pdu': {
      const b = s.batches.find((x) => x.id === a.id)
      if (!b || b.pdu) return s
      const t = s.tenants.find((x) => x.id === b.tenantId)!
      if (!a.ok) {
        return {
          ...s,
          batches: s.batches.map((x) => (x.id === a.id ? { ...x, points: 0, pdu: { state: 'ditolak', biogas: 0, slurry: 0, at: nowAt(), reason: a.reason } } : x)),
          events: [ev({ kind: 'pdu-reject', actor: 'Hendra (PDU)', text: `Batch ditolak PDU: ${a.reason}`, batchId: a.id }), ...s.events],
        }
      }
      const biogas = a.biogas ?? round(b.kg * K.biogasPerKg, 2)
      const slurry = a.slurry ?? round(b.kg / K.kgPerSlurryL, 1)
      return {
        ...s,
        stockL: round(s.stockL + slurry, 1),
        tenants: s.tenants.map((x) => (x.id === b.tenantId ? { ...x, points: x.points + b.points } : x)),
        batches: s.batches.map((x) => (x.id === a.id ? { ...x, pdu: { state: 'diterima', biogas, slurry, at: nowAt() } } : x)),
        events: [
          ev({ kind: 'points', actor: 'Sistem OC-Life', text: `+${b.points} Poin Sirkular untuk ${t.name}`, batchId: a.id }),
          ev({ kind: 'pdu', actor: 'Hendra (PDU)', text: `Batch diterima · ${fmt(biogas, 2)} m³ biogas · ${fmt(slurry, 1)} L bioslurry`, batchId: a.id }),
          ...s.events,
        ],
      }
    }
    case 'redeem': {
      const t = s.tenants.find((x) => x.id === a.tenantId)!
      if (t.points < K.voucherCost) return s
      return {
        ...s,
        tenants: s.tenants.map((x) => (x.id === a.tenantId ? { ...x, points: x.points - K.voucherCost } : x)),
        vouchers: [{ code: a.code, tenantId: a.tenantId, cost: K.voucherCost, status: 'aktif', createdAt: nowAt(), expires: expiresIn(7) }, ...s.vouchers],
        events: [ev({ kind: 'voucher', actor: t.owner, text: `${t.name} menukar ${K.voucherCost} poin → e-voucher LPG 3 kg`, voucher: a.code }), ...s.events],
      }
    }
    case 'useVoucher': {
      const v = s.vouchers.find((x) => x.code === a.code)
      if (!v || v.status !== 'aktif') return s
      const t = s.tenants.find((x) => x.id === v.tenantId)!
      return {
        ...s,
        vouchers: s.vouchers.map((x) => (x.code === a.code ? { ...x, status: 'ditukar', redeemedAt: nowAt(), cashier: a.cashier } : x)),
        events: [ev({ kind: 'redeem', actor: a.cashier, text: `Voucher ${a.code} ditukar · 1 tabung LPG 3 kg untuk ${t.name}`, voucher: a.code }), ...s.events],
      }
    }
    case 'sellSlurry':
      return {
        ...s,
        stockL: round(Math.max(0, s.stockL - a.liters), 1),
        events: [ev({ kind: 'sale', actor: 'Hendra (PDU)', text: `${fmt(a.liters)} L bioslurry dijual ke Gapoktan · ${'Rp' + (a.liters * K.slurryPrice).toLocaleString('id-ID')}` }), ...s.events],
      }
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as State
      if (s.version === 4) return s
    }
  } catch { /* storage tidak tersedia */ }
  return seed()
}

type Ctx = { s: State; d: (a: Action) => void }
const StoreCtx = createContext<Ctx>(null!)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, d] = useReducer(reducer, undefined, load)
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* abaikan */ }
  }, [s])
  return <StoreCtx.Provider value={{ s, d }}>{children}</StoreCtx.Provider>
}

export const useStore = () => useContext(StoreCtx)
export const newVoucherCode = voucherCode

// ---------- Router (hash) ----------
export function useRoute() {
  const get = () => (location.hash.replace(/^#/, '') || '/').split('?')[0]
  const [path, setPath] = useState(get)
  useEffect(() => {
    const f = () => { setPath(get()); window.scrollTo({ top: 0 }) }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return path
}
export const go = (p: string) => { location.hash = p }

// ---------- Toast ----------
type Toast = { id: number; title: string; desc?: string; tone?: 'ok' | 'warn' | 'err' | 'info'; action?: { label: string; run: () => void } }
const ToastCtx = createContext<{ toasts: Toast[]; push: (t: Omit<Toast, 'id'>) => void; drop: (id: number) => void }>(null!)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, set] = useState<Toast[]>([])
  const drop = useCallback((id: number) => set((x) => x.filter((t) => t.id !== id)), [])
  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random()
    set((x) => [...x.slice(-2), { ...t, id }])
    setTimeout(() => drop(id), t.action ? 7000 : 4200)
  }, [drop])
  const v = useMemo(() => ({ toasts, push, drop }), [toasts, push, drop])
  return <ToastCtx.Provider value={v}>{children}</ToastCtx.Provider>
}
export const useToast = () => useContext(ToastCtx)
