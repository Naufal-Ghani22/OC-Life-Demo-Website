// Konstanta bisnis — wajib sama dengan proposal (PRD §9)
export const K = {
  tenants: 25,
  kgPerTenantDay: 6,
  opsDays: 26,
  pureRatio: 0.85,
  biogasPerKg: 0.1, // m³/kg
  kgPerSlurryL: 1.2, // 1 L bioslurry per 1,2 kg
  slurryPrice: 2000, // Rp/L
  co2PerTon: 0.76, // t CO₂e / t
  subscription: 300_000, // Rp/lokasi/bulan
  pointsPerKg: 7.5, // poin per kg batch Murni
  voucherCost: 500, // poin per e-voucher LPG 3 kg
  lpgPrice: 20_000, // asumsi harga refill LPG 3 kg (simulasi)
  pduCapacityKg: 2000, // kapasitas mingguan PDU mitra (simulasi)
  weights: { purity: 0.5, clean: 0.3, schedule: 0.2 },
}

export const TODAY = '2026-10-10'

export type Status = 'murni' | 'pilah' | 'ditolak'
export type Check = 'anorganik' | 'cairan' | 'minyak' | 'perusak'
export const CHECKS: { id: Check; label: string; hint: string; severe: boolean }[] = [
  { id: 'anorganik', label: 'Ada anorganik', hint: 'plastik, styrofoam, sedotan', severe: true },
  { id: 'cairan', label: 'Cairan berlebih', hint: 'kuah menggenang > ¼ wadah', severe: false },
  { id: 'minyak', label: 'Minyak berlebih', hint: 'minyak jelantah, lapisan lemak', severe: false },
  { id: 'perusak', label: 'Material perusak', hint: 'tulang keras, kaca, deterjen', severe: true },
]

export function gate(checks: Check[]): Status {
  if (checks.some((c) => CHECKS.find((x) => x.id === c)!.severe)) return 'ditolak'
  if (checks.length > 0) return 'pilah'
  return 'murni'
}

export const STATUS_META: Record<Status, { label: string; fg: string; bg: string; ring: string; note: string }> = {
  murni: { label: 'Murni', fg: 'text-murni', bg: 'bg-[#e8f5e9]', ring: 'ring-murni/25', note: 'Lolos ke PDU, poin diberikan penuh.' },
  pilah: { label: 'Pilah Ulang', fg: 'text-[#9a6400]', bg: 'bg-[#fff6dc]', ring: 'ring-pilah/30', note: 'Dipilah ulang di hub sebelum dikirim. Tanpa poin.' },
  ditolak: { label: 'Ditolak', fg: 'text-tolak', bg: 'bg-[#ffebee]', ring: 'ring-tolak/25', note: 'Dialihkan ke TPS. Tenant menerima tips perbaikan.' },
}

export type Tenant = {
  id: string; name: string; kios: string; menu: string; owner: string
  points: number; clean: number; schedule: number
}
export type Batch = {
  id: string; tenantId: string; kg: number; status: Status; checks: Check[]
  at: string; dur: number; officer: string; photo: string; synced: boolean
  points: number
  pdu?: { state: 'diterima' | 'ditolak'; biogas: number; slurry: number; at: string; reason?: string }
}
export type Voucher = {
  code: string; tenantId: string; cost: number; status: 'aktif' | 'ditukar'
  createdAt: string; expires: string; redeemedAt?: string; cashier?: string
}
export type LogEvent = { id: string; at: string; kind: string; actor: string; text: string; batchId?: string; voucher?: string }

