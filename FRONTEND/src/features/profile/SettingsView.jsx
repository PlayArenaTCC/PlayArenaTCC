import { useState } from 'react'
import { Bell, Eye, Globe2 } from 'lucide-react'
import {
  accessibilityOptions,
  currencyOptions,
  getAppSettings,
  languageOptions,
  saveAppSettings,
  translate,
} from '../../utils/appSettings'

const notificationOptions = [
  { key: 'notificationEmail' },
  { key: 'notificationReservations' },
  { key: 'notificationPromotions' },
]

export function SettingsView() {
  const [settings, setSettings] = useState(getAppSettings)
  const t = (key) => translate(key, settings)

  function updateSetting(field, value) {
    setSettings((current) => saveAppSettings({ ...current, [field]: value }))
  }

  function toggleAccessibility(key) {
    setSettings((current) => saveAppSettings({
      ...current,
      accessibility: {
        ...current.accessibility,
        [key]: !current.accessibility[key],
      },
    }))
  }

  return (
    <section className="settings-screen">
      <h1>{t('configuracoes')}</h1>

      <div className="settings-card">
        <div className="settings-card-heading">
          <Bell size={16} />
          <div>
            <h2>{t('notifications')}</h2>
            <p>{t('notificationsDescription')}</p>
          </div>
        </div>

        <div className="settings-option-list">
          {notificationOptions.map((option) => (
            <label className="settings-switch-row" key={option.key}>
              <span>{t(option.key)}</span>
              <input type="checkbox" />
            </label>
          ))}
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card-heading">
          <Globe2 size={16} />
          <div>
            <div className="settings-card-title-row">
              <h2>{t('languageRegion')}</h2>
              <span className="settings-beta-badge">BETA</span>
            </div>
            <p>{t('languageRegionDescription')}</p>
          </div>
        </div>

        <div className="settings-info-list">
          <label className="settings-select-row">
            <span>{t('language')}</span>
            <select value={settings.language} onChange={(event) => updateSetting('language', event.target.value)}>
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="settings-select-row">
            <span>{t('currency')}</span>
            <select value={settings.currency} onChange={(event) => updateSetting('currency', event.target.value)}>
              {currencyOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card-heading">
          <Eye size={16} />
          <div>
            <h2>{t('accessibility')}</h2>
            <p>{t('accessibilityDescription')}</p>
          </div>
        </div>

        <div className="settings-option-list">
          {accessibilityOptions.map((option) => (
            <label className="settings-switch-row" key={option.key}>
              <span>{t(option.labelKey)}</span>
              <input
                checked={settings.accessibility[option.key]}
                type="checkbox"
                onChange={() => toggleAccessibility(option.key)}
              />
            </label>
          ))}
        </div>
      </div>
    </section>
  )
}
