import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Search, Store, Truck, ShieldCheck, Factory, Flame, Coins, Ticket, Lock, Copy, ArrowDown, Fingerprint, Check } from 'lucide-react'
import { useStore, useToast, go } from '../store'
import { CHECKS, K, STATUS_META, dateShort, fmt, rp, summary, time, type Batch } from '../data'
import { Btn, Label, Mono, Num, StatusPill, cx } from '../kit'

async function sha(text: string) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch { return 'n/a' }
}

export default function Ledger({ id }: { id?: string }) {
  const { s, d } = useStore()
  const { push } = useToast()
  const fallback = s.demoBatch ?? [...s.batches].sort((a, b) => b.at.localeCompare(a.at))[0]?.id
  const cur = id && s.batches.some((b) => b.id === id) ? id : fallback
  const b = s.batches.find((x) => x.id === cur)
  const [q, setQ] = useState('')
  const [focus, setFocus] = useState(false)
  const [hash, setHash] = useState('')
  useEffect(() => { if (b) sha(JSON.stringify(b)).then(setHash) }, [b])
  useEffect(() => { if (b && b.id === s.demoBatch) d({ t: 'mark', step: 6 }) }, [b, s.demoBatch, d])

  const sugg = useMemo(() => {
    const all = [...s.batches].sort((a, b) => b.at.localeCompare(a.at))
    const k = q.trim().toLowerCase()
    return (k ? all.filter((x) => x.id.toLowerCase().includes(k) || s.tenants.find((t) => t.id === x.tenantId)!.name.toLowerCase().includes(k)) : all).slice(0, 6)
  }, [q, s.batches, s.tenants])

  if (!b) return <div className="p-10 text-center text-mute">Belum ada batch.</div>
  const t = s.tenants.find((x) => x.id === b.tenantId)!

  return (
    <div className="px-4 pb-48 pt-6 sm:px-6 xl:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Label>Langkah 6 · Circular Impact Ledger</Label>
          <h1 className="mt-1 text-3xl font-bold">Lacak balak per batch</h1>
          <p className="mt-1 text-sm text-mute">Setiap titik punya waktu, aktor, dan bukti. Cari batch ID mana pun dari 30 hari terakhir.</p>
        </div>
        <div className="relative w-full max-w-md">
          <label className="flex h-12 items-center gap-2.5 rounded-2xl bg-paper px-4 ring-1 ring-line focus-within:ring-2 focus-within:ring-forest/40">
            <Search size={17} className="text-mute" />
            <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 150)} placeholder="OCL-SWK01-… atau nama tenant" className="min-w-0 flex-1 bg-transparent font-mono text-sm outline-none placeholder:font-sans placeholder:text-mute" />
          </label>
          {focus && (
            <div className="absolute inset-x-0 top-14 z-30 overflow-hidden rounded-2xl bg-paper shadow-xl ring-1 ring-line">
              {sugg.length ? sugg.map((x) => (
                <button key={x.id} onMouseDown={() => { go('/ledger/' + x.id); setQ('') }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-cream">
                  <Mono className="flex-1 text-[12.5px] font-semibold">{x.id}</Mono>
                  <span className="truncate text-[12px] text-mute">{s.tenants.find((tt) => tt.id === x.tenantId)!.name}</span>
                  <StatusPill s={x.status} />
                </button>
              )) : <div className="px-4 py-4 text-sm text-mute">Tidak ada batch yang cocok.</div>}
            </div>
          )}
        </div>
      </div>

      {/* Identitas batch */}
      <div className="card mt-6 flex flex-wrap items-center gap-x-8 gap-y-4 p-5">
        <div className="min-w-0">
          <div className="text-[11px] text-mute">Batch ID</div>
          <div className="flex items-center gap-2"><Mono className="text-lg font-semibold">{b.id}</Mono>
            <button onClick={() => { navigator.clipboard?.writeText(b.id).catch(() => {}); push({ title: 'Batch ID disalin', tone: 'info' }) }} className="text-mute hover:text-ink" aria-label="Salin"><Copy size={15} /></button></div>
        </div>
        <div><div className="text-[11px] text-mute">Tenant</div><div className="font-semibold">{t.name} · {t.kios}</div></div>
        <div><div className="text-[11px] text-mute">Status</div><StatusPill s={b.status} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] text-mute"><Fingerprint size={12} /> Sidik SHA-256 catatan</div>
          <Mono className="block truncate text-[12px] text-ink/70">{hash || '…'}</Mono>
        </div>
        {b.id === s.demoBatch && <span className="rounded-full bg-lime px-3 py-1 text-[12px] font-bold text-night">Batch dari tur Anda</span>}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <Timeline b={b} />
        <Subsidy b={b} />
      </div>

      <Cumulative />
    </div>
  )
}

type Node = { icon: typeof Store; title: string; actor: string; at?: string; state: 'done' | 'wait' | 'stop'; body?: React.ReactNode }

