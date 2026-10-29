import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { PedeApp } from '@/features/pedeai/PedeApp';
import '@/features/pedeai/checkout.css';
import '@/features/pedeai/account.css';

export const Route = createFileRoute('/redefinir-senha')({
  head: () => ({ meta: [{ title: 'Nova senha | Pede Aí' }, { name: 'description', content: 'Crie uma nova senha para sua conta Pede Aí.' }, { property: 'og:title', content: 'Nova senha | Pede Aí' }, { property: 'og:description', content: 'Crie uma nova senha para sua conta Pede Aí.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(event => { if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true); });
    void supabase.auth.getSession().then(({ data: s }) => { if (s.session) setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError('');
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (password !== confirmation) { setError('As senhas não conferem.'); return; }
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) { setError('Não foi possível salvar a nova senha. Abra novamente o link do e-mail.'); return; }
    navigate({ to: '/minha-conta', search: { tab: 'perfil' } });
  };
  return <PedeApp><main className="container auth-page"><div className="auth-content"><h1>Criar nova senha</h1>
    {!ready ? <p className="account-disclaimer">Abra esta página pelo link enviado ao seu e-mail.</p> :
    <form noValidate onSubmit={submit} className="account-form">
      <label className="checkout-field">Nova senha<input type="password" autoComplete="new-password" value={password} maxLength={128} onChange={e => setPassword(e.target.value)} /></label>
      <label className="checkout-field">Confirmar nova senha<input type="password" autoComplete="new-password" value={confirmation} maxLength={128} onChange={e => setConfirmation(e.target.value)} /></label>
      {error && <p role="alert" className="field-error">{error}</p>}
      <Button type="submit" disabled={busy} className="pa-primary checkout-cta">Salvar nova senha</Button>
    </form>}</div></main></PedeApp>;
}
