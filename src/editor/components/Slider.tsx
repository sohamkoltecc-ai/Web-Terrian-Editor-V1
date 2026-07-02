interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  precision?: number;
  onChange: (v: number) => void;
}

export function Slider({ label, value, min, max, step = 0.01, precision = 2, onChange }: SliderProps) {
  return (
    <div className="slider-row">
      <div className="slider-label-row">
        <span>{label}</span>
        <span className="slider-value">{value.toFixed(precision)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}
