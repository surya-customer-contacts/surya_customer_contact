
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import logo from '../assets/surya-industries-logo.png'

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.session) {
        onLoginSuccess(data.session)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center
      overflow-hidden px-4 py-10 md:px-8"
      style={{
        backgroundImage: `
          linear-gradient(110deg, rgba(3, 30, 39, 0.94), rgba(3, 45, 53, 0.72)),
          url('https://images.unsplash.com/photo-1567789884554-0b844b597180?auto=format&fit=crop&w=2000&q=85')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto
        grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

        {/* Left branding section */}
        <div className="text-white hidden lg:block">

          <div className="flex items-center gap-4 mb-20">
            <img
              src={logo}
              alt="Surya Industries"
              className="h-20 w-auto object-contain"
            />

            <div>
              <h1 className="text-3xl font-bold tracking-widest">
                SURYA INDUSTRIES
              </h1>
              <p className="text-teal-300 text-sm tracking-[0.3em] mt-1">
                TRUST • QUALITY • GROWTH
              </p>
            </div>
          </div>

          <div className="border-l-4 border-teal-400 pl-7">
            <p className="text-teal-300 font-semibold tracking-[0.25em]
              text-sm mb-4">
              WELCOME BACK
            </p>

            <h2 className="text-5xl xl:text-6xl font-bold leading-tight">
              Customer Contact
              <br />
              Management
            </h2>

            <p className="text-gray-300 text-lg mt-7 max-w-lg leading-8">
              Building stronger relationships for a better tomorrow.
              Manage customer information and business connections
              in one place.
            </p>
          </div>

          <div className="flex gap-10 mt-16">
            {[
              ['◇', 'Trust'],
              ['⚙', 'Quality'],
              ['♧', 'Partnership'],
              ['✧', 'Growth'],
            ].map(([symbol, label]) => (
              <div key={label} className="text-center">
                <div className="text-3xl text-teal-300 mb-2">
                  {symbol}
                </div>
                <p className="text-sm text-gray-300">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Login card */}
        <div className="w-full max-w-md mx-auto">

          <div className="bg-white rounded-3xl shadow-2xl
            border border-white/40 p-7 sm:p-10">

            {/* Mobile logo */}
            <div className="flex justify-center lg:hidden mb-6">
              <img
                src={logo}
                alt="Surya Industries"
                className="h-20 w-auto object-contain"
              />
            </div>

            {/* Login heading */}
            <div className="text-center mb-9">

              <img
                src={logo}
                alt="Surya Industries"
                className="hidden lg:block h-20 w-auto mx-auto
                  object-contain mb-4"
              />

              <h2 className="text-3xl font-bold text-slate-800">
                Welcome Back
              </h2>

              <p className="text-slate-500 mt-2">
                Customer Contact Management
              </p>

              <div className="w-14 h-1 bg-teal-600 rounded-full
                mx-auto mt-5" />
            </div>

            <form onSubmit={handleLogin}>

              {/* Email */}
              <div className="mb-6">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold
                    text-slate-700 mb-2"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="username"
                  required
                  className="w-full px-4 py-3.5 bg-slate-50
                    border border-slate-200 rounded-xl
                    outline-none transition
                    focus:bg-white focus:border-teal-600
                    focus:ring-4 focus:ring-teal-600/10"
                />
              </div>

              {/* Password */}
              <div className="mb-6">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold
                    text-slate-700 mb-2"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="w-full px-4 py-3.5 pr-16
                      bg-slate-50 border border-slate-200
                      rounded-xl outline-none transition
                      focus:bg-white focus:border-teal-600
                      focus:ring-4 focus:ring-teal-600/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2
                      -translate-y-1/2 text-sm font-medium
                      text-teal-700 hover:text-teal-900"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div
                  role="alert"
                  className="mb-5 p-3.5 rounded-xl bg-red-50
                    border border-red-200 text-red-700 text-sm"
                >
                  {error}
                </div>
              )}

              {/* Login button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-2 rounded-xl
                  bg-teal-800 text-white font-semibold
                  text-base shadow-lg shadow-teal-900/20
                  hover:bg-teal-900 hover:-translate-y-0.5
                  active:translate-y-0
                  disabled:opacity-60 disabled:cursor-not-allowed
                  transition-all duration-200"
              >
                {loading ? 'Signing in...' : 'Login →'}
              </button>

            </form>

            {/* Footer */}
            <div className="flex items-center gap-3 mt-8">
              <div className="flex-1 h-px bg-slate-200" />
              <p className="text-xs text-slate-500 whitespace-nowrap">
                🔒 Authorized users only
              </p>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

          </div>

          <p className="text-center text-xs text-gray-300 mt-6">
            © {new Date().getFullYear()} Surya Industries.
            All rights reserved.
          </p>

        </div>
      </div>
    </div>
  )
}

export default Login
