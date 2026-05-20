import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, Phone, UserPlus, ArrowLeft,
  MessageCircle, Globe, Send, CheckCircle, AlertCircle
} from 'lucide-react';
import { authService } from '../services/auth.service';
import { supabase } from '../services/supabase';

type AuthMode = 'login' | 'register' | 'sms' | 'recover';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  let result = '+7';
  if (digits.length > 1) result += ` (${digits.slice(1, 4)}`;
  if (digits.length >= 5) result += `) ${digits.slice(4, 7)}`;
  if (digits.length >= 8) result += `-${digits.slice(7, 9)}`;
  if (digits.length >= 10) result += `-${digits.slice(9, 11)}`;
  return result;
}

function validateEmail(v: string): string {
  if (!v.trim()) return 'Введите email';
  if (!EMAIL_REGEX.test(v)) return 'Некорректный email';
  return '';
}

function validatePhone(v: string): string {
  if (!v.trim()) return 'Введите телефон';
  if (v.replace(/\D/g, '').length !== 11) return 'Некорректный телефон';
  return '';
}

function validatePassword(v: string): string {
  if (!v) return 'Введите пароль';
  if (v.length < 6) return 'Минимум 6 символов';
  return '';
}

const modes: { id: AuthMode; label: string }[] = [
  { id: 'login', label: 'Вход' },
  { id: 'register', label: 'Регистрация' },
  { id: 'sms', label: 'SMS-код' },
  { id: 'recover', label: 'Восстановление' },
];

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);

  const [smsPhone, setSmsPhone] = useState('');
  const [smsStep, setSmsStep] = useState<'phone' | 'code'>('phone');
  const [smsCode, setSmsCode] = useState<string[]>(Array(6).fill(''));
  const [countdown, setCountdown] = useState(0);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverStep, setRecoverStep] = useState<'request' | 'reset'>('request');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const switchMode = useCallback((m: AuthMode) => {
    setMode(m);
    setErrors({});
    setSuccess('');
    setLoading(false);
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('recover');
        setRecoverStep('reset');
      }
    });
    return () => listener?.subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess('');
    const errs: Record<string, string> = {};
    const ee = validateEmail(email);
    if (ee) errs.email = ee;
    if (!password) errs.password = 'Введите пароль';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await authService.login(email, password);
      setSuccess('Вход выполнен!');
      setTimeout(() => navigate('/'), 1000);
    } catch (err: unknown) {
      setErrors({ form: err instanceof Error ? err.message : 'Ошибка входа' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess('');
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Введите имя';
    const ee = validateEmail(email);
    if (ee) errs.email = ee;
    const pe = validatePassword(password);
    if (pe) errs.password = pe;
    if (password !== confirmPassword) errs.confirmPassword = 'Пароли не совпадают';
    if (!agreed) errs.agreed = 'Необходимо согласие';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await authService.register(email, password, name, phone || undefined);
      setSuccess('Регистрация успешна! Проверьте почту для подтверждения.');
      setTimeout(() => navigate('/'), 2000);
    } catch (err: unknown) {
      setErrors({ form: err instanceof Error ? err.message : 'Ошибка регистрации' });
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess('');
    const ee = validateEmail(recoverEmail);
    if (ee) { setErrors({ recoverEmail: ee }); return; }
    setLoading(true);
    try {
      await authService.recover(recoverEmail);
      setSuccess('Ссылка для восстановления отправлена на вашу почту');
    } catch (err: unknown) {
      setErrors({ recoverEmail: err instanceof Error ? err.message : 'Ошибка' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess('');
    const errs: Record<string, string> = {};
    const pe = validatePassword(newPassword);
    if (pe) errs.newPassword = pe;
    if (newPassword !== confirmNewPassword) errs.confirmNewPassword = 'Пароли не совпадают';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await authService.resetPassword(newPassword);
      setSuccess('Пароль успешно изменён!');
      setTimeout(() => { switchMode('login'); setRecoverStep('request'); }, 1500);
    } catch (err: unknown) {
      setErrors({ form: err instanceof Error ? err.message : 'Ошибка' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = useCallback(async () => {
    const phe = validatePhone(smsPhone);
    if (phe) { setErrors({ smsPhone: phe }); return; }
    setLoading(true);
    setErrors({});
    try {
      await authService.sendSmsCode(smsPhone);
      setSmsStep('code');
      setCountdown(60);
    } catch (err: unknown) {
      setErrors({ smsPhone: err instanceof Error ? err.message : 'Ошибка' });
    } finally {
      setLoading(false);
    }
  }, [smsPhone]);

  const handleVerifySms = useCallback(async () => {
    if (smsCode.some(d => !d)) return;
    setLoading(true);
    setErrors({});
    try {
      await authService.verifySmsCode(smsPhone, smsCode.join(''));
      setSuccess('Телефон подтверждён!');
    } catch (err: unknown) {
      setErrors({ smsCode: err instanceof Error ? err.message : 'Ошибка' });
    } finally {
      setLoading(false);
    }
  }, [smsPhone, smsCode]);

  const handleSmsCodeChange = (i: number, v: string) => {
    if (v.length > 1) return;
    const next = [...smsCode];
    next[i] = v;
    setSmsCode(next);
    if (v && i < 5) codeRefs.current[i + 1]?.focus();
  };

  const handleSmsCodeKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !smsCode[i] && i > 0) {
      codeRefs.current[i - 1]?.focus();
    }
  };

  const handleOAuth = async (provider: 'telegram' | 'vkontakte' | 'yandex') => {
    try {
      await authService.signInWithOAuth(provider);
    } catch {
      setErrors({ form: 'Ошибка входа через соцсеть' });
    }
  };

  const setCodeRef = (i: number) => (el: HTMLInputElement | null) => { codeRefs.current[i] = el; };

  const stagger = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-20 pb-8">
      <div className="w-full max-w-md mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm mb-8 transition-colors hover:text-[var(--accent-ocean)] text-[var(--text-secondary)]"
          >
            <ArrowLeft size={16} />
            На главную
          </Link>

          <div className="flex items-center gap-2 mb-8 justify-center">
            <span className="font-mono text-2xl tracking-[0.1em] uppercase text-[var(--text-primary)] font-medium">
              SAKHALIN
            </span>
            <span className="w-[2px] h-6 bg-[var(--accent-ocean)]" />
          </div>

          <div className="sakh-tabs mb-8 overflow-x-auto">
            {modes.map(m => (
              <button
                key={m.id}
                onClick={() => switchMode(m.id)}
                className={`sakh-tabs__item ${mode === m.id ? 'sakh-tabs__item--active' : ''}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              variants={stagger}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              {mode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="sakh-caption block mb-1.5">Email</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className={`sakh-input pl-10 ${errors.email ? 'sakh-input--error' : ''}`}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-[var(--accent-sunset)] mt-1 font-mono">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="sakh-caption block mb-1.5">Пароль</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`sakh-input pl-10 ${errors.password ? 'sakh-input--error' : ''}`}
                      />
                    </div>
                    {errors.password && <p className="text-xs text-[var(--accent-sunset)] mt-1 font-mono">{errors.password}</p>}
                  </div>
                  <div className="text-center">
                    <button type="button" onClick={() => switchMode('recover')} className="sakh-link text-xs font-mono">
                      Забыли пароль?
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`sakh-btn sakh-btn--primary sakh-btn--lg w-full ${loading ? 'sakh-btn--loading' : ''}`}
                  >
                    {loading ? '' : 'Войти'}
                  </button>
                </form>
              )}

              {mode === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="sakh-caption block mb-1.5">Имя</label>
                    <div className="relative">
                      <UserPlus size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Ваше имя"
                        className={`sakh-input pl-10 ${errors.name ? 'sakh-input--error' : ''}`}
                      />
                    </div>
                    {errors.name && <p className="text-xs text-[var(--accent-sunset)] mt-1 font-mono">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="sakh-caption block mb-1.5">Телефон</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(formatPhone(e.target.value))}
                        placeholder="+7 (XXX) XXX-XX-XX"
                        className={`sakh-input pl-10 ${errors.phone ? 'sakh-input--error' : ''}`}
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-[var(--accent-sunset)] mt-1 font-mono">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="sakh-caption block mb-1.5">Email</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className={`sakh-input pl-10 ${errors.email ? 'sakh-input--error' : ''}`}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-[var(--accent-sunset)] mt-1 font-mono">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="sakh-caption block mb-1.5">Пароль</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`sakh-input pl-10 ${errors.password ? 'sakh-input--error' : ''}`}
                      />
                    </div>
                    {errors.password && <p className="text-xs text-[var(--accent-sunset)] mt-1 font-mono">{errors.password}</p>}
                  </div>
                  <div>
                    <label className="sakh-caption block mb-1.5">Подтверждение пароля</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`sakh-input pl-10 ${errors.confirmPassword ? 'sakh-input--error' : ''}`}
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-[var(--accent-sunset)] mt-1 font-mono">{errors.confirmPassword}</p>}
                  </div>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="sakh-checkbox mt-0.5" />
                    <span className="text-xs leading-relaxed text-[var(--text-secondary)]">
                      Я согласен с{' '}
                      <Link to="#" className="sakh-link text-xs">пользовательским соглашением</Link>
                      {' '}и{' '}
                      <Link to="#" className="sakh-link text-xs">политикой конфиденциальности</Link>
                    </span>
                  </label>
                  {errors.agreed && <p className="text-xs text-[var(--accent-sunset)] mt-1 font-mono">{errors.agreed}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`sakh-btn sakh-btn--primary sakh-btn--lg w-full ${loading ? 'sakh-btn--loading' : ''}`}
                  >
                    {loading ? '' : 'Зарегистрироваться'}
                  </button>
                </form>
              )}

              {mode === 'sms' && (
                <div className="space-y-4">
                  {smsStep === 'phone' ? (
                    <>
                      <div>
                        <label className="sakh-caption block mb-1.5">Номер телефона</label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                          <input
                            type="tel"
                            value={smsPhone}
                            onChange={e => setSmsPhone(formatPhone(e.target.value))}
                            placeholder="+7 (XXX) XXX-XX-XX"
                            className={`sakh-input pl-10 ${errors.smsPhone ? 'sakh-input--error' : ''}`}
                          />
                        </div>
                        {errors.smsPhone && <p className="text-xs text-[var(--accent-sunset)] mt-1 font-mono">{errors.smsPhone}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={loading}
                        className={`sakh-btn sakh-btn--primary sakh-btn--lg w-full ${loading ? 'sakh-btn--loading' : ''}`}
                      >
                        {loading ? '' : 'Получить код'}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-[var(--text-secondary)] text-center">
                        Код отправлен на номер {smsPhone}
                      </p>
                      <div className="flex justify-center gap-2">
                        {smsCode.map((d, i) => (
                          <input
                            key={i}
                            ref={setCodeRef(i)}
                            type="text"
                            maxLength={1}
                            value={d}
                            onChange={e => handleSmsCodeChange(i, e.target.value)}
                            onKeyDown={e => handleSmsCodeKeyDown(i, e)}
                            className="sakh-input w-12 h-12 text-center text-lg font-mono"
                          />
                        ))}
                      </div>
                      {errors.smsCode && <p className="text-xs text-[var(--accent-sunset)] mt-1 text-center font-mono">{errors.smsCode}</p>}
                      <button
                        type="button"
                        onClick={handleVerifySms}
                        disabled={loading || countdown > 0 || smsCode.some(d => !d)}
                        className={`sakh-btn sakh-btn--primary sakh-btn--lg w-full ${loading ? 'sakh-btn--loading' : ''}`}
                      >
                        {loading ? '' : 'Подтвердить'}
                      </button>
                      <div className="text-center">
                        <button
                          type="button"
                          disabled={countdown > 0}
                          onClick={() => { setSmsCode(Array(6).fill('')); handleSendCode(); }}
                          className="sakh-link text-xs"
                        >
                          {countdown > 0 ? `Отправить повторно через ${countdown}с` : 'Отправить повторно'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {mode === 'recover' && (
                <div className="space-y-4">
                  {recoverStep === 'request' ? (
                    <form onSubmit={handleRecoverRequest} className="space-y-4">
                      <p className="text-sm text-[var(--text-secondary)]">
                        Введите email, и мы отправим ссылку для восстановления пароля
                      </p>
                      <div>
                        <label className="sakh-caption block mb-1.5">Email</label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                          <input
                            type="email"
                            value={recoverEmail}
                            onChange={e => setRecoverEmail(e.target.value)}
                            placeholder="your@email.com"
                            className={`sakh-input pl-10 ${errors.recoverEmail ? 'sakh-input--error' : ''}`}
                          />
                        </div>
                        {errors.recoverEmail && <p className="text-xs text-[var(--accent-sunset)] mt-1 font-mono">{errors.recoverEmail}</p>}
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className={`sakh-btn sakh-btn--primary sakh-btn--lg w-full ${loading ? 'sakh-btn--loading' : ''}`}
                      >
                        {loading ? '' : 'Восстановить'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <p className="text-sm text-[var(--text-secondary)]">Введите новый пароль</p>
                      <div>
                        <label className="sakh-caption block mb-1.5">Новый пароль</label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                          <input
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className={`sakh-input pl-10 ${errors.newPassword ? 'sakh-input--error' : ''}`}
                          />
                        </div>
                        {errors.newPassword && <p className="text-xs text-[var(--accent-sunset)] mt-1 font-mono">{errors.newPassword}</p>}
                      </div>
                      <div>
                        <label className="sakh-caption block mb-1.5">Подтверждение пароля</label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                          <input
                            type="password"
                            value={confirmNewPassword}
                            onChange={e => setConfirmNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className={`sakh-input pl-10 ${errors.confirmNewPassword ? 'sakh-input--error' : ''}`}
                          />
                        </div>
                        {errors.confirmNewPassword && <p className="text-xs text-[var(--accent-sunset)] mt-1 font-mono">{errors.confirmNewPassword}</p>}
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className={`sakh-btn sakh-btn--primary sakh-btn--lg w-full ${loading ? 'sakh-btn--loading' : ''}`}
                      >
                        {loading ? '' : 'Сохранить пароль'}
                      </button>
                    </form>
                  )}
                  <div className="text-center">
                    <button type="button" onClick={() => { switchMode('login'); setRecoverStep('request'); }} className="sakh-link text-xs font-mono">
                      Вернуться ко входу
                    </button>
                  </div>
                </div>
              )}

              {errors.form && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 mt-4 text-sm text-[var(--accent-sunset)] bg-red-50/10"
                >
                  <AlertCircle size={16} />
                  {errors.form}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 mt-4 text-sm text-[var(--accent-ocean)] bg-[var(--ocean-alpha-10)]"
                >
                  <CheckCircle size={16} />
                  {success}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-px bg-[var(--border-color)]" />
              <span className="sakh-caption">или через</span>
              <div className="flex-1 h-px bg-[var(--border-color)]" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => handleOAuth('telegram')} className="sakh-btn sakh-btn--secondary sakh-btn--sm">
                <Send size={14} />
                Telegram
              </button>
              <button onClick={() => handleOAuth('vkontakte')} className="sakh-btn sakh-btn--secondary sakh-btn--sm">
                <MessageCircle size={14} />
                VK
              </button>
              <button onClick={() => handleOAuth('yandex')} className="sakh-btn sakh-btn--secondary sakh-btn--sm">
                <Globe size={14} />
                Яндекс
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
