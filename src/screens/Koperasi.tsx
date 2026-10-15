import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ScanLine, Search, Check, X, AlertTriangle, Flame, Receipt, Package } from 'lucide-react'
import { useStore, useToast } from '../store'
import { dateShort, time, type Voucher } from '../data'
import { Btn, Label, Mono, cx } from '../kit'
import { DeviceStage, EventList, SidePanel } from '../Shell'

type Result = { kind: 'valid' | 'used' | 'none' | 'expired'; v?: Voucher } | null

export default function Koperasi() {
  const { s, d } = useStore()
  const { push } = useToast()
  const pre = new URLSearchParams(location.hash.split('?')[1] ?? '').get('c') ?? ''
  const [code, setCode] = useState(pre)
  const [res, setRes] = useState<Result>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<Voucher | null>(null)
  const active = s.vouchers.filter((v) => v.status === 'aktif')
  const redeemedToday = s.vouchers.filter((v) => v.redeemedAt?.startsWith('2026-10-10')).length
  const quota = 20

  const check = (c = code) => {
    const k = c.trim().toUpperCase()
    if (!k) return
    setBusy(true); setDone(null)
    setTimeout(() => {
      const v = s.vouchers.find((x) => x.code === k)
      setRes(!v ? { kind: 'none' } : v.status === 'ditukar' ? { kind: 'used', v } : new Date(v.expires) < new Date('2026-10-10') ? { kind: 'expired', v } : { kind: 'valid', v })
      setBusy(false)
    }, 500)
  }
  useEffect(() => { if (pre) check(pre) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const scan = () => {
    const v = active[0]
    if (!v) { push({ title: 'Tidak ada QR di depan kamera', desc: 'Belum ada e-voucher aktif untuk dipindai.', tone: 'warn' }); return }
    setCode(v.code); check(v.code)
  }
  const redeem = () => {
    if (res?.kind !== 'valid' || !res.v) return
    d({ t: 'useVoucher', code: res.v.code, cashier: 'Slamet Riyadi' })
    setDone(res.v); setRes(null)
    push({ title: 'Voucher ditukar', desc: '1 tabung LPG 3 kg diserahkan.', tone: 'ok' })
  }
  const tn = (id: string) => s.tenants.find((t) => t.id === id)!

  return (
    <DeviceStage side={
      <SidePanel photo="/kv/koperasi.webp" eyebrow="Langkah 5 · Koperasi SWK" title="Satu voucher, satu tabung, tidak bisa diklaim ulang." body="Koperasi memindai QR e-voucher tenant. Sistem memeriksa keaslian, masa berlaku, dan status pemakaian sebelum tabung LPG 3 kg diserahkan. Coba validasi voucher yang sama dua kali untuk melihat pencegahan klaim ganda.">
        <div className="card p-5"><Label>Aktivitas terbaru</Label><div className="mt-3"><EventList limit={6} /></div></div>
      </SidePanel>
    }>
      <div className="px-4 pb-10 pt-2">
        <div className="flex items-center gap-3 pb-4">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-forest text-white"><Receipt size={20} /></div>
          <div className="min-w-0 flex-1"><div className="text-[12px] text-mute">Koperasi SWK Makmur Mandiri</div><div className="font-display text-[17px] font-semibold">Loket penukaran 02</div></div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-[18px] bg-paper p-3.5 ring-1 ring-line"><div className="text-[11.5px] text-mute">Stok tabung hari ini</div><div className="font-display text-xl font-bold tnum">{quota - redeemedToday}<span className="text-sm font-semibold text-mute"> / {quota}</span></div></div>
          <div className="rounded-[18px] bg-paper p-3.5 ring-1 ring-line"><div className="text-[11.5px] text-mute">Ditukar hari ini</div><div className="font-display text-xl font-bold tnum">{redeemedToday}<span className="text-sm font-semibold text-mute"> voucher</span></div></div>
        </div>

        <div className="mt-3 rounded-[22px] bg-paper p-4 ring-1 ring-line">
          <div className="font-display text-[15px] font-semibold">Validasi e-voucher</div>
          <form onSubmit={(e) => { e.preventDefault(); check() }} className="mt-3 flex h-12 items-center gap-2 rounded-xl bg-cream px-3 ring-[1.5px] ring-[#d5cfbd] focus-within:ring-forest">
            <input value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setRes(null) }} placeholder="LPG3-SWK01-XXXX" className="min-w-0 flex-1 bg-transparent font-mono text-[15px] font-semibold uppercase outline-none placeholder:font-normal placeholder:text-mute/70" aria-label="Kode voucher" />
            {code && <button type="button" onClick={() => { setCode(''); setRes(null) }} aria-label="Hapus" className="text-mute"><X size={16} /></button>}
          </form>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <Btn v="quiet" icon={<ScanLine size={16} />} onClick={scan}>Scan QR</Btn>
            <Btn icon={<Search size={16} />} loading={busy} disabled={!code} onClick={() => check()}>Cek kode</Btn>
          </div>
          {active.length > 0 && !res && !done && (
            <div className="mt-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mute">Voucher aktif (simulasi)</div>
              <div className="no-scrollbar mt-1.5 flex gap-1.5 overflow-x-auto">
                {active.map((v) => <button key={v.code} onClick={() => { setCode(v.code); check(v.code) }} className="shrink-0 rounded-full bg-amber/20 px-3 py-1.5 font-mono text-[11.5px] font-semibold text-[#6b5000]">{v.code.slice(-4)} · {tn(v.tenantId).name.split(' ').slice(-2).join(' ')}</button>)}
              </div>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {res && (
            <motion.div key={res.kind + (res.v?.code ?? '')} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3">
              {res.kind === 'valid' && res.v && (
                <div className="overflow-hidden rounded-[22px] bg-paper ring-2 ring-murni/40">
                  <div className="flex items-center gap-2 bg-murni px-4 py-3 font-semibold text-white"><Check size={18} strokeWidth={3} /> Valid · siap ditukar</div>
                  <div className="space-y-2 p-4 text-[13px]">
                    {[['Penerima', tn(res.v.tenantId).name + ' · ' + tn(res.v.tenantId).kios], ['Hadiah', '1 refill LPG 3 kg'], ['Diterbitkan', dateShort(res.v.createdAt) + ', ' + time(res.v.createdAt)], ['Berlaku s.d.', dateShort(res.v.expires) + ' 2026'], ['Potong poin', res.v.cost + ' poin']].map(([a, b]) => (
                      <div key={a} className="flex justify-between gap-3"><span className="text-mute">{a}</span><span className="text-right font-semibold">{b}</span></div>
                    ))}
                    <Btn size="lg" className="mt-2 w-full" icon={<Flame size={18} />} onClick={redeem}>Serahkan tabung & tandai ditukar</Btn>
                  </div>
                </div>
              )}
              {res.kind === 'used' && res.v && (
                <div className="rounded-[22px] bg-[#ffebee] p-4 ring-2 ring-tolak/30">
                  <div className="flex items-center gap-2 font-semibold text-tolak"><AlertTriangle size={18} /> Sudah ditukar. Klaim ganda dicegah.</div>
                  <p className="mt-2 text-[13px] text-ink/75">Voucher <Mono>{res.v.code}</Mono> dipakai {dateShort(res.v.redeemedAt!)} pukul {time(res.v.redeemedAt!)} oleh kasir {res.v.cashier}. Jangan serahkan tabung.</p>
                </div>
              )}
              {res.kind === 'none' && (
                <div className="rounded-[22px] bg-[#fff6dc] p-4 ring-2 ring-pilah/40">
                  <div className="flex items-center gap-2 font-semibold text-[#8a5a00]"><AlertTriangle size={18} /> Kode tidak ditemukan</div>
                  <p className="mt-1 text-[13px] text-ink/75">Periksa ejaan, atau minta tenant menampilkan QR dari aplikasinya.</p>
                </div>
              )}
              {res.kind === 'expired' && <div className="rounded-[22px] bg-[#fff6dc] p-4 text-[13px] ring-2 ring-pilah/40"><b>Voucher kedaluwarsa.</b> Poin dikembalikan otomatis ke tenant.</div>}
            </motion.div>
          )}
          {done && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="mt-3 rounded-[22px] bg-night p-5 text-white">
              <div className="flex items-center gap-3">
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }} className="grid h-11 w-11 place-items-center rounded-full bg-lime text-night"><Package size={20} /></motion.span>
                <div><div className="font-display text-lg font-semibold">Tabung diserahkan</div><div className="text-[12.5px] text-white/55">{tn(done.tenantId).name} · <Mono>{done.code}</Mono></div></div>
              </div>
              <p className="mt-3 text-[12.5px] text-white/55">Status voucher kini <b className="text-white">Ditukar</b>. Coba cek kode yang sama sekali lagi untuk melihat pencegahan klaim ganda.</p>
              <button onClick={() => { setCode(done.code); check(done.code) }} className="mt-3 text-[13px] font-semibold text-lime">Cek ulang kode ini →</button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-5">
          <Label className="px-1">Riwayat penukaran</Label>
          <div className="mt-2 space-y-1.5">
            {s.vouchers.filter((v) => v.status === 'ditukar').sort((a, b) => b.redeemedAt!.localeCompare(a.redeemedAt!)).map((v) => (
              <div key={v.code} className="flex items-center gap-3 rounded-[16px] bg-paper p-3 ring-1 ring-line">
                <span className="w-12 font-mono text-[12px] text-mute">{time(v.redeemedAt!)}</span>
                <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-semibold">{tn(v.tenantId).name}</div><Mono className="text-[11px] text-mute">{v.code}</Mono></div>
                <span className={cx('rounded-full bg-murni/10 px-2 py-0.5 text-[11px] font-bold text-murni')}>Selesai</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DeviceStage>
  )
}
