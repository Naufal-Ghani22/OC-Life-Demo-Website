import { motion } from 'framer-motion'
import { RotateCcw, Search, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'
import { useStore, go } from '../store'
import { MAIN_TENANT, fmt, summary } from '../data'
import { Btn, Modal, Mono } from '../kit'
import { STEPS } from '../tour'

export default function Finish() {
  const { s, d } = useStore()
  const [confirm, setConfirm] = useState(false)
  const b = s.batches.find((x) => x.id === s.demoBatch)
  const v = s.vouchers.find((x) => x.tenantId === MAIN_TENANT)
  const sm = summary(s)
  const done = STEPS.filter((x) => x.done(s)).length

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-night px-5 pb-40 pt-12 text-white sm:px-10">
      <img src="/kv/farm.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-b from-night/60 via-night/85 to-night" />
      <div className="relative mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="font-mono text-[12px] text-lime">TUR SELESAI · {done}/6 LANGKAH</div>
          <h1 className="mt-3 text-4xl font-bold leading-[1.05] sm:text-6xl">Sisa terukur,<br /><span className="text-lime">nilai berputar.</span></h1>
          <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-white/65">
            {b ? <>Sisa makanan {fmt(b.kg, 1)} kg dari Warung Bu Sari dijemput, lolos quality gate, diubah menjadi {fmt(b.pdu?.biogas ?? 0, 2)} m³ biogas dan {fmt(b.pdu?.slurry ?? 0, 1)} L bioslurry. Hasilnya kembali ke dapur tenant dalam bentuk tabung LPG 3 kg.</>
              : 'Ulangi tur untuk mengikuti satu batch dari dapur sampai tabung gas.'}
          </p>
        </motion.div>

        {b && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-10 grid gap-px overflow-hidden rounded-3xl bg-white/10 ring-1 ring-white/10 sm:grid-cols-4">
            {[
              ['Batch', <Mono className="text-[13px]">{b.id.slice(-12)}</Mono>],
              ['Durasi QC', b.dur + ' detik'],
              ['Poin', '+' + b.points],
              ['Voucher', v ? (v.status === 'ditukar' ? 'Ditukar' : 'Aktif') : '—'],
            ].map(([a, c]) => (
              <div key={a as string} className="bg-night/80 p-5"><div className="text-[11px] uppercase tracking-[0.12em] text-white/45">{a}</div><div className="mt-1.5 font-display text-xl font-semibold">{c}</div></div>
            ))}
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4 grid gap-px overflow-hidden rounded-3xl bg-white/10 ring-1 ring-white/10 sm:grid-cols-3">
          {[[fmt(sm.kgPure / 1000, 2) + ' t', 'organik dialihkan dari TPA'], [fmt(sm.co2, 2) + ' t', 'CO₂e dihindari'], [fmt(sm.lpg) + ' tabung', 'LPG 3 kg setara subsidi']].map(([a, c]) => (
            <div key={c} className="bg-night/80 p-5"><div className="font-display text-3xl font-bold text-lime">{a}</div><div className="mt-1 text-[13px] text-white/55">{c} · 30 hari, 1 SWK</div></div>
          ))}
        </motion.div>

        <div className="mt-10 flex flex-wrap gap-3">
          {b && <Btn v="lime" size="lg" icon={<Search size={18} />} onClick={() => go('/ledger/' + b.id)}>Buka jejak batch</Btn>}
          <Btn v="dark" size="lg" className="ring-1 ring-white/15" icon={<LayoutDashboard size={18} />} onClick={() => go('/pengelola')}>Dashboard kawasan</Btn>
          <Btn v="dark" size="lg" className="ring-1 ring-white/15" icon={<RotateCcw size={18} />} onClick={() => setConfirm(true)}>Ulangi dari awal</Btn>
        </div>
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Ulangi">
        <div className="p-6 text-ink">
          <h3 className="text-xl font-semibold">Mulai tur dari awal?</h3>
          <p className="mt-2 text-sm text-mute">Data demo dikembalikan ke kondisi awal agar juri berikutnya melihat alur yang sama.</p>
          <div className="mt-6 flex gap-2">
            <Btn v="quiet" className="flex-1" onClick={() => setConfirm(false)}>Batal</Btn>
            <Btn className="flex-1" onClick={() => { d({ t: 'reset' }); d({ t: 'tour', on: true, step: 1 }); go('/tenant') }}>Reset & mulai</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
