import { useState } from 'react';
import { loginWithEmail } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';

export const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithEmail(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-stone-100">
      <form
        onSubmit={handleSubmit}
        className="max-w-sm w-full space-y-4 rounded-xl bg-white p-8 shadow-lg"
      >
        <h2 className="text-2xl font-bold text-center">Admin login</h2>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded border px-3 py-2"
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded border px-3 py-2"
        />
        <button
          type="submit"
          className="w-full rounded bg-[#f97316] py-2 font-medium text-white hover:bg-[#e6620f]"
        >
          Sign in
        </button>
      </form>
    </section>
  );
};
