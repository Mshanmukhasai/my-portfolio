import { useEffect, useState } from 'react'

import AdminDashboard from './pages/AdminDashboard.jsx'
import Home from './pages/Home.jsx'
import NotFound from './pages/NotFound.jsx'

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const route = path.replace(/\/+$/, '') || '/'

  useEffect(() => {
    function syncPath() {
      setPath(window.location.pathname)
    }

    window.addEventListener('popstate', syncPath)
    return () => window.removeEventListener('popstate', syncPath)
  }, [])

  useEffect(() => {
    if (route === '/admin' || route === '/admin/login') {
      window.history.replaceState({}, '', '/admin/dashboard')
      setPath('/admin/dashboard')
    }
  }, [route])

  if (route.startsWith('/admin/')) return <AdminDashboard path={route} />
  if (route === '/') return <Home />
  return <NotFound />
}

export default App
