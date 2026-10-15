import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Download, Recycle, Leaf, Flame, Wallet, TrendingDown, ArrowRight, Printer, Search, ArrowUpDown, Truck, Battery } from 'lucide-react'
import { useStore, go } from '../store'
import { K, daily, fmt, greenScore, rp, scoreLabel, summary, dateLong, TODAY } from '../data'
import { Btn, Bar, Gauge, Label, Modal, Num, Segmented, cx } from '../kit'

export default function Manager() {
  const { s } = useStore()
  const sm = summary(s)
  const days = daily(s)
  const [report, setReport] = useState(false)
  const saved = sm.kgAll * 350 // asumsi biaya angkut ke TPA Rp350/kg

  return (
    <div className="px-4 pb-48 pt-6 sm:px-6 xl:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Label>Langkah 6 · Pengelola kawasan</Label>
          <h1 className="mt-1 text-3xl font-bold">SWK Contoh · 30 hari terakhir</h1>
          <p className="mt-1 text-sm text-mute">Semua angka dihitung langsung dari batch yang tercatat, termasuk batch yang Anda buat di tur.</p>
        </div>
        <div className="flex gap-2">
          <Btn v="ghost" onClick={() => go('/ledger')} icon={<Search size={16} />}>Impact Ledger</Btn>
          <Btn onClick={() => setReport(true)} icon={<Download size={16} />}>Laporan dampak</Btn>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi icon={<Recycle size={16} />} label="Organik Murni terkumpul" v={<Num value={sm.kgPure} />} unit="kg" foot={`dari ${fmt(sm.kgAll)} kg total · target ±3.300`} />
        <Kpi icon={<Leaf size={16} />} label="Batch Murni" v={<Num value={sm.pureRatio * 100} d={1} />} unit="%" foot={`${sm.pureCount} dari ${sm.count} batch · target 85%`} />
        <Kpi icon={<TrendingDown size={16} />} label="Emisi dihindari" v={<Num value={sm.co2} d={2} />} unit="t CO₂e" foot={`${fmt(K.co2PerTon, 2)} t CO₂e per ton organik`} />
        <Kpi icon={<Wallet size={16} />} label="Biaya angkut dihemat" v={<Num value={saved / 1e6} d={2} />} unit="juta" foot="asumsi Rp350/kg ke TPA" accent />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Trend days={days} />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
          <div className="card p-5">
            <div className="flex items-center justify-between"><Label>Kapasitas PDU mitra · minggu ini</Label><span className="rounded-full bg-murni/10 px-2 py-0.5 text-[11px] font-bold text-murni">Aman</span></div>
            <div className="mt-3"><Gauge value={0.78} label="AD-02 terpakai" /></div>
            <div className="mt-3 grid grid-cols-3 text-center text-[12px]">
              <div><div className="text-mute">Masuk</div><div className="font-semibold">1.560 kg</div></div>
              <div><div className="text-mute">Sisa</div><div className="font-semibold">440 kg</div></div>
              <div><div className="text-mute">Kapasitas</div><div className="font-semibold">{fmt(K.pduCapacityKg)} kg</div></div>
            </div>
          </div>
          <Fleet />
        </div>
      </div>

      <Leaderboard />

      <Modal open={report} onClose={() => setReport(false)} wide title="Laporan dampak">
        <Report />
      </Modal>
    </div>
  )
}

function Kpi({ icon, label, v, unit, foot, accent }: { icon: React.ReactNode; label: string; v: React.ReactNode; unit: string; foot: string; accent?: boolean }) {
  return (
    <div className={cx('card p-4 sm:p-5', accent && 'border-l-4 border-l-amber')}>
      <div className="flex items-start justify-between gap-2 text-mute"><Label>{label}</Label>{icon}</div>
      <div className="mt-3 flex items-baseline gap-1.5"><span className="font-display text-[30px] font-bold leading-none sm:text-[34px]">{v}</span><span className="text-sm font-semibold text-mute">{unit}</span></div>
      <div className="mt-2 text-[12px] text-mute">{foot}</div>
    </div>
  )
}

