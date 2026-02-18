# Protect Training & Diet

App com duas abas: **Treino** (integrado à Hevy API) e **Dieta** (dados no Supabase).

## Como usar

1. **Supabase**  
   - No [Supabase](https://supabase.com/dashboard) → SQL Editor, execute o conteúdo do arquivo `supabase-schema.sql` para criar a tabela `diet_entries` e as políticas.

2. **Treino (Hevy)**  
   - Obtenha sua chave em [hevy.com/settings → Developer](https://hevy.com/settings?developer) (é necessário Hevy Pro).  
   - No app, aba **Treino**, cole a chave e clique em **Salvar**.  
   - Use **Atualizar treinos** para listar treinos e rotinas.

3. **Dieta**  
   - Na aba **Dieta**, preencha data, tipo de refeição, o que comeu e (opcional) calorias.  
   - Os dados são salvos no Supabase. Use os filtros para ver por data ou “Ver tudo”.

## Arquivos

- `index.html` – estrutura e abas
- `styles.css` – estilos
- `script.js` – lógica (Hevy + Supabase)
- `config.js` – URL e chave anon do Supabase (e URL base da Hevy)
- `supabase-schema.sql` – script para criar a tabela no Supabase

## Rodar localmente

Abra o `index.html` no navegador ou use um servidor local, por exemplo:

```bash
npx serve .
```

Ou abra diretamente o arquivo (alguns recursos podem ter restrições em `file://`; nesse caso use `npx serve .`).

## Segurança

- **Supabase:** no front foi usada apenas a chave **anon** (pública). A tabela está protegida por RLS; a política atual libera tudo para `anon`. Para produção, recomenda-se usar autenticação (Auth) e políticas por usuário.  
- **Hevy:** a chave da API fica só no `localStorage` do seu navegador; não é enviada a nenhum outro servidor além da Hevy.
