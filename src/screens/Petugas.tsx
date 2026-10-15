import { AnimatePresence, animate, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import {
  ScanLine, ChevronLeft, Scale, Camera, Check, Bluetooth, Wifi, WifiOff, CloudUpload, Timer, Truck, ArrowRight, Minus, Plus, ImagePlus, CircleAlert, RotateCcw,
} from 'lucide-react'
import { useStore, useToast, go } from '../store'
import { CHECKS, K, MAIN_TENANT, PHOTOS, STATUS_META, fmt, gate, nextBatchId, time, ymd, type Check as C } from '../data'
import { Btn, Bar, Label, Mono, StatusPill, cx } from '../kit'
import { DeviceStage, EventList, SidePanel } from '../Shell'

type Phase = 'rute' | 'scan' | 'form' | 'hasil'

export default function Petugas() {
  const { s } = useStore()
  const [phase, setPhase] = useState<Phase>(() => (s.demoBatch && s.tour.on && s.tour.step === 3 ? 'hasil' : 'rute'))
  const [tenantId, setTenantId] = useState<string>('')
  const [saved, setSaved] = useState<string | undefined>(() => (s.tour.on && s.tour.step === 3 ? s.demoBatch : undefined))
  const t0 = useRef(0)
  useEffect(() => { document.getElementById('phone-scroll')?.scrollTo({ top: 0 }) }, [phase])

  const side = {
    rute: { photo: '/kv/pickup.webp', eyebrow: 'Langkah 2 · Lapangan', title: 'Rute harian dari wadah yang siap dijemput.', body: 'Petugas melihat urutan kios dan status wadah secara langsung. Kapasitas box E-Trike dipantau agar satu putaran rute tidak melebihi muatan.' },
    scan: { photo: '/kv/mock-pickup.webp', eyebrow: 'Langkah 2 · Scan', title: 'Satu scan, identitas wadah dan tenant langsung terkunci.', body: 'Di prototipe, pemindaian disimulasikan dengan memilih wadah. Versi produksi memakai kamera HP dan stiker QR tahan air pada setiap wadah.' },
    form: { photo: '/kv/hub.webp', eyebrow: 'Langkah 2 · QC Log', title: 'Berat, foto, dan checklist dalam satu layar.', body: 'Berat diambil dari timbangan Bluetooth, foto menjadi bukti audit, dan checklist kontaminan langsung menentukan status batch. Target pencatatan di bawah 60 detik.' },
    hasil: { photo: '/kv/hub.webp', eyebrow: 'Langkah 3 · Quality gate', title: 'Status ditetapkan sistem, bukan opini petugas.', body: '0 centang = Murni. Satu kontaminan ringan (cairan atau minyak) = Pilah Ulang. Anorganik atau material perusak = Ditolak. Aturan yang sama berlaku di semua kawasan.' },
  }[phase]

  return (
    <DeviceStage side={<SidePanel {...side}><GateRules /><div className="card p-5"><Label>Aktivitas terbaru</Label><div className="mt-3"><EventList limit={5} /></div></div></SidePanel>}>
      <AnimatePresence mode="wait">
        <motion.div key={phase} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
          {phase === 'rute' && <Rute onScan={() => setPhase('scan')} />}
          {phase === 'scan' && <Scan onBack={() => setPhase('rute')} onPick={(id) => { setTenantId(id); t0.current = Date.now(); setPhase('form') }} />}
          {phase === 'form' && <Form tenantId={tenantId} t0={t0.current} onBack={() => setPhase('scan')} onSaved={(id) => { setSaved(id); setPhase('hasil') }} />}
          {phase === 'hasil' && saved && <Hasil id={saved} onNext={() => setPhase('rute')} />}
        </motion.div>
      </AnimatePresence>
    </DeviceStage>
  )
}

function GateRules() {
  return (
    <div className="card p-5">
      <Label>Aturan quality gate</Label>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {([['murni', '0 centang'], ['pilah', '1 kontaminan ringan'], ['ditolak', 'Anorganik / perusak']] as const).map(([k, r]) => (
          <div key={k} className={cx('rounded-xl p-3 ring-1', STATUS_META[k].bg, STATUS_META[k].ring)}>
            <div className={cx('text-sm font-bold', STATUS_META[k].fg)}>{STATUS_META[k].label}</div>
            <div className="mt-0.5 text-[12.5px] text-ink/70">{r}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Header({ title, sub, onBack, right }: { title: string; sub?: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-4 pb-3 pt-2">
      {onBack && <button onClick={onBack} aria-label="Kembali" className="-ml-1 grid h-10 w-10 place-items-center rounded-xl hover:bg-ink/5"><ChevronLeft size={22} /></button>}
      <div className="min-w-0 flex-1">
        {sub && <div className="text-[12px] text-mute">{sub}</div>}
        <div className="truncate font-display text-[18px] font-semibold">{title}</div>
      </div>
      {right}
    </div>
  )
}

function Rute({ onScan }: { onScan: () => void }) {
  const { s, d } = useStore()
  const { push } = useToast()
  const key = ymd(new Date('2026-10-10T12:00:00+07:00'))
  const today = s.batches.filter((b) => b.id.includes(`-${key}-`))
  const loaded = today.reduce((a, b) => a + b.kg, 0)
  const pending = s.batches.filter((b) => !b.synced).length
  const doneIds = new Set(today.map((b) => b.tenantId))
  const route = [...s.tenants].sort((a, b) => a.kios.localeCompare(b.kios)).slice(0, 12)

  const toggle = () => {
    if (s.offline) {
      d({ t: 'offline', v: false })
      if (pending) setTimeout(() => { d({ t: 'sync' }); push({ title: `${pending} batch tersinkron`, desc: 'Data offline sudah masuk ke server.', tone: 'ok' }) }, 900)
    } else {
      d({ t: 'offline', v: true })
      push({ title: 'Mode offline aktif', desc: 'Batch disimpan di perangkat dan disinkron saat sinyal kembali.', tone: 'warn' })
    }
  }

  return (
    <div className="pb-32">
      <Header sub="Pak Joko · E-Trike #01" title="Rute hari ini" right={
        <button onClick={toggle} className={cx('inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold transition', s.offline ? 'bg-amber/25 text-[#6b5000]' : 'bg-murni/10 text-murni')}>
          {s.offline ? <WifiOff size={14} /> : <Wifi size={14} />}{s.offline ? 'Offline' : 'Online'}
        </button>
      } />
      <div className="space-y-3 px-4">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-[18px] bg-paper p-3.5 ring-1 ring-line">
            <div className="text-[11.5px] text-mute">Muatan box</div>
            <div className="font-display text-xl font-bold tnum">{fmt(loaded, 1)}<span className="text-sm font-semibold text-mute"> /140 kg</span></div>
            <div className="mt-2"><Bar value={loaded / 140} color="bg-lime-2" /></div>
          </div>
          <div className="rounded-[18px] bg-paper p-3.5 ring-1 ring-line">
            <div className="text-[11.5px] text-mute">Rata-rata durasi</div>
            <div className="font-display text-xl font-bold tnum">{today.length ? Math.round(today.reduce((a, b) => a + b.dur, 0) / today.length) : 0}<span className="text-sm font-semibold text-mute"> detik</span></div>
            <div className="mt-2 text-[11.5px] font-semibold text-murni">Target &lt; 60 detik</div>
          </div>
        </div>
        {pending > 0 && (
          <div className="flex items-center gap-3 rounded-[18px] bg-amber/15 p-3.5 text-[13px] ring-1 ring-amber/40">
            <CloudUpload size={18} className="text-[#8a6500]" />
            <div className="flex-1"><b>{pending} batch</b> menunggu sinkron</div>
            {!s.offline && <button onClick={() => d({ t: 'sync' })} className="font-semibold text-forest">Sinkron</button>}
          </div>
        )}
        <Label className="px-1 pt-1">Urutan kios · {doneIds.size}/{s.tenants.length} selesai</Label>
        <ol className="space-y-1.5">
          {route.map((t, i) => {
            const done = doneIds.has(t.id)
            const ready = t.id === MAIN_TENANT && s.binReady && !done
            return (
              <li key={t.id} className={cx('flex items-center gap-3 rounded-[16px] p-3 ring-1 transition', ready ? 'bg-lime/25 ring-lime' : 'bg-paper ring-line')}>
                <span className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12px] font-bold', done ? 'bg-forest text-white' : ready ? 'bg-night text-lime' : 'bg-ink/5 text-mute')}>{done ? <Check size={15} strokeWidth={3} /> : i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-semibold">{t.name}</div>
                  <div className="text-[12px] text-mute">{t.kios}{ready && ' · wadah siap dijemput'}</div>
                </div>
                {ready && <span className="relative h-2.5 w-2.5 text-forest"><span className="pulse-ring absolute inset-0" /><span className="absolute inset-0 rounded-full bg-forest" /></span>}
                {done && <span className="text-[11.5px] font-semibold text-murni">Selesai</span>}
              </li>
            )
          })}
        </ol>
      </div>
      <div className="sticky bottom-0 mt-4 bg-gradient-to-t from-cream via-cream to-transparent px-4 pb-6 pt-6">
        <Btn size="lg" className="w-full" icon={<ScanLine size={20} />} onClick={onScan}>Scan QR wadah</Btn>
      </div>
    </div>
  )
}

function Scan({ onBack, onPick }: { onBack: () => void; onPick: (id: string) => void }) {
  const { s } = useStore()
  const [hit, setHit] = useState<string | null>(null)
  const key = ymd(new Date('2026-10-10T12:00:00+07:00'))
  const done = new Set(s.batches.filter((b) => b.id.includes(`-${key}-`)).map((b) => b.tenantId))
  const list = [...s.tenants].sort((a, b) => (a.id === MAIN_TENANT ? -1 : b.id === MAIN_TENANT ? 1 : a.kios.localeCompare(b.kios))).filter((t) => !done.has(t.id)).slice(0, 8)
  const pick = (id: string) => {
    if (hit) return
    setHit(id)
    navigator.vibrate?.(40)
    setTimeout(() => onPick(id), 650)
  }
  return (
    <div className="min-h-full bg-night pb-10 text-white">
      <Header title="Scan QR wadah" sub="Arahkan kamera ke stiker QR" onBack={onBack} />
      <div className="px-4">
        <div className="relative aspect-[4/4.3] overflow-hidden rounded-[26px]">
          <img src="/kv/pickup.webp" alt="" className="absolute inset-0 h-full w-full scale-[1.9] object-cover object-[48%_62%]" />
          <div className="absolute inset-0 bg-night/35" />
          <div className="absolute inset-[16%]">
            {['left-0 top-0 border-l-4 border-t-4 rounded-tl-2xl', 'right-0 top-0 border-r-4 border-t-4 rounded-tr-2xl', 'left-0 bottom-0 border-l-4 border-b-4 rounded-bl-2xl', 'right-0 bottom-0 border-r-4 border-b-4 rounded-br-2xl'].map((c) => (
              <span key={c} className={cx('absolute h-10 w-10 transition-colors', hit ? 'border-lime' : 'border-white', c)} />
            ))}
            {!hit && <span className="laser absolute inset-x-2 h-0.5 rounded-full bg-lime shadow-[0_0_16px_4px_rgba(198,242,78,.6)]" />}
          </div>
          <AnimatePresence>
            {hit && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 grid place-items-center bg-lime/20">
                <div className="flex items-center gap-2 rounded-full bg-lime px-4 py-2 text-sm font-bold text-night"><Check size={16} strokeWidth={3} /> QR terbaca</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="mt-5 flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">Simulasi · pilih wadah</div>
          <div className="text-[11px] text-white/35">{list.length} belum dijemput</div>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {list.map((t) => {
            const star = t.id === MAIN_TENANT && s.tour.on
            return (
              <button key={t.id} onClick={() => pick(t.id)} className={cx('relative rounded-2xl p-3 text-left ring-1 transition', hit === t.id ? 'bg-lime text-night ring-lime' : star ? 'bg-lime/15 ring-lime/70' : 'bg-white/[.05] ring-white/10 hover:bg-white/[.09]')}>
                {star && !hit && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-lime"><span className="pulse-ring absolute inset-0 text-lime" /></span>}
                <Mono className="text-[11px] opacity-60">BIN #{t.kios.slice(-2)}</Mono>
                <div className="mt-0.5 truncate text-[13px] font-semibold">{t.name}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Form({ tenantId, t0, onBack, onSaved }: { tenantId: string; t0: number; onBack: () => void; onSaved: (id: string) => void }) {
  const { s, d } = useStore()
  const { push } = useToast()
  const t = s.tenants.find((x) => x.id === tenantId)!
  const [kg, setKg] = useState(0)
  const [weighing, setWeighing] = useState(false)
  const [photo, setPhoto] = useState<string>('')
  const [checks, setChecks] = useState<C[]>([])
  const [sec, setSec] = useState(0)
  const [saving, setSaving] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  useEffect(() => { const i = setInterval(() => setSec(Math.floor((Date.now() - t0) / 1000)), 250); return () => clearInterval(i) }, [t0])

  const weigh = () => {
    setWeighing(true)
    const target = tenantId === MAIN_TENANT ? 6.4 : Math.round((3 + Math.random() * 6) * 10) / 10
    // simulasi angka timbangan yang berosilasi lalu stabil
    animate(0, target, { duration: 1.4, ease: [0.2, 1.3, 0.4, 1], onUpdate: (v) => setKg(Math.round(v * 10) / 10), onComplete: () => { setKg(target); setWeighing(false) } })
  }
  const status = gate(checks)
  const missing = [!kg && 'berat', !photo && 'foto'].filter(Boolean) as string[]
  const save = () => {
    setSaving(true)
    const id = nextBatchId(s)
    setTimeout(() => {
      d({ t: 'saveBatch', tenantId, kg, checks, photo, dur: sec, officer: 'Pak Joko', demo: tenantId === MAIN_TENANT })
      onSaved(id)
      push({ title: 'Batch tersimpan', desc: `${id.slice(-12)} · ${sec} detik`, action: { label: 'Urungkan', run: () => { d({ t: 'deleteBatch', id }); onBack() } } })
    }, 450)
  }
  const mm = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`

  return (
    <div className="pb-6">
      <Header title={t.name} sub={`${t.kios} · BIN #${t.kios.slice(-2)}`} onBack={onBack} right={
        <span className={cx('inline-flex h-9 items-center gap-1.5 rounded-full px-3 font-mono text-[13px] font-semibold', sec < 60 ? 'bg-murni/10 text-murni' : 'bg-amber/25 text-[#6b5000]')}><Timer size={14} />{mm}</span>
      } />
      <div className="space-y-3 px-4">
        {/* 1 Berat */}
        <section className="rounded-[22px] bg-paper p-4 ring-1 ring-line">
          <StepHead n={1} title="Berat" ok={!!kg} />
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-night px-4 py-4 text-white">
            <Scale size={22} className="text-lime" />
            <div className="flex-1 font-mono text-[40px] font-semibold leading-none tnum">{fmt(kg, 1)}<span className="ml-1 text-lg text-white/50">kg</span></div>
            {kg > 0 && !weighing && (
              <div className="flex flex-col gap-1">
                <button aria-label="Tambah 0,1 kg" onClick={() => setKg((v) => Math.round((v + 0.1) * 10) / 10)} className="grid h-7 w-7 place-items-center rounded-lg bg-white/10"><Plus size={14} /></button>
                <button aria-label="Kurangi 0,1 kg" onClick={() => setKg((v) => Math.max(0.1, Math.round((v - 0.1) * 10) / 10))} className="grid h-7 w-7 place-items-center rounded-lg bg-white/10"><Minus size={14} /></button>
              </div>
            )}
          </div>
          <Btn v={kg ? 'quiet' : 'primary'} className="mt-2.5 w-full" loading={weighing} icon={<Bluetooth size={16} />} onClick={weigh}>{weighing ? 'Membaca timbangan…' : kg ? 'Timbang ulang' : 'Ambil dari timbangan'}</Btn>
        </section>

        {/* 2 Foto */}
        <section className="rounded-[22px] bg-paper p-4 ring-1 ring-line">
          <StepHead n={2} title="Foto bukti" ok={!!photo} />
          {photo ? (
            <div className="relative mt-3 overflow-hidden rounded-2xl">
              <img src={photo} alt="Foto bukti" className="aspect-[16/10] w-full object-cover" />
              <span className="absolute left-2 top-2 rounded-full bg-night/70 px-2.5 py-1 font-mono text-[10.5px] text-white">{time(new Date().toISOString())} · -7.29, 112.76</span>
              <button onClick={() => setPhoto('')} className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-paper px-3 py-1.5 text-[12px] font-semibold"><RotateCcw size={12} /> Ulangi</button>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-4 gap-2">
              <button onClick={() => file.current?.click()} className="grid aspect-square place-items-center rounded-xl bg-forest text-white"><Camera size={20} /></button>
              {PHOTOS.map((p) => (
                <button key={p} onClick={() => setPhoto(p)} className="group relative aspect-square overflow-hidden rounded-xl ring-1 ring-line">
                  <img src={p} alt="" className="h-full w-full object-cover transition group-hover:scale-110" />
                  <span className="absolute inset-0 grid place-items-center bg-night/0 text-white opacity-0 transition group-hover:bg-night/30 group-hover:opacity-100"><ImagePlus size={16} /></span>
                </button>
              ))}
              <input ref={file} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPhoto(URL.createObjectURL(f)) }} />
            </div>
          )}
          {!photo && <p className="mt-2 text-[12px] text-mute">Kamera, atau pilih foto contoh untuk simulasi.</p>}
        </section>

        {/* 3 Checklist */}
        <section className="rounded-[22px] bg-paper p-4 ring-1 ring-line">
          <StepHead n={3} title="Checklist kontaminan" ok />
          <p className="mt-1 text-[12px] text-mute">Centang hanya yang ditemukan. Kosong = bersih.</p>
          <div className="mt-3 space-y-1.5">
            {CHECKS.map((c) => {
              const on = checks.includes(c.id)
              return (
                <button key={c.id} onClick={() => setChecks((x) => (on ? x.filter((y) => y !== c.id) : [...x, c.id]))} className={cx('flex w-full items-center gap-3 rounded-2xl p-3 text-left ring-1 transition', on ? (c.severe ? 'bg-[#ffebee] ring-tolak/30' : 'bg-[#fff6dc] ring-pilah/40') : 'bg-cream ring-transparent')}>
                  <span className={cx('grid h-5 w-5 shrink-0 place-items-center rounded-md', on ? (c.severe ? 'bg-tolak text-white' : 'bg-pilah text-white') : 'ring-2 ring-inset ring-ink/20')}>{on && <Check size={13} strokeWidth={3} />}</span>
                  <span className="flex-1"><span className="block text-[13.5px] font-semibold">{c.label}</span><span className="block text-[12px] text-mute">{c.hint}</span></span>
                  <span className={cx('text-[10.5px] font-bold uppercase', c.severe ? 'text-tolak/70' : 'text-[#9a6400]/70')}>{c.severe ? 'berat' : 'ringan'}</span>
                </button>
              )
            })}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-2xl bg-cream px-3.5 py-2.5">
            <span className="text-[12.5px] text-mute">Prediksi quality gate</span>
            <motion.span key={status} initial={{ scale: 0.85 }} animate={{ scale: 1 }}><StatusPill s={status} /></motion.span>
          </div>
        </section>
      </div>
      <div className="sticky bottom-0 mt-3 bg-gradient-to-t from-cream via-cream to-transparent px-4 pb-6 pt-5">
        <Btn size="lg" className="w-full" disabled={missing.length > 0} loading={saving} onClick={save} icon={<Check size={18} strokeWidth={2.6} />}>Simpan batch</Btn>
        {missing.length > 0 && <p className="mt-2 flex items-center justify-center gap-1.5 text-[12px] text-mute"><CircleAlert size={13} /> Lengkapi {missing.join(' & ')} untuk menyimpan</p>}
      </div>
    </div>
  )
}

function StepHead({ n, title, ok }: { n: number; title: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={cx('grid h-6 w-6 place-items-center rounded-full text-[11.5px] font-bold transition', ok ? 'bg-forest text-white' : 'bg-ink/[.07] text-mute')}>{ok ? <Check size={13} strokeWidth={3} /> : n}</span>
      <span className="font-display text-[15px] font-semibold">{title}</span>
    </div>
  )
}

function Hasil({ id, onNext }: { id: string; onNext: () => void }) {
  const { s, d } = useStore()
  const b = s.batches.find((x) => x.id === id)
  const [syncing, setSyncing] = useState(!s.offline)
  useEffect(() => { if (!s.offline) { const i = setTimeout(() => setSyncing(false), 1300); return () => clearTimeout(i) } }, [s.offline])
  if (!b) return <div className="p-8 text-center text-sm text-mute">Batch dibatalkan. <button className="font-semibold text-forest" onClick={onNext}>Kembali ke rute</button></div>
  const m = STATUS_META[b.status]
  const t = s.tenants.find((x) => x.id === b.tenantId)!
  const color = b.status === 'murni' ? '#2e7d32' : b.status === 'pilah' ? '#e39b12' : '#c62828'

  return (
    <div className="pb-8">
      <Header title="Quality gate" sub="Hasil verifikasi otomatis" />
      <div className="px-4">
        <div className="relative overflow-hidden rounded-[26px] bg-paper p-6 text-center ring-1 ring-line">
          <div className="dots-bg absolute inset-0 opacity-50" />
          <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 12, stiffness: 180 }} className="relative mx-auto grid h-24 w-24 place-items-center rounded-full" style={{ background: color }}>
            <motion.svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              {b.status === 'murni' ? <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25, duration: 0.45 }} />
                : b.status === 'pilah' ? <motion.path d="M12 6v7M12 17.5v.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25 }} />
                : <motion.path d="M7 7l10 10M17 7L7 17" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25 }} />}
            </motion.svg>
          </motion.div>
          <div className="relative mt-4 font-display text-[34px] font-bold uppercase leading-none" style={{ color }}>{m.label}</div>
          <p className="relative mx-auto mt-2 max-w-[260px] text-[13px] text-mute">{m.note}</p>
          <div className="relative mt-5 rounded-2xl bg-cream p-3 text-left">
            <Mono className="text-[12.5px] font-semibold">{b.id}</Mono>
            <div className="mt-2 grid grid-cols-3 gap-2 text-[12px]">
              <div><div className="text-mute">Berat</div><div className="font-display text-base font-bold tnum">{fmt(b.kg, 1)} kg</div></div>
              <div><div className="text-mute">Durasi</div><div className={cx('font-display text-base font-bold tnum', b.dur < 60 ? 'text-murni' : 'text-[#9a6400]')}>{b.dur} dtk</div></div>
              <div><div className="text-mute">Poin</div><div className="font-display text-base font-bold tnum">{b.points ? '+' + b.points : '0'}</div></div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-[18px] bg-paper p-3.5 ring-1 ring-line">
          {s.offline || !b.synced ? <WifiOff size={18} className="text-[#8a6500]" /> : syncing ? <CloudUpload size={18} className="animate-pulse text-forest" /> : <Check size={18} className="text-murni" />}
          <div className="flex-1 text-[13px]">
            {s.offline || !b.synced ? <><b>Menunggu sinkron.</b> Tersimpan aman di perangkat.</> : syncing ? 'Menyinkronkan ke server…' : <><b>Tersinkron</b> ke Impact Ledger</>}
          </div>
        </div>
        {b.status === 'murni' && <p className="mt-2 px-1 text-[12px] text-mute">+{b.points} poin untuk {t.name} cair setelah PDU memverifikasi batch ({fmt(K.pointsPerKg, 1)} poin/kg).</p>}

        <div className="mt-5 space-y-2">
          {b.status === 'murni' ? (
            <Btn size="lg" className="w-full" icon={<Truck size={18} />} onClick={() => { d({ t: 'mark', step: 3 }); if (s.tour.on) { d({ t: 'tour', on: true, step: 4 }); go('/operator') } else onNext() }}>
              Kirim ke PDU <ArrowRight size={16} />
            </Btn>
          ) : (
            <Btn size="lg" className="w-full" onClick={() => { d({ t: 'mark', step: 3 }); onNext() }}>{b.status === 'pilah' ? 'Bawa ke meja pilah hub' : 'Alihkan ke TPS'}</Btn>
          )}
          <Btn v="quiet" className="w-full" onClick={onNext}>Jemput wadah berikutnya</Btn>
        </div>
      </div>
    </div>
  )
}
