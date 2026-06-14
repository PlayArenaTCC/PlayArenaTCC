import { useState } from 'react'
import { Plus } from 'lucide-react'

export function CourtForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    nome: '',
    modalidade: 'futsal',
    endereco: '',
    bairro: '',
    cidade: 'Campo Mourao',
    preco_hora: '90',
    imagem_url: '',
    descricao: '',
  })

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    await onSubmit(form)
    setForm((current) => ({ ...current, nome: '', endereco: '', bairro: '', descricao: '' }))
  }

  return (
    <form className="management-form" onSubmit={submit}>
      <label className="field">
        <span>Nome da quadra</span>
        <input value={form.nome} onChange={(event) => update('nome', event.target.value)} placeholder="Ex.: Arena Central" />
      </label>
      <label className="field">
        <span>Modalidade</span>
        <select value={form.modalidade} onChange={(event) => update('modalidade', event.target.value)}>
          <option value="futsal">Futsal</option>
          <option value="society">Society</option>
          <option value="basquete">Basquete</option>
          <option value="poliesportiva">Poliesportiva</option>
        </select>
      </label>
      <label className="field">
        <span>Endereco</span>
        <input value={form.endereco} onChange={(event) => update('endereco', event.target.value)} placeholder="Rua e numero" />
      </label>
      <label className="field">
        <span>Bairro</span>
        <input value={form.bairro} onChange={(event) => update('bairro', event.target.value)} placeholder="Centro" />
      </label>
      <label className="field">
        <span>Cidade</span>
        <input value={form.cidade} onChange={(event) => update('cidade', event.target.value)} />
      </label>
      <label className="field">
        <span>Valor por hora</span>
        <input type="number" min="0" value={form.preco_hora} onChange={(event) => update('preco_hora', event.target.value)} />
      </label>
      <label className="field wide-field">
        <span>Imagem URL</span>
        <input value={form.imagem_url} onChange={(event) => update('imagem_url', event.target.value)} placeholder="https://..." />
      </label>
      <label className="field wide-field">
        <span>Descricao</span>
        <textarea value={form.descricao} onChange={(event) => update('descricao', event.target.value)} placeholder="Caracteristicas do espaco" />
      </label>
      <button className="primary-action wide-field" type="submit" disabled={loading}>
        <Plus size={17} />
        {loading ? 'Salvando...' : 'Cadastrar quadra'}
      </button>
    </form>
  )
}
