'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const autofillStyle = {
  WebkitBoxShadow: '0 0 0 1000px #000 inset',
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
    <div className="min-h-screen bg-black flex flex-col lg:flex-row">

      {/* Painel esquerdo — branding */}
      <div className="hidden lg:flex w-[52%] flex-col p-16 relative overflow-hidden bg-[#04080a]">
        {/* Glows */}
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-3 mb-auto">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <path d="M8 24L16 8L24 24" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 18H20" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">
            home-yield<span className="text-emerald-400">.app</span>
          </span>
        </div>

        {/* Tagline central */}
        <div className="relative my-auto py-16">
          <p className="text-emerald-500 text-xs font-semibold tracking-[0.2em] uppercase mb-8">
            Assessor Financeiro Pessoal
          </p>
          <h2 className="text-[3.25rem] font-bold text-white leading-[1.1] mb-8">
            Onde outros<br />veem faturas,<br />
            <span className="text-emerald-400">o Yield vê<br />rendimento.</span>
          </h2>
          <p className="text-gray-500 text-base leading-relaxed max-w-[340px]">
            Controle seus gastos, acompanhe metas e obtenha análises inteligentes do seu financeiro familiar.
          </p>
        </div>

        {/* Features rodapé */}
        <div className="relative flex items-center gap-8 mt-auto">
          {['OCR com IA', 'Consultor IA', 'Metas financeiras'].map(f => (
            <div key={f} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-gray-600 text-xs">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex items-center justify-center px-8 py-16 bg-black min-h-screen lg:min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[360px]"
        >
          {/* Logo mobile */}
          <div className="flex lg:hidden items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                <path d="M8 24L16 8L24 24" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 18H20" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-white font-semibold tracking-tight">
              home-yield<span className="text-emerald-400">.app</span>
            </span>
          </div>

          <h1 className="text-[2rem] font-bold text-white mb-1.5 leading-tight">Bem-vindo de volta</h1>
          <p className="text-gray-500 text-sm mb-12">Acesse sua conta para continuar</p>

          {error && (
            <div className="mb-8 px-4 py-3 bg-red-500/8 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-10">
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
              className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 py-4"
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

          <p className="text-center text-gray-800 text-xs mt-8">
            Criptografia de nível bancário
          </p>
        </motion.div>
      </div>

    </div>
  )
}
