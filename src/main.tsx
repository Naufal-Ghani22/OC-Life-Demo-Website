import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { StoreProvider, ToastProvider, useRoute } from './store'
import { Shell } from './Shell'
import Home from './screens/Home'
import Tenant from './screens/Tenant'
import Petugas from './screens/Petugas'
import Operator from './screens/Operator'
import Koperasi from './screens/Koperasi'
import Manager from './screens/Manager'
import Ledger from './screens/Ledger'
import Finish from './screens/Finish'

function App() {
  const path = useRoute()
  let page
  if (path.startsWith('/tenant')) page = <Tenant />
  else if (path.startsWith('/petugas')) page = <Petugas />
  else if (path.startsWith('/operator')) page = <Operator />
  else if (path.startsWith('/koperasi')) page = <Koperasi key={location.hash} />
  else if (path.startsWith('/pengelola')) page = <Manager />
  else if (path.startsWith('/ledger')) page = <Ledger id={path.split('/')[2]} />
  else if (path.startsWith('/selesai')) page = <Finish />
  else page = <Home />
  return <Shell path={path}>{page}</Shell>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </StoreProvider>
  </StrictMode>,
)
