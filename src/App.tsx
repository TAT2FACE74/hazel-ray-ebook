import { CoverPortrait } from './CoverPortrait';
import { FlipBook } from './FlipBook';
import { useOrientation } from './useOrientation';

export default function App() {
  const orientation = useOrientation();

  return (
    <div className="app">
      {orientation === 'portrait' ? <CoverPortrait /> : <FlipBook />}
    </div>
  );
}
