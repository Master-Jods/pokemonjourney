interface PokeballProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Pokeball({ size = 'md', className = '' }: PokeballProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const buttonSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };

  return (
    <div className={`${sizes[size]} ${className} relative`}>
      <div className="w-full h-full rounded-full bg-white border-4 border-gray-800 shadow-lg">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800"></div>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${buttonSizes[size]} rounded-full bg-white border-4 border-gray-800`}></div>
      </div>
    </div>
  );
}
