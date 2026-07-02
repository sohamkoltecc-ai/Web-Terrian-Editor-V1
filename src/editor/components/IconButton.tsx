interface IconButtonProps {
  glyph: string;
  label?: string;
  active?: boolean;
  disabled?: boolean;
  square?: boolean;
  title?: string;
  onClick?: () => void;
}

export function IconButton({ glyph, label, active, disabled, square, title, onClick }: IconButtonProps) {
  return (
    <button
      className={`icon-btn${active ? ' active' : ''}${square ? ' square' : ''}`}
      disabled={disabled}
      title={title ?? label}
      onClick={onClick}
      type="button"
    >
      <span className="glyph">{glyph}</span>
      {label && !square && <span>{label}</span>}
    </button>
  );
}
