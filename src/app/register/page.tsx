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

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) { setError(error.message); return }
      if (data.user) router.push('/dashboard')
    } catch {
      setError('Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col lg:flex-row">

      {/* Painel esquerdo — branding */}
      <div className="hidden lg:flex w-[52%] flex-col p-16 relative overflow-hidden bg-[#04080a]">
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
            Comece agora gratuitamente
          </p>
          <h2 className="text-[3.25rem] font-bold text-white leading-[1.1] mb-8">
            Tome o controle<br />das suas<br />
            <span className="text-emerald-400">finanças hoje.</span>
          </h2>
          <p className="text-gray-500 text-base leading-relaxed max-w-[340px]">
            Crie sua conta e comece a transformar suas faturas em inteligência financeira real.
          </p>
        </div>

        {/* Features rodapé */}
        <div className="relative flex items-center gap-8 mt-auto">
          {['Grátis para começar', 'Dados seguros', 'IA integrada'].map(f => (
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

          <h1 className="text-[2rem] font-bold text-white mb-1.5 leading-tight">Criar conta</h1>
          <p className="text-gray-500 text-sm mb-12">Preencha os dados para começar</p>

          {error && (
            <div className="mb-8 px-4 py-3 bg-red-500/8 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-8">
            {/* Nome */}
            <div className="group">
              <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-[0.18em] mb-3 group-focus-within:text-emerald-500 transition-colors duration-200">
                Nome completo
              </label>
              <div className="border-b border-gray-800 group-focus-within:border-emerald-500 transition-colors duration-200 pb-3">
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  style={autofillStyle}
                  className="w-full bg-transparent text-white text-base outline-none placeholder:text-gray-700"
                />
              </div>
            </div>

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
              <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-[0.18em] mb-3 group-focus-within:text-emerald-500 transition-colors duration-200">
                Senha
              </label>
              <div className="border-b border-gray-800 group-focus-within:border-emerald-500 transition-colors duration-200 pb-3 flex items-center gap-3">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
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

            {/* Confirmar senha */}
            <div className="group">
              <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-[0.18em] mb-3 group-focus-within:text-emerald-500 transition-colors duration-200">
                Confirmar senha
              </label>
              <div className="border-b border-gray-800 group-focus-within:border-emerald-500 transition-colors duration-200 pb-3">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  style={autofillStyle}
                  className="w-full bg-transparent text-white text-base outline-none placeholder:text-gray-700"
                />
              </div>
            </div>

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 py-4"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  Criar minha conta
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-gray-600 text-sm mt-10">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-emerald-500 hover:text-emerald-400 font-semibold transition-colors">
              Fazer login
            </Link>
          </p>

          <p className="text-center text-gray-800 text-xs mt-8">
            Ao se cadastrar, você aceita nossos termos de uso
          </p>
        </motion.div>
      </div>

    </div>
  )
}
