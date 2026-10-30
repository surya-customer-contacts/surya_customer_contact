import { useState } from 'react'
import { supabase } from '../lib/supabase'
import logo from '../assets/surya-industries-logo.png'

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()

    setError('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setLoading(false)

    if (data.session) {
      onLoginSuccess(data.session)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">

          {/* Logo */}
          <div className="text-center mb-8">

            <img
              src={logo}
              alt="Surya Industries"
              className="h-24 w-auto mx-auto object-contain"
            />

            <h1 className="text-2xl font-bold text-gray-900 mt-4">
              SURYA INDUSTRIES
            </h1>

            <p className="text-gray-500 mt-1">
              Customer Contact Management
            </p>

          </div>

          {/* Login form */}
          <form onSubmit={handleLogin}>

            <div className="mb-5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="mb-5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>

          </form>

        </div>

        <p className="text-center text-xs text-gray-500 mt-5">
          Authorized users only
        </p>

      </div>

    </div>
  )
}

export default Login