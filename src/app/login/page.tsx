'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const autofillStyle = {
  WebkitBoxShadow: '0 0 0 1000px #0a0a0a inset',
  WebkitTextFillColor: '#ffffff',
  caretColor: '#10b981',
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); return }
      if (data.user) router.push('/dashboard')
    } catch {
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[400px]"
      >
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 mb-6 shadow-lg shadow-emerald-500/20">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <path d="M8 24L16 8L24 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 18H20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            home-yield<span className="text-emerald-400">.app</span>
          </h1>
          <p className="text-gray-600 text-sm mt-2">Assessor Financeiro Pessoal</p>
        </div>

        {/* Título do form */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-white">Bem-vindo de volta</h2>
          <p className="text-gray-500 text-sm mt-1">Acesse sua conta para continuar</p>
        </div>

        {error && (
          <div className="mb-8 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-9">
          {/* E-mail */}
          <div className="group">
            <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-[0.18em] mb-3 group-focus-within:text-emerald-500 transition-colors duration-200">
              E-mail
            </label>
            <div className="border-b border-gray-800 group-focus-within:border-emerald-500 transition-colors duration-200 pb-3">
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={autofillStyle}
                className="w-full bg-transparent text-white text-base outline-none placeholder:text-gray-700"
              />
            </div>
          </div>

          {/* Senha */}
          <div className="group">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.18em] group-focus-within:text-emerald-500 transition-colors duration-200">
                Senha
              </label>
              <button type="button" className="text-[11px] text-emerald-500 hover:text-emerald-400 transition-colors font-semibold">
                Esqueceu?
              </button>
            </div>
            <div className="border-b border-gray-800 group-focus-within:border-emerald-500 transition-colors duration-200 pb-3 flex items-center gap-3">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={autofillStyle}
                className="flex-1 bg-transparent text-white text-base outline-none placeholder:text-gray-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 py-[15px]"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                Entrar na conta
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-10">
          Não tem uma conta?{' '}
          <Link href="/register" className="text-emerald-500 hover:text-emerald-400 font-semibold transition-colors">
            Cadastre-se
          </Link>
        </p>

        <p className="text-center text-gray-700 text-xs mt-6">
          Criptografia de nível bancário
        </p>
      </motion.div>
    </div>
  )
}
