import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ClientSubmission from './pages/ClientSubmission'

function App() {
  const isClientSubmission = new URLSearchParams(window.location.search).get('client-submit') === '1'
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (mounted) { setSession(currentSession); setLoading(false) }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => { mounted = false; subscription.unsubscribe() }
  }, [])

  if (isClientSubmission) return <ClientSubmission />
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-gray-100"><p className="text-gray-600">Loading…</p></div>
  if (!session) return <Login onLoginSuccess={setSession} />
  return <Dashboard />
}

export default App
