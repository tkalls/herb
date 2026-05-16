interface LiveNumberProps {
  value: number;
  format?: (v: number) => string;
  className?: string;
}

export default function LiveNumber({ value, format, className = "" }: LiveNumberProps) {
  const display = format ? format(value) : value.toLocaleString();
  return (
    <span className={`font-mono tabular-nums ${className}`}>{display}</span>
  );
}
