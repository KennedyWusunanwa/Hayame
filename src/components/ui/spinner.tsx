type SpinnerProps = {
  size?: number;
};

export function Spinner({ size = 16 }: SpinnerProps) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-primary border-r-transparent"
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
}
