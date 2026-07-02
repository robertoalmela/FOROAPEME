import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { useAuthStore } from '../store/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [dni, setDni] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tempToken, setTempToken] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
      await authService.sendOTP(formattedPhone);
      setPhone(formattedPhone);
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error enviando código');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.verifyOTP(phone, code);

      if (result.needsRegistration) {
        setTempToken(result.tempToken);
        setStep('register');
        return;
      }

      login(result.token, result.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.register(tempToken, dni, firstName, lastName);
      login(result.token, result.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error en el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDEDE3] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img
            src="/apeme-logo.png"
            alt="APEME Alicante"
            className="h-16 mx-auto mb-4"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <h1 className="text-2xl font-bold text-[#074E63]">APEME Alicante</h1>
          <p className="text-[#4C4A45] mt-1">Plataforma de Gobernanza Digital</p>
        </div>

        <div className="bg-white rounded-lg shadow p-8 border border-[#e5e9dd]">
          {step === 'phone' && (
            <>
              <h2 className="text-xl font-semibold mb-4 text-[#074E63]">Iniciar Sesión</h2>
              <p className="text-[#4C4A45] mb-6">
                Ingresa tu número de teléfono para recibir un código de verificación.
              </p>
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4C4A45] mb-1">
                    Número de teléfono
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full px-4 py-2 border border-[#e5e9dd] rounded-lg focus:ring-2 focus:ring-[#00738B] focus:border-transparent outline-none"
                    required
                  />
                </div>
                {error && <p className="text-[#ef4444] text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00738B] text-white py-2 px-4 rounded-lg hover:bg-[#074E63] transition-colors disabled:opacity-50 font-medium"
                >
                  {loading ? 'Enviando...' : 'Enviar código'}
                </button>
              </form>
            </>
          )}

          {step === 'otp' && (
            <>
              <h2 className="text-xl font-semibold mb-4 text-[#074E63]">Verificar código</h2>
              <p className="text-[#4C4A45] mb-6">
                Ingresa el código de 6 dígitos enviado a {phone}
              </p>
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4C4A45] mb-1">
                    Código de verificación
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-2 border border-[#e5e9dd] rounded-lg focus:ring-2 focus:ring-[#00738B] focus:border-transparent text-center text-2xl tracking-widest outline-none"
                    required
                  />
                </div>
                {error && <p className="text-[#ef4444] text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00738B] text-white py-2 px-4 rounded-lg hover:bg-[#074E63] transition-colors disabled:opacity-50 font-medium"
                >
                  {loading ? 'Verificando...' : 'Verificar'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="w-full text-[#4C4A45] hover:text-[#00738B] text-sm"
                >
                  Cambiar número
                </button>
              </form>
            </>
          )}

          {step === 'register' && (
            <>
              <h2 className="text-xl font-semibold mb-2 text-[#074E63]">Completar registro</h2>
              <p className="text-[#4C4A45] mb-6">
                Para acceder a la plataforma necesitamos verificar tu identidad con tu DNI.
              </p>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4C4A45] mb-1">
                    DNI / NIE
                  </label>
                  <input
                    type="text"
                    value={dni}
                    onChange={(e) => setDni(e.target.value.toUpperCase())}
                    placeholder="12345678A"
                    maxLength={9}
                    className="w-full px-4 py-2 border border-[#e5e9dd] rounded-lg focus:ring-2 focus:ring-[#00738B] focus:border-transparent uppercase outline-none"
                    required
                  />
                  <p className="text-xs text-[#9ca3af] mt-1">
                    Sin puntos ni guiones. Ejemplo: 12345678A
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#4C4A45] mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Tu nombre"
                      className="w-full px-4 py-2 border border-[#e5e9dd] rounded-lg focus:ring-2 focus:ring-[#00738B] focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4C4A45] mb-1">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Tus apellidos"
                      className="w-full px-4 py-2 border border-[#e5e9dd] rounded-lg focus:ring-2 focus:ring-[#00738B] focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                {error && <p className="text-[#ef4444] text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00738B] text-white py-2 px-4 rounded-lg hover:bg-[#074E63] transition-colors disabled:opacity-50 font-medium"
                >
                  {loading ? 'Registrando...' : 'Completar registro'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="w-full text-[#4C4A45] hover:text-[#00738B] text-sm"
                >
                  Cambiar número
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
