import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  Home as HomeI, Coins, History, Check, X, Truck, QrCode, Clock, Ticket, Copy, ChevronRight, Lightbulb, Leaf, Flame, Info,
} from 'lucide-react'
import { useStore, useToast, newVoucherCode, go } from '../store'
import { K, MAIN_TENANT, STATUS_META, dateShort, fmt, greenScore, scoreLabel, time, type Batch } from '../data'
import { Btn, Bar, Label, Modal, Mono, Num, QR, Ring, StatusPill, cx } from '../kit'
import { DeviceStage, EventList, SidePanel } from '../Shell'

type Tab = 'beranda' | 'poin' | 'riwayat'

export default function Tenant() {
  const { s } = useStore()
  const [tab, setTab] = useState<Tab>(() => (s.tour.on && s.tour.step === 5 ? 'poin' : 'beranda'))
  useEffect(() => { if (s.tour.on && s.tour.step === 5) setTab('poin') }, [s.tour.on, s.tour.step])
  useEffect(() => { document.getElementById('phone-scroll')?.scrollTo({ top: 0 }) }, [tab])

  const side = {
    beranda: { photo: '/kv/pickup.webp', eyebrow: 'Langkah 1 · Sumber', title: 'Pemilahan terjadi di dapur tenant, bukan di TPS.', body: 'Setiap kios punya wadah 20 L ber-QR. QR mengikat setiap kilogram sisa makanan ke satu tenant, sehingga kemurnian bisa diukur dan dihargai per kios.' },
    poin: { photo: '/kv/koperasi.webp', eyebrow: 'Langkah 5 · Insentif', title: 'Poin cair setelah PDU memverifikasi batch.', body: `Hanya batch Murni yang diterima digester yang menghasilkan poin (${fmt(K.pointsPerKg, 1)} poin/kg). ${K.voucherCost} poin ditukar menjadi e-voucher refill LPG 3 kg di Koperasi SWK, didanai dari penjualan bioslurry.` },
    riwayat: { photo: '/kv/hub.webp', eyebrow: 'Transparansi', title: 'Tenant melihat apa yang dilihat pengelola.', body: 'Setiap batch menampilkan hasil quality gate dan tips perbaikan bila Pilah Ulang atau Ditolak, sehingga tenant belajar dari datanya sendiri.' },
  }[tab]

  return (
    <DeviceStage side={<SidePanel {...side}><div className="card p-5"><Label>Aktivitas terbaru</Label><div className="mt-3"><EventList limit={6} /></div></div></SidePanel>}>
      <div className="flex min-h-full flex-col">
        <AppTop />
        <div className="flex-1 px-4 pb-28">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              {tab === 'beranda' && <Beranda toPoin={() => setTab('poin')} />}
              {tab === 'poin' && <Poin />}
              {tab === 'riwayat' && <Riwayat />}
            </motion.div>
          </AnimatePresence>
        </div>
        <BottomNav tab={tab} setTab={setTab} />
      </div>
    </DeviceStage>
  )
}

function AppTop() {
  const { s } = useStore()
  const t = s.tenants.find((x) => x.id === MAIN_TENANT)!
  return (
    <div className="flex items-center gap-3 px-4 pb-3 pt-3">
      <img src="/kv/ic-tenant.webp" alt="" className="h-11 w-11 rounded-2xl bg-[#ece6d6] object-contain p-1" />
      <div className="min-w-0 flex-1">
        <div className="text-[12px] text-mute">{t.kios} · SWK Contoh</div>
        <div className="truncate font-display text-[17px] font-semibold">{t.name}</div>
      </div>
      <div className="rounded-full bg-amber/25 px-3 py-1.5 text-[13px] font-bold text-[#6b5000]"><Num value={t.points} /> <span className="font-semibold">poin</span></div>
    </div>
  )
}

function BottomNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const items: [Tab, string, typeof HomeI][] = [['beranda', 'Wadah', HomeI], ['poin', 'Poin', Coins], ['riwayat', 'Riwayat', History]]
  return (
    <nav className="sticky bottom-0 z-20 mt-auto border-t border-line bg-paper/95 px-6 pb-5 pt-2 backdrop-blur">
      <div className="flex justify-around">
        {items.map(([k, l, I]) => (
          <button key={k} onClick={() => setTab(k)} className={cx('relative flex min-w-16 flex-col items-center gap-1 rounded-xl py-1.5 text-[11.5px] font-semibold transition', tab === k ? 'text-forest' : 'text-mute')}>
            {tab === k && <motion.span layoutId="tnav" className="absolute -top-2 h-[3px] w-8 rounded-full bg-forest" />}
            <I size={21} strokeWidth={tab === k ? 2.4 : 1.8} />
            {l}
          </button>
        ))}
      </div>
    </nav>
  )
}