function Trend({ days }: { days: ReturnType<typeof daily> }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 720, H = 240, pl = 36, pr = 36, pt = 16, pb = 28
  const maxKg = Math.ceil(Math.max(...days.map((x) => x.kg)) / 50) * 50 || 50
  const maxC = Math.ceil(Math.max(...days.map((x) => x.contam)) / 10) * 10 + 10
  const bw = (W - pl - pr) / days.length
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / maxKg)
  const yc = (v: number) => pt + (H - pt - pb) * (1 - v / maxC)
  const op = days.map((d, i) => ({ ...d, i })).filter((d) => d.n > 0)
  const line = op.map((d, k) => `${k ? 'L' : 'M'}${pl + d.i * bw + bw / 2} ${yc(d.contam)}`).join(' ')
  const h = hover != null ? days[hover] : null
  const avg = op.reduce((a, d) => a + d.contam, 0) / op.length

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-display text-lg font-semibold">Volume harian vs kontaminasi</div>
          <div className="text-[12.5px] text-mute">Edukasi pemilahan menurunkan batch non-Murni dari minggu ke minggu</div>
        </div>
        <div className="flex items-center gap-4 text-[12px] text-mute">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-forest" />Volume (kg)</span>
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-tolak" />Non-Murni (%)</span>
        </div>
      </div>
      <div className="relative mt-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseLeave={() => setHover(null)}>
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line x1={pl} x2={W - pr} y1={y(maxKg * f)} y2={y(maxKg * f)} stroke="#e7e1d1" strokeDasharray={f ? '3 4' : ''} />
              <text x={pl - 6} y={y(maxKg * f) + 4} textAnchor="end" className="fill-mute text-[10px]">{fmt(maxKg * f)}</text>
              <text x={W - pr + 6} y={yc(maxC * f) + 4} className="fill-tolak/70 text-[10px]">{maxC * f}%</text>
            </g>
          ))}
          {days.map((d, i) => (
            <g key={i} onMouseEnter={() => setHover(i)}>
              <rect x={pl + i * bw} y={pt} width={bw} height={H - pt - pb} fill={hover === i ? 'rgba(31,95,63,.06)' : 'transparent'} />
              {d.n > 0 && (
                <motion.rect
                  x={pl + i * bw + bw * 0.18} width={bw * 0.64} rx={3}
                  initial={{ y: H - pb, height: 0 }} animate={{ y: y(d.kg), height: H - pb - y(d.kg) }} transition={{ delay: i * 0.015, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  fill={i === days.length - 1 ? '#9ed75b' : '#1f5f3f'} opacity={hover == null || hover === i ? 1 : 0.55}
                />
              )}
              {((i % 7 === 0 && i < days.length - 3) || i === days.length - 1) &&<text x={pl + i * bw + bw / 2} y={H - 8} textAnchor="middle" className="fill-mute text-[10px]">{d.date.getDate()}/{d.date.getMonth() + 1}</text>}
            </g>
          ))}
          <motion.path d={line} fill="none" stroke="#c62828" strokeWidth={2} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 0.3 }} />
          {op.map((d) => <circle key={d.i} cx={pl + d.i * bw + bw / 2} cy={yc(d.contam)} r={hover === d.i ? 4 : 2} fill="#c62828" />)}
        </svg>
        {h && hover != null && (
          <div className="pointer-events-none absolute top-2 rounded-xl bg-night px-3 py-2 text-[12px] text-white shadow-lg" style={{ left: `clamp(0px, calc(${((pl + hover * bw + bw / 2) / W) * 100}% - 70px), calc(100% - 150px))` }}>
            <div className="font-semibold">{h.date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}{hover === days.length - 1 && ' · hari ini'}</div>
            {h.n ? <><div className="tnum">{fmt(h.kg, 1)} kg · {h.n} batch</div><div className="tnum text-white/60">Non-Murni {fmt(h.contam, 1)}%</div></> : <div className="text-white/60">Minggu · tidak beroperasi</div>}
          </div>
        )}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-4 text-[12.5px]">
        <div><div className="text-mute">Puncak harian</div><div className="font-display text-lg font-bold">{fmt(Math.max(...days.map((d) => d.kg)), 1)} kg</div></div>
        <div><div className="text-mute">Rata-rata non-Murni</div><div className="font-display text-lg font-bold">{fmt(avg, 1)}%</div></div>
        <div><div className="text-mute">Minggu terakhir</div><div className="font-display text-lg font-bold text-murni">{fmt(op.slice(-6).reduce((a, d) => a + d.contam, 0) / 6, 1)}%</div></div>
      </div>
    </div>
  )
}

