import { describe, expect, it, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
import { friendlyError, rowToAddress, STATUS_LABEL } from '@/features/pedeai/account-context';

describe('Supabase account mapping', () => {
  it('maps a stored address row to the checkout address shape', () => {
    const saved = rowToAddress({ id: 'a1', label: 'Trabalho', recipient_name: 'Ana', phone: '(93) 99999-0000', cep: null, street: 'Rua A', number: '5', neighborhood: 'Centro', complement: null, reference: 'Praça', instructions: null, is_default: true });
    expect(saved).toEqual({ id: 'a1', isDefault: true, address: { type: 'Trabalho', name: 'Ana', phone: '(93) 99999-0000', cep: '', street: 'Rua A', number: '5', district: 'Centro', complement: '', reference: 'Praça', instructions: '' } });
  });
  it('shows wrong credentials without revealing which field failed', () => {
    expect(friendlyError('Invalid login credentials')).toBe('E-mail ou senha incorretos.');
  });
  it('explains server rejection of an unmet minimum order', () => {
    expect(friendlyError('Pedido mínimo não atingido')).toBe('O pedido mínimo deste restaurante não foi atingido.');
  });
  it('labels a newly received order as in preparation', () => {
    expect(STATUS_LABEL['received']).toBe('Em preparação');
  });
});
