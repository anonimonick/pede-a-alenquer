import { describe,it,expect } from 'vitest';
import { webcrypto } from 'node:crypto';
import { validateRegistration,formatPhone,validateProfile,putAddress,removeAddress,createAccount,passwordVerifier,accountsSchema,validateSavedAddress,type Registration,type SavedAddress } from '@/features/pedeai/account-rules';
import { emptyAddress } from '@/features/pedeai/checkout-rules';
const registration:Registration={name:'Maria Silva',email:'maria@example.com',phone:'93999998888',password:'abc123',confirmation:'abc123',accepted:true};
describe('Local demo account rules',()=>{
 it('requires at least six password characters',()=>{expect(validateRegistration({...registration,password:'abc12',confirmation:'abc12'},[])['password']).toBeDefined();expect(validateRegistration(registration,[])['password']).toBeUndefined();});
 it('requires matching password confirmation',()=>{expect(validateRegistration({...registration,confirmation:'other'},[])['confirmation']).toBeDefined();});
 it('requires acceptance of terms and privacy',()=>{expect(validateRegistration({...registration,accepted:false},[])['accepted']).toBeDefined();});
 it('prevents duplicate normalized email addresses',()=>{expect(validateRegistration({...registration,email:' MARIA@example.com '},[{email:'maria@example.com'}])['email']).toBeDefined();});
 it('rejects incomplete Brazilian phone numbers',()=>{expect(validateProfile('Maria','9399999')['phone']).toBeDefined();expect(formatPhone('93999998888')).toBe('(93) 99999-8888');expect(validateProfile('Maria',formatPhone('93999998888'))).toEqual({});});
 it('requires valid email',()=>{expect(validateRegistration({...registration,email:'invalid'},[])['email']).toBeDefined();});
 it('validates account delivery address including reference',()=>{expect(validateSavedAddress({...emptyAddress,name:'Maria',phone:'93999998888',street:'Ramal A',number:'Lote 2',district:'Comunidade'})['reference']).toBeDefined();});
 it('keeps exactly one default address and promotes after deletion',()=>{const a:SavedAddress={id:'a',address:emptyAddress,isDefault:false};const b={...a,id:'b',isDefault:true};const list=putAddress(putAddress([],a),b);expect(list.map(v=>v.isDefault)).toEqual([false,true]);expect(removeAddress(list,'b')[0]?.isDefault).toBe(true);});
 it('stores salted verifiers, never plaintext passwords',async()=>{Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});const account=await createAccount(registration);const another=await createAccount(registration);expect(accountsSchema.safeParse([account]).success).toBe(true);expect(JSON.stringify(account)).not.toContain('abc123');expect(account.verifier).not.toBe(another.verifier);expect(await passwordVerifier('abc123',account.salt)).toBe(account.verifier);expect(await passwordVerifier('wrong',account.salt)).not.toBe(account.verifier);});
 it('ignores corrupt persisted account structure',()=>{expect(accountsSchema.safeParse([{email:'maria@example.com',password:'abc123'}]).success).toBe(false);});
});
