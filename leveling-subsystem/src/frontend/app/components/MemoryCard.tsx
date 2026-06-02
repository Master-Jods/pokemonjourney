import { Card } from './MatchThePokemon';

interface MemoryCardProps {
  card: Card;
  onClick: () => void;
}

export function MemoryCard({ card, onClick }: MemoryCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative aspect-[3/4] cursor-pointer transition-all duration-500 transform-style-3d ${
        card.isFlipped || card.isMatched ? 'rotate-y-180' : ''
      }`}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
    >
      {/* Card Back (Pokeball design) */}
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 border-4 border-white shadow-xl flex items-center justify-center backface-hidden ${
          card.isFlipped || card.isMatched ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ backfaceVisibility: 'hidden' }}
      >
        <div className="w-16 h-16 rounded-full bg-white border-4 border-black relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-black"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-4 border-black"></div>
        </div>
      </div>

      {/* Card Front (Pokemon or Symbol) */}
      <div
        className={`absolute inset-0 rounded-2xl bg-white border-4 shadow-xl p-4 backface-hidden rotate-y-180 ${
          card.isMatched
            ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100'
            : 'border-blue-500'
        } ${card.isFlipped || card.isMatched ? 'opacity-100' : 'opacity-0'}`}
        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
      >
        <div className="w-full h-full flex items-center justify-center">
          {card.content}
        </div>
        {card.isMatched && (
          <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
