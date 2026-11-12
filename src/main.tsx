import { createRoot } from 'react-dom/client';
import BookingApp from './components/BookingApp';
import '../css/css/style.css';
import './styles.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Missing React root element');
}

createRoot(rootElement).render(<BookingApp />);
