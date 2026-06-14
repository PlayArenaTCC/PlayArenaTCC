export function SettingsView() {
  return (
    <section className="settings-screen">
      <h1>Configuracoes</h1>
      <div className="settings-list">
        <label className="toggle-row">
          <span>
            <strong>Notificacoes</strong>
            <small>Receber avisos sobre reservas.</small>
          </span>
          <input type="checkbox" defaultChecked />
        </label>
        <label className="toggle-row">
          <span>
            <strong>Lembretes por e-mail</strong>
            <small>Enviar confirmacoes e alteracoes.</small>
          </span>
          <input type="checkbox" defaultChecked />
        </label>
        <label className="field">
          <span>Tema do sistema</span>
          <select defaultValue="claro">
            <option value="claro">Claro</option>
            <option value="escuro">Escuro</option>
          </select>
        </label>
      </div>
    </section>
  )
}