const NAMES: [string, string, string][] = [
  ['Warung Bu Sari', 'Pecel & olahan sayur', 'Bu Sari'],
  ['Soto Ayam Cak Nur', 'Kuah & daging', 'Cak Nur'],
  ['Nasi Padang Minang', 'Nasi & lauk', 'Uda Rizal'],
  ['Warung Bu Joko', 'Nasi rames', 'Bu Joko'],
  ['Bebek Goreng Slamet', 'Bebek & sambal', 'Pak Slamet'],
  ['Rawon Mbok Tin', 'Rawon & tahu', 'Mbok Tin'],
  ['Lontong Balap Pak Gendut', 'Lontong & tauge', 'Pak Gendut'],
  ['Es Buah Segar Dewi', 'Buah potong', 'Mbak Dewi'],
  ['Mie Ayam Pak Kumis', 'Mie & sayur', 'Pak Kumis'],
  ['Tahu Tek Cak Mat', 'Tahu & lontong', 'Cak Mat'],
  ['Rujak Cingur Bu Har', 'Rujak & sayur', 'Bu Har'],
  ['Sate Klopo Ondomohen', 'Sate & lontong', 'Pak Udin'],
  ['Gado-Gado Bu Ani', 'Sayur & bumbu', 'Bu Ani'],
  ['Pecel Lele Lamongan', 'Lele & lalapan', 'Mas Agus'],
  ['Nasi Goreng Cak Har', 'Nasi goreng', 'Cak Har'],
  ['Bakso Arema', 'Bakso & kuah', 'Pak Wawan'],
  ['Lalapan Mbak Rina', 'Ayam & lalapan', 'Mbak Rina'],
  ['Jus Sehat Nita', 'Jus & buah', 'Mbak Nita'],
  ['Kupang Lontong Pak Ri', 'Kupang & lontong', 'Pak Ri'],
  ['Nasi Krawu Bu Ifa', 'Nasi & daging', 'Bu Ifa'],
  ['Ayam Geprek Juara', 'Ayam & nasi', 'Mas Doni'],
  ['Seblak Teh Rara', 'Seblak & sayur', 'Teh Rara'],
  ['Pisang Molen Cak To', 'Gorengan', 'Cak To'],
  ['Martabak Manis Arif', 'Martabak', 'Mas Arif'],
  ['Kopi & Roti Bakar 24', 'Roti & kopi', 'Mas Bima'],
]
// Kios 07 dipakai sebagai tenant utama tur demo
const KIOS = [7, 12, 2, 4, 18, 1, 3, 5, 6, 8, 9, 10, 11, 13, 14, 15, 16, 17, 19, 20, 21, 22, 23, 24, 25]

export const OFFICERS = ['Pak Joko', 'Mas Andi']
export const PHOTOS = ['/kv/pickup.webp', '/kv/mock-pickup.webp', '/kv/pdu.webp']

// PRNG deterministik agar seed selalu sama setelah Reset
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

const pad = (n: number, l = 2) => String(n).padStart(l, '0')
export const ymd = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
export const batchId = (date: Date, seq: number) => `OCL-SWK01-${ymd(date)}-${pad(seq, 3)}`
const iso = (d: Date) => d.toISOString()

function dayDate(offset: number, h = 14, m = 0) {
  const d = new Date(`${TODAY}T00:00:00+07:00`)
  d.setDate(d.getDate() + offset)
  d.setHours(h, m, 0, 0)
  return d
}

export type State = {
  version: number
  tenants: Tenant[]
  batches: Batch[]
  vouchers: Voucher[]
  events: LogEvent[]
  tour: { on: boolean; step: number; done: number[] }
  demoBatch?: string
  binReady: boolean
  offline: boolean
  stockL: number
}

export const MAIN_TENANT = 't07'

