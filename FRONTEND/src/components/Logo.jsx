import playarenaLogoUrl from '../../IMG/d2fd47a50_image-removebg-preview.png'

export function Logo({ compact = false }) {
  return (
    <div className={compact ? 'logo logo-compact' : 'logo'}>
      <img src={playarenaLogoUrl} alt="PlayArena" />
    </div>
  )
}
