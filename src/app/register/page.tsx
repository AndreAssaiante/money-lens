'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
    <div className="min-h-screen bg-black flex">

      {/* Painel esquerdo — branding */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-16 overflow-hidden bg-[#04080a]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-0 w-[480px] h-[480px] bg-emerald-500/8 rounded-full blur-[100px]" />
          <div className="absolute top-1/4 right-0 w-[300px] h-[300px] bg-cyan-500/6 rounded-full blur-[80px]" />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <path d="M8 24L16 8L24 24" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 18H20" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">
            home-yield<span className="text-emerald-400">.app</span>
          </span>
        </div>

        <div className="relative">
          <p className="text-emerald-500 text-sm font-medium tracking-widest uppercase mb-6">
            Comece agora
          </p>
          <h2 className="text-5xl font-bold text-white leading-tight mb-6">
            Tome o controle<br />das suas<br />
            <span className="text-emerald-400">finanças hoje.</span>
          </h2>
          <p className="text-gray-500 text-base leading-relaxed max-w-sm">
            Crie sua conta gratuita e comece a transformar suas faturas em inteligência financeira.
          </p>
        </div>

        <div className="relative flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-gray-600 text-xs">Grátis para começar</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-gray-600 text-xs">Dados seguros</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-gray-600 text-xs">IA integrada</span>
          </div>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex items-center justify-center px-8 py-16 bg-black">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
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

          <h1 className="text-3xl font-bold text-white mb-2">Criar conta</h1>
          <p className="text-gray-500 text-sm mb-10">Preencha os dados para começar</p>

          {error && (
            <div className="mb-8 px-4 py-3 bg-red-500/8 border border-red-500/15 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-7">
            {/* Nome */}
            <div className="group border-b border-gray-800 focus-within:border-emerald-500 transition-colors duration-200 pb-3">
              <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-2 group-focus-within:text-emerald-500 transition-colors">
                Nome completo
              </label>
              <input
                type="text"
                placeholder="Seu nome"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                className="w-full bg-transparent text-white text-base outline-none placeholder:text-gray-700 caret-emerald-500"
              />
            </div>

            {/* E-mail */}
            <div className="group border-b border-gray-800 focus-within:border-emerald-500 transition-colors duration-200 pb-3">
              <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-2 group-focus-within:text-emerald-500 transition-colors">
                E-mail
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-transparent text-white text-base outline-none placeholder:text-gray-700 caret-emerald-500"
              />
            </div>

            {/* Senha */}
            <div className="group border-b border-gray-800 focus-within:border-emerald-500 transition-colors duration-200 pb-3">
              <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-2 group-focus-within:text-emerald-500 transition-colors">
                Senha
              </label>
              <div className="flex items-center gap-3">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="flex-1 bg-transparent text-white text-base outline-none placeholder:text-gray-700 caret-emerald-500"
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
            <div className="group border-b border-gray-800 focus-within:border-emerald-500 transition-colors duration-200 pb-3">
              <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-2 group-focus-within:text-emerald-500 transition-colors">
                Confirmar senha
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-transparent text-white text-base outline-none placeholder:text-gray-700 caret-emerald-500"
              />
            </div>

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 py-4"
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

          <p className="text-center text-gray-600 text-sm mt-8">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-emerald-500 hover:text-emerald-400 font-semibold transition-colors">
              Fazer login
            </Link>
          </p>

          <p className="text-center text-gray-800 text-xs mt-10">
            Ao se cadastrar, você aceita nossos termos de uso
          </p>
        </motion.div>
      </div>

    </div>
  )
}