export function seed(): State {
  const r = rng(20261010)
  const tenants: Tenant[] = NAMES.map(([name, menu, owner], i) => ({
    id: 't' + pad(KIOS[i]),
    name, menu, owner,
    kios: 'Kios ' + pad(KIOS[i]),
    points: i === 0 ? 460 : Math.round(150 + r() * 450),
    clean: i === 0 ? 95 : Math.round(72 + r() * 24),
    schedule: i === 0 ? 94 : Math.round(74 + r() * 22),
  }))
  const quality = tenants.map((_, i) => (i === 0 ? 1.08 : i < 4 ? 0.95 : 0.7 + r() * 0.25))

  const batches: Batch[] = []
  // 30 hari terakhir (tanpa Minggu → ±26 hari operasi)
  for (let off = -30; off <= -1; off++) {
    const d = dayDate(off)
    if (d.getDay() === 0) continue
    let seq = 1
    // edukasi menurunkan batch non-Murni dari ±24% ke ±6% (rata-rata ±15%)
    const progress = (off + 30) / 29
    const nBad = Math.max(0, Math.round(K.tenants * (0.24 - 0.18 * progress) + (r() - 0.5) * 2))
    const risk = tenants.map((_, i) => ({ i, v: r() * (1.12 - quality[i]) })).sort((a, b) => b.v - a.v)
    const bad = new Set(risk.slice(0, nBad).map((x) => x.i))
    tenants.forEach((t, i) => {
      const kg = Math.round((4.2 + r() * 3.9) * 10) / 10
      let status: Status = 'murni'
      let checks: Check[] = []
      if (bad.has(i)) {
        if (r() < 0.3) { status = 'ditolak'; checks = ['anorganik'] }
        else { status = 'pilah'; checks = [r() > 0.5 ? 'cairan' : 'minyak'] }
      }
      const at = dayDate(off, 11 + Math.floor(i / 6), Math.floor(r() * 59))
      const b: Batch = {
        id: batchId(d, seq++), tenantId: t.id, kg, status, checks, at: iso(at),
        dur: Math.round(38 + r() * 30), officer: OFFICERS[i % 2], photo: PHOTOS[i % 2], synced: true,
        points: status === 'murni' ? Math.round(kg * K.pointsPerKg) : 0,
      }
      if (status === 'murni') {
        const pd = new Date(at.getTime() + 75 * 60000)
        b.pdu = { state: 'diterima', biogas: round(kg * K.biogasPerKg, 2), slurry: round(kg / K.kgPerSlurryL, 1), at: iso(pd) }
      }
      batches.push(b)
    })
  }
  // Hari ini: 6 batch pagi, sebagian sudah diterima PDU
  const todayKios = [3, 1, 2, 4, 5, 6] // index tenant (bukan Bu Sari)
  todayKios.forEach((ti, k) => {
    const kg = [11.2, 9.8, 18.5, 14.8, 7.6, 8.1][k]
    const at = dayDate(0, 9 + k, 10 + k * 7)
    const b: Batch = {
      id: batchId(dayDate(0), k + 1), tenantId: tenants[ti].id, kg, status: 'murni', checks: [], at: iso(at),
      dur: 41 + k * 3, officer: OFFICERS[k % 2], photo: PHOTOS[k % 2], synced: true,
      points: Math.round(kg * K.pointsPerKg),
    }
    if (k < 4) b.pdu = { state: 'diterima', biogas: round(kg * K.biogasPerKg, 2), slurry: round(kg / K.kgPerSlurryL, 1), at: iso(new Date(at.getTime() + 3600000)) }
    batches.push(b)
  })

  const vouchers: Voucher[] = [
    { code: 'LPG3-SWK01-4F7K', tenantId: tenants[1].id, cost: 500, status: 'ditukar', createdAt: iso(dayDate(-3, 15)), expires: iso(dayDate(4, 23)), redeemedAt: iso(dayDate(-2, 10)), cashier: 'Slamet Riyadi' },
    { code: 'LPG3-SWK01-9QXM', tenantId: tenants[3].id, cost: 500, status: 'ditukar', createdAt: iso(dayDate(-1, 13)), expires: iso(dayDate(6, 23)), redeemedAt: iso(dayDate(0, 11, 20)), cashier: 'Slamet Riyadi' },
    { code: 'LPG3-SWK01-2HBD', tenantId: tenants[2].id, cost: 500, status: 'aktif', createdAt: iso(dayDate(0, 8)), expires: iso(dayDate(7, 23)) },
  ]

  const events: LogEvent[] = batches.slice(-6).flatMap((b) => {
    const t = tenants.find((x) => x.id === b.tenantId)!
    const ev: LogEvent[] = [{ id: 'e' + b.id, at: b.at, kind: 'pickup', actor: b.officer, text: `${t.name} · ${fmt(b.kg, 1)} kg · Murni`, batchId: b.id }]
    if (b.pdu) ev.push({ id: 'p' + b.id, at: b.pdu.at, kind: 'pdu', actor: 'Hendra (PDU)', text: `Batch diterima · ${fmt(b.pdu.biogas, 2)} m³ biogas`, batchId: b.id })
    return ev
  })

  return {
    version: 4, tenants, batches, vouchers, events,
    tour: { on: false, step: 1, done: [] },
    binReady: false, offline: false, stockL: 1425,
  }
}

