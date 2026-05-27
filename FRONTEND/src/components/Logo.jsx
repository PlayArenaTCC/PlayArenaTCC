export const LOGO_URL = 'https://media.base44.com/images/public/6910e9894741240b3e56e211/d2fd47a50_image-removebg-preview.png'

export function Logo({ compact = false }) {
  return (
    <div className={compact ? 'logo logo-compact' : 'logo'}>
      <img src={LOGO_URL} alt="PlayArena" />
    </div>
  )
}
