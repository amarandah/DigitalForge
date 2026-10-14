import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from './components/Header';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import UploadAsset from './pages/UploadAsset';
import MyAssets from './pages/MyAssets';
import Account from './pages/Account';
import AssetDetails from './pages/AssetDetails';
import EditAsset from './pages/EditAsset';
import Search from './pages/Search';
import Category from './pages/Category';
import FloatingButton from './components/FloatingButton';
import Etiqueta from './pages/Etiqueta';
import UserAssets from './pages/UserAssets';
import DownloadedAssets from './pages/DownloadedAssets';
import Footer from './components/Footer';

function App() {
  return (
    <>
      <Router>
        <div className="container">
          <Header />
          <Navbar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/search" element={<Search />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/upload-asset" element={<UploadAsset />} />
            <Route path="/my-assets" element={<MyAssets />} />
            <Route path="/account" element={<Account />} />
            <Route path="/assets/:id" element={<AssetDetails />} />
            <Route path="/assets/:id/edit" element={<EditAsset />} />
            <Route path="/category/:category" element={<Category />} />
            <Route path="/category/:category/tag/:tag" element={<Etiqueta />} />
            <Route path="/user/:userId/assets" element={<UserAssets />} />
            <Route path="/downloaded-assets" element={<DownloadedAssets />} />
          </Routes>
          <Footer />
        </div>
      </Router>
      <FloatingButton/>
      <ToastContainer />
    </>
  );
}

export default App;