export const round = (n: number, d = 0) => Math.round(n * 10 ** d) / 10 ** d
export const fmt = (n: number, d = 0) => n.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d })
export const rp = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID')
export const time = (s: string) => new Date(s).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
export const dateShort = (s: string) => new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
export const dateLong = (s: string) => new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

// Skor Hijau: 50% rasio murni, 30% kebersihan, 20% kepatuhan jadwal
export function greenScore(t: Tenant, batches: Batch[]) {
  const own = batches.filter((b) => b.tenantId === t.id)
  const purity = own.length ? (own.filter((b) => b.status === 'murni').length / own.length) * 100 : 0
  const score = purity * K.weights.purity + t.clean * K.weights.clean + t.schedule * K.weights.schedule
  return { purity, clean: t.clean, schedule: t.schedule, score: Math.round(score), kg: own.reduce((a, b) => a + b.kg, 0), count: own.length }
}

export function scoreLabel(s: number) {
  if (s >= 88) return 'Hijau Unggul'
  if (s >= 78) return 'Hijau'
  return 'Perlu Pendampingan'
}

// Ringkasan 30 hari terakhir (window bergulir hingga hari ini)
export function summary(st: State) {
  const from = dayDate(-29, 0).getTime()
  const win = st.batches.filter((b) => new Date(b.at).getTime() >= from)
  const pure = win.filter((b) => b.status === 'murni')
  const kgPure = pure.reduce((a, b) => a + b.kg, 0)
  const kgAll = win.reduce((a, b) => a + b.kg, 0)
  const biogas = kgPure * K.biogasPerKg
  const slurry = kgPure / K.kgPerSlurryL
  return {
    count: win.length, pureCount: pure.length,
    kgAll, kgPure, pureRatio: win.length ? pure.length / win.length : 0,
    biogas, slurry, slurryRp: slurry * K.slurryPrice,
    co2: (kgPure / 1000) * K.co2PerTon,
    lpg: Math.floor((slurry * K.slurryPrice * 0.65) / K.lpgPrice),
  }
}

export function daily(st: State) {
  const out: { date: Date; kg: number; contam: number; n: number }[] = []
  for (let off = -29; off <= 0; off++) {
    const d = dayDate(off)
    const key = ymd(d)
    const bs = st.batches.filter((b) => b.id.includes(`-${key}-`))
    const bad = bs.filter((b) => b.status !== 'murni').length
    out.push({ date: d, kg: bs.reduce((a, b) => a + b.kg, 0), contam: bs.length ? (bad / bs.length) * 100 : 0, n: bs.length })
  }
  return out
}

export function nextBatchId(st: State) {
  const key = ymd(dayDate(0))
  const n = st.batches.filter((b) => b.id.includes(`-${key}-`)).length
  return batchId(dayDate(0), n + 1)
}

export function nowAt(minutesAfter = 0) {
  // jam simulasi: hari demo, jam nyata perangkat
  const real = new Date()
  const d = dayDate(0, real.getHours(), real.getMinutes())
  d.setMinutes(d.getMinutes() + minutesAfter)
  return d.toISOString()
}

export function voucherCode() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 4; i++) s += c[Math.floor(Math.random() * c.length)]
  return `LPG3-SWK01-${s}`
}

export const expiresIn = (days: number) => {
  const d = new Date(nowAt())
  d.setDate(d.getDate() + days)
  return d.toISOString()
}