function Timeline({ b }: { b: Batch }) {
  const { s } = useStore()
  const t = s.tenants.find((x) => x.id === b.tenantId)!
  const prepAt = new Date(new Date(b.at).getTime() - 35 * 60000).toISOString()
  const voucher = s.vouchers.filter((v) => v.tenantId === b.tenantId && v.createdAt >= b.at).sort((a, c) => a.createdAt.localeCompare(c.createdAt))[0]
  const murni = b.status === 'murni'
  const ok = b.pdu?.state === 'diterima'

  const nodes: Node[] = [
    { icon: Store, title: 'Tenant memilah', actor: `${t.owner} · ${t.name}`, at: prepAt, state: 'done', body: <Facts items={[['Wadah', `#${t.kios.slice(-2)} · 20 L ber-QR`], ['Segel', 'QR-BIN-SWK01-' + t.kios.slice(-2)]]} /> },
    { icon: Truck, title: 'Pickup & penimbangan', actor: `${b.officer} · E-Trike #01`, at: b.at, state: 'done', body: <div className="flex gap-3"><img src={b.photo} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover" /><Facts items={[['Berat', fmt(b.kg, 1) + ' kg (timbangan BT)'], ['Durasi', b.dur + ' detik'], ['Sinkron', b.synced ? 'Ya' : 'Menunggu']]} /></div> },
    { icon: ShieldCheck, title: 'Quality gate', actor: 'Sistem OC-Life', at: b.at, state: murni ? 'done' : 'stop', body: <div><StatusPill s={b.status} /><div className="mt-1.5 text-[12.5px] text-mute">{b.checks.length ? 'Ditemukan: ' + b.checks.map((c) => CHECKS.find((x) => x.id === c)!.label.toLowerCase()).join(', ') : 'Checklist kontaminan kosong · 0 temuan'}. {!murni && STATUS_META[b.status].note}</div></div> },
  ]
  if (murni) {
    nodes.push(
      { icon: Factory, title: 'Diterima PDU', actor: 'Hendra · Reaktor AD-02', at: b.pdu?.at, state: ok ? 'done' : b.pdu ? 'stop' : 'wait', body: b.pdu ? (ok ? <Facts items={[['Unit', 'AD-02 mesofilik'], ['Suhu / pH', '37,2°C / 7,18']]} /> : <div className="text-[12.5px] text-tolak">Ditolak: {b.pdu.reason}</div>) : <div className="text-[12.5px] text-mute">Menunggu konfirmasi operator.</div> },
      { icon: Flame, title: 'Biogas & bioslurry', actor: 'Digester anaerob', at: b.pdu?.at, state: ok ? 'done' : 'wait', body: ok ? <Facts items={[['Biogas', fmt(b.pdu!.biogas, 2) + ' m³'], ['Bioslurry', fmt(b.pdu!.slurry, 1) + ' L · ' + rp(b.pdu!.slurry * K.slurryPrice)], ['CO₂e dihindari', fmt(b.kg * K.co2PerTon, 2) + ' kg']]} /> : undefined },
      { icon: Coins, title: 'Poin Sirkular', actor: 'Dompet ' + t.name, at: b.pdu?.at, state: ok ? 'done' : 'wait', body: ok ? <div className="text-[13px]"><b className="text-[#6b5000]">+{b.points} poin</b> · {fmt(K.pointsPerKg, 1)} poin/kg Murni</div> : undefined },
      { icon: Ticket, title: 'E-voucher LPG 3 kg', actor: 'Koperasi SWK', at: voucher?.redeemedAt ?? voucher?.createdAt, state: voucher?.status === 'ditukar' ? 'done' : 'wait', body: voucher ? <Facts items={[['Kode', voucher.code], ['Status', voucher.status === 'ditukar' ? `Ditukar · ${voucher.cashier}` : 'Aktif, belum ditukar']]} /> : ok ? <div className="text-[12.5px] text-mute">Poin terakumulasi menuju {K.voucherCost} poin.</div> : undefined },
    )
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="font-display text-lg font-semibold">Jejak batch</div>
        <span className="font-mono text-[12px] text-mute">{nodes.filter((n) => n.state === 'done').length}/{nodes.length} titik</span>
      </div>
      <ol className="relative mt-5">
        {nodes.map((n, i) => {
          const I = n.icon
          return (
            <motion.li key={n.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="relative flex gap-4 pb-6 last:pb-0">
              {i < nodes.length - 1 && <span className={cx('absolute left-[19px] top-10 bottom-0 w-0.5', n.state === 'done' && nodes[i + 1].state !== 'wait' ? 'bg-forest' : 'border-l-2 border-dashed border-line bg-transparent')} />}
              <span className={cx('relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full', n.state === 'done' ? 'bg-forest text-white' : n.state === 'stop' ? 'bg-tolak text-white' : 'bg-cream text-mute ring-1 ring-line')}><I size={17} /></span>
              <div className={cx('min-w-0 flex-1 rounded-2xl p-4 ring-1', n.state === 'wait' ? 'ring-dashed bg-transparent ring-line' : 'bg-cream/60 ring-line/70')}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className={cx('font-semibold', n.state === 'wait' && 'text-mute')}>{i + 1}. {n.title}</div>
                  <span className="font-mono text-[11.5px] text-mute">{n.at ? `${dateShort(n.at)} · ${time(n.at)}` : 'menunggu'}</span>
                </div>
                <div className="text-[12px] text-mute">{n.actor}</div>
                {n.body && <div className="mt-2.5">{n.body}</div>}
              </div>
            </motion.li>
          )
        })}
      </ol>
    </div>
  )
}

function Facts({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid flex-1 grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[12.5px]">
      {items.map(([a, v]) => <div key={a} className="contents"><dt className="text-mute">{a}</dt><dd className="font-medium">{v}</dd></div>)}
    </dl>
  )
}

function Subsidy({ b }: { b: Batch }) {
  const { s } = useStore()
  const sm = summary(s)
  const cash = sm.slurryRp
  const redeemed = s.vouchers.filter((v) => v.status === 'ditukar').length
  const mine = b.pdu?.state === 'diterima' ? b.pdu.slurry * K.slurryPrice : 0
  const steps = [
    { k: 'A', title: 'Penjualan bioslurry', sub: `${fmt(sm.slurry)} L × ${rp(K.slurryPrice)} ke Gapoktan`, val: rp(cash), mine: mine ? `batch ini ${rp(mine)}` : undefined },
    { k: 'B', title: 'Kas OC-Life', sub: 'Dialokasikan otomatis', alloc: [['Subsidi LPG via poin', 0.65], ['Operasional kurir & E-Trike', 0.25], ['Edukasi & insentif kios', 0.1]] as [string, number][] },
    { k: 'C', title: 'Poin Sirkular tenant', sub: `${K.voucherCost} poin = 1 refill LPG 3 kg`, val: fmt(sm.lpg) + ' tabung', mine: b.points && b.pdu ? `batch ini +${b.points} poin` : undefined },
    { k: 'D', title: 'LPG ditukar di koperasi', sub: 'Biaya gas dapur tenant turun', val: redeemed + ' voucher' },
  ]
  return (
    <div className="card-dark p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div><div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">Subsidi silang · 30 hari</div><div className="mt-1 font-display text-lg font-semibold">Dari bioslurry ke tabung gas</div></div>
        <Lock size={16} className="text-lime/70" />
      </div>
      <div className="mt-5 space-y-1">
        {steps.map((st, i) => (
          <div key={st.k}>
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.12 }} className="rounded-2xl bg-white/[.05] p-4 ring-1 ring-white/[.07]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-lime font-mono text-[12px] font-bold text-night">{st.k}</span>
                  <div><div className="font-semibold">{st.title}</div><div className="text-[12px] text-white/50">{st.sub}</div></div>
                </div>
                {st.val && <div className="text-right font-display text-lg font-bold text-lime tnum">{st.val}</div>}
              </div>
              {st.alloc && (
                <div className="mt-3 space-y-2">
                  {st.alloc.map(([l, p]) => (
                    <div key={l}>
                      <div className="flex justify-between text-[12px]"><span className="text-white/65">{Math.round(p * 100)}% · {l}</span><span className="font-mono tnum">{rp(cash * p)}</span></div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-lime" initial={{ width: 0 }} animate={{ width: `${p * 100}%` }} transition={{ duration: 1, delay: 0.5 }} /></div>
                    </div>
                  ))}
                </div>
              )}
              {st.mine && <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-amber/20 px-2.5 py-1 text-[11.5px] font-semibold text-amber"><Check size={12} /> {st.mine}</div>}
            </motion.div>
            {i < steps.length - 1 && (
              <div className="flex justify-center py-1">
                <motion.span animate={{ y: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.2 }} className="text-lime/60"><ArrowDown size={16} /></motion.span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Cumulative() {
  const { s } = useStore()
  const sm = summary(s)
  return (
    <div className="mt-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Organik dialihkan', sm.kgPure / 1000, 2, 't', 'dari TPA'],
          ['Emisi dihindari', sm.co2, 2, 't CO₂e', `${fmt(K.co2PerTon, 2)} t/t`],
          ['Biogas', sm.biogas, 0, 'm³', 'energi terbarukan'],
          ['Setara LPG 3 kg', sm.lpg, 0, 'tabung', '65% kas bioslurry'],
        ].map(([l, v, dd, u, f]) => (
          <div key={l as string} className="card p-5">
            <Label>{l}</Label>
            <div className="mt-2.5 flex items-baseline gap-1.5"><span className="font-display text-[32px] font-bold leading-none"><Num value={v as number} d={dd as number} /></span><span className="text-sm font-semibold text-mute">{u}</span></div>
            <div className="mt-1.5 text-[12px] text-mute">{f}</div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-forest p-5 text-white">
        <div><div className="font-display text-lg font-semibold">Audit terbuka</div><div className="text-[13px] text-white/60">Data siap dibagikan ke DLH, pengelola kampus, dan investor ESG.</div></div>
        <Btn v="lime" onClick={() => {
          const blob = new Blob([JSON.stringify({ ringkasan: sm, batch: s.batches.slice(-50) }, null, 2)], { type: 'application/json' })
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'oc-life-ledger.json'; a.click()
        }}>Ekspor JSON</Btn>
      </div>
    </div>
  )
}
