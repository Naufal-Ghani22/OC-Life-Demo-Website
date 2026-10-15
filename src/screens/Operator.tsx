import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Thermometer, Gauge as GaugeI, Droplets, Flame, Check, X, Inbox, Truck, Banknote, ShieldCheck, FlaskConical, ArrowRight, Search } from 'lucide-react'
import { useStore, useToast, go } from '../store'
import { K, fmt, round, rp, time, ymd, type Batch } from '../data'
import { Btn, Bar, Label, Modal, Mono, Num, Spark, StatusPill, cx } from '../kit'

const KEY = ymd(new Date('2026-10-10T12:00:00+07:00'))

export default function Operator() {
  const { s, d } = useStore()
  const { push } = useToast()
  const today = useMemo(() => s.batches.filter((b) => b.id.includes(`-${KEY}-`)).sort((a, b) => b.at.localeCompare(a.at)), [s.batches])
  const incoming = today.filter((b) => b.status === 'murni')
  const waiting = incoming.filter((b) => !b.pdu)
  const [sel, setSel] = useState<string | undefined>(() => s.demoBatch && !s.batches.find((b) => b.id === s.demoBatch)?.pdu ? s.demoBatch : waiting[0]?.id ?? incoming[0]?.id)
  const [q, setQ] = useState('')
  const b = s.batches.find((x) => x.id === sel)
  const accepted = today.filter((x) => x.pdu?.state === 'diterima')
  const kgIn = accepted.reduce((a, x) => a + x.kg, 0)
  const gas = accepted.reduce((a, x) => a + (x.pdu?.biogas ?? 0), 0)
  const slurry = accepted.reduce((a, x) => a + (x.pdu?.slurry ?? 0), 0)
  const rows = incoming.filter((x) => !q || x.id.toLowerCase().includes(q.toLowerCase()) || s.tenants.find((t) => t.id === x.tenantId)!.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="px-4 pb-48 pt-6 sm:px-6 xl:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Label>Langkah 4 · Fasilitas PDU mitra</Label>
          <h1 className="mt-1 text-3xl font-bold">Reaktor AD-02 · Batch masuk</h1>
          <p className="mt-1 text-sm text-mute">Hanya batch berstatus Murni yang muncul di sini. Batch Pilah Ulang & Ditolak berhenti di hub.</p>
        </div>
        <Telemetry />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={<Inbox size={16} />} label="Diterima hari ini" value={<Num value={kgIn} d={1} />} unit="kg" foot={`${accepted.length} batch · ${waiting.length} menunggu`} />
        <Kpi icon={<Flame size={16} />} label="Biogas hari ini" value={<Num value={gas} d={2} />} unit="m³" foot={`${fmt(K.biogasPerKg, 1)} m³ per kg`} />
        <Kpi icon={<Droplets size={16} />} label="Bioslurry hari ini" value={<Num value={slurry} d={1} />} unit="L" foot={`1 L per ${fmt(K.kgPerSlurryL, 1)} kg`} />
        <Kpi icon={<Banknote size={16} />} label="Stok bioslurry" value={<Num value={s.stockL} />} unit="L" foot={rp(s.stockL * K.slurryPrice) + ' nilai jual'} accent />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div className="font-display text-lg font-semibold">Antrean batch · hari ini</div>
            <label className="flex h-10 items-center gap-2 rounded-xl bg-cream px-3 text-sm ring-1 ring-line focus-within:ring-forest/40">
              <Search size={15} className="text-mute" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari batch / tenant" className="w-40 bg-transparent outline-none placeholder:text-mute" />
            </label>
          </div>
          <div className="thin-scroll max-h-[520px] overflow-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-paper text-[11px] font-semibold uppercase tracking-[0.1em] text-mute">
                <tr className="border-b border-line"><th className="px-5 py-3">Batch</th><th className="py-3">Tenant</th><th className="py-3 text-right">Berat</th><th className="py-3 pl-6">QC</th><th className="px-5 py-3">Status PDU</th></tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {rows.map((x) => {
                    const t = s.tenants.find((y) => y.id === x.tenantId)!
                    const on = x.id === sel
                    return (
                      <motion.tr layout key={x.id} initial={{ backgroundColor: '#e9f7c4' }} animate={{ backgroundColor: on ? '#f1f6ea' : 'rgba(0,0,0,0)' }} onClick={() => setSel(x.id)} className={cx('cursor-pointer border-b border-line/70 transition hover:bg-cream', on && 'shadow-[inset_3px_0_0_#1f5f3f]')}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <img src={x.photo} alt="" className="h-10 w-10 rounded-lg object-cover" />
                            <div><Mono className="block text-[12.5px] font-semibold">{x.id.slice(-12)}</Mono><div className="text-[12px] text-mute">Timbang {time(x.at)}</div></div>
                          </div>
                        </td>
                        <td className="py-3.5"><div className="font-medium">{t.name}</div><div className="text-[12px] text-mute">{t.kios}</div></td>
                        <td className="py-3.5 text-right font-display font-bold tnum">{fmt(x.kg, 1)} kg</td>
                        <td className="py-3.5 pl-6"><StatusPill s={x.status} /></td>
                        <td className="px-5 py-3.5">
                          {!x.pdu ? <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/20 px-2.5 py-1 text-xs font-semibold text-[#6b5000]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c99a00]" />Menunggu</span>
                            : x.pdu.state === 'diterima' ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-murni"><Check size={14} />Diterima {time(x.pdu.at)}</span>
                            : <span className="inline-flex items-center gap-1 text-xs font-semibold text-tolak"><X size={14} />Ditolak</span>}
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-5">
          {b ? <Detail key={b.id} b={b} onDone={(ok) => {
            if (ok) push({ title: 'Batch diterima digester', desc: `+${b.points} poin dikirim ke tenant`, tone: 'ok' })
            const nxt = waiting.find((w) => w.id !== b.id)
            if (nxt && !s.tour.on) setSel(nxt.id)
          }} /> : <div className="card grid h-60 place-items-center text-sm text-mute">Pilih batch dari antrean</div>}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Reactor />
        <Stock onSell={(l) => { d({ t: 'sellSlurry', liters: l }); push({ title: `${fmt(l)} L bioslurry terjual`, desc: rp(l * K.slurryPrice) + ' masuk kas subsidi silang', tone: 'ok' }) }} />
      </div>
    </div>
  )
}

function Kpi({ icon, label, value, unit, foot, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; unit: string; foot: string; accent?: boolean }) {
  return (
    <div className={cx('card p-4 sm:p-5', accent && 'border-l-4 border-l-amber')}>
      <div className="flex items-center justify-between text-mute"><Label>{label}</Label>{icon}</div>
      <div className="mt-2.5 flex items-baseline gap-1"><span className="font-display text-[28px] font-bold leading-none sm:text-[32px]">{value}</span><span className="text-sm font-semibold text-mute">{unit}</span></div>
      <div className="mt-2 truncate text-[12px] text-mute">{foot}</div>
    </div>
  )
}

function useTelemetry() {
  const [v, setV] = useState({ temp: 37.2, ph: 7.18, bar: 2.4, flow: 0.24, hist: Array.from({ length: 24 }, (_, i) => 0.2 + Math.sin(i / 3) * 0.03 + Math.random() * 0.02) })
  useEffect(() => {
    const i = setInterval(() => setV((o) => {
      const flow = Math.max(0.18, Math.min(0.3, o.flow + (Math.random() - 0.5) * 0.02))
      return { temp: round(37 + Math.random() * 0.5, 1), ph: round(7.1 + Math.random() * 0.15, 2), bar: round(2.3 + Math.random() * 0.2, 1), flow, hist: [...o.hist.slice(1), flow] }
    }), 2000)
    return () => clearInterval(i)
  }, [])
  return v
}

function Telemetry() {
  const v = useTelemetry()
  return (
    <div className="flex flex-wrap gap-2">
      {[
        [<Thermometer size={14} />, v.temp.toFixed(1) + '°C', 'Suhu'],
        [<FlaskConical size={14} />, 'pH ' + v.ph.toFixed(2), 'Keasaman'],
        [<GaugeI size={14} />, v.bar.toFixed(1) + ' bar', 'Tekanan'],
      ].map(([i, val, l]) => (
        <div key={l as string} className="flex items-center gap-2 rounded-xl bg-paper px-3 py-2 ring-1 ring-line">
          <span className="text-forest">{i}</span>
          <div className="leading-tight"><div className="text-[10.5px] text-mute">{l}</div><div className="font-mono text-[13px] font-semibold tnum">{val}</div></div>
        </div>
      ))}
      <div className="flex items-center gap-2 rounded-xl bg-murni/10 px-3 py-2 text-[12.5px] font-semibold text-murni"><span className="h-2 w-2 animate-pulse rounded-full bg-murni" />Mesofilik stabil</div>
    </div>
  )
}

const REASONS = ['Bau busuk / fermentasi awal', 'Terdeteksi plastik saat bongkar', 'Berat tidak sesuai log', 'Wadah bocor / segel rusak']

function Detail({ b, onDone }: { b: Batch; onDone: (ok: boolean) => void }) {
  const { s, d } = useStore()
  const t = s.tenants.find((x) => x.id === b.tenantId)!
  const [gas, setGas] = useState(round(b.kg * K.biogasPerKg, 2))
  const [sl, setSl] = useState(round(b.kg / K.kgPerSlurryL, 1))
  const [busy, setBusy] = useState(false)
  const [rej, setRej] = useState(false)
  const [reason, setReason] = useState(REASONS[0])
  const isDemo = b.id === s.demoBatch

  const accept = () => {
    setBusy(true)
    setTimeout(() => { d({ t: 'pdu', id: b.id, ok: true, biogas: gas, slurry: sl }); setBusy(false); onDone(true) }, 700)
  }

  return (
    <div className={cx('card overflow-hidden', isDemo && !b.pdu && 'ring-2 ring-lime')}>
      <div className="relative h-36">
        <img src={b.photo} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-night/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 text-white">
          <div><div className="font-display text-xl font-semibold">{t.name}</div><Mono className="text-[12px] text-white/70">{b.id}</Mono></div>
          {isDemo && <span className="rounded-full bg-lime px-2.5 py-1 text-[11px] font-bold text-night">Batch tur</span>}
        </div>
      </div>
      <div className="grid grid-cols-3 divide-x divide-line border-b border-line text-center">
        {[['Berat', fmt(b.kg, 1) + ' kg'], ['Petugas', b.officer], ['Durasi QC', b.dur + ' dtk']].map(([a, v]) => (
          <div key={a} className="px-2 py-3"><div className="text-[11px] text-mute">{a}</div><div className="mt-0.5 text-sm font-semibold tnum">{v}</div></div>
        ))}
      </div>
      <div className="p-5">
        {b.pdu ? (
          <div className={cx('rounded-2xl p-4', b.pdu.state === 'diterima' ? 'bg-[#eef6e9]' : 'bg-[#ffebee]')}>
            <div className={cx('flex items-center gap-2 font-semibold', b.pdu.state === 'diterima' ? 'text-murni' : 'text-tolak')}>{b.pdu.state === 'diterima' ? <Check size={18} /> : <X size={18} />}{b.pdu.state === 'diterima' ? `Diterima ${time(b.pdu.at)}` : 'Ditolak: ' + b.pdu.reason}</div>
            {b.pdu.state === 'diterima' && (
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div><div className="text-[11.5px] text-mute">Biogas</div><div className="font-display text-lg font-bold">{fmt(b.pdu.biogas, 2)} m³</div></div>
                <div><div className="text-[11.5px] text-mute">Bioslurry</div><div className="font-display text-lg font-bold">{fmt(b.pdu.slurry, 1)} L</div></div>
                <div><div className="text-[11.5px] text-mute">CO₂e</div><div className="font-display text-lg font-bold">{fmt(b.kg * K.co2PerTon, 2)} kg</div></div>
              </div>
            )}
            <button onClick={() => go('/ledger/' + b.id)} className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-forest">Lihat jejak di ledger <ArrowRight size={14} /></button>
          </div>
        ) : (
          <>
            <Label>Catat output · bisa disesuaikan</Label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Biogas (CH₄)" unit="m³" value={gas} step={0.01} onChange={setGas} hint={`${fmt(b.kg, 1)} kg × ${fmt(K.biogasPerKg, 1)}`} />
              <Field label="Bioslurry" unit="L" value={sl} step={0.1} onChange={setSl} hint={`${fmt(b.kg, 1)} kg ÷ ${fmt(K.kgPerSlurryL, 1)}`} />
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-cream px-3.5 py-2.5 text-[13px]">
              <span className="text-mute">Emisi dihindari</span><span className="font-semibold tnum">{fmt(b.kg * K.co2PerTon, 2)} kg CO₂e</span>
            </div>
            <div className="mt-4 flex gap-2">
              <Btn v="danger" onClick={() => setRej(true)} icon={<X size={16} />}>Tolak</Btn>
              <Btn className="flex-1" loading={busy} onClick={accept} icon={<Check size={16} strokeWidth={2.6} />}>Terima & catat output</Btn>
            </div>
            <p className="mt-2 text-[12px] text-mute">Menerima batch akan mencairkan +{b.points} Poin Sirkular ke {t.name}.</p>
          </>
        )}
      </div>
      <Modal open={rej} onClose={() => setRej(false)} title="Tolak batch">
        <div className="p-6">
          <h3 className="text-xl font-semibold">Tolak batch ini?</h3>
          <p className="mt-1 text-sm text-mute">Poin tenant tidak dicairkan. Alasan tercatat di ledger dan dikirim ke petugas.</p>
          <div className="mt-4 space-y-2">
            {REASONS.map((r) => (
              <label key={r} className={cx('flex cursor-pointer items-center gap-3 rounded-xl p-3 ring-1 transition', reason === r ? 'bg-[#ffebee] ring-tolak/30' : 'ring-line hover:bg-cream')}>
                <input type="radio" name="r" checked={reason === r} onChange={() => setReason(r)} className="accent-[#c62828]" />
                <span className="text-sm">{r}</span>
              </label>
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            <Btn v="quiet" className="flex-1" onClick={() => setRej(false)}>Batal</Btn>
            <Btn v="danger" className="flex-1 !bg-tolak !text-white" onClick={() => { d({ t: 'pdu', id: b.id, ok: false, reason }); setRej(false); onDone(false) }}>Tolak batch</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Field({ label, unit, value, step, onChange, hint }: { label: string; unit: string; value: number; step: number; onChange: (n: number) => void; hint: string }) {
  return (
    <label className="block">
      <span className="text-[12px] text-mute">{label}</span>
      <span className="mt-1 flex h-12 items-center rounded-xl bg-paper px-3 ring-[1.5px] ring-[#d5cfbd] focus-within:ring-forest">
        <input type="number" step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full bg-transparent text-right font-display text-lg font-bold tnum outline-none" />
        <span className="ml-1.5 text-sm font-semibold text-mute">{unit}</span>
      </span>
      <span className="mt-1 block font-mono text-[10.5px] text-mute">{hint}</span>
    </label>
  )
}

function Reactor() {
  const v = useTelemetry()
  const fill = 0.78
  return (
    <div className="card-dark relative overflow-hidden p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">Telemetri reaktor</div>
          <div className="mt-1 font-display text-xl font-semibold">Laju alir metana</div>
        </div>
        <div className="text-right"><div className="font-mono text-2xl font-semibold text-lime tnum">{v.flow.toFixed(2)}</div><div className="text-[11px] text-white/45">m³/jam</div></div>
      </div>
      <div className="mt-4 flex items-end gap-6">
        <div className="relative h-36 w-32 shrink-0">
          <div className="absolute inset-x-0 bottom-0 h-28 overflow-hidden rounded-b-[28px] rounded-t-[60px] bg-white/[.06] ring-1 ring-white/15">
            <motion.div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#6b5a1f] to-[#9a8a3a]" initial={{ height: 0 }} animate={{ height: `${fill * 100}%` }} transition={{ duration: 1.4 }} />
            {[18, 40, 62, 80, 30].map((x, i) => <span key={i} className="bubble absolute bottom-2 h-2 w-2 rounded-full bg-lime/70" style={{ left: `${x}%`, animationDelay: `${i * 0.6}s` }} />)}
          </div>
          <div className="absolute left-1/2 top-0 h-8 w-3 -translate-x-1/2 rounded-t bg-white/15" />
        </div>
        <div className="min-w-0 flex-1">
          <Spark data={v.hist} />
          <div className="mt-2 flex justify-between text-[11px] text-white/40"><span>−48 mnt</span><span>sekarang</span></div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-[11px] text-white/45">Volume terisi</div><div className="font-semibold">{fill * 100}% · AD-02</div></div>
            <div><div className="text-[11px] text-white/45">Retensi</div><div className="font-semibold">±25 hari</div></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stock({ onSell }: { onSell: (l: number) => void }) {
  const { s } = useStore()
  const [open, setOpen] = useState(false)
  const [l, setL] = useState(1000)
  const cap = 1700
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <Label>Valorisasi samping</Label>
          <div className="mt-1 font-display text-xl font-semibold">Stok bioslurry siap angkut</div>
        </div>
        <span className="rounded-full bg-amber/20 px-2.5 py-1 text-[11px] font-bold text-[#6b5000]">Offtaker siap</span>
      </div>
      <div className="mt-4 flex items-end gap-6">
        <div><div className="font-display text-4xl font-bold tnum"><Num value={s.stockL} /></div><div className="text-[12px] text-mute">liter dari kapasitas {fmt(cap)} L</div></div>
        <div className="ml-auto text-right"><div className="font-display text-2xl font-bold tnum">{rp(s.stockL * K.slurryPrice)}</div><div className="text-[12px] text-mute">@ {rp(K.slurryPrice)}/L</div></div>
      </div>
      <div className="mt-3"><Bar value={s.stockL / cap} color="bg-amber" h="h-2.5" /></div>
      <div className="mt-4 space-y-2">
        {[['Gapoktan Urban Mandiri', '1.800 L/bulan'], ['Kampus Green Nursery', '950 L/bulan']].map(([a, b]) => (
          <div key={a} className="flex items-center justify-between rounded-xl bg-cream px-3.5 py-2.5 text-[13px]"><span className="flex items-center gap-2"><ShieldCheck size={15} className="text-forest" />{a}</span><span className="text-mute">Kontrak {b}</span></div>
        ))}
      </div>
      <Btn v="ghost" className="mt-4 w-full" icon={<Truck size={16} />} disabled={s.stockL < 100} onClick={() => setOpen(true)}>Jadwalkan penjualan</Btn>
      <Modal open={open} onClose={() => setOpen(false)} title="Jual bioslurry">
        <div className="p-6">
          <h3 className="text-xl font-semibold">Jual bioslurry ke Gapoktan</h3>
          <p className="mt-1 text-sm text-mute">Hasil penjualan masuk kas OC-Life dan mendanai Poin Sirkular tenant.</p>
          <input type="range" min={100} max={Math.floor(s.stockL / 100) * 100} step={100} value={Math.min(l, s.stockL)} onChange={(e) => setL(Number(e.target.value))} className="mt-6 w-full accent-[#1f5f3f]" />
          <div className="mt-3 flex justify-between"><span className="font-display text-2xl font-bold tnum">{fmt(Math.min(l, s.stockL))} L</span><span className="font-display text-2xl font-bold text-forest tnum">{rp(Math.min(l, s.stockL) * K.slurryPrice)}</span></div>
          <div className="mt-6 flex gap-2"><Btn v="quiet" className="flex-1" onClick={() => setOpen(false)}>Batal</Btn><Btn className="flex-1" onClick={() => { onSell(Math.min(l, s.stockL)); setOpen(false) }}>Konfirmasi</Btn></div>
        </div>
      </Modal>
    </div>
  )
}
