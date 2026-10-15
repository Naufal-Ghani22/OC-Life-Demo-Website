import { motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, Smartphone, Laptop, Check, Play } from 'lucide-react'
import { useStore, go } from '../store'
import { STEPS, ROLES } from '../tour'
import { K, fmt, summary } from '../data'
import { cx } from '../kit'

export default function Home() {
  const { s, d } = useStore()
  const sm = summary(s)
  const done = STEPS.filter((x) => x.done(s)).length
  const start = () => {
    const next = STEPS.find((x) => !x.done(s)) ?? STEPS[0]
    d({ t: 'tour', on: true, step: next.n })
    go(next.path)
  }

  return (
    <div className="pb-24">
      {/* Hero */}
      <section className="relative overflow-hidden bg-night text-white">
        <div className="grid-bg absolute inset-0 opacity-60" />
        <div className="relative grid gap-10 px-5 pb-10 pt-10 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:px-12 lg:pb-14 lg:pt-14">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/[.06] px-3 py-1.5 text-[12px] font-medium text-white/70 ring-1 ring-white/10">
              <span className="relative h-2 w-2 text-lime"><span className="pulse-ring absolute inset-0" /><span className="absolute inset-0 rounded-full bg-lime" /></span>
              Simulasi terpandu · IDEANATION 2026
            </div>
            <h1 className="mt-6 max-w-2xl text-[2.35rem] font-bold leading-[1.05] sm:text-5xl xl:text-[3.6rem]">
              Ikuti satu wadah sisa makanan, <span className="text-lime">dari dapur sampai tabung gas.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-white/60">
              Enam langkah, lima peran, satu batch ID. Anda berpindah sudut pandang dari tenant, petugas, operator biogas, koperasi, hingga pengelola kawasan. Semua aksi saling terhubung dan tercatat di Impact Ledger.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button onClick={start} className="group inline-flex h-14 items-center gap-3 rounded-2xl bg-lime pl-5 pr-4 font-bold text-night transition hover:bg-[#b5e33c]">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-night text-lime"><Play size={14} fill="currentColor" /></span>
                {done ? `Lanjutkan tur (${done}/6)` : 'Mulai tur 6 langkah'}
                <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
              </button>
              <a href="#peran" className="inline-flex h-14 items-center rounded-2xl px-5 text-[15px] font-semibold text-white/80 ring-1 ring-white/15 transition hover:bg-white/5">Jelajah bebas per peran</a>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10">
              {[
                [fmt(sm.kgPure), 'kg Murni · 30 hari'],
                [fmt(sm.pureRatio * 100) + '%', 'rasio batch Murni'],
                [fmt(sm.co2, 2), 't CO₂e dihindari'],
              ].map(([a, b]) => (
                <div key={b} className="bg-night px-4 py-3.5">
                  <div className="font-display text-xl font-bold tnum sm:text-2xl">{a}</div>
                  <div className="mt-0.5 text-[11.5px] text-white/45">{b}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Jalur 6 langkah sebagai film strip */}
          <div className="relative min-w-0">
            <ol className="relative space-y-2.5">
              <span className="absolute bottom-6 left-[27px] top-6 w-px bg-gradient-to-b from-lime/60 via-white/15 to-white/5" />
              {STEPS.map((st, i) => {
                const ok = st.done(s)
                return (
                  <motion.li key={st.n} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 * i, duration: 0.5 }}>
                    <button onClick={() => { d({ t: 'tour', on: true, step: st.n }); go(st.path) }} className="group relative flex w-full items-center gap-4 rounded-2xl p-2 pr-3 text-left transition hover:bg-white/[.05]">
                      <span className={cx('relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full font-mono text-sm font-semibold ring-4 ring-night', ok ? 'bg-lime text-night' : 'bg-night-3 text-white/70')}>
                        {ok ? <Check size={16} strokeWidth={3} /> : st.n}
                      </span>
                      <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10">
                        <img src={st.photo} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-[15px] font-semibold">{st.title}</span>
                        <span className="block truncate text-[12.5px] text-white/45">{st.actor}</span>
                      </span>
                      <ArrowUpRight size={16} className="shrink-0 text-white/25 transition group-hover:text-lime" />
                    </button>
                  </motion.li>
                )
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* Peran */}
      <section id="peran" className="scroll-mt-20 px-5 pt-12 sm:px-8 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">Masuk tanpa kata sandi</div>
            <h2 className="mt-2 text-3xl font-bold">Pilih sudut pandang</h2>
          </div>
          <p className="max-w-sm text-sm text-mute">Peran HP tampil dalam bingkai ponsel di laptop, dan layar penuh bila dibuka dari HP juri.</p>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ROLES.map((r, i) => (
            <motion.button
              key={r.path} onClick={() => go(r.path)}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
              className="card group relative flex items-stretch overflow-hidden text-left transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-18px_rgba(31,95,63,.35)]"
            >
              <div className="flex min-w-0 flex-1 flex-col p-5">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-ink/[.05] px-2.5 py-1 text-[11px] font-semibold text-mute">
                  {r.device === 'HP' ? <Smartphone size={12} /> : <Laptop size={12} />} {r.device}
                </span>
                <div className="mt-4 font-display text-lg font-semibold">{r.name}</div>
                <div className="text-[12.5px] text-mute">{r.who}</div>
                <p className="mt-3 text-[13.5px] leading-relaxed text-ink/75">{r.desc}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[13px] font-semibold text-forest">Masuk <ArrowRight size={14} className="transition group-hover:translate-x-1" /></span>
              </div>
              <div className="relative w-[38%] shrink-0 overflow-hidden bg-[#efeadb]">
                <img src={r.img} alt="" className={cx('absolute inset-0 h-full w-full transition duration-500 group-hover:scale-105', r.img.includes('/ic-') ? 'object-contain p-3' : 'object-cover')} />
              </div>
            </motion.button>
          ))}
        </div>

        <div className="mt-6 grid gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['Kawasan', '1 SWK pilot'],
            ['Tenant aktif', K.tenants + ' kios'],
            ['Target Murni', fmt(K.pureRatio * 100) + '%'],
            ['Biogas', '0,1 m³ / kg'],
            ['Bioslurry', '1 L / 1,2 kg · Rp2.000/L'],
          ].map(([a, b]) => (
            <div key={a} className="bg-paper px-5 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mute">{a}</div>
              <div className="mt-1 font-display text-[15px] font-semibold">{b}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
