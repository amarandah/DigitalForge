import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__content">
        <div className="footer__section">
          <h4>&copy; {year} DigitalForge-UA</h4>
          <p>Todos los derechos reservados.</p>
        </div>
        
        <div className="footer__section">
          <h4>Categorías</h4>
          <ul>
            <li><Link to="/category/3D">3D</Link></li>
            <li><Link to="/category/2D">2D</Link></li>
            <li><Link to="/category/Add-ons">Add-ons</Link></li>
            <li><Link to="/category/Audio">Audio</Link></li>
            <li><Link to="/category/Video">Video</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export default Footer;