function Fleet() {
  return (
    <div className="card p-5">
      <Label>Armada E-Trike</Label>
      <div className="mt-3 space-y-2.5">
        {[['#01', 'Pak Joko', 'Rute siang · aktif', 0.88, true], ['#02', 'Mas Andi', 'Standby sesi sore 18:00', 0.96, false]].map(([id, n, st, bat, on]) => (
          <div key={id as string} className="flex items-center gap-3 rounded-xl bg-cream p-3">
            <span className={cx('grid h-9 w-9 place-items-center rounded-lg', on ? 'bg-forest text-white' : 'bg-ink/5 text-mute')}><Truck size={16} /></span>
            <div className="min-w-0 flex-1"><div className="text-[13px] font-semibold">E-Trike {id} · {n}</div><div className="text-[12px] text-mute">{st}</div></div>
            <span className="flex items-center gap-1 text-[12px] font-semibold tnum text-mute"><Battery size={14} />{Math.round((bat as number) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

type Sort = 'score' | 'kg' | 'purity'
function Leaderboard() {
  const { s } = useStore()
  const [sort, setSort] = useState<Sort>('score')
  const [q, setQ] = useState('')
  const [all, setAll] = useState(false)
  const rows = useMemo(() => s.tenants.map((t) => ({ t, g: greenScore(t, s.batches) }))
    .sort((a, b) => (sort === 'score' ? b.g.score - a.g.score : sort === 'kg' ? b.g.kg - a.g.kg : b.g.purity - a.g.purity)), [s.tenants, s.batches, sort])
  const list = rows.filter((r) => !q || r.t.name.toLowerCase().includes(q.toLowerCase())).slice(0, all || q ? 25 : 8)

  return (
    <div className="card mt-5 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <div className="font-display text-lg font-semibold">Peringkat tenant · Green Performance Score</div>
          <div className="text-[12.5px] text-mute">50% rasio Murni · 30% kebersihan wadah · 20% kepatuhan jadwal</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-9 items-center gap-2 rounded-xl bg-cream px-3 text-sm ring-1 ring-line focus-within:ring-forest/40">
            <Search size={14} className="text-mute" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari kios" className="w-28 bg-transparent outline-none placeholder:text-mute" />
          </label>
          <Segmented value={sort} onChange={setSort} items={[['score', 'Skor'], ['kg', 'Volume'], ['purity', '% Murni']]} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-[11px] font-semibold uppercase tracking-[0.1em] text-mute">
            <tr className="border-b border-line"><th className="px-5 py-3 w-12">#</th><th className="py-3">Tenant</th><th className="py-3 text-right">Volume</th><th className="py-3 pl-8 w-48">% Murni</th><th className="py-3 text-right">Skor</th><th className="px-5 py-3 text-right">Poin</th></tr>
          </thead>
          <tbody>
            {list.map((r) => {
              const rank = rows.indexOf(r) + 1
              return (
                <motion.tr layout key={r.t.id} className={cx('border-b border-line/70 last:border-0', r.t.id === 't07' && 'bg-lime/10')}>
                  <td className="px-5 py-3"><span className={cx('grid h-7 w-7 place-items-center rounded-full text-[12px] font-bold', rank <= 3 ? 'bg-amber/30 text-[#6b5000]' : 'bg-ink/5 text-mute')}>{rank}</span></td>
                  <td className="py-3"><div className="font-semibold">{r.t.name}</div><div className="text-[12px] text-mute">{r.t.kios} · {r.t.menu}</div></td>
                  <td className="py-3 text-right font-semibold tnum">{fmt(r.g.kg, 1)} kg</td>
                  <td className="py-3 pl-8"><div className="flex items-center gap-2"><div className="flex-1"><Bar value={r.g.purity / 100} color={r.g.purity >= 85 ? 'bg-murni' : 'bg-pilah'} h="h-1.5" /></div><span className="w-11 text-right text-[12.5px] font-semibold tnum">{fmt(r.g.purity)}%</span></div></td>
                  <td className="py-3 text-right"><div className="font-display text-base font-bold tnum">{r.g.score}</div><div className={cx('text-[11px]', r.g.score >= 78 ? 'text-murni' : 'text-[#9a6400]')}>{scoreLabel(r.g.score)}</div></td>
                  <td className="px-5 py-3 text-right font-semibold tnum">{fmt(r.t.points)}</td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {!q && <button onClick={() => setAll(!all)} className="flex w-full items-center justify-center gap-1.5 border-t border-line py-3 text-[13px] font-semibold text-forest hover:bg-cream"><ArrowUpDown size={14} />{all ? 'Tampilkan 8 teratas' : 'Tampilkan ke-25 tenant'}</button>}
    </div>
  )
}

function Report() {
  const { s, d } = useStore()
  const sm = summary(s)
  const top = s.tenants.map((t) => ({ t, g: greenScore(t, s.batches) })).sort((a, b) => b.g.score - a.g.score).slice(0, 3)
  return (
    <div className="print-area">
      <div className="flex items-start justify-between gap-4 bg-night px-8 pb-7 pt-8 text-white">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-lime">Laporan dampak sirkular</div>
          <h2 className="mt-1 text-3xl font-bold">SWK Contoh · 30 hari</h2>
          <div className="mt-1 text-sm text-white/55">Periode s.d. {dateLong(TODAY + 'T12:00:00+07:00')} · format pendukung UI GreenMetric / ESG</div>
        </div>
        <img src="/kv/logo-wide.webp" alt="OC-Life" className="h-10 w-auto" />
      </div>
      <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
        {[
          ['Organik Murni', fmt(sm.kgPure / 1000, 2) + ' t', <Recycle size={16} />],
          ['CO₂e dihindari', fmt(sm.co2, 2) + ' t', <Leaf size={16} />],
          ['Biogas', fmt(sm.biogas) + ' m³', <Flame size={16} />],
          ['Bioslurry', fmt(sm.slurry) + ' L', <Wallet size={16} />],
        ].map(([a, b, i]) => (
          <div key={a as string} className="bg-paper p-5"><div className="flex items-center gap-1.5 text-mute">{i}<span className="text-[11px] font-semibold uppercase tracking-[0.1em]">{a}</span></div><div className="mt-2 font-display text-2xl font-bold tnum">{b}</div></div>
        ))}
      </div>
      <div className="grid gap-6 p-8 sm:grid-cols-2">
        <div>
          <Label>Kinerja operasional</Label>
          <dl className="mt-3 divide-y divide-line text-sm">
            {[['Total batch tercatat', fmt(sm.count)], ['Rasio batch Murni', fmt(sm.pureRatio * 100, 1) + '%'], ['Tenant berpartisipasi', '25 / 25'], ['Rata-rata durasi pencatatan', '< 60 detik'], ['Nilai bioslurry', rp(sm.slurryRp)], ['Setara refill LPG 3 kg (65% kas)', fmt(sm.lpg) + ' tabung']].map(([a, b]) => (
              <div key={a} className="flex justify-between py-2.5"><dt className="text-mute">{a}</dt><dd className="font-semibold tnum">{b}</dd></div>
            ))}
          </dl>
        </div>
        <div>
          <Label>Tenant teladan</Label>
          <div className="mt-3 space-y-2">
            {top.map((r, i) => (
              <div key={r.t.id} className="flex items-center gap-3 rounded-xl bg-cream p-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-amber/30 font-bold text-[#6b5000]">{i + 1}</span>
                <div className="flex-1"><div className="text-sm font-semibold">{r.t.name}</div><div className="text-[12px] text-mute">{fmt(r.g.purity)}% Murni · {fmt(r.g.kg, 1)} kg</div></div>
                <span className="font-display text-lg font-bold">{r.g.score}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-mute">Metodologi: biogas {fmt(K.biogasPerKg, 1)} m³/kg; bioslurry 1 L per {fmt(K.kgPerSlurryL, 1)} kg; faktor emisi ±{fmt(K.co2PerTon, 2)} t CO₂e/t organik yang dialihkan dari TPA. Setiap angka dapat ditelusuri ke batch ID di Impact Ledger.</p>
        </div>
      </div>
      <div className="no-print flex flex-wrap justify-end gap-2 border-t border-line px-8 py-5">
        <Btn v="ghost" icon={<ArrowRight size={16} />} onClick={() => { d({ t: 'mark', step: 6 }); go('/ledger') }}>Telusuri di ledger</Btn>
        <Btn icon={<Printer size={16} />} onClick={() => window.print()}>Cetak / simpan PDF</Btn>
      </div>
    </div>
  )
}