const PREP = [
  ['Tidak ada plastik, sedotan, atau styrofoam', 'Anorganik membuat batch Ditolak'],
  ['Kuah & minyak sudah ditiriskan', 'Cairan berlebih = Pilah Ulang'],
  ['Tutup wadah terkunci rapat', 'Mencegah bau & lalat saat diangkut'],
]

function Beranda({ toPoin }: { toPoin: () => void }) {
  const { s, d } = useStore()
  const { push } = useToast()
  const [ok, setOk] = useState<boolean[]>(() => (s.binReady ? [true, true, true] : [false, false, false]))
  const t = s.tenants.find((x) => x.id === MAIN_TENANT)!
  const gs = greenScore(t, s.batches)
  const demo = s.batches.find((b) => b.id === s.demoBatch)
  const all = ok.every(Boolean)

  return (
    <div className="space-y-3.5">
      {/* Kartu wadah */}
      <div className="overflow-hidden rounded-[22px] bg-night text-white">
        <div className="flex items-start gap-4 p-4">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">Wadah organik</div>
            <div className="mt-0.5 font-display text-2xl font-semibold">#07 · 20 L</div>
            <div className="mt-1 font-mono text-[11px] text-white/45">QR-BIN-SWK01-07</div>
          </div>
          <div className="h-[74px] w-[74px] rounded-xl bg-white p-2"><QR text="OCL|BIN|SWK01|07" /></div>
        </div>
        <div className="px-4 pb-4">
          <div className="flex justify-between text-[12px] text-white/55"><span>Terisi sesi siang</span><span className="tnum text-white">{s.binReady || demo ? '±75%' : '±62%'}</span></div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-lime" animate={{ width: s.binReady || demo ? '75%' : '62%' }} /></div>
        </div>
        <AnimatePresence mode="wait">
          {demo ? (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 border-t border-white/10 bg-white/[.04] px-4 py-3.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-lime text-night"><Check size={18} strokeWidth={3} /></span>
              <div className="min-w-0 flex-1 text-[13px]">
                <div className="font-semibold">Sudah dijemput · {fmt(demo.kg, 1)} kg</div>
                <div className="text-white/50">{STATUS_META[demo.status].label}{demo.pdu ? ' · diterima PDU' : ' · menunggu verifikasi PDU'}</div>
              </div>
              <button onClick={() => go('/ledger/' + demo.id)} className="text-[12px] font-semibold text-lime">Lacak</button>
            </motion.div>
          ) : s.binReady ? (
            <motion.div key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-white/10 bg-white/[.04] px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className="relative grid h-9 w-9 place-items-center rounded-full bg-lime/15 text-lime"><Truck size={17} /></span>
                <div className="min-w-0 flex-1 text-[13px]">
                  <div className="font-semibold">Pak Joko menuju kios Anda</div>
                  <div className="text-white/50">E-Trike #01 · estimasi 12 menit</div>
                </div>
                <button onClick={() => d({ t: 'binReady', v: false })} className="text-[12px] font-semibold text-white/50 hover:text-white">Batalkan</button>
              </div>
              <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="shimmer absolute inset-0" /><div className="h-full w-1/3 rounded-full bg-lime" /></div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Checklist sebelum menutup wadah */}
      {!demo && (
        <div className="rounded-[22px] bg-paper p-4 ring-1 ring-line">
          <div className="flex items-center justify-between">
            <div className="font-display text-[15px] font-semibold">Sebelum menutup wadah</div>
            <span className="font-mono text-[11px] text-mute">{ok.filter(Boolean).length}/3</span>
          </div>
          <div className="mt-3 space-y-2">
            {PREP.map(([a, b], i) => (
              <button key={a} disabled={s.binReady} onClick={() => setOk((o) => o.map((v, j) => (j === i ? !v : v)))} className={cx('flex w-full items-start gap-3 rounded-2xl p-3 text-left ring-1 transition', ok[i] ? 'bg-[#eef6e9] ring-murni/20' : 'bg-cream ring-transparent hover:ring-line')}>
                <span className={cx('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md transition', ok[i] ? 'bg-forest text-white' : 'ring-2 ring-inset ring-ink/20')}>{ok[i] && <Check size={13} strokeWidth={3} />}</span>
                <span><span className="block text-[13.5px] font-semibold leading-snug">{a}</span><span className="block text-[12px] text-mute">{b}</span></span>
              </button>
            ))}
          </div>
          {!s.binReady && (
            <Btn size="lg" className="mt-4 w-full" disabled={!all} icon={<Truck size={18} />} onClick={() => { d({ t: 'binReady', v: true }); push({ title: 'Wadah siap dijemput', desc: 'Petugas terdekat menerima notifikasi rute.' }) }}>
              Wadah siap dijemput
            </Btn>
          )}
          {!all && !s.binReady && <p className="mt-2 text-center text-[12px] text-mute">Centang ketiga poin untuk mengaktifkan tombol</p>}
        </div>
      )}

      {/* Panduan pilah */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-[20px] bg-paper p-3.5 ring-1 ring-line">
          <div className="flex items-center gap-1.5 text-[13px] font-bold text-murni"><Check size={15} strokeWidth={3} /> Boleh masuk</div>
          <ul className="mt-2 space-y-1 text-[12.5px] text-ink/75">{['Sisa nasi & lauk', 'Sayur, kulit buah', 'Ampas kopi & teh', 'Tulang ikan lunak'].map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
        <div className="rounded-[20px] bg-paper p-3.5 ring-1 ring-line">
          <div className="flex items-center gap-1.5 text-[13px] font-bold text-tolak"><X size={15} strokeWidth={3} /> Jangan masuk</div>
          <ul className="mt-2 space-y-1 text-[12.5px] text-ink/75">{['Plastik & sedotan', 'Tusuk sate, kayu', 'Minyak jelantah', 'Tulang sapi keras'].map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      </div>

      <button onClick={toPoin} className="flex w-full items-center gap-3 rounded-[20px] bg-paper p-4 text-left ring-1 ring-line transition hover:ring-forest/30">
        <Ring value={gs.score / 100} size={52} stroke={6} color="#1f5f3f" track="#ece6d6"><span className="font-display text-sm font-bold">{gs.score}</span></Ring>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] text-mute">Skor Hijau bulan ini</div>
          <div className="font-display text-[15px] font-semibold">{scoreLabel(gs.score)}</div>
        </div>
        <ChevronRight size={18} className="text-mute" />
      </button>
    </div>
  )
}

function Poin() {
  const { s, d } = useStore()
  const { push } = useToast()
  const [confirm, setConfirm] = useState(false)
  const [show, setShow] = useState<string | null>(null)
  const t = s.tenants.find((x) => x.id === MAIN_TENANT)!
  const gs = greenScore(t, s.batches)
  const rank = 1 + s.tenants.filter((x) => greenScore(x, s.batches).score > gs.score).length
  const pending = s.batches.filter((b) => b.tenantId === MAIN_TENANT && b.status === 'murni' && !b.pdu).reduce((a, b) => a + b.points, 0)
  const mine = s.vouchers.filter((v) => v.tenantId === MAIN_TENANT)
  const can = t.points >= K.voucherCost

  const redeem = () => {
    const code = newVoucherCode()
    d({ t: 'redeem', tenantId: MAIN_TENANT, code })
    setConfirm(false)
    setShow(code)
    push({ title: 'E-voucher terbit', desc: `${code} · berlaku 7 hari`, tone: 'ok' })
  }
  const v = mine.find((x) => x.code === show)

  return (
    <div className="space-y-3.5">
      <div className="relative overflow-hidden rounded-[22px] bg-forest p-5 text-white">
        <Leaf className="absolute -right-6 -top-6 text-white/[.06]" size={140} />
        <div className="text-[12px] font-medium text-white/60">Saldo Poin Sirkular</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-display text-[44px] font-bold leading-none"><Num value={t.points} /></span>
          <span className="text-sm text-white/60">poin</span>
        </div>
        {pending > 0 && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[12px]">
            <Clock size={12} /> +{pending} tertunda · menunggu verifikasi PDU
          </div>
        )}
        <div className="mt-5">
          <div className="mb-1.5 flex justify-between text-[12px]">
            <span className="text-white/60">Menuju 1 tabung LPG 3 kg</span>
            <span className="font-semibold tnum">{fmt(Math.min(t.points, K.voucherCost))}/{K.voucherCost}</span>
          </div>
          <Bar value={t.points / K.voucherCost} color="bg-amber" track="bg-white/15" h="h-2.5" />
          <div className="mt-1.5 text-[12px] text-white/55">{can ? 'Poin cukup untuk ditukar sekarang.' : `Kurang ${K.voucherCost - t.points} poin (±${fmt((K.voucherCost - t.points) / K.pointsPerKg, 1)} kg sisa makanan Murni)`}</div>
        </div>
        <Btn v="amber" size="lg" className="mt-4 w-full" disabled={!can} icon={<Flame size={18} />} onClick={() => setConfirm(true)}>
          Tukar {K.voucherCost} poin → LPG 3 kg
        </Btn>
      </div>

      {mine.length > 0 && (
        <div className="space-y-2">
          <Label className="px-1">E-voucher saya</Label>
          {mine.map((x) => (
            <button key={x.code} onClick={() => setShow(x.code)} className="flex w-full items-center gap-3 rounded-[18px] bg-paper p-3.5 text-left ring-1 ring-line transition hover:ring-forest/30">
              <span className={cx('grid h-10 w-10 place-items-center rounded-xl', x.status === 'aktif' ? 'bg-amber/25 text-[#6b5000]' : 'bg-ink/5 text-mute')}><Ticket size={18} /></span>
              <div className="min-w-0 flex-1">
                <Mono className="block text-[13px] font-semibold">{x.code}</Mono>
                <div className="text-[12px] text-mute">{x.status === 'aktif' ? `Aktif · s.d. ${dateShort(x.expires)}` : `Ditukar ${time(x.redeemedAt!)} · ${x.cashier}`}</div>
              </div>
              <span className={cx('rounded-full px-2.5 py-1 text-[11px] font-bold', x.status === 'aktif' ? 'bg-forest text-white' : 'bg-ink/5 text-mute')}>{x.status === 'aktif' ? 'Tampilkan' : 'Selesai'}</span>
            </button>
          ))}
        </div>
      )}

      <div className="rounded-[22px] bg-paper p-4 ring-1 ring-line">
        <div className="flex items-center gap-4">
          <Ring value={gs.score / 100} size={76} stroke={8} color="#1f5f3f" track="#ece6d6">
            <div><div className="font-display text-xl font-bold leading-none">{gs.score}</div><div className="text-[10px] text-mute">/100</div></div>
          </Ring>
          <div>
            <div className="text-[12px] text-mute">Green Performance Score</div>
            <div className="font-display text-lg font-semibold">{scoreLabel(gs.score)}</div>
            <div className="text-[12px] text-mute">Peringkat {rank} dari {s.tenants.length} kios</div>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {[
            ['Rasio batch Murni', gs.purity, '50%'],
            ['Kebersihan wadah', gs.clean, '30%'],
            ['Kepatuhan jadwal', gs.schedule, '20%'],
          ].map(([l, v, w]) => (
            <div key={l as string}>
              <div className="mb-1 flex justify-between text-[12.5px]"><span>{l} <span className="text-mute">· bobot {w}</span></span><span className="font-semibold tnum">{fmt(v as number)}%</span></div>
              <Bar value={(v as number) / 100} />
            </div>
          ))}
        </div>
      </div>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Konfirmasi penukaran">
        <div className="p-6">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber/25 text-[#6b5000]"><Flame size={22} /></div>
          <h3 className="mt-4 text-xl font-semibold">Tukar {K.voucherCost} poin?</h3>
          <div className="mt-4 divide-y divide-line rounded-2xl bg-cream text-sm">
            {[['Saldo sekarang', fmt(t.points) + ' poin'], ['Dipotong', '−' + K.voucherCost + ' poin'], ['Sisa saldo', fmt(t.points - K.voucherCost) + ' poin'], ['Hadiah', '1 refill LPG 3 kg'], ['Berlaku', '7 hari · Koperasi SWK']].map(([a, b]) => (
              <div key={a} className="flex justify-between px-4 py-2.5"><span className="text-mute">{a}</span><span className="font-semibold tnum">{b}</span></div>
            ))}
          </div>
          <p className="mt-3 flex gap-2 text-[12px] text-mute"><Info size={14} className="mt-0.5 shrink-0" />Voucher hanya dapat ditukar satu kali. Poin tidak dapat dikembalikan setelah voucher dipakai.</p>
          <div className="mt-5 flex gap-2">
            <Btn v="quiet" className="flex-1" onClick={() => setConfirm(false)}>Batal</Btn>
            <Btn v="primary" className="flex-1" onClick={redeem}>Tukar sekarang</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={!!v} onClose={() => setShow(null)} title="E-voucher">
        {v && <VoucherCard code={v.code} expires={v.expires} used={v.status === 'ditukar'} />}
      </Modal>
    </div>
  )
}

function VoucherCard({ code, expires, used }: { code: string; expires: string; used: boolean }) {
  const { push } = useToast()
  const { s } = useStore()
  return (
    <div>
      <div className="relative overflow-hidden rounded-t-3xl bg-forest px-6 pb-12 pt-7 text-white">
        <img src="/kv/koperasi.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="relative">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-lime">E-voucher Poin Sirkular</div>
          <div className="mt-1 font-display text-2xl font-semibold">1 Refill LPG 3 kg</div>
          <div className="text-sm text-white/60">Koperasi SWK Makmur Mandiri</div>
        </div>
      </div>
      <div className="relative -mt-8 mx-5 rounded-2xl bg-paper p-5 shadow-lg ring-1 ring-line">
        <div className={cx('relative mx-auto h-48 w-48', used && 'opacity-20')}><QR text={`OCL|VCH|${code}`} /></div>
        {used && <div className="absolute inset-x-0 top-20 text-center font-display text-xl font-bold text-tolak">SUDAH DITUKAR</div>}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-cream px-3 py-2.5">
          <Mono className="text-[15px] font-semibold">{code}</Mono>
          <button onClick={() => { navigator.clipboard?.writeText(code).catch(() => {}); push({ title: 'Kode disalin', tone: 'info' }) }} className="inline-flex items-center gap-1 text-[12px] font-semibold text-forest"><Copy size={13} /> Salin</button>
        </div>
        <div className="mt-3 flex justify-between text-[12px] text-mute"><span>Berlaku s.d.</span><span className="font-semibold text-ink">{dateShort(expires)} 2026</span></div>
      </div>
      <div className="p-5 pt-4">
        {!used ? (
          <>
            <p className="text-center text-[12.5px] text-mute">Tunjukkan QR ini ke petugas loket Koperasi SWK.</p>
            {s.tour.on && <Btn v="primary" className="mt-3 w-full" icon={<QrCode size={16} />} onClick={() => go('/koperasi?c=' + code)}>Buka layar Koperasi (validasi)</Btn>}
          </>
        ) : <p className="text-center text-[12.5px] text-mute">Voucher ini sudah dipakai dan tidak dapat digunakan lagi.</p>}
      </div>
    </div>
  )
}

function Riwayat() {
  const { s } = useStore()
  const mine = s.batches.filter((b) => b.tenantId === MAIN_TENANT).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 14)
  const [open, setOpen] = useState<Batch | null>(null)
  return (
    <div className="space-y-2">
      <Label className="px-1">Riwayat batch · 30 hari</Label>
      {mine.map((b) => (
        <button key={b.id} onClick={() => setOpen(b)} className="flex w-full items-center gap-3 rounded-[18px] bg-paper p-3.5 text-left ring-1 ring-line transition hover:ring-forest/30">
          <div className="min-w-0 flex-1">
            <Mono className="block truncate text-[12.5px] font-semibold">{b.id}</Mono>
            <div className="text-[12px] text-mute">{dateShort(b.at)} · {time(b.at)} · {fmt(b.kg, 1)} kg</div>
          </div>
          <div className="text-right">
            <StatusPill s={b.status} />
            <div className={cx('mt-1 text-[12px] font-semibold tnum', b.pdu ? 'text-murni' : 'text-mute')}>{b.status === 'murni' ? (b.pdu ? `+${b.points}` : `+${b.points} tertunda`) : '0'}</div>
          </div>
        </button>
      ))}
      <Modal open={!!open} onClose={() => setOpen(null)} title="Detail batch">
        {open && (
          <div className="p-6">
            <Mono className="text-[13px] text-mute">{open.id}</Mono>
            <div className="mt-2 flex items-center gap-3"><span className="font-display text-3xl font-bold">{fmt(open.kg, 1)} kg</span><StatusPill s={open.status} size="lg" /></div>
            <p className="mt-2 text-sm text-mute">{STATUS_META[open.status].note}</p>
            {open.status !== 'murni' && (
              <div className="mt-4 flex gap-3 rounded-2xl bg-amber/15 p-4 text-[13px]">
                <Lightbulb size={18} className="shrink-0 text-[#8a6500]" />
                <div><div className="font-semibold">Tips perbaikan</div><div className="mt-0.5 text-ink/70">{open.checks.includes('anorganik') ? 'Pisahkan plastik pembungkus sebelum membuang sisa ke wadah. Sediakan kantong kecil khusus plastik di meja saji.' : 'Tiriskan kuah dan minyak di saringan selama 1 menit sebelum menuang ke wadah organik.'}</div></div>
              </div>
            )}
            <Btn v="ghost" className="mt-5 w-full" onClick={() => { setOpen(null); go('/ledger/' + open.id) }}>Lacak di Impact Ledger</Btn>
          </div>
        )}
      </Modal>
    </div>
  )
}

export { VoucherCard }
