import React, { useState } from 'react';
import { User } from '../types';
import {
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  User as UserIcon,
  Smile,
} from 'lucide-react';
import { soundEffects } from '../utils/audio';

interface AuthModalProps {
  onLoginSuccess: (user: User) => void;
}

const AVATAR_COLORS = [
  '#f59e0b', // Amber / Gold (Mod theme)
  '#5865f2', // Discord Blurple
  '#23a55a', // Green
  '#00a8fc', // Cyan
  '#eb459e', // Pink
  '#8b5cf6', // Purple
  '#f23f43', // Red
  '#10b981', // Emerald
];

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login Form State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Form State
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regColor, setRegColor] = useState(AVATAR_COLORS[1]);

  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'اسم المستخدم أو كلمة المرور غير صحيحة');
        soundEffects.playMuteOff();
        setLoading(false);
        return;
      }

      soundEffects.playJoin();
      onLoginSuccess(data.user);
    } catch (err) {
      console.error('Login error:', err);
      setError('تعذر الاتصال بالخادم، يرجى التحقق من الاتصال والمحاولة مجدداً');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regDisplayName.trim() || !regUsername.trim() || !regPassword.trim()) {
      setError('يرجى تعبئة كافة الحقول المطلوبة');
      return;
    }

    if (regUsername.trim().length < 3) {
      setError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
      return;
    }

    if (regPassword.trim().length < 4) {
      setError('كلمة المرور يجب أن تكون 4 خانات على الأقل');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: regDisplayName.trim(),
          username: regUsername.trim().toLowerCase(),
          password: regPassword.trim(),
          color: regColor,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'تعذر إنشاء الحساب، قد يكون اسم المستخدم مسجلاً مسبقاً');
        soundEffects.playMuteOff();
        setLoading(false);
        return;
      }

      soundEffects.playJoin();
      setSuccessNotice('تم إنشاء حسابك بنجاح! جاري تسجيل الدخول...');
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 400);
    } catch (err) {
      console.error('Register error:', err);
      setError('حدث خطأ أثناء حفظ الحساب الجديد في الخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="auth-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-[#313338] border border-[#2b2d31] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-[#5865f2]/20 via-[#313338] to-[#f59e0b]/20 p-6 border-b border-[#2b2d31] text-center relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#5865f2] text-white font-extrabold text-2xl shadow-lg shadow-[#5865f2]/30 mb-3">
            M
          </div>
          <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
            <span>MODcord - مودكورد</span>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            منصة المحادثة الصوتية والنصية ومشاركة الشاشة الحقيقية
          </p>

          {/* Navigation: 2 Clean Pages/Tabs Only */}
          <div className="flex bg-[#1e1f22] p-1 rounded-xl mt-5 border border-[#3f4147]">
            <button
              id="auth-tab-login"
              type="button"
              onClick={() => {
                setTab('login');
                setError(null);
                setSuccessNotice(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === 'login'
                  ? 'bg-[#5865f2] text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول</span>
            </button>
            <button
              id="auth-tab-register"
              type="button"
              onClick={() => {
                setTab('register');
                setError(null);
                setSuccessNotice(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === 'register'
                  ? 'bg-[#23a55a] text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>إنشاء حساب</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-[#f23f43]/15 border border-[#f23f43]/40 rounded-xl p-3 text-xs text-[#f23f43] font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="mb-4 bg-[#23a55a]/15 border border-[#23a55a]/40 rounded-xl p-3 text-xs text-[#23a55a] font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {tab === 'login' ? (
            /* Page 1: Sign In */
            <div>
              <form onSubmit={handleLogin} className="space-y-4 text-right">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    اسم المستخدم (Username)
                  </label>
                  <div className="relative">
                    <input
                      id="login-username-input"
                      type="text"
                      required
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="أدخل اسم المستخدم"
                      className="w-full bg-[#1e1f22] text-sm text-white px-3.5 py-2.5 rounded-xl border border-[#3f4147] focus:outline-none focus:border-[#5865f2] transition font-mono pr-9"
                    />
                    <UserIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    كلمة المرور (Password)
                  </label>
                  <div className="relative">
                    <input
                      id="login-password-input"
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="أدخل كلمة المرور"
                      className="w-full bg-[#1e1f22] text-sm text-white px-3.5 py-2.5 rounded-xl border border-[#3f4147] focus:outline-none focus:border-[#5865f2] transition font-mono pr-9 pl-10"
                    />
                    <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}</span>
                </button>
              </form>

              {/* Switch to Register link */}
              <div className="mt-4 text-center text-xs text-gray-400">
                <span>ليس لديك حساب؟ </span>
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setError(null);
                  }}
                  className="text-[#5865f2] hover:underline font-bold cursor-pointer"
                >
                  أنشئ حساباً جديداً الآن
                </button>
              </div>
            </div>
          ) : (
            /* Page 2: Register New Account */
            <div>
              <form onSubmit={handleRegister} className="space-y-3.5 text-right">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    الاسم المعروض (الاسم المستعار في السيرفر)
                  </label>
                  <div className="relative">
                    <input
                      id="reg-displayname-input"
                      type="text"
                      required
                      value={regDisplayName}
                      onChange={(e) => setRegDisplayName(e.target.value)}
                      placeholder="مثال: أحمد، فهد، المحارب..."
                      className="w-full bg-[#1e1f22] text-sm text-white px-3.5 py-2.5 rounded-xl border border-[#3f4147] focus:outline-none focus:border-[#23a55a] transition pr-9"
                    />
                    <Smile className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    اسم المستخدم لتسجيل الدخول (Username بالإنجليزية)
                  </label>
                  <div className="relative">
                    <input
                      id="reg-username-input"
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.replace(/\s+/g, ''))}
                      placeholder="مثال: ahmed أو saad"
                      className="w-full bg-[#1e1f22] text-sm text-white px-3.5 py-2.5 rounded-xl border border-[#3f4147] focus:outline-none focus:border-[#23a55a] transition font-mono pr-9"
                    />
                    <UserIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    كلمة المرور (Password)
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password-input"
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="اختر كلمة مرور لحسابك"
                      className="w-full bg-[#1e1f22] text-sm text-white px-3.5 py-2.5 rounded-xl border border-[#3f4147] focus:outline-none focus:border-[#23a55a] transition font-mono pr-9 pl-10"
                    />
                    <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                    >
                      {showRegPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Avatar Color Choice */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-2">
                    لون صورة الحساب الشخصية
                  </label>
                  <div className="flex items-center justify-center gap-2.5 py-1">
                    {AVATAR_COLORS.map((color) => {
                      const isSelected = regColor === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setRegColor(color)}
                          className={`w-7 h-7 rounded-full transition transform hover:scale-110 cursor-pointer flex items-center justify-center ${
                            isSelected
                              ? 'ring-2 ring-white scale-110 shadow-lg'
                              : 'opacity-85 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: color }}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  id="reg-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#23a55a] hover:bg-[#1f924f] disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-3"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{loading ? 'جارٍ حفظ الحساب والدخول...' : 'إنشاء الحساب والدخول فوراً'}</span>
                </button>
              </form>

              {/* Switch to Login link */}
              <div className="mt-4 text-center text-xs text-gray-400">
                <span>لديك حساب بالفعل؟ </span>
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setError(null);
                  }}
                  className="text-[#23a55a] hover:underline font-bold cursor-pointer"
                >
                  تسجيل الدخول
